---
layout: post
title: Spark-Mongo-Connector
tag: Spark-Mongo-Connector
---

## sbt 地址
```sbt
libraryDependencies += "org.mongodb.spark" % "mongo-spark-connector_2.11" % "2.0.0"
```
## 写配置

　　在SparkConf或者$SPARK_HOME/conf/spark-default.conf 文件中将uri、database、collection必选的配置项配置好，如下

```scala
package com.neusoft.apps

import com.mongodb.spark.{MongoConnector, MongoSpark}
import org.apache.spark.SparkConf
import org.apache.spark.sql.SparkSession

import com.mongodb.spark.config._

// mongodb集群的写法，单个mongodb只写一个即可
val uri = """mongodb://xxx.xxx.xxx.xxx:27017/db.test,xxx.xxx.xxx.xxx:27017,xxx.xxx.xxx.xxx:27017"""

val conf = new SparkConf()
      .set("spark.mongodb.output.uri", uri)) // 写配置

val sparkSession = SparkSession.builder().config(conf).appName("learn something").getOrCreate()
```
　　当后面要读写别的collection时使用WriteConfig覆盖即可
```scala
val writeVectorMap = new HashMap[String, String]
writeVectorMap += ("collection" -> CollectionDict.VISIT_VECTOR)
writeVectorMap += ("writeConcern.w" -> "majority")

val writeVectorConfig = WriteConfig(writeVectorMap, Some(WriteConfig(sparkSession)))

MongoSpark.save(similarityDocRDD, writeVectorConfig)
```
## 读配置
```scala
package com.neusoft.apps

import com.mongodb.spark.{MongoConnector, MongoSpark}
import org.apache.spark.SparkConf
import org.apache.spark.sql.SparkSession

import com.mongodb.spark.config._

// mongodb集群的写法，单个mongodb只写一个即可
val uri = """mongodb://xxx.xxx.xxx.xxx:27017/db.test,xxx.xxx.xxx.xxx:27017,xxx.xxx.xxx.xxx:27017"""

val conf = new SparkConf()
      .set("spark.mongodb.input.uri", uri) // 读配置

val sparkSession = SparkSession.builder().config(conf).appName("learn something").getOrCreate()
```
　　当后面要读写别的collection时使用ReadConfig覆盖即可
```scala
 val readVectorMap = new HashMap[String, String]
 readVectorMap += ("collection" -> CollectionDict.VISIT_REAL_DATA)
 readVectorMap += ("readPreference.name" -> "secondaryPreferred")
 // mongodb版本过低(3.4以下)需要指定partitioner，用于shard集群
 // readVectorMap += ("partitioner" -> "MongoShardedPartitioner")
 // MongoSplitVectorPartitioner用于standalone和replication set集群，且3.4之后此属性默认使用MongoDefaultPartitioner，它是所有平台通用的分片类MongoSamplePartitioner的包装类
 // 另外，如果在replicationset部署方式下使用MongoShardedPartitioner会出现无法将数据分片的问题，导致只有一个Task
 readVectorMap += ("partitioner" -> "MongoSplitVectorPartitioner")
 val readVectorConfig = ReadConfig(readVectorMap, Some(ReadConfig(sparkSession)))
 val visitData = MongoSpark.load(sparkSession.sparkContext, readVectorConfig)
```