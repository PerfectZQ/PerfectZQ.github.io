---
layout: post
title: Configuration
tag: Spark
---

## Spark Configuration
```shell
# Number of cores to use for the driver process, only in cluster mode.
spark.driver.cores	1	
	
# 设置executor使用的cpu数 和executors实例的数（spark.executor.instances）
spark-submit --master yarn --deploy-mode client --executor-cores 6 --num-executors 6 --class com.neusoft.client.Client  /usr/zhangqiang/smarket-remould.jar 
	
# reduce task 数目不合适
# 调整分区数，设置为core数目的2-3倍，太少运行缓慢或者单个任务太大导致内存不足；数量太多，造成任务太小，增加启动任务的开销
# 因此需要合理的修改reduce task的数量
spark.default.parallelism 
	
# shuffle io 磁盘时间长
# 设置多个磁盘，并且设置io最快的磁盘，通过增加IO来优化shuffle性能
spark.local.dir
	
# map/reduce数量大，造成shuffle小文件的数目较多，设置下列参数来合并shuffle中间文件，此时文件的数目为reduce tasks的数目
spark.shuffle.consolidateFiles true
	
# 序列化时间长、结果大
# spark默认使用JDK自带的ObjetcOutputStream，这种方式产生的结果大、cpu处理时间长
# 另外如果结果本身就很大，那就只能使用广播变量了，结果是运行变缓慢？
spark.serializer  org.apache.spark.serializer.KeyoSerializer
	
# 单条记录消耗大
# mapPartition是对每个partition进行计算，而map是对partition中的每条记录进行计算
map -> mapPartition

# collect输出大量结果时速度慢
# collect的源码是把所有的结果以Array形式放在内存中，可以直接输出到分布式文件系统（hdfs）然后查看文件系统中的内容
	
# 任务执行速度倾斜
# 如果发生数据倾斜，一般是因为partition的key取得不好，可以考虑其他的处理方式，并在中间加上aggregation操作
# 如果是worker倾斜，例如某些worker上的executor执行缓慢，可以通过设置下面的参数将那些持续缓慢的节点去掉
spark.speculation=true
	
# 通过多步骤的RDD操作后有很多空任务或者小任务产生
# 使用coalesce或者repartition去减少RDD中的partition数
	
# spark Streaming 吞吐量不高
spark.streaming.concurrentJobs
	
# spark streaming 运行速度突然下降，经常会有任务延迟和阻塞
# 这是因为设置job启动interval的时间间隔太短了，导致每次job在指定的时间无法正常执行完成，换句话说就是创建的windows窗口时间间隔太密集了
```
