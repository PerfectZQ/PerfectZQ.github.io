---
layout: post
title: Spark DataSource
tag: Spark SQL
---

## Spark2.4.0 DataSource 源码
```scala
object DataSource extends Logging {

  /** A map to maintain backward compatibility in case we move data sources around. */
  // 笔者注: 这里就是 DataReader/DataWriter 所支持的所有 source format 实际对应的 Format 类
  private val backwardCompatibilityMap: Map[String, String] = {
    val jdbc = classOf[JdbcRelationProvider].getCanonicalName
    val json = classOf[JsonFileFormat].getCanonicalName
    val parquet = classOf[ParquetFileFormat].getCanonicalName
    val csv = classOf[CSVFileFormat].getCanonicalName
    val libsvm = "org.apache.spark.ml.source.libsvm.LibSVMFileFormat"
    val orc = "org.apache.spark.sql.hive.orc.OrcFileFormat"
    val nativeOrc = classOf[OrcFileFormat].getCanonicalName
    val socket = classOf[TextSocketSourceProvider].getCanonicalName
    val rate = classOf[RateStreamProvider].getCanonicalName

    Map(
      "org.apache.spark.sql.jdbc" -> jdbc,
      "org.apache.spark.sql.jdbc.DefaultSource" -> jdbc,
      "org.apache.spark.sql.execution.datasources.jdbc.DefaultSource" -> jdbc,
      "org.apache.spark.sql.execution.datasources.jdbc" -> jdbc,
      "org.apache.spark.sql.json" -> json,
      "org.apache.spark.sql.json.DefaultSource" -> json,
      "org.apache.spark.sql.execution.datasources.json" -> json,
      "org.apache.spark.sql.execution.datasources.json.DefaultSource" -> json,
      "org.apache.spark.sql.parquet" -> parquet,
      "org.apache.spark.sql.parquet.DefaultSource" -> parquet,
      "org.apache.spark.sql.execution.datasources.parquet" -> parquet,
      "org.apache.spark.sql.execution.datasources.parquet.DefaultSource" -> parquet,
      // 笔者注: ORC library in Hive 1.2.1(old)
      "org.apache.spark.sql.hive.orc.DefaultSource" -> orc,
      "org.apache.spark.sql.hive.orc" -> orc,
      // 笔者注: Apache ORC 1.4(new)
      "org.apache.spark.sql.execution.datasources.orc.DefaultSource" -> nativeOrc,
      "org.apache.spark.sql.execution.datasources.orc" -> nativeOrc,
      "org.apache.spark.ml.source.libsvm.DefaultSource" -> libsvm,
      "org.apache.spark.ml.source.libsvm" -> libsvm,
      "com.databricks.spark.csv" -> csv,
      "org.apache.spark.sql.execution.streaming.TextSocketSourceProvider" -> socket,
      "org.apache.spark.sql.execution.streaming.RateSourceProvider" -> rate
    )
  }

  /**
   * Class that were removed in Spark 2.0. Used to detect incompatibility libraries for Spark 2.0.
   */
  private val spark2RemovedClasses = Set(
    "org.apache.spark.sql.DataFrame",
    "org.apache.spark.sql.sources.HadoopFsRelationProvider",
    "org.apache.spark.Logging")

  /** Given a provider name, look up the data source class definition. */
  // 笔者注: provider 就是 DataSource 支持的 source format
  def lookupDataSource(provider: String, conf: SQLConf): Class[_] = {
    val provider1 = backwardCompatibilityMap.getOrElse(provider, provider) match {
      // 笔者注: format == "orc" && spark.sql.orc.impl == "native"
      case name if name.equalsIgnoreCase("orc") &&
          conf.getConf(SQLConf.ORC_IMPLEMENTATION) == "native" =>
        // 笔者注: org.apache.spark.sql.execution.datasources.orc.OrcFileFormat
        classOf[OrcFileFormat].getCanonicalName
      // 笔者注: format == "orc" && spark.sql.orc.impl == "hive"
      case name if name.equalsIgnoreCase("orc") &&
          conf.getConf(SQLConf.ORC_IMPLEMENTATION) == "hive" =>
        "org.apache.spark.sql.hive.orc.OrcFileFormat"
      case "com.databricks.spark.avro" if conf.replaceDatabricksSparkAvroEnabled =>
        "org.apache.spark.sql.avro.AvroFileFormat"
      case name => name
    }
    val provider2 = s"$provider1.DefaultSource"
    val loader = Utils.getContextOrSparkClassLoader
    val serviceLoader = ServiceLoader.load(classOf[DataSourceRegister], loader)

    try {
      serviceLoader.asScala.filter(_.shortName().equalsIgnoreCase(provider1)).toList match {
        // the provider format did not match any given registered aliases
        case Nil =>
          try {
            Try(loader.loadClass(provider1)).orElse(Try(loader.loadClass(provider2))) match {
              case Success(dataSource) =>
                // Found the data source using fully qualified path
                dataSource
              case Failure(error) =>
                if (provider1.startsWith("org.apache.spark.sql.hive.orc")) {
                  throw new AnalysisException(
                    "Hive built-in ORC data source must be used with Hive support enabled. " +
                    "Please use the native ORC data source by setting 'spark.sql.orc.impl' to " +
                    "'native'")
                } else if (provider1.toLowerCase(Locale.ROOT) == "avro" ||
                  provider1 == "com.databricks.spark.avro" ||
                  provider1 == "org.apache.spark.sql.avro") {
                  throw new AnalysisException(
                    s"Failed to find data source: $provider1. Avro is built-in but external data " +
                    "source module since Spark 2.4. Please deploy the application as per " +
                    "the deployment section of \"Apache Avro Data Source Guide\".")
                } else if (provider1.toLowerCase(Locale.ROOT) == "kafka") {
                  throw new AnalysisException(
                    s"Failed to find data source: $provider1. Please deploy the application as " +
                    "per the deployment section of " +
                    "\"Structured Streaming + Kafka Integration Guide\".")
                } else {
                  throw new ClassNotFoundException(
                    s"Failed to find data source: $provider1. Please find packages at " +
                      "http://spark.apache.org/third-party-projects.html",
                    error)
                }
            }
          } catch {
            case e: NoClassDefFoundError => // This one won't be caught by Scala NonFatal
              // NoClassDefFoundError's class name uses "/" rather than "." for packages
              val className = e.getMessage.replaceAll("/", ".")
              if (spark2RemovedClasses.contains(className)) {
                throw new ClassNotFoundException(s"$className was removed in Spark 2.0. " +
                  "Please check if your library is compatible with Spark 2.0", e)
              } else {
                throw e
              }
          }
        case head :: Nil =>
          // there is exactly one registered alias
          head.getClass
        case sources =>
          // There are multiple registered aliases for the input. If there is single datasource
          // that has "org.apache.spark" package in the prefix, we use it considering it is an
          // internal datasource within Spark.
          val sourceNames = sources.map(_.getClass.getName)
          val internalSources = sources.filter(_.getClass.getName.startsWith("org.apache.spark"))
          if (internalSources.size == 1) {
            logWarning(s"Multiple sources found for $provider1 (${sourceNames.mkString(", ")}), " +
              s"defaulting to the internal datasource (${internalSources.head.getClass.getName}).")
            internalSources.head.getClass
          } else {
            throw new AnalysisException(s"Multiple sources found for $provider1 " +
              s"(${sourceNames.mkString(", ")}), please specify the fully qualified class name.")
          }
      }
    } catch {
      case e: ServiceConfigurationError if e.getCause.isInstanceOf[NoClassDefFoundError] =>
        // NoClassDefFoundError's class name uses "/" rather than "." for packages
        val className = e.getCause.getMessage.replaceAll("/", ".")
        if (spark2RemovedClasses.contains(className)) {
          throw new ClassNotFoundException(s"Detected an incompatible DataSourceRegister. " +
            "Please remove the incompatible library from classpath or upgrade it. " +
            s"Error: ${e.getMessage}", e)
        } else {
          throw e
        }
    }
  }

  /**
   * When creating a data source table, the `path` option has a special meaning: the table location.
   * This method extracts the `path` option and treat it as table location to build a
   * [[CatalogStorageFormat]]. Note that, the `path` option is removed from options after this.
   */
  def buildStorageFormatFromOptions(options: Map[String, String]): CatalogStorageFormat = {
    val path = CaseInsensitiveMap(options).get("path")
    val optionsWithoutPath = options.filterKeys(_.toLowerCase(Locale.ROOT) != "path")
    CatalogStorageFormat.empty.copy(
      locationUri = path.map(CatalogUtils.stringToURI), properties = optionsWithoutPath)
  }

  /**
   * Called before writing into a FileFormat based data source to make sure the
   * supplied schema is not empty.
   * @param schema
   */
  private def validateSchema(schema: StructType): Unit = {
    def hasEmptySchema(schema: StructType): Boolean = {
      schema.size == 0 || schema.find {
        case StructField(_, b: StructType, _, _) => hasEmptySchema(b)
        case _ => false
      }.isDefined
    }


    if (hasEmptySchema(schema)) {
      throw new AnalysisException(
        s"""
           |Datasource does not support writing empty or nested empty schemas.
           |Please make sure the data schema has at least one or more column(s).
         """.stripMargin)
    }
  }
}
```

