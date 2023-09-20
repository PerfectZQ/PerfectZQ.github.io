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
1. Application Properties: 和 Application Deploy 相关，比如`spark.driver.memory`、`spark.executor.instances`，像这种参数在 Runtime(写在程序里面) 的时候已经无效了，因为要先分配总的资源(资源限定，已经分给你的资源具体怎么用，runtime 决定)，再启动程序。
2. Runtime Properties: 主要是控制 Runtime 行为，如`spark.task.maxFailures`，这种就可以在所有位置指定，只不过在优先级低的位置指定会被优先级高的覆盖掉(如果你在多个位置指定过相同 property 的话)。

## View Spark Properties
可以在`http://<driver>:4040`的`Environment`页查看，从这里可以确定之前指定的参数是否都生效了。

## Common configurations
```shell
# Number of cores to use for the driver process, only in cluster mode.
spark.driver.cores	1	
	
```

## Spark Resource Management
Spark 资源分配的最小粒度是 Container，Driver/Executor 都运行在 Container 里

### Spark Memory Management
Spark App 提交后，申请的总内存大小为`(spark.driver.memory + spark.driver.memoryOverhead) + spark.executor.instances * (spark.executor.memory + spark.executor.memoryOverhead)`，其中：
* `spark.driver.memory` <=> `--driver-memory`，默认`1G`
* `spark.driver.memoryOverhead`，默认`spark.driver.memory * MEMORY_OVERHEAD_FACTOR, with minimum of 384`，`MEMORY_OVERHEAD_FACTOR = 0.1` 在 Spark 代码中写死了
* `spark.executor.instances` <=> `--num-executors`，默认`2`
* `spark.executor.memory` <=> `--executor-memory`， 默认`1G`
* `spark.executor.memoryOverhead`，默认`spark.executor.memory * MEMORY_OVERHEAD_FACTOR, with minimum of 384MiB`

当执行`spark-submit`提交到 YARN 时，Executor 运行在 YARN Container，可申请的最大内存受限于`yarn.scheduler.maximum-allocation-mb`

[最强Spark内存管理剖析](https://bbs.huaweicloud.com/blogs/325349)

### Spark Parallels Management
Spark App 的最大任务并行度为`spark.executor.instances * spark.executor.cores * spark.vcore.boost.ratio`，其中
* `spark.executor.instances` <=> `--num-executors`，默认`2`
* `spark.executor.cores` <=> `--executor-cores`，在 YARN 模式下默认`1`
* `spark.vcore.boost.ratio`，虚拟核数，用于提高 CPU 的利用率，默认`1`

当开启资源[动态分配](https://spark.apache.org/docs/latest/configuration.html#dynamic-allocation)`spark.dynamicAllocation.enabled true`时，可以通过以下几个参数动态控制 Executor 的数量
* `spark.dynamicAllocation.minExecutors`: 最小 Executor 数量，默认`0`
* `spark.dynamicAllocation.maxExecutors`: 最大 Executor 数量，默认`infinity` 
* `spark.dynamicAllocation.initialExecutors`: 初始 Executor 数量，默认`spark.dynamicAllocation.minExecutors`


## Spark Streaming Kafka
```shell
# Spark Streaming Consumer 每个分区每秒最大消费记录条数
# Max Throughput of a Batch = maxRatePerPartition * batchWindowTime(second) * topicPartitions
spark.streaming.kafka.maxRatePerPartition 1000
```

```agsl
1: 建议将 spark.executor.memory 设置为 6g
2: 建议将 spark.vcore.boost.ratio 设置为 2
3: 建议将 spark.driver.cores 设置为 2
4: 建议将 spark.sql.fragPartition.maxShuffleBytes 设置为 1073741824
5: 建议将 spark.executor.milliCores 设置为 3860
6: 建议将 spark.yarn.batch.smart.heuristic 设置为 160233628
7: 建议将 spark.sql.files.maxPartitionBytes 设置为 536870912
8: 建议将 spark.dynamicAllocation.maxExecutors 设置为 94
9: 建议将 spark.sql.parquet.adaptiveFileSplit 设置为 true
10: 建议将 spark.sql.fragPartition.parquet.fast.mode.enabled 设置为 true
11: 建议将 spark.sql.fragPartition.compactEnabled 设置为 true
12: 建议将 spark.maxRemoteBlockSizeFetchToMem 设置为 268435456
13: 建议将 spark.sql.fragPartition.skip.failure 设置为 true
14: 建议将 spark.sql.adaptive.maxNumPostShufflePartitions 设置为 80
15: 建议将 spark.sql.fragPartition.threshold 设置为 268435456
16: 建议将 spark.sql.orc.adaptiveFileSplit 设置为 true
17: 建议将 spark.dynamicAllocation.minExecutors 设置为 1
18: 建议将 spark.executor.memoryOverhead 设置为 3072
19: 建议将 spark.dynamicAllocation.initialExecutors 设置为 1
20: 建议将 spark.executor.instances 设置为 1
21: 建议将 spark.sql.fragPartition.expectedBytes 设置为 268435456
```