---
layout: post
title: Spark Job Optimization
tag: Spark
---

## References
* [Tuning Spark](https://spark.apache.org/docs/latest/tuning.html#tuning-spark)
* [Apache Spark Memory Management](https://medium.com/analytics-vidhya/apache-spark-memory-management-49682ded3d42)
* [Apache Spark 2.0 作业优化技巧](https://mp.weixin.qq.com/s/C94nFvrp9ALgKVsOmIX7Jw)

## reduce task 数目不合适
调整分区数，设置为core数目的2-3倍，太少运行缓慢或者单个任务太大导致内存不足，数量太多，造成任务太小，增加启动任务的开销，因此需要合理的修改reduce task的数量
```shell
spark.default.parallelism 800
```
	
## shuffle io 磁盘时间长
设置多个磁盘，并且设置 io 最快的磁盘，通过增加 IO 来优化 shuffle 性能
```shell
spark.local.dir
```
	
## map/reduce 数量大，造成shuffle小文件的数目较多
设置下列参数来合并 shuffle 中间文件，此时文件的数目为 reduce tasks 的数目
```shell
spark.shuffle.consolidateFiles true
```

## 序列化时间长、结果大
spark 默认使用 JDK 自带的 ObjetcOutputStream，这种方式产生的结果大、cpu处理时间长，另外如果结果本身就很大，那就只能使用广播变量了，结果是运行变缓慢？
```shell
spark.serializer  org.apache.spark.serializer.KeyoSerializer
```

## 单条记录消耗大
`map()`换成`mapPartition`，`map()`底层虽然也是`mapPartition`，但是`map()`对数据是每条数据都进行相同的操作，如果是要写数据的话就会频繁开关连接，这时候就可以用`mapPartition`进行批量处理。

## Collect 输出大量结果时速度慢
collect 的源码是把所有的结果以 Array 形式放在内存中，可以考虑直接写到 hdfs 上
	
## 任务执行速度倾斜
如果发生数据倾斜，一般是因为 partition 的 key 取得不好，可以考虑其他的处理方式，并在中间加上`aggregation`

如果是 worker 倾斜，例如某些 worker 上的 executor 执行缓慢(一般是负载太高，资源不足)，可以启用下面的配置，在其他节点上启动相同的 task，哪个结束的早就用哪个
```shell
spark.speculation true
```
	
## 通过多步骤的RDD操作后有很多空任务或者小任务产生
使用`coalesce`或者`repartition`重新分区
	
## Spark Streaming 吞吐量不高
```shell
spark.streaming.concurrentJobs
```
	
## Spark Streaming 运行速度突然下降，经常会有任务延迟和阻塞
这是因为设置 job 启动 interval 的时间间隔太短了，导致每次 job 在指定的时间无法正常执行完成，换句话说就是创建的 windows 窗口时间间隔太密集了
