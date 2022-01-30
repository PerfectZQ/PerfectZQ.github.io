---
layout: post 
title: Spark SQL 
tag: Spark SQL
---

## Reference

* [Spark SQL, DataFrames and Datasets Guide](https://spark.apache.org/docs/latest/sql-programming-guide.html)

## SQLConf 源码

```scala
// 定义了 SparkSQL 的配置属性
org.apache.spark.sql.internal.SQLConf
org.apache.spark.sql.internal.StaticSQLConf
```

## SparkSQL Functions
* [SparkSQL Functions](https://spark.apache.org/docs/latest/sql-ref-functions.html)
* [Complete Built-in Functions API Document](https://spark.apache.org/docs/latest/api/sql/)

SparkSQL 的函数类型结构如下:
* [Built-in Functions](https://spark.apache.org/docs/latest/sql-ref-functions-builtin.html)
  * Scalar Functions: 普通函数，作用于每行记录，对一行记录中的某些列进行计算，得出一个返回值作为一个新列，表的记录数不改变。
    * [Array Functions](https://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#array-functions)
    * [Map Functions](https://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#map-functions)
    * [Date and Timestamp Functions](https://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#date-and-timestamp-functions)
    * [JSON Functions](https://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#json-functions)
  * Aggregate-like Functions
    * [Aggregate Functions](https://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#aggregate-functions): 作用于一组记录，对这一组的数据的列进行聚合计算得出一个值，做聚合后结果表的总记录数通常会减少，例如
    ```sql
    select max(age) from person group by sex
    ```
    * [Window Functions](https://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#window-functions): 窗口函数有别于聚合函数，聚合函数分组中的所有记录都会参与计算，最终每个分组得出一条结果记录。而窗口函数只是限定一个窗口范围，窗口内的每一条记录都会进行计算，计算的过程会涉及到窗口内的其他数据参与计算，并且得出的最终记录数不会减少。例如窗口内有5条记录，计算完的结果表依然还有5条记录。
* UDFs (User-Defined Functions)
  * [Scalar User-Defined Functions (UDFs)](https://spark.apache.org/docs/latest/sql-ref-functions-udf-scalar.html)
  * [User-Defined Aggregate Functions (UDAFs)](https://spark.apache.org/docs/latest/sql-ref-functions-udf-aggregate.html)
  * [Integration with Hive UDFs/UDAFs/UDTFs](https://spark.apache.org/docs/latest/sql-ref-functions-udf-hive.html)

### Aggregate-like Functions
#### Aggregate Functions
* [Aggregate Functions](https://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#aggregate-functions)

```sql
-- Examples
SELECT  bool_and(col) AS result
FROM    (
            VALUES
                (false), 
                (false),
                (NULL)
        ) AS tab(col);
```

#### Window Functions
* [Window Functions](https://spark.apache.org/docs/latest/sql-ref-functions-builtin.html#window-functions)
* [Spark SQL操作之-函数汇总篇-中](https://blog.csdn.net/coding_hello/article/details/90664447)

```sql

```


### User Defined Functions
#### UDF
注册 SparkSQL UDF 有两种方式`sparkSession.udf.register()`和`org.apache.spark.sql.function.udf()`

```scala
object Test {

  case class Cat(name: String, age: Integer, sex: String)

  // 测试数据集
  val testDataset = Seq(
    Cat(null, null, null),
    Cat("喵", 1, "母"),
    Cat("嗷", 3, "公"),
    Cat("喵", 2, "母"),
    Cat("嗷", 1, "公")
  )

  def main(args: Array[String]): Unit = {

    import org.apache.spark.sql.SparkSession
    val sparkSession = SparkSession.builder().master("local").getOrCreate()
    import sparkSession.implicits._
    val catDF = sparkSession.sparkContext.makeRDD(testDataset).toDF

    /**
     * Spark 自带的`concat_ws(cols: Column*, sep: String)`函数，只要有一个Column 
     * 的值为`null`，`concat`的结果就会变为`null`。有时我们并不想这么做，那么我们实现
     * 一个`myConcat`方法解决这个问题
     * 注意：Spark UDF 不支持变长参数`cols: String*`，不过可以用下面的方式实现
     */
    val myConcatFunc = (cols: Seq[Any], sep: String) => cols.filterNot(_ == null).mkString(sep)

    // 使用 register() 方法
    // 这种方式注册的 udf 方法，只能在`selectExpr`中可见，而对于`DataFrame API`是不可见的
    sparkSession.udf.register("myConcat", myConcatFunc)
    catDF.selectExpr("myConcat(array(name, age, sex), '-') as concat").show()

    // 使用 udf()
    // DataFrame API
    import org.apache.spark.sql.functions.udf
    import org.apache.spark.sql.functions.array
    import org.apache.spark.sql.functions.lit
    val myConcat = udf(myConcatFunc)
    val seq = lit("-")
    catDF.select(myConcat(array("name", "age", "sex"), seq).alias("concat")).show()
  }
}
```

#### UDAF

## SparkSQL Join Operations

![MySQL Join 示意图]({{ site.url }}/assets/sql/sql_set_operations.png)

* [SparkSQL 中支持的七种 Join 类型简介](https://blog.csdn.net/wypblog/article/details/109281755)

## SparkSQL DataFrame Common Operators

* [Untyped Dataset Operations](https://spark.apache.org/docs/latest/sql-getting-started.html#untyped-dataset-operations-aka-dataframe-operations)
* [Dataset](https://spark.apache.org/docs/latest/api/scala/org/apache/spark/sql/Dataset.html)

> DataFrame 是一种泛型类型为 Row 的 Dataset，即`type DataFrame = Dataset[Row]`
