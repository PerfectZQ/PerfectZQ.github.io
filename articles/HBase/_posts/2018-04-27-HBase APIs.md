---
layout: post
title: HBase APIs
tag: HBase
---
## Scala or Java client
### Dependencies
#### Maven
```xml
<dependency>
   <groupId>org.apache.hbase</groupId>
   <artifactId>hbase-client</artifactId>
   <version>1.3.1</version>
</dependency>
```
#### SBT
```sbtshell
libraryDependencies += "org.apache.hbase" % "hbase-client" % "1.3.1"
```
### APIs
　　这里是Scala写法，Java写法，自行领悟，-_-。

```scala
package com.zq.hbase.learn

import org.apache.hadoop.hbase.{HBaseConfiguration, HColumnDescriptor, HTableDescriptor, TableName}
import org.apache.hadoop.hbase.client._
import org.apache.hadoop.hbase.util.Bytes

object HBaseUtil {
  def main(args: Array[String]): Unit = {
    
    // 创建 HBase 配置文件对象
    val conf = HBaseConfiguration.create()
    // 指定 zookeeper 节点地址，在 hbase-site.xml 有配置
    conf.set("hbase.zookeeper.quorum", "server202,server203,server204")
    // 指定 zookeeper 端口号
    conf.set("hbase.zookeeper.property.clientPort", "2181")
    /**
     * HDP's HBase 需要额外指定 zookeeper.znode.parent
     * Cloudera's HBase 不需要
     * 因为我用的 Cloudera，所以在这里注释掉了 ^_^
     */
    // conf.set("zookeeper.znode.parent", "/hbase-unsecure")
    
    // 根据配置文件创建连接
    val connection: Connection = ConnectionFactory.createConnection(conf)
    
    /**
      * 通过连接获取管理对象
      * Note:
      * 1、这是一个轻量级的操作，不会保证返回的Admin对象是线程安全的
      * 在多线程的情况下，应该为每个线程创建一个新实例。
      * 2、不建议把返回的 Admin 对象池化或缓存
      * 3、记得调用 admin.close()
      */
    val admin: Admin = connection.getAdmin

    // 如果表存在，删了重建
    if (admin.tableExists(TableName.valueOf("test_table"))) {
      admin.disableTable(TableName.valueOf("test_table"))
      admin.deleteTable(TableName.valueOf("test_table"))
    }
    // 建表
    val tableDescriptor: HTableDescriptor = new HTableDescriptor(TableName.valueOf("test_table"))
    val columnDescriptor: HColumnDescriptor = new HColumnDescriptor("column_family".getBytes())
    tableDescriptor.addFamily(columnDescriptor)
    admin.createTable(tableDescriptor)


    // 返回 HBase table ist
    val tables: Array[HTableDescriptor] = admin.listTables()
    tables.foreach(println)


    // get table
    val table: Table = connection.getTable(TableName.valueOf("test_table"))

    // ======================= 写 =======================

    // rowkey
    val put: Put = new Put(Bytes.toBytes("2018/4/27-rowkey"))
    // column family, column qualifier, value
    put.addColumn(Bytes.toBytes("column_family"), Bytes.toBytes("column_qualifier"), Bytes.toBytes("value"))
    // add to HBase table
    table.put(put)

    // ======================= 读 =======================

    // rowkey
    val get: Get = new Get(Bytes.toBytes("2018/4/27-rowkey"))
    val result: Result = table.get(get)
    val value: Array[Byte] = result.value()
    println(Bytes.toString(value))
  }

}
```

## Spark APIs
### Dependencies
#### Maven
```xml
<dependency>
   <groupId>org.apache.hbase</groupId>
   <artifactId>hbase-client</artifactId>
   <version>1.3.1</version>
</dependency>
<dependency>
   <groupId>org.apache.hbase</groupId>
   <artifactId>hbase-server</artifactId>
   <version>1.3.1</version>
</dependency>
```
#### SBT
```sbtshell
libraryDependencies += "org.apache.hbase" % "hbase-client" % "1.3.1"
libraryDependencies += "org.apache.hbase" % "hbase-server" % "1.3.1"
```

### Spark 集群需要下面的jar包
```console
hbase-client-1.3.1.jar
hbase-server-1.3.1.jar
hbase-common-1.3.1.jar
hbase-protocol-1.3.1.jar
hbase-hadoop2-compat-1.3.1.jar
htrace-core-3.1.0-incubating.jar
metrics-core-2.2.0.jar(com.yammer.metrics.metrics-core)
```
### APIs
#### Write
　　将 RDD 写入 HBase 表

