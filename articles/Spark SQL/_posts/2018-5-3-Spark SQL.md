---
layout: post
title: Spark SQL
tag: Spark SQL
---

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