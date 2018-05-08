---
layout: post
title: Spark JDBC 调优
tag: Spark
---

## JDBC 调优
　　Spark 通过 JDBC 读取关系型数据库，默认查全表，只有一个`task`去执行查询操作，效率可想而知。

　　首先从官网粘几个重要的参数项：

| Property Name | Meaning |
| :-------- | :-------- |
| url | The JDBC URL to connect to. The source-specific connection properties may be specified in the URL. e.g., jdbc:postgresql://localhost/test?user=fred&password=secret |
| dbtable | The JDBC table that should be read. Note that anything that is valid in a FROM clause of a SQL query can be used. For example, instead of a full table you could also use a subquery in parentheses. |
| driver | The class name of the JDBC driver to use to connect to this URL |
| partitionColumn<br/> lowerBound<br/> upperBound | These options must all be specified if any of them is specified. In addition, numPartitions must be specified. They describe how to partition the table when reading in parallel from multiple workers. partitionColumn must be a numeric column from the table in question. Notice that lowerBound and upperBound are just used to decide the partition stride, not for filtering the rows in table. So all rows in the table will be partitioned and returned. This option applies only to reading. |
| numPartitions | The maximum number of partitions that can be used for parallelism in table reading and writing. This also determines the maximum number of concurrent JDBC connections. If the number of partitions to write exceeds this limit, we decrease it to this limit by calling coalesce(numPartitions) before writing. |

　　还有很多重要的参数，这里暂时没用就不粘了。 [http://spark.apache.org/docs/latest/sql-programming-guide.html#jdbc-to-other-databases]

1. `dbtable`：写表名，就是查全表(全字段)。不想查全表，可以在括号里面写子查询。说白了，只要 SQL 语句里，`FROM`后面能跟的，都合法，因为他就是拼了个 SQL 语句，`dbtable`会填在`FROM`后面。
2. `numPartitions`：读、写的**最大**分区数，也决定了开启数据库连接的数目。注意**最大**两个字，也就是说你指定了32个分区，它也不一定就真的分32个分区了。比如：在读的时候，即便指定了`numPartitions`为任何大于1的值，如果没有指定分区规则，就只有一个`task`去执行查询。
3. `partitionColumn, lowerBound, upperBound`：指定读数据时的分区规则。要使用这三个参数，必须定义`numPartitions`，而且这三个参数不能单独出现，要用就必须全部指定。而且`lowerBound, upperBound`不是过滤条件，只是用于决定分区跨度。

```scala
val sparkSession = SparkSession.builder.appName("jdbc learn").getOrCreate()
val reader:DataFrameReader = sparkSession.read.format("jdbc")
                                   .option("url", "jdbc:oracle:thin:@<host>:<port>:<SID> ")
                                   // oracle 表自带整数列 rownum
                                   .option("dbtable", "(SELECT a.*, rownum as rn FROM tablename a)")
                                   .option("user", "user")
                                   .option("password", "password")
                                   .option("fetchsize", 500)
                                   // 分配分区数(task)尽量是cores的倍数
                                   .option("numPartitions", 32)
                                   // 指定数字类型的列
                                   .option("partitionColumn", "rn")
                                   // 分区上下界
                                   .option("lowerBound", "1")
                                   .option("upperBound", "5000000")
```

## Spark 源码解读
　　Spark 版本：`spark-sql_2.11-2.2.1`

　　对于参数`partitionColumn`，`lowerBound`，`upperBound`怎么设置，看官方说明迷迷糊糊的，而且设置了之后，有的`task`记录数直接为0，`task`分配极不均衡，因此扒了扒源码，想看看它到底咋分的。
```scala
package org.apache.spark.sql.execution.datasources.jdbc

/**
 * Instructions on how to partition the table among workers.
 */
private[sql] case class JDBCPartitioningInfo(
    column: String,
    lowerBound: Long,
    upperBound: Long,
    numPartitions: Int)

private[sql] object JDBCRelation extends Logging {
  /**
   * Given a partitioning schematic (a column of integral type, a number of
   * partitions, and upper and lower bounds on the column's value), generate
   * WHERE clauses for each partition so that each row in the table appears
   * exactly once.  The parameters minValue and maxValue are advisory in that
   * incorrect values may cause the partitioning to be poor, but no data
   * will fail to be represented.
   *
   * Null value predicate is added to the first partition where clause to include
   * the rows with null value for the partitions column.
   *
   * @param partitioning partition information to generate the where clause for each partition
   * @return an array of partitions with where clause for each partition
   */
  def columnPartition(partitioning: JDBCPartitioningInfo): Array[Partition] = {
    if (partitioning == null || partitioning.numPartitions <= 1 ||
      partitioning.lowerBound == partitioning.upperBound) {
      return Array[Partition](JDBCPartition(null, 0))
    }

    val lowerBound = partitioning.lowerBound
    val upperBound = partitioning.upperBound
    require (lowerBound <= upperBound,
      "Operation not allowed: the lower bound of partitioning column is larger than the upper " +
      s"bound. Lower bound: $lowerBound; Upper bound: $upperBound")

    /**
     * 笔者注：
     * 从这里可以看出`upperBound`和`lowerBound`的差如果小于你指定的`numPartitions`
     * 那么实际的分区数其实是 upperBound-lowerBound
     */
    val numPartitions =
      if ((upperBound - lowerBound) >= partitioning.numPartitions || /* check for overflow */
          (upperBound - lowerBound) < 0) {
        partitioning.numPartitions
      } else {
        logWarning("The number of partitions is reduced because the specified number of " +
          "partitions is less than the difference between upper bound and lower bound. " +
          s"Updated number of partitions: ${upperBound - lowerBound}; Input number of " +
          s"partitions: ${partitioning.numPartitions}; Lower bound: $lowerBound; " +
          s"Upper bound: $upperBound.")
        upperBound - lowerBound
      }
    // Overflow and silliness can happen if you subtract then divide.
    // Here we get a little roundoff, but that's (hopefully) OK.
    // 笔者注：分区的跨度
    val stride: Long = upperBound / numPartitions - lowerBound / numPartitions
    val column = partitioning.column
    var i: Int = 0
    var currentValue: Long = lowerBound
    var ans = new ArrayBuffer[Partition]()
    /**
     * 笔者注：
     * 假设指定`partitionColumn = 32`，且`partitionColumn - lowerBound >= partitionColumn`。
     * 对于 partition_i，构造条件语句如下： 
     * partition_0 : whereClause = $partitionColumn < $lowerBound + $stride or $partitionColumn is null
     * partition_1~30 : whereClause = $partitionColumn >= $lowerBound + $stride * i AND $partitionColumn < $lowerBound + $stride * (i + 1)
     * partition_31 : whereClause = $partitionColumn >= $lowerBound + $stride * i
     * 注意：$lowerBound + $stride * 31 并不一定等于 $upperBound - $stride
     */
    while (i < numPartitions) {
      // 笔者注：构造分区下界条件语句，若是第一个分区(partition0)，下界条件为null
      val lBound = if (i != 0) s"$column >= $currentValue" else null
      currentValue += stride
      // 笔者注：构造分区上界条件语句，若是最后一个分区，上界条件为null
      val uBound = if (i != numPartitions - 1) s"$column < $currentValue" else null
      val whereClause =
        if (uBound == null) {
          lBound
        } else if (lBound == null) {
          s"$uBound or $column is null"
        } else {
          s"$lBound AND $uBound"
        }
      ans += JDBCPartition(whereClause, i)
      i = i + 1
    }
    ans.toArray
  }
}
```

　　这下清楚了，如果你指定的`partitionColumn`不是连续的数(分布不均匀)，那么每个`task`中的数据量就会分配不均匀。

　　如果不用`numPartitions`，`partitionColumn, lowerBound, upperBound`，就不能提高`task`并发量了吗？其实不然。我们可以通过`dbtable`构造自己的子查询，并行执行多个查询得到多个结果RDD，最后通过`reduce`合并成一个RDD，这样查询的速度也是很快的。大概思路如下：

```scala
// 为了不丢失数据，向上取整，将数据分成32份
val stride = Math.ceil(1384288 / 32)

val tableName = "TABLE"

// 创建32个task
val registerDF = Range(0, 32)
  .map {
    index =>
      sparkSession
        .read
        .format("jdbc")
        .option("url", jdbcProps.getProperty("url"))
        .option("dbtable", s"(SELECT * FROM (SELECT a.*, rownum as rn FROM $tableName a) b WHERE b.rn > ${stride * index} AND b.rn <= ${stride * (index + 1)})")
        .option("user", jdbcProps.getProperty("user"))
        .option("password", jdbcProps.getProperty("password"))
        .option("fetchsize", 500)
        .load()
  }
  .reduce((resultDF1, resultDF2) => resultDF1.union(resultDF2))
```