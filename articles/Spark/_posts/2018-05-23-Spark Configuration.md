---
layout: post
title: Spark Configuration
tag: Spark
---

## SparkCore Config 源码
```scala
// 定义了 Spark Core 的配置属性
org.apache.spark.internal.config
```

## 参考
* [Spark Configuration](https://spark.apache.org/docs/latest/configuration.html)

## 指定 Spark Configuration
Spark Configuration Properties 可以在三个地方进行配置，优先级依次增加。

### spark-defaults.conf
在配置文件中指定全局的参数，优先级最低

```shell
$ vim SPARK_HOME/conf/spark-defaults.conf
spark.driver.extraLibraryPath /usr/hdp/current/hadoop-client/lib/native:/usr/hdp/current/hadoop-client/lib/native/Linux-amd64-64
spark.eventLog.dir hdfs:///spark2-history/
spark.eventLog.enabled true
```

### spark-submit
在执行 spark-submit 的时候为某个 spark app 指定参数

```shell
$ spark-submit \
    --class com.xxxx.xxx.xxxxxx \
    --master yarn \
    --deploy-mode client \
    --conf "spark.eventLog.enabled=false" \
    --conf "spark.executor.extraJavaOptions=-XX:+PrintGCDetails -XX:+PrintGCTimeStamps" \
    app.jar
```

### new SparkConf
在写代码的时候指定，优先级最高，但需要注意的是和 deploy 相关的参数在这里指定是无效的，具体原因在下面说。

```scala
val conf = new SparkConf()
conf.set("spark.speculation", "true")
conf.set("spark.speculation.interval", "100ms")
conf.set("spark.speculation.multiplier", "1.5")
val sparkSession = SparkSession.builder.config(conf).getOrCreate
```

## 2 Kind of Spark Properties
Spark Properties 主要分为两种
1. 一种和 deploy 相关，比如`spark.driver.memory`、`spark.executor.instances`，像这种参数在 runtime(写在程序里面) 的时候已经无效了，因为要先分配总的资源(资源限定，已经分给你的资源具体怎么用，runtime 决定)，再启动程序。
2. 另一种主要是控制 runtime 行为，如`spark.task.maxFailures`，这种就可以在所有位置指定，只不过在优先级低的位置指定会被优先级高的覆盖掉(如果你在多个位置指定过相同 property 的话)。

## View Spark Properties
可以在`http://<driver>:4040`的`Environment`页查看，从这里可以确定之前指定的参数是否都生效了。

## Common configurations
```shell
# Number of cores to use for the driver process, only in cluster mode.
spark.driver.cores	1	
	
```

## Spark Memory Management
一个 Spark 任务提交后，申请的总内存大小为`(spark.driver.memory + spark.driver.memoryOverhead) + spark.executor.instances * (spark.executor.memory + spark.executor.memoryOverhead)`，其中：
* `spark.driver.memory` <=> `--driver-memory`，默认`1G`
* `spark.driver.memoryOverhead`，默认`spark.driver.memory * MEMORY_OVERHEAD_FACTOR, with minimum of 384`，`MEMORY_OVERHEAD_FACTOR = 0.1` 在 Spark 代码中写死了
* `spark.executor.instances` <=> `--num-executors`，默认`2`，
* `spark.executor.memory` <=> `--executor-memory`， 默认`1G`，
* `spark.executor.memoryOverhead`，默认`spark.executor.memory * MEMORY_OVERHEAD_FACTOR, with minimum of 384MiB`

当执行`spark-submit`提交到 YARN 时，Executor 运行在 YARN Container，可申请的最大内存受限于`yarn.scheduler.maximum-allocation-mb`