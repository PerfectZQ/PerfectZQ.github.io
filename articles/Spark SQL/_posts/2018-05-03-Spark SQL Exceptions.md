---
layout: post
title: Spark SQL Exceptions
tag: Spark SQL
---

## SparkSQL Exceptions
### SparkSQL 创建表时指定 location 会默认删除该目录下的 db 文件夹，导致整个 hive 中的数据全部被清空。
```scala
def main(args: Array[String]): Unit = {

    def getSparkSession(appName: String,
                        conf: SparkConf = new SparkConf,
                        enableHive: Boolean = true): SparkSession = {
      val builder = SparkSession.builder().config(conf).appName(appName)
      val sparkMaster = System.getProperty("spark.master")
      if (sparkMaster == null) {
        builder.master("local[*]")
        logger.warn("Using local[*] as spark master since `spark.master` is not set.")
      }
      if (enableHive) {
        builder.config("spark.sql.warehouse.dir", "hdfs:///zq_test/hive/warehouse")
        builder.enableHiveSupport()
      }
      builder.getOrCreate
    }

    val sparkSession = getSparkSession("Test")
    
    import sparkSession.implicits._
    
    sparkSession.sparkContext
      .makeRDD(Seq("a", "b", "c", "d", "e", "f"))
      .repartition(3)
      .toDF("col")
      .createOrReplaceTempView("temp")
      
    sparkSession.sql(s"create database if not exists test")
    
    sparkSession.sql(
      s"""create table test.zq1
         |as
         |select * from temp
       """.stripMargin)
       
    // 这里 location 千万不要指定为`/zq_test/hive/warehouse/`,
    // 而是应该指定为`/zq_test/hive/warehouse/test.db/zq2`, 否则 spark
    // 会删除掉所有`/zq_test/hive/warehouse/`下非`_`开头的文件和文件夹，导
    // 致所有 db 数据被清空, 而 hive sql 执行同样的语句是不会删除该文件夹下的
    // 其他文件的。 
    sparkSession.sql(
      s"""create table test.zq2
         |location '/zq_test/hive/warehouse/'
         |as
         |select * from temp
       """.stripMargin)
}
```