## ORC
* [sql data sources orc](https://spark.apache.org/docs/latest/sql-data-sources-orc.html)
* [orc improvements for apache spark2.2 of hdp2.6.3](https://community.hortonworks.com/articles/148917/orc-improvements-for-apache-spark-22.html)

```scala
// spark1.4 开始支持 orc 格式的文件的读写，首先创建一个测试数据
val conf = new SparkConf()
val sparkSession = SparkSession.builder().config(conf).getOrCreate
val df = sparkSession.range(200000000).sample(true, 0.5)

// 将数据写入 orc 文件
df.write.format("orc").mode("overwrite").save("/tmp/orc_100m")

// 统计读取 orc 文件的时间
sparkSession.time(sparkSession.read.format("orc").load("/tmp/orc_100m").count)

// hdp2.6.3 集成了 apache spark2.2 和 apache orc1.4，apache spark 有 ColumnarBatch，apache orc 有 RowBatch
// 通过结合这两种矢量化技术，hdp 实现了读取速度的性能增益，而以前 apache spark 仅对 apache parquet 有 ColumnarBatch 
// 的增益效果
sparkSession.time(sparkSession.read.format("org.apache.spark.sql.execution.datasources.orc").load("/tmp/orc_100m").count)
// 启用 new orc format 为 default
sparkSession.sql("SET spark.sql.orc.enabled=true")

/* -------------- 分割线 --------------- */

// Since Spark 2.3, Spark supports a vectorized ORC reader with a new ORC file format for ORC files
// spark.sql.orc.impl=hive，会选择 org.apache.spark.sql.hive.orc.OrcFileFormat(ORC library in Hive 1.2.1, old) 进行加载
// spark.sql.orc.impl=native，会选择 org.apache.spark.sql.execution.datasources.orc.OrcFileFormat(Apache ORC 1.4, new) 进行加载
sparkSession.sql("SET spark.sql.orc.impl=native")

// 当 spark.sql.orc.impl=native，并且 spark.sql.orc.enableVectorizedReader=true 时 vectorized reader
// 会应用到 native ORC tables(如使用 USING ORC 子句创建的表)
sparkSession.sql("SET spark.sql.orc.enableVectorizedReader=true")
// 如果 spark.sql.orc.enableVectorizedReader=true，并且 spark.sql.hive.convertMetastoreOrc=true，对于
// hive ORC tables(如使用 USING HIVE OPTIONS (fileFormat 'ORC') 子句创建的表) 也会启用 vectorized reader。
sparkSession.sql("SET spark.sql.hive.convertMetastoreOrc=true")
```

### Spark 读写 Hive ORC 表
[sql-data-sources-hive-tables](https://spark.apache.org/docs/latest/sql-data-sources-hive-tables.html)
[hive-tables-spark2.2](https://spark.apache.org/docs/2.2.0/sql-programming-guide.html#hive-tables)
[specifying-storage-format-for-hive-tables-spark2.2](https://spark.apache.org/docs/2.2.0/sql-programming-guide.html#specifying-storage-format-for-hive-tables)

```scala

```