```scala
package com.zq.hbase.learn

import org.apache.hadoop.hbase.HBaseConfiguration
import org.apache.hadoop.hbase.client.Put
import org.apache.hadoop.hbase.io.ImmutableBytesWritable
import org.apache.hadoop.hbase.mapred.TableOutputFormat
import org.apache.hadoop.hbase.mapreduce.TableInputFormat
import org.apache.hadoop.hbase.util.Bytes
import org.apache.hadoop.mapred.JobConf
import org.apache.spark.SparkConf
import org.apache.spark.rdd.PairRDDFunctions
import org.apache.spark.sql.SparkSession


object Spark_HBase_Write {

  def main(args: Array[String]): Unit = {
  
    val spark = SparkSession.builder().master("local").appName("Spark HBase Write Demo").getOrCreate()
    val sc = spark.sparkContext

    val tableName = "test_table"

    // JobConf 是 write out
    val jobConf = new JobConf(hbaseConf, this.getClass)
    jobConf.setOutputFormat(classOf[TableOutputFormat])
    // Note: TableOutputFormat 是 mapred 包下的
    jobConf.set(TableOutputFormat.OUTPUT_TABLE, tableName)
    jobConf.set("hbase.zookeeper.quorum", "server202,server203,server204")

    // (rowkey, value)
    val pairs = sc.parallelize(Seq("2018/4/27-rowkey" -> "value"))

    def convert(pair: (String, String)) = {
      val (rowkey, value) = pair
      val p = new Put(Bytes.toBytes(rowkey))
      // column family, column qualifier, value
      p.addColumn(Bytes.toBytes("column_family"), Bytes.toBytes("column_qualifier"), Bytes.toBytes(value))
      (new ImmutableBytesWritable, p)
    }

    // 保存数据到 HBase
    new PairRDDFunctions(pairs.map(convert)).saveAsHadoopDataset(jobConf)
  }
}
```
#### Read
　　将 HBase 表读到 Spark RDD

```scala
package com.zq.hbase.learn

import org.apache.hadoop.hbase.HBaseConfiguration
import org.apache.hadoop.hbase.client.Result
import org.apache.hadoop.hbase.io.ImmutableBytesWritable
import org.apache.hadoop.hbase.mapreduce.TableInputFormat
import org.apache.hadoop.hbase.util.Bytes
import org.apache.spark.rdd.RDD
import org.apache.spark.sql.SparkSession


object Spark_HBase_Read {

  def main(args: Array[String]): Unit = {
    
    val spark = SparkSession.builder().master("local").appName("Spark HBase Read Demo").getOrCreate();
    val sc = spark.sparkContext

    // HBaseConfiguration 永远是 read in
    val tableName = "test_table"
    val hConf = HBaseConfiguration.create()
    hConf.set("hbase.zookeeper.quorum", "server202,server203,server204")
    // Note: TableInputFormat 是 mapreduce 包下的
    hConf.set(TableInputFormat.INPUT_TABLE, tableName)

    // 将整张表读入 Spark 并转换成 RDD
    val resultRDD: RDD[(ImmutableBytesWritable, Result)] = sc.newAPIHadoopRDD(hConf, classOf[TableInputFormat], classOf[ImmutableBytesWritable], classOf[Result])

    // ============================ round 1 ============================

    resultRDD.foreach(tuple => {
      // rowkey
      println(Bytes.toString(tuple._2.getRow))
      // column family, column qualifier
      println(Bytes.toInt(tuple._2.getValue("column_family".getBytes, "column_qualifier".getBytes)))
    })

    // ============================ round 2 ：元组模式匹配 ============================

    resultRDD.foreach(x => x match {
      case (_, result) =>
        // rowkey
        println(Bytes.toString(result.getRow))
        // column family, column qualifier
        println(Bytes.toInt(result.getValue("column_family".getBytes, "column_qualifier".getBytes)))
    })

    // ============================ round 3 ：真·元组模式匹配 ============================

    resultRDD.foreach {
      case (_, result) =>
        // rowkey
        println(Bytes.toString(result.getRow))
        // column family, column qualifier
        println(Bytes.toInt(result.getValue("column_family".getBytes, "column_qualifier".getBytes)))
    }

  }
  
}
```