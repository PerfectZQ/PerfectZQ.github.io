---
layout: post
title: Spark SQL
tag: Spark SQL
---

## SQLConf 源码
```scala
// 定义了 SparkSQL 的配置属性
org.apache.spark.sql.internal.SQLConf
org.apache.spark.sql.internal.StaticSQLConf
```

## Built-in Functions
[Spark SQL, Built-in Functions](http://spark.apache.org/docs/latest/api/sql/index.html)

## UDF
注册 SparkSQL UDF 有两种方式`sparkSession.udf.register()`和`org.apache.spark.sql.function.udf()`

这种方式注册的 udf 方法，只能在`selectExpr`中可见，而对于`DataFrame API`是不可见的
```scala
object Test {

  case class Cat(name: String, age: Integer, sex: String)

  def main(args: Array[String]): Unit = {

    import org.apache.spark.sql.SparkSession
    val sparkSession = SparkSession.builder().master("local").getOrCreate()
    import sparkSession.implicits._
    val catDF = sparkSession.sparkContext.makeRDD(Seq(
      Cat(null, null, null),
      Cat("喵", 1, "母"),
      Cat("嗷", null, "公")
    )).toDF

    /**
      * Spark 自带的`concat_ws(cols: Column*, sep: String)`函数，只要有一个Column 
      * 的值为`null`，`concat`的结果就会变为`null`。有时我们并不想这么做，那么我们实现
      * 一个`myConcat`方法解决这个问题
      * 注意：Spark UDF 不支持变长参数`cols: String*`，不过可以用下面的方式实现
      */
    val myConcatFunc = (cols: Seq[Any], sep: String) => cols.filterNot(_ == null).mkString(sep)

    // 使用 register() 方法
    sparkSession.udf.register("myConcat", myConcatFunc)
    catDF.selectExpr("myConcat(array(name, age, sex), '-') as concat").show()

    // 使用 udf()
    import org.apache.spark.sql.functions.udf
    import org.apache.spark.sql.functions.array
    import org.apache.spark.sql.functions.lit
    val myConcat = udf(myConcatFunc)
    val seq = lit("-")
    catDF.select(myConcat(array("name", "age", "sex"), seq).alias("concat")).show()
  }
}
```

## spark sql 创建表时指定 location 会默认删除该目录下的 db 文件夹，导致整个 hive 中的数据全部被清空。
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