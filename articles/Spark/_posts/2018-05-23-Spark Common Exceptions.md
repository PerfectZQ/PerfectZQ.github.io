---
layout: post
title: Spark Common Exceptions
tag: Spark
---

## spark 运行空指针异常的原因
1. 嵌套使用了RDD操作，比如在一个RDD map中又对另一个RDD进行了map操作。主要原因在于spark不支持RDD的嵌套操作。
2. 在RDD的算子操作中引用了object非原始类型(非int long等简单类型)的成员变量。是由于object的成员变量默认是无法序列化的。解决方法：可以先将成员变量赋值给一个临时变量，然后使用该临时变量即可
3. spark 2.0.0对kryo序列化的依赖有bug，到SPARK_HOME/conf/spark-defaults.conf
将默认： spark.serializer     org.apache.spark.serializer.KryoSerializer
改为： spark.serializer 	  org.apache.spark.serializer.JavaSerializer

## Task not serializable
[https://stackoverflow.com/questions/28006517/redis-on-sparktask-not-serializable](https://stackoverflow.com/questions/28006517/redis-on-sparktask-not-serializable)

[https://stackoverflow.com/questions/22592811/task-not-serializable-java-io-notserializableexception-when-calling-function-ou](https://stackoverflow.com/questions/22592811/task-not-serializable-java-io-notserializableexception-when-calling-function-ou)

Spark划分好DAG图后，会把各个stage转换成taskSet，然后将各个task分发到不同的executor上去计算。分发时，task中包含的算子(窄依赖)例如`map()`中的所有引用对象，需要被序列化后才能发送到各executor。所以，在`map`等算子内部使用外部定义的函数和变量时，如果这个外部定义的变量不能被序列化，就会出现这种问题。

但是在算子的计算过程中难免需要使用外部变量，要使用这些外部变量，就需要对这些外部变量做好序列化工作。最普遍的情形是：当引用了某个类（绝大多数是当前class或者object）的某个成员变量或者成员函数的时候，将导致这个类的所有的成员都需要支持序列化。即便这个类extends了Serializable，声明支持序列化，如果某些字段(成员对象，Object)不支持序列化，仍然会导致这个类在序列化的时候出现问题。这种情况可以将类中不能被序列化的成员变量标注为`@transient`，表示不对其进行序列化。

解决Task not serializable的方法，按情况使用：

* 在条件允许的情况下，不要引用外部声明的对象，在 map 算子内部创建对象。
* 如果必须引用`map`算子外部的对象，不要在类加载的时候就初始化对象，而是在 executor 真正去执行的时候去初始化对象。例如创建一个 redis 的 client，该对象就没有实现`Serializable`接口。

```scala
/**
 *  第一种：使用 rdd.mapPartitions
 *  
 *  一个partition就对应着一个task，一个分区中的数据共用一个对象
 */
resultRDD.mapPartitions {
  partition => {
    // create the connection in the context of the mapPartition operation
    val jedis = new Jedis("10.4.121.202", 6379)
    val res = partition.map {
      case (key: String, nameAndIP: String) =>
        jedis.hget(key, nameAndIP)
    }
    jedis.close
    res
  }
}

/**
 * 第二种：使用 @transient lazy 
 * 
 * 被 @transient 声明的对象不会被序列化，lazy 声明为对象被调用的时候才会创建对象
 * 这样在 executor 真正使用这个对象的时候才会执行创建操作，相当于为每个 executor
 * 都创建了一个连接对象(jedis)。
 */
object Test {
  def main(args: Array[String]): Unit = {
    
    // 当task被分发到executor上执行的时候才会创建对象，没有被创建的对象在分发时不需要被序列化。
    @transient lazy val redis: Jedis = new Jedis("10.4.121.202", 6379)
    
    resultRDD = ...
    resultRDD.map {
        case (key: String, nameAndIP: String) =>
          // 在 Executor 上调用 redis 实例的时候才开始初始化
          redis.hget(key, nameAndIP)
    }
  }
}

/**
  * 第三种：利用 JVM 类加载机制实现懒加载
  * 
  * JVM 类加载机制: 与在编译时需要进行连接工作的语言不同，Java 类型的加载、连接和初始化都是在程序运行期间完成的。                                                                                                                                         
  * JVM 会在我们尝试实例化(new、clone、deserialize、reflect...)一个对象的时候，先检测相关类是否已经初始化，
  * 如果没有初始化，则通过 ClassLoader.loadClass() 将相关类(.class 文件)加载到内存、然后验证、准备并初始化。
  * 
  * 注: 使用这种方式需要确保 RedisUtil 在 Executor 上执行之前没有被 Driver JVM 加载
  * 过，即 Driver 端没有代码调用过 RedisUtil 类，否则就需要传输该对象，要传输该对象就需要序列化
  */
object RedisUtil {
  // Scala 没有 static 关键字，object 中的成员变量实际上都是 static 的，而类中的 static 属性和 static {}
  // 在类进行初始化的阶段按顺序从上往下执行。这也是为什么 static 成员不能访问非 static 成员，反过来却可以的原因，
  // 因为类的 static 成员执行的早，非 static 成员在被真正执行到的时候才会执行。
  val redis: Jedis = new Jedis("10.4.121.202", 6379)
}

object Test {
  def main(args: Array[String]): Unit = {
    resultRDD = ...
    resultRDD.map {
        case (key: String, nameAndIP: String) =>
          // Executor JVM 在使用 RedisUtil 的时候会对其进行加载，且 JVM 内部的机制能够保证类的加载过程
          // 是线程互斥的
          RedisUtil.redis.hget(key, nameAndIP)
    }
  }
}
```

* 同理，如果是引用了 class 的成员函数导致整个 class 需要支持序列化，可以用`@transient`声明该成员不需要被序列化。
* 让不能被序列化的类`extends Serializable`接口，然后向`KryoSerializer`注册类，并声明该类的序列化方式。

```scala
SparkConf.set("spark.serializer","org.apache.spark.serializer.KryoSerializer")  
SparkConf.registerKryoClasses(Array(classOf[org.apache.hadoop.hbase.io.ImmutableBytesWritable]))
```

* 如果不支持序列化的类不是你自定义的，是第三方包的类，可以将该类的对象放在广播变量中，广播变量会将该变量变成只读的变量，然后缓存在每一台机器(executor)节点上，而非每个Task保存一份拷贝，这样也可以避免Task not serializable的问题

```scala
val sparkContext = sparkSession.sparkContext
val jedisClusterNodes = new HashSet[HostAndPort]()
jedisClusterNodes.add(new HostAndPort("10.4.121.202", 6379))
...
val broadcastJedisCluster = sparkContext.broadcast(new JedisCluster(jedisClusterNodes))
```

## java.io.NotSerializableException: org.apache.spark.SparkContext
sparkContext、sparkConf、sparkSession都是不能被序列化的对象，所以他们不能出现在map等算子中。

## object not serializable(class:org.apache.hadoop.hbase.io.ImmutableBytesWritable)
Spark操作HBase返回的是`RDD[ImmutableWritable,Result]`类型，当在集群上对此RDD进行操作的时候。（比如`join`、`repartition`等进行shuffle），就会产生此异常，因为`org.apache.hadoop.hbase.io.ImmutableBytesWritable`和`org.apache.hadoop.hbase.client.Result`并没有实现`java.io.Serializable`接口

解决方式：

方式一：
```scala
// 向Spark注册，声明ImmutableWritable类需要使用KryoSerializer进行序列化
SparkConf.set("spark.serializer","org.apache.spark.serializer.KryoSerializer")  
SparkConf.registerKryoClasses(Array(classOf[org.apache.hadoop.hbase.io.ImmutableBytesWritable]))
```
方式二：
将ImmutableWritable转换成其他可序列化的类，将其中的数据抽取出来放在可以序列化的类中，比如String或者数组

## java.lang.IllegalArgumentException: requirement failed: Column features must be of type org.apache.spark.ml.linalg.VectorUDT@3bfc3ba7 but was actually org.apache.spark.mllib.linalg.VectorUDT@f71b0bce.
解决办法：
```scala
import org.apache.spark.mllib.linalg.Vectors
// 换成
import org.apache.spark.ml.linalg.Vectors
```
## java.lang.OutOfMemoryError: PermGen space

永生代内存溢出

解决方法：
在IDEA的run configuration中添加VM options  -XX:PermSize=128m

原因：
PermGen space用于存放Class和Meta的信息,Class在被 Load的时候被放入PermGen space区域，它和和存放Instance的Heap区域不同,GC(Garbage Collection)不会在主程序运行期对PermGen space进行清理，所以如果你的APP会LOAD很多CLASS的话,就很可能
出现PermGen space错误。这种错误常见在web服务器对JSP进行pre compile的时候。

改正方法：
```shell
-Xms256m -Xmx256m -XX:MaxNewSize=256m -XX:MaxPermSize=256m 
```

## org.apache.spark.shuffle.FetchFailedException
### 原因
首先了解下 shuffle 操作，shuffle 分为`shuffle write`和`shuffle read`两部分，假设 Mapper 端有`M`个 tasks，Reducer 端有`R`个 tasks，在遇到 shuffle 操作的时候，spark 会先对前一个 stage 的`ShuffleMapTask`进行 shuffle write，写到`M * R`个`BlockManager`中，并将数据位置上报到 driver 的`MapOutTrack`组件中，下一个 stage 根据数据位置信息，执行 shuffle read，拉取上个 stage 的输出数据。 

`shuffle write`的分区数则由`shuffle read`的 RDD 分区数控制，`shuffle write`将计算的中间结果按某种规则临时放到各个 executor 所在的本地磁盘上。

`shuffle read`的分区数是由 spark 提供的一些配置参数控制。如果这个参数值设置的很小，而`shuffle read`的数据量很大，那么 task 需要处理的数据量就会很大，`JVM`内存使用过多会导致`JVM`长时间 GC 或者直接崩溃，executor 无法及时发送响应心跳，当超过默认的`spark.network.timeout=120s`，就会移除 executor，`Failed to connect to hadoop1/10.53.187.33:43791`就证明已经`lost executor`，这样就会导致`lost task`，从而`shuffle read/fetch`失败。当发生`lost task`，spark 会 retry，将失败的任务提交到另一个正常的 executor，但是每个 executor 的资源都是一样的，同样没有办法正常执行完该 task，这样所有的 executor 最终都会超时被移除。


### 解决方法
#### 减少/避免 shuffle 数据。
1. 只操作相关字段而不是使用全部字段来减少`shuffle`数据量
2. 使用`map side join`或者`broadcast join`来避免`shuffle`。

#### 减少单个 task 数据量
1. 对于 spark sql、DataFrame 的`join`、`group by`、`reduce by`等`shuffle`操作，使用`spark.sql.shuffle.partitions`根据数据量和计算复杂度适量增大分区数(默认是`200`)。
2. 对于 RDD 的`join`、`group by`、`reduce by`等`shuffle`操作，使用`spark.default.parallelism`控制`shuffle read`和`reduce`的分区数(默认为运行任务`cores`的总数)，官方建议设置为运行任务`cores`的总数的2～3倍。
3. 减少数据倾斜。过滤空值、对与某个`key`数据量特别大数据，考虑单独处理、或者改变数据的分区策略。

#### 增加 executor 内存
通过`spark.executor.memory`/`--executor-memory`适当提高 executor 的内存。

#### 增加超时检测时间
增大`spark.network.timeout`，允许有更多的时间去等待心跳响应。

## Spark on YARN –executor-cores 无效问题
### 问题描述

```shell
./spark-submit \
–master yarn-client \
–executor-cores 4 \
–num-executors 6  \
–executor-memory 10g \
–driver-memory 2g \
–class xxxApp \
xxJar
```

按理说 YARN:8088 上展示的`vcores`使用应该是`6 * 4 + 1 = 25`，但是实际上是`6 * 1 + 1 = 7`，driver 1 个核，6 个 executors 一共 6 个核，看起来就像参数设置并未生效一样。

### 解决方法
其实这是因为我们的`capacity schedule`使用的是`DefaultResourceCalculator`，而`DefaultResourceCalculator`在加载`container`时仅仅只会考虑内存而不考虑`cores`。所以，如果我们想让它既考虑内存也考虑`cores`的话，需要将`$HADOOP_HOME/etc/hadoop/capacity-scheduler.xml`中的

```xml
<property>
    <name>yarn.scheduler.capacity.resource-calculator</name>
    <value>org.apache.hadoop.yarn.util.resource.DefaultResourceCalculator</value>
</property>
```

修改为

```xml
<property>
    <name>yarn.scheduler.capacity.resource-calculator</name>
    <value>org.apache.hadoop.yarn.util.resource.DominantResourceCalculator</value>
</property>
```

>注意每个节点的配置文件都需要修改并且重启 Hadoop

另外，如果不在命令中写`executor-cores`参数，可以在`$SPARK_HOME/conf/spark-env.sh`里配置`export SPARK_EXECUTOR_CORES=4`，这样默认`executor-cores`就为 4 了。

如果是 HDP 集群，则直接进入 Ambari Manager -> YARN -> Configs -> Settings -> CPU Node -> Enable CPU Scheduling，[具体可以参考](https://arch-long.cn/articles/hadoop/Hadoop-%E5%B8%B8%E7%94%A8%E5%8F%82%E6%95%B0%E9%85%8D%E7%BD%AE.html)

## Executor heartbeat timed out after 132036 ms
```console
...
19/04/25 11:38:31 WARN HeartbeatReceiver: Removing executor 3 with no recent heartbeats: 132036 ms exceeds timeout 120000 ms
19/04/25 11:38:32 ERROR YarnScheduler: Lost executor 3 on hadoop1: Executor heartbeat timed out after 132036 ms
19/04/25 11:38:32 INFO ContextCleaner: Cleaned accumulator 3
19/04/25 11:38:32 INFO ContextCleaner: Cleaned accumulator 2
19/04/25 11:38:32 WARN TaskSetManager: Lost task 8.0 in stage 2.0 (TID 83, hadoop1, executor 3): ExecutorLostFailure (executor 3 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 132036 ms
19/04/25 11:38:32 INFO ContextCleaner: Cleaned accumulator 9
19/04/25 11:38:32 INFO ContextCleaner: Cleaned accumulator 6
19/04/25 11:38:32 INFO ContextCleaner: Cleaned accumulator 7
19/04/25 11:38:32 INFO ContextCleaner: Cleaned accumulator 8
19/04/25 11:38:32 INFO ContextCleaner: Cleaned accumulator 11
19/04/25 11:38:32 INFO ContextCleaner: Cleaned accumulator 12
19/04/25 11:38:32 WARN TaskSetManager: Lost task 15.0 in stage 2.0 (TID 91, hadoop1, executor 3): ExecutorLostFailure (executor 3 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 132036 ms
19/04/25 11:38:32 WARN TaskSetManager: Lost task 4.0 in stage 2.0 (TID 79, hadoop1, executor 3): ExecutorLostFailure (executor 3 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 132036 ms
19/04/25 11:38:32 WARN TaskSetManager: Lost task 12.0 in stage 2.0 (TID 87, hadoop1, executor 3): ExecutorLostFailure (executor 3 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 132036 ms
19/04/25 11:38:32 WARN TaskSetManager: Lost task 1.0 in stage 2.0 (TID 75, hadoop1, executor 3): ExecutorLostFailure (executor 3 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 132036 ms
19/04/25 11:38:32 INFO DAGScheduler: Executor lost: 3 (epoch 1)
19/04/25 11:38:32 INFO YarnClientSchedulerBackend: Requesting to kill executor(s) 3
19/04/25 11:38:32 INFO YarnClientSchedulerBackend: Actual list of executor(s) to be killed is 3
19/04/25 11:38:32 INFO BlockManagerMasterEndpoint: Trying to remove executor 3 from BlockManagerMaster.
19/04/25 11:38:32 INFO BlockManagerMasterEndpoint: Removing block manager BlockManagerId(3, hadoop1, 36037, None)
19/04/25 11:38:32 INFO BlockManagerInfo: Removed broadcast_2_piece0 on 192.168.51.23:38401 in memory (size: 3.7 KB, free: 366.2 MB)
19/04/25 11:38:32 INFO BlockManagerMaster: Removed 3 successfully in removeExecutor
19/04/25 11:38:32 INFO DAGScheduler: Shuffle files lost for executor: 3 (epoch 1)
19/04/25 11:38:32 INFO DAGScheduler: Host added was in lost list earlier: hadoop1
19/04/25 11:38:35 WARN TransportChannelHandler: Exception in connection from /192.168.51.21:59578
java.io.IOException: Connection reset by peer
        at sun.nio.ch.FileDispatcherImpl.read0(Native Method)
        at sun.nio.ch.SocketDispatcher.read(SocketDispatcher.java:39)
        at sun.nio.ch.IOUtil.readIntoNativeBuffer(IOUtil.java:223)
        at sun.nio.ch.IOUtil.read(IOUtil.java:192)
        at sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:380)
        at io.netty.buffer.PooledUnsafeDirectByteBuf.setBytes(PooledUnsafeDirectByteBuf.java:221)
        at io.netty.buffer.AbstractByteBuf.writeBytes(AbstractByteBuf.java:899)
        at io.netty.channel.socket.nio.NioSocketChannel.doReadBytes(NioSocketChannel.java:275)
        at io.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:119)
        at io.netty.channel.nio.NioEventLoop.processSelectedKey(NioEventLoop.java:643)
        at io.netty.channel.nio.NioEventLoop.processSelectedKeysOptimized(NioEventLoop.java:566)
        at io.netty.channel.nio.NioEventLoop.processSelectedKeys(NioEventLoop.java:480)
        at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:442)
        at io.netty.util.concurrent.SingleThreadEventExecutor$2.run(SingleThreadEventExecutor.java:131)
        at io.netty.util.concurrent.DefaultThreadFactory$DefaultRunnableDecorator.run(DefaultThreadFactory.java:144)
        at java.lang.Thread.run(Thread.java:748)
19/04/25 11:38:35 ERROR TransportResponseHandler: Still have 1 requests outstanding when connection from /192.168.51.21:59578 is closed
19/04/25 11:38:35 INFO YarnSchedulerBackend$YarnDriverEndpoint: Disabling executor 3.
19/04/25 11:38:35 INFO DAGScheduler: Executor lost: 3 (epoch 2)
19/04/25 11:38:35 INFO BlockManagerMasterEndpoint: Trying to remove executor 3 from BlockManagerMaster.
19/04/25 11:38:35 INFO BlockManagerMaster: Removed 3 successfully in removeExecutor
19/04/25 11:38:35 INFO DAGScheduler: Shuffle files lost for executor: 3 (epoch 2)
19/04/25 11:38:35 WARN BlockManagerMaster: Failed to remove broadcast 2 with removeFromMaster = true - Connection reset by peer
java.io.IOException: Connection reset by peer
        at sun.nio.ch.FileDispatcherImpl.read0(Native Method)
        at sun.nio.ch.SocketDispatcher.read(SocketDispatcher.java:39)
        at sun.nio.ch.IOUtil.readIntoNativeBuffer(IOUtil.java:223)
        at sun.nio.ch.IOUtil.read(IOUtil.java:192)
        at sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:380)
        at io.netty.buffer.PooledUnsafeDirectByteBuf.setBytes(PooledUnsafeDirectByteBuf.java:221)
        at io.netty.buffer.AbstractByteBuf.writeBytes(AbstractByteBuf.java:899)
        at io.netty.channel.socket.nio.NioSocketChannel.doReadBytes(NioSocketChannel.java:275)
        at io.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:119)
        at io.netty.channel.nio.NioEventLoop.processSelectedKey(NioEventLoop.java:643)
        at io.netty.channel.nio.NioEventLoop.processSelectedKeysOptimized(NioEventLoop.java:566)
        at io.netty.channel.nio.NioEventLoop.processSelectedKeys(NioEventLoop.java:480)
        at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:442)
        at io.netty.util.concurrent.SingleThreadEventExecutor$2.run(SingleThreadEventExecutor.java:131)
        at io.netty.util.concurrent.DefaultThreadFactory$DefaultRunnableDecorator.run(DefaultThreadFactory.java:144)
        at java.lang.Thread.run(Thread.java:748)
19/04/25 11:38:35 ERROR ContextCleaner: Error cleaning broadcast 2
org.apache.spark.SparkException: Exception thrown in awaitResult: 
        at org.apache.spark.util.ThreadUtils$.awaitResult(ThreadUtils.scala:205)
        at org.apache.spark.rpc.RpcTimeout.awaitResult(RpcTimeout.scala:75)
        at org.apache.spark.storage.BlockManagerMaster.removeBroadcast(BlockManagerMaster.scala:152)
        at org.apache.spark.broadcast.TorrentBroadcast$.unpersist(TorrentBroadcast.scala:306)
        at org.apache.spark.broadcast.TorrentBroadcastFactory.unbroadcast(TorrentBroadcastFactory.scala:45)
        at org.apache.spark.broadcast.BroadcastManager.unbroadcast(BroadcastManager.scala:60)
        at org.apache.spark.ContextCleaner.doCleanupBroadcast(ContextCleaner.scala:238)
        at org.apache.spark.ContextCleaner$$anonfun$org$apache$spark$ContextCleaner$$keepCleaning$1$$anonfun$apply$mcV$sp$1.apply(ContextCleaner.scala:194)
        at org.apache.spark.util.ThreadUtils$.awaitResult(ThreadUtils.scala:205)
        at org.apache.spark.rpc.RpcTimeout.awaitResult(RpcTimeout.scala:75)
        at org.apache.spark.storage.BlockManagerMaster.removeBroadcast(BlockManagerMaster.scala:152)
        at org.apache.spark.broadcast.TorrentBroadcast$.unpersist(TorrentBroadcast.scala:306)
        at org.apache.spark.broadcast.TorrentBroadcastFactory.unbroadcast(TorrentBroadcastFactory.scala:45)
        at org.apache.spark.broadcast.BroadcastManager.unbroadcast(BroadcastManager.scala:60)
        at org.apache.spark.ContextCleaner.doCleanupBroadcast(ContextCleaner.scala:238)
        at org.apache.spark.ContextCleaner$$anonfun$org$apache$spark$ContextCleaner$$keepCleaning$1$$anonfun$apply$mcV$sp$1.apply(ContextCleaner.scala:194)
        at org.apache.spark.ContextCleaner$$anonfun$org$apache$spark$ContextCleaner$$keepCleaning$1$$anonfun$apply$mcV$sp$1.apply(ContextCleaner.scala:185)
        at scala.Option.foreach(Option.scala:257)
        at org.apache.spark.ContextCleaner$$anonfun$org$apache$spark$ContextCleaner$$keepCleaning$1.apply$mcV$sp(ContextCleaner.scala:185)
        at org.apache.spark.util.Utils$.tryOrStopSparkContext(Utils.scala:1279)
        at org.apache.spark.ContextCleaner.org$apache$spark$ContextCleaner$$keepCleaning(ContextCleaner.scala:178)
        at org.apache.spark.ContextCleaner$$anon$1.run(ContextCleaner.scala:73)
Caused by: java.io.IOException: Connection reset by peer
        at sun.nio.ch.FileDispatcherImpl.read0(Native Method)
        at sun.nio.ch.SocketDispatcher.read(SocketDispatcher.java:39)
        at sun.nio.ch.IOUtil.readIntoNativeBuffer(IOUtil.java:223)
        at sun.nio.ch.IOUtil.read(IOUtil.java:192)
        at sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:380)
        at io.netty.buffer.PooledUnsafeDirectByteBuf.setBytes(PooledUnsafeDirectByteBuf.java:221)
        at io.netty.buffer.AbstractByteBuf.writeBytes(AbstractByteBuf.java:899)
        at io.netty.channel.socket.nio.NioSocketChannel.doReadBytes(NioSocketChannel.java:275)
        at io.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:119)
        at io.netty.channel.nio.NioEventLoop.processSelectedKey(NioEventLoop.java:643)
        at io.netty.channel.nio.NioEventLoop.processSelectedKeysOptimized(NioEventLoop.java:566)
        at io.netty.channel.nio.NioEventLoop.processSelectedKeys(NioEventLoop.java:480)
        at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:442)
        at io.netty.util.concurrent.SingleThreadEventExecutor$2.run(SingleThreadEventExecutor.java:131)
        at io.netty.util.concurrent.DefaultThreadFactory$DefaultRunnableDecorator.run(DefaultThreadFactory.java:144)
        at java.lang.Thread.run(Thread.java:748)
19/04/25 11:38:35 INFO BlockManagerInfo: Removed broadcast_1_piece0 on 192.168.51.23:38401 in memory (size: 6.5 KB, free: 366.2 MB)
19/04/25 11:38:35 ERROR YarnScheduler: Lost executor 3 on hadoop1: Container container_e1037_1555417068416_0066_01_000004 exited from explicit termination request.
19/04/25 11:38:37 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.21:32808) with ID 5
19/04/25 11:38:37 INFO TaskSetManager: Starting task 1.1 in stage 2.0 (TID 95, hadoop1, executor 5, partition 1, NODE_LOCAL, 5111 bytes)
19/04/25 11:38:37 INFO TaskSetManager: Starting task 12.1 in stage 2.0 (TID 96, hadoop1, executor 5, partition 12, NODE_LOCAL, 5111 bytes)
19/04/25 11:38:37 INFO TaskSetManager: Starting task 4.1 in stage 2.0 (TID 97, hadoop1, executor 5, partition 4, NODE_LOCAL, 5111 bytes)
19/04/25 11:38:37 INFO TaskSetManager: Starting task 15.1 in stage 2.0 (TID 98, hadoop1, executor 5, partition 15, NODE_LOCAL, 5111 bytes)
19/04/25 11:38:37 INFO TaskSetManager: Starting task 8.1 in stage 2.0 (TID 99, hadoop1, executor 5, partition 8, NODE_LOCAL, 5111 bytes)
19/04/25 11:38:37 INFO BlockManagerMasterEndpoint: Registering block manager hadoop1:38879 with 4.1 GB RAM, BlockManagerId(5, hadoop1, 38879, None)
19/04/25 11:39:31 WARN HeartbeatReceiver: Removing executor 1 with no recent heartbeats: 144788 ms exceeds timeout 120000 ms
19/04/25 11:39:31 ERROR YarnScheduler: Lost executor 1 on hadoop4: Executor heartbeat timed out after 144788 ms
19/04/25 11:39:31 WARN TaskSetManager: Lost task 3.0 in stage 2.0 (TID 77, hadoop4, executor 1): ExecutorLostFailure (executor 1 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 144788 ms
19/04/25 11:39:31 WARN TaskSetManager: Lost task 17.0 in stage 2.0 (TID 89, hadoop4, executor 1): ExecutorLostFailure (executor 1 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 144788 ms
19/04/25 11:39:31 WARN TaskSetManager: Lost task 9.0 in stage 2.0 (TID 85, hadoop4, executor 1): ExecutorLostFailure (executor 1 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 144788 ms
19/04/25 11:39:31 WARN TaskSetManager: Lost task 6.0 in stage 2.0 (TID 81, hadoop4, executor 1): ExecutorLostFailure (executor 1 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 144788 ms
19/04/25 11:39:31 WARN TaskSetManager: Lost task 18.0 in stage 2.0 (TID 93, hadoop4, executor 1): ExecutorLostFailure (executor 1 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 144788 ms
19/04/25 11:39:31 INFO DAGScheduler: Executor lost: 1 (epoch 3)
19/04/25 11:39:31 INFO YarnClientSchedulerBackend: Requesting to kill executor(s) 1
19/04/25 11:39:31 INFO BlockManagerMasterEndpoint: Trying to remove executor 1 from BlockManagerMaster.
19/04/25 11:39:31 INFO YarnClientSchedulerBackend: Actual list of executor(s) to be killed is 1
19/04/25 11:39:31 WARN HeartbeatReceiver: Removing executor 4 with no recent heartbeats: 163380 ms exceeds timeout 120000 ms
19/04/25 11:39:31 ERROR YarnScheduler: Lost executor 4 on hadoop3: Executor heartbeat timed out after 163380 ms
19/04/25 11:39:31 INFO BlockManagerMasterEndpoint: Removing block manager BlockManagerId(1, hadoop4, 42088, None)
19/04/25 11:39:31 WARN TaskSetManager: Lost task 16.0 in stage 2.0 (TID 92, hadoop3, executor 4): ExecutorLostFailure (executor 4 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 163380 ms
19/04/25 11:39:31 INFO BlockManagerMaster: Removed 1 successfully in removeExecutor
19/04/25 11:39:31 INFO DAGScheduler: Shuffle files lost for executor: 1 (epoch 3)
19/04/25 11:39:31 INFO DAGScheduler: Host added was in lost list earlier: hadoop4
19/04/25 11:39:31 WARN TaskSetManager: Lost task 5.0 in stage 2.0 (TID 80, hadoop3, executor 4): ExecutorLostFailure (executor 4 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 163380 ms
19/04/25 11:39:31 WARN TaskSetManager: Lost task 0.0 in stage 2.0 (TID 76, hadoop3, executor 4): ExecutorLostFailure (executor 4 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 163380 ms
19/04/25 11:39:31 WARN TaskSetManager: Lost task 13.0 in stage 2.0 (TID 88, hadoop3, executor 4): ExecutorLostFailure (executor 4 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 163380 ms
19/04/25 11:39:31 WARN TaskSetManager: Lost task 10.0 in stage 2.0 (TID 84, hadoop3, executor 4): ExecutorLostFailure (executor 4 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 163380 ms
19/04/25 11:39:31 INFO DAGScheduler: Executor lost: 4 (epoch 4)
19/04/25 11:39:31 INFO BlockManagerMasterEndpoint: Trying to remove executor 4 from BlockManagerMaster.
19/04/25 11:39:31 WARN BlockManagerMasterEndpoint: No more replicas available for broadcast_2_piece0 !
19/04/25 11:39:31 INFO BlockManagerMasterEndpoint: Removing block manager BlockManagerId(4, hadoop3, 36148, None)
19/04/25 11:39:31 INFO BlockManagerMaster: Removed 4 successfully in removeExecutor
19/04/25 11:39:31 INFO DAGScheduler: Shuffle files lost for executor: 4 (epoch 4)
19/04/25 11:39:31 INFO DAGScheduler: Host added was in lost list earlier: hadoop3
19/04/25 11:39:31 INFO YarnClientSchedulerBackend: Requesting to kill executor(s) 4
19/04/25 11:39:31 INFO YarnClientSchedulerBackend: Actual list of executor(s) to be killed is 4
19/04/25 11:39:34 WARN TransportChannelHandler: Exception in connection from /192.168.51.23:37280
java.io.IOException: Connection reset by peer
	at sun.nio.ch.FileDispatcherImpl.read0(Native Method)
	at sun.nio.ch.SocketDispatcher.read(SocketDispatcher.java:39)
	at sun.nio.ch.IOUtil.readIntoNativeBuffer(IOUtil.java:223)
	at sun.nio.ch.IOUtil.read(IOUtil.java:192)
	at sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:380)
	at io.netty.buffer.PooledUnsafeDirectByteBuf.setBytes(PooledUnsafeDirectByteBuf.java:221)
	at io.netty.buffer.AbstractByteBuf.writeBytes(AbstractByteBuf.java:899)
	at io.netty.channel.socket.nio.NioSocketChannel.doReadBytes(NioSocketChannel.java:275)
	at io.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:119)
	at io.netty.channel.nio.NioEventLoop.processSelectedKey(NioEventLoop.java:643)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeysOptimized(NioEventLoop.java:566)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeys(NioEventLoop.java:480)
	at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:442)
	at io.netty.util.concurrent.SingleThreadEventExecutor$2.run(SingleThreadEventExecutor.java:131)
	at io.netty.util.concurrent.DefaultThreadFactory$DefaultRunnableDecorator.run(DefaultThreadFactory.java:144)
	at java.lang.Thread.run(Thread.java:748)
19/04/25 11:39:34 ERROR TransportResponseHandler: Still have 2 requests outstanding when connection from /192.168.51.23:37280 is closed
19/04/25 11:39:34 INFO YarnSchedulerBackend$YarnDriverEndpoint: Disabling executor 4.
19/04/25 11:39:34 WARN BlockManagerMaster: Failed to remove broadcast 1 with removeFromMaster = true - Connection reset by peer
java.io.IOException: Connection reset by peer
	at sun.nio.ch.FileDispatcherImpl.read0(Native Method)
	at sun.nio.ch.SocketDispatcher.read(SocketDispatcher.java:39)
	at sun.nio.ch.IOUtil.readIntoNativeBuffer(IOUtil.java:223)
	at sun.nio.ch.IOUtil.read(IOUtil.java:192)
	at sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:380)
	at io.netty.buffer.PooledUnsafeDirectByteBuf.setBytes(PooledUnsafeDirectByteBuf.java:221)
	at io.netty.buffer.AbstractByteBuf.writeBytes(AbstractByteBuf.java:899)
	at io.netty.channel.socket.nio.NioSocketChannel.doReadBytes(NioSocketChannel.java:275)
	at io.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:119)
	at io.netty.channel.nio.NioEventLoop.processSelectedKey(NioEventLoop.java:643)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeysOptimized(NioEventLoop.java:566)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeys(NioEventLoop.java:480)
	at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:442)
	at io.netty.util.concurrent.SingleThreadEventExecutor$2.run(SingleThreadEventExecutor.java:131)
	at io.netty.util.concurrent.DefaultThreadFactory$DefaultRunnableDecorator.run(DefaultThreadFactory.java:144)
	at java.lang.Thread.run(Thread.java:748)
19/04/25 11:39:34 INFO DAGScheduler: Executor lost: 4 (epoch 5)
19/04/25 11:39:34 INFO BlockManagerMasterEndpoint: Trying to remove executor 4 from BlockManagerMaster.
19/04/25 11:39:34 ERROR ContextCleaner: Error cleaning broadcast 1
org.apache.spark.SparkException: Exception thrown in awaitResult: 
	at org.apache.spark.util.ThreadUtils$.awaitResult(ThreadUtils.scala:205)
	at org.apache.spark.rpc.RpcTimeout.awaitResult(RpcTimeout.scala:75)
	at org.apache.spark.storage.BlockManagerMaster.removeBroadcast(BlockManagerMaster.scala:152)
	at org.apache.spark.broadcast.TorrentBroadcast$.unpersist(TorrentBroadcast.scala:306)
	at org.apache.spark.broadcast.TorrentBroadcastFactory.unbroadcast(TorrentBroadcastFactory.scala:45)
	at org.apache.spark.broadcast.BroadcastManager.unbroadcast(BroadcastManager.scala:60)
	at org.apache.spark.ContextCleaner.doCleanupBroadcast(ContextCleaner.scala:238)
	at org.apache.spark.ContextCleaner$$anonfun$org$apache$spark$ContextCleaner$$keepCleaning$1$$anonfun$apply$mcV$sp$1.apply(ContextCleaner.scala:194)
	at org.apache.spark.ContextCleaner$$anonfun$org$apache$spark$ContextCleaner$$keepCleaning$1$$anonfun$apply$mcV$sp$1.apply(ContextCleaner.scala:185)
	at scala.Option.foreach(Option.scala:257)
	at org.apache.spark.ContextCleaner$$anonfun$org$apache$spark$ContextCleaner$$keepCleaning$1.apply$mcV$sp(ContextCleaner.scala:185)
	at org.apache.spark.util.Utils$.tryOrStopSparkContext(Utils.scala:1279)
	at org.apache.spark.ContextCleaner.org$apache$spark$ContextCleaner$$keepCleaning(ContextCleaner.scala:178)
	at org.apache.spark.ContextCleaner$$anon$1.run(ContextCleaner.scala:73)
Caused by: java.io.IOException: Connection reset by peer
	at sun.nio.ch.FileDispatcherImpl.read0(Native Method)
	at sun.nio.ch.SocketDispatcher.read(SocketDispatcher.java:39)
	at sun.nio.ch.IOUtil.readIntoNativeBuffer(IOUtil.java:223)
	at sun.nio.ch.IOUtil.read(IOUtil.java:192)
	at sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:380)
	at io.netty.buffer.PooledUnsafeDirectByteBuf.setBytes(PooledUnsafeDirectByteBuf.java:221)
	at io.netty.buffer.AbstractByteBuf.writeBytes(AbstractByteBuf.java:899)
	at io.netty.channel.socket.nio.NioSocketChannel.doReadBytes(NioSocketChannel.java:275)
	at io.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:119)
	at io.netty.channel.nio.NioEventLoop.processSelectedKey(NioEventLoop.java:643)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeysOptimized(NioEventLoop.java:566)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeys(NioEventLoop.java:480)
	at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:442)
	at io.netty.util.concurrent.SingleThreadEventExecutor$2.run(SingleThreadEventExecutor.java:131)
	at io.netty.util.concurrent.DefaultThreadFactory$DefaultRunnableDecorator.run(DefaultThreadFactory.java:144)
	at java.lang.Thread.run(Thread.java:748)
19/04/25 11:39:34 INFO BlockManagerMaster: Removed 4 successfully in removeExecutor
19/04/25 11:39:34 INFO DAGScheduler: Shuffle files lost for executor: 4 (epoch 5)
19/04/25 11:39:34 INFO BlockManagerInfo: Removed broadcast_0_piece0 on 192.168.51.23:38401 in memory (size: 33.1 KB, free: 366.3 MB)
19/04/25 11:39:34 ERROR YarnScheduler: Lost executor 4 on hadoop3: Container container_e1037_1555417068416_0066_01_000008 exited from explicit termination request.
19/04/25 11:39:34 WARN TransportChannelHandler: Exception in connection from /192.168.51.24:43146
java.io.IOException: Connection reset by peer
	at sun.nio.ch.FileDispatcherImpl.read0(Native Method)
	at sun.nio.ch.SocketDispatcher.read(SocketDispatcher.java:39)
	at sun.nio.ch.IOUtil.readIntoNativeBuffer(IOUtil.java:223)
	at sun.nio.ch.IOUtil.read(IOUtil.java:192)
	at sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:380)
	at io.netty.buffer.PooledUnsafeDirectByteBuf.setBytes(PooledUnsafeDirectByteBuf.java:221)
	at io.netty.buffer.AbstractByteBuf.writeBytes(AbstractByteBuf.java:899)
	at io.netty.channel.socket.nio.NioSocketChannel.doReadBytes(NioSocketChannel.java:275)
	at io.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:119)
	at io.netty.channel.nio.NioEventLoop.processSelectedKey(NioEventLoop.java:643)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeysOptimized(NioEventLoop.java:566)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeys(NioEventLoop.java:480)
	at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:442)
	at io.netty.util.concurrent.SingleThreadEventExecutor$2.run(SingleThreadEventExecutor.java:131)
	at io.netty.util.concurrent.DefaultThreadFactory$DefaultRunnableDecorator.run(DefaultThreadFactory.java:144)
	at java.lang.Thread.run(Thread.java:748)
19/04/25 11:39:34 ERROR TransportResponseHandler: Still have 2 requests outstanding when connection from /192.168.51.24:43146 is closed
19/04/25 11:39:34 INFO YarnSchedulerBackend$YarnDriverEndpoint: Disabling executor 1.
19/04/25 11:39:34 INFO DAGScheduler: Executor lost: 1 (epoch 6)
19/04/25 11:39:34 INFO BlockManagerMasterEndpoint: Trying to remove executor 1 from BlockManagerMaster.
19/04/25 11:39:34 INFO BlockManagerMaster: Removed 1 successfully in removeExecutor
19/04/25 11:39:34 INFO DAGScheduler: Shuffle files lost for executor: 1 (epoch 6)
19/04/25 11:39:34 ERROR YarnScheduler: Lost executor 1 on hadoop4: Container container_e1037_1555417068416_0066_01_000002 exited from explicit termination request.
19/04/25 11:39:36 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.24:43446) with ID 7
19/04/25 11:39:36 INFO TaskSetManager: Starting task 0.1 in stage 2.0 (TID 100, hadoop4, executor 7, partition 0, NODE_LOCAL, 5111 bytes)
19/04/25 11:39:36 INFO TaskSetManager: Starting task 5.1 in stage 2.0 (TID 101, hadoop4, executor 7, partition 5, NODE_LOCAL, 5111 bytes)
19/04/25 11:39:36 INFO TaskSetManager: Starting task 18.1 in stage 2.0 (TID 102, hadoop4, executor 7, partition 18, NODE_LOCAL, 5111 bytes)
19/04/25 11:39:36 INFO TaskSetManager: Starting task 6.1 in stage 2.0 (TID 103, hadoop4, executor 7, partition 6, NODE_LOCAL, 5111 bytes)
19/04/25 11:39:36 INFO TaskSetManager: Starting task 9.1 in stage 2.0 (TID 104, hadoop4, executor 7, partition 9, NODE_LOCAL, 5111 bytes)
19/04/25 11:39:36 INFO BlockManagerMasterEndpoint: Registering block manager hadoop4:40763 with 4.1 GB RAM, BlockManagerId(7, hadoop4, 40763, None)
19/04/25 11:39:37 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.23:34918) with ID 6
19/04/25 11:39:37 INFO TaskSetManager: Starting task 10.1 in stage 2.0 (TID 105, hadoop3, executor 6, partition 10, NODE_LOCAL, 5111 bytes)
19/04/25 11:39:37 INFO TaskSetManager: Starting task 13.1 in stage 2.0 (TID 106, hadoop3, executor 6, partition 13, NODE_LOCAL, 5111 bytes)
19/04/25 11:39:37 INFO TaskSetManager: Starting task 16.1 in stage 2.0 (TID 107, hadoop3, executor 6, partition 16, NODE_LOCAL, 5111 bytes)
19/04/25 11:39:37 INFO TaskSetManager: Starting task 17.1 in stage 2.0 (TID 108, hadoop3, executor 6, partition 17, NODE_LOCAL, 5111 bytes)
19/04/25 11:39:37 INFO TaskSetManager: Starting task 19.0 in stage 2.0 (TID 109, hadoop3, executor 6, partition 19, NODE_LOCAL, 5111 bytes)
19/04/25 11:39:37 INFO BlockManagerMasterEndpoint: Registering block manager hadoop3:37745 with 4.1 GB RAM, BlockManagerId(6, hadoop3, 37745, None)
19/04/25 11:39:37 INFO BlockManagerInfo: Added broadcast_4_piece0 in memory on hadoop4:40763 (size: 8.0 KB, free: 4.1 GB)
19/04/25 11:39:37 INFO BlockManagerInfo: Added broadcast_4_piece0 in memory on hadoop3:37745 (size: 8.0 KB, free: 4.1 GB)
19/04/25 11:40:01 INFO BlockManagerInfo: Added broadcast_3_piece0 in memory on hadoop3:37745 (size: 33.2 KB, free: 4.1 GB)
19/04/25 11:40:01 INFO BlockManagerInfo: Added broadcast_3_piece0 in memory on hadoop4:40763 (size: 33.2 KB, free: 4.1 GB)
19/04/25 11:40:01 INFO BlockManagerInfo: Removed broadcast_1_piece0 on hadoop2:44747 in memory (size: 6.5 KB, free: 4.1 GB)
19/04/25 11:40:01 INFO BlockManagerInfo: Removed broadcast_0_piece0 on hadoop2:44747 in memory (size: 33.1 KB, free: 4.1 GB)
19/04/25 11:40:01 INFO BlockManagerInfo: Added broadcast_4_piece0 in memory on hadoop1:38879 (size: 8.0 KB, free: 4.1 GB)
19/04/25 11:40:01 INFO ContextCleaner: Cleaned accumulator 1
19/04/25 11:40:01 INFO ContextCleaner: Cleaned shuffle 0
19/04/25 11:40:01 INFO ContextCleaner: Cleaned accumulator 4
19/04/25 11:40:01 INFO ContextCleaner: Cleaned accumulator 5
19/04/25 11:40:01 INFO ContextCleaner: Cleaned accumulator 10
19/04/25 11:40:02 INFO BlockManagerInfo: Added broadcast_3_piece0 in memory on hadoop1:38879 (size: 33.2 KB, free: 4.1 GB)
19/04/25 11:40:03 WARN TransportChannelHandler: Exception in connection from /192.168.51.22:42428
java.io.IOException: Connection reset by peer
	at sun.nio.ch.FileDispatcherImpl.read0(Native Method)
	at sun.nio.ch.SocketDispatcher.read(SocketDispatcher.java:39)
	at sun.nio.ch.IOUtil.readIntoNativeBuffer(IOUtil.java:223)
	at sun.nio.ch.IOUtil.read(IOUtil.java:192)
	at sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:380)
	at io.netty.buffer.PooledUnsafeDirectByteBuf.setBytes(PooledUnsafeDirectByteBuf.java:221)
	at io.netty.buffer.AbstractByteBuf.writeBytes(AbstractByteBuf.java:899)
	at io.netty.channel.socket.nio.NioSocketChannel.doReadBytes(NioSocketChannel.java:275)
	at io.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:119)
	at io.netty.channel.nio.NioEventLoop.processSelectedKey(NioEventLoop.java:643)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeysOptimized(NioEventLoop.java:566)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeys(NioEventLoop.java:480)
	at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:442)
	at io.netty.util.concurrent.SingleThreadEventExecutor$2.run(SingleThreadEventExecutor.java:131)
	at io.netty.util.concurrent.DefaultThreadFactory$DefaultRunnableDecorator.run(DefaultThreadFactory.java:144)
	at java.lang.Thread.run(Thread.java:748)
19/04/25 11:40:03 ERROR TransportResponseHandler: Still have 1 requests outstanding when connection from /192.168.51.22:42428 is closed
19/04/25 11:40:03 INFO YarnSchedulerBackend$YarnDriverEndpoint: Disabling executor 2.
19/04/25 11:40:03 INFO DAGScheduler: Executor lost: 2 (epoch 7)
19/04/25 11:40:03 INFO BlockManagerMasterEndpoint: Trying to remove executor 2 from BlockManagerMaster.
19/04/25 11:40:03 INFO BlockManagerMasterEndpoint: Removing block manager BlockManagerId(2, hadoop2, 44747, None)
19/04/25 11:40:03 INFO BlockManagerMaster: Removed 2 successfully in removeExecutor
19/04/25 11:40:03 INFO DAGScheduler: Shuffle files lost for executor: 2 (epoch 7)
19/04/25 11:40:03 WARN BlockManagerMaster: Failed to remove shuffle 0 - Connection reset by peer
java.io.IOException: Connection reset by peer
	at sun.nio.ch.FileDispatcherImpl.read0(Native Method)
	at sun.nio.ch.SocketDispatcher.read(SocketDispatcher.java:39)
	at sun.nio.ch.IOUtil.readIntoNativeBuffer(IOUtil.java:223)
	at sun.nio.ch.IOUtil.read(IOUtil.java:192)
	at sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:380)
	at io.netty.buffer.PooledUnsafeDirectByteBuf.setBytes(PooledUnsafeDirectByteBuf.java:221)
	at io.netty.buffer.AbstractByteBuf.writeBytes(AbstractByteBuf.java:899)
	at io.netty.channel.socket.nio.NioSocketChannel.doReadBytes(NioSocketChannel.java:275)
	at io.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:119)
	at io.netty.channel.nio.NioEventLoop.processSelectedKey(NioEventLoop.java:643)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeysOptimized(NioEventLoop.java:566)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeys(NioEventLoop.java:480)
	at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:442)
	at io.netty.util.concurrent.SingleThreadEventExecutor$2.run(SingleThreadEventExecutor.java:131)
	at io.netty.util.concurrent.DefaultThreadFactory$DefaultRunnableDecorator.run(DefaultThreadFactory.java:144)
	at java.lang.Thread.run(Thread.java:748)
19/04/25 11:40:03 ERROR YarnScheduler: Lost executor 2 on hadoop2: Container marked as failed: container_e1037_1555417068416_0066_01_000003 on host: hadoop2. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:40:03 WARN TaskSetManager: Lost task 11.0 in stage 2.0 (TID 86, hadoop2, executor 2): ExecutorLostFailure (executor 2 exited caused by one of the running tasks) Reason: Container marked as failed: container_e1037_1555417068416_0066_01_000003 on host: hadoop2. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:40:03 WARN TaskSetManager: Lost task 7.0 in stage 2.0 (TID 82, hadoop2, executor 2): ExecutorLostFailure (executor 2 exited caused by one of the running tasks) Reason: Container marked as failed: container_e1037_1555417068416_0066_01_000003 on host: hadoop2. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:40:03 WARN TaskSetManager: Lost task 20.0 in stage 2.0 (TID 94, hadoop2, executor 2): ExecutorLostFailure (executor 2 exited caused by one of the running tasks) Reason: Container marked as failed: container_e1037_1555417068416_0066_01_000003 on host: hadoop2. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:40:03 WARN TaskSetManager: Lost task 2.0 in stage 2.0 (TID 78, hadoop2, executor 2): ExecutorLostFailure (executor 2 exited caused by one of the running tasks) Reason: Container marked as failed: container_e1037_1555417068416_0066_01_000003 on host: hadoop2. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:40:03 WARN TaskSetManager: Lost task 14.0 in stage 2.0 (TID 90, hadoop2, executor 2): ExecutorLostFailure (executor 2 exited caused by one of the running tasks) Reason: Container marked as failed: container_e1037_1555417068416_0066_01_000003 on host: hadoop2. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:40:03 WARN YarnSchedulerBackend$YarnSchedulerEndpoint: Container marked as failed: container_e1037_1555417068416_0066_01_000003 on host: hadoop2. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:40:03 INFO BlockManagerMasterEndpoint: Trying to remove executor 2 from BlockManagerMaster.
19/04/25 11:40:03 INFO BlockManagerMaster: Removal of executor 2 requested
19/04/25 11:40:03 INFO YarnSchedulerBackend$YarnDriverEndpoint: Asked to remove non-existent executor 2
19/04/25 11:40:06 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.22:43072) with ID 8
19/04/25 11:40:06 INFO TaskSetManager: Starting task 14.1 in stage 2.0 (TID 110, hadoop2, executor 8, partition 14, NODE_LOCAL, 5111 bytes)
19/04/25 11:40:06 INFO TaskSetManager: Starting task 2.1 in stage 2.0 (TID 111, hadoop2, executor 8, partition 2, NODE_LOCAL, 5111 bytes)
19/04/25 11:40:06 INFO TaskSetManager: Starting task 20.1 in stage 2.0 (TID 112, hadoop2, executor 8, partition 20, NODE_LOCAL, 5111 bytes)
19/04/25 11:40:06 INFO TaskSetManager: Starting task 7.1 in stage 2.0 (TID 113, hadoop2, executor 8, partition 7, NODE_LOCAL, 5111 bytes)
19/04/25 11:40:06 INFO TaskSetManager: Starting task 11.1 in stage 2.0 (TID 114, hadoop2, executor 8, partition 11, NODE_LOCAL, 5111 bytes)
19/04/25 11:40:06 INFO BlockManagerMasterEndpoint: Registering block manager hadoop2:40058 with 4.1 GB RAM, BlockManagerId(8, hadoop2, 40058, None)
19/04/25 11:40:08 INFO BlockManagerInfo: Added broadcast_4_piece0 in memory on hadoop2:40058 (size: 8.0 KB, free: 4.1 GB)
19/04/25 11:40:08 INFO BlockManagerInfo: Added broadcast_3_piece0 in memory on hadoop2:40058 (size: 33.2 KB, free: 4.1 GB)
19/04/25 11:47:31 WARN TransportChannelHandler: Exception in connection from /192.168.51.24:43446
java.io.IOException: Connection reset by peer
	at sun.nio.ch.FileDispatcherImpl.read0(Native Method)
	at sun.nio.ch.SocketDispatcher.read(SocketDispatcher.java:39)
	at sun.nio.ch.IOUtil.readIntoNativeBuffer(IOUtil.java:223)
	at sun.nio.ch.IOUtil.read(IOUtil.java:192)
	at sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:380)
	at io.netty.buffer.PooledUnsafeDirectByteBuf.setBytes(PooledUnsafeDirectByteBuf.java:221)
	at io.netty.buffer.AbstractByteBuf.writeBytes(AbstractByteBuf.java:899)
	at io.netty.channel.socket.nio.NioSocketChannel.doReadBytes(NioSocketChannel.java:275)
	at io.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:119)
	at io.netty.channel.nio.NioEventLoop.processSelectedKey(NioEventLoop.java:643)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeysOptimized(NioEventLoop.java:566)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeys(NioEventLoop.java:480)
	at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:442)
	at io.netty.util.concurrent.SingleThreadEventExecutor$2.run(SingleThreadEventExecutor.java:131)
	at io.netty.util.concurrent.DefaultThreadFactory$DefaultRunnableDecorator.run(DefaultThreadFactory.java:144)
	at java.lang.Thread.run(Thread.java:748)
19/04/25 11:47:31 INFO YarnSchedulerBackend$YarnDriverEndpoint: Disabling executor 7.
19/04/25 11:47:31 INFO DAGScheduler: Executor lost: 7 (epoch 8)
19/04/25 11:47:31 INFO BlockManagerMasterEndpoint: Trying to remove executor 7 from BlockManagerMaster.
19/04/25 11:47:31 INFO BlockManagerMasterEndpoint: Removing block manager BlockManagerId(7, hadoop4, 40763, None)
19/04/25 11:47:31 INFO BlockManagerMaster: Removed 7 successfully in removeExecutor
19/04/25 11:47:31 INFO DAGScheduler: Shuffle files lost for executor: 7 (epoch 8)
19/04/25 11:47:31 ERROR YarnScheduler: Lost executor 7 on hadoop4: Container marked as failed: container_e1037_1555417068416_0066_01_000007 on host: hadoop4. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:47:31 WARN TaskSetManager: Lost task 5.1 in stage 2.0 (TID 101, hadoop4, executor 7): ExecutorLostFailure (executor 7 exited caused by one of the running tasks) Reason: Container marked as failed: container_e1037_1555417068416_0066_01_000007 on host: hadoop4. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:47:31 WARN TaskSetManager: Lost task 9.1 in stage 2.0 (TID 104, hadoop4, executor 7): ExecutorLostFailure (executor 7 exited caused by one of the running tasks) Reason: Container marked as failed: container_e1037_1555417068416_0066_01_000007 on host: hadoop4. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:47:31 WARN TaskSetManager: Lost task 0.1 in stage 2.0 (TID 100, hadoop4, executor 7): ExecutorLostFailure (executor 7 exited caused by one of the running tasks) Reason: Container marked as failed: container_e1037_1555417068416_0066_01_000007 on host: hadoop4. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:47:31 WARN TaskSetManager: Lost task 6.1 in stage 2.0 (TID 103, hadoop4, executor 7): ExecutorLostFailure (executor 7 exited caused by one of the running tasks) Reason: Container marked as failed: container_e1037_1555417068416_0066_01_000007 on host: hadoop4. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:47:31 WARN TaskSetManager: Lost task 18.1 in stage 2.0 (TID 102, hadoop4, executor 7): ExecutorLostFailure (executor 7 exited caused by one of the running tasks) Reason: Container marked as failed: container_e1037_1555417068416_0066_01_000007 on host: hadoop4. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:47:31 WARN YarnSchedulerBackend$YarnSchedulerEndpoint: Container marked as failed: container_e1037_1555417068416_0066_01_000007 on host: hadoop4. Exit status: 143. Diagnostics: Container killed on request. Exit code is 143
Container exited with a non-zero exit code 143. 
Killed by external signal

19/04/25 11:47:31 INFO BlockManagerMaster: Removal of executor 7 requested
19/04/25 11:47:31 INFO YarnSchedulerBackend$YarnDriverEndpoint: Asked to remove non-existent executor 7
19/04/25 11:47:31 INFO BlockManagerMasterEndpoint: Trying to remove executor 7 from BlockManagerMaster.
19/04/25 11:47:33 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.24:43764) with ID 9
19/04/25 11:47:33 INFO TaskSetManager: Starting task 18.2 in stage 2.0 (TID 115, hadoop4, executor 9, partition 18, NODE_LOCAL, 5111 bytes)
19/04/25 11:47:33 INFO TaskSetManager: Starting task 6.2 in stage 2.0 (TID 116, hadoop4, executor 9, partition 6, NODE_LOCAL, 5111 bytes)
19/04/25 11:47:33 INFO TaskSetManager: Starting task 0.2 in stage 2.0 (TID 117, hadoop4, executor 9, partition 0, NODE_LOCAL, 5111 bytes)
19/04/25 11:47:33 INFO TaskSetManager: Starting task 9.2 in stage 2.0 (TID 118, hadoop4, executor 9, partition 9, NODE_LOCAL, 5111 bytes)
19/04/25 11:47:33 INFO TaskSetManager: Starting task 5.2 in stage 2.0 (TID 119, hadoop4, executor 9, partition 5, NODE_LOCAL, 5111 bytes)
19/04/25 11:47:33 INFO BlockManagerMasterEndpoint: Registering block manager hadoop4:33964 with 4.1 GB RAM, BlockManagerId(9, hadoop4, 33964, None)
19/04/25 11:48:31 WARN HeartbeatReceiver: Removing executor 8 with no recent heartbeats: 156055 ms exceeds timeout 120000 ms
19/04/25 11:48:31 ERROR YarnScheduler: Lost executor 8 on hadoop2: Executor heartbeat timed out after 156055 ms
19/04/25 11:48:31 WARN TaskSetManager: Lost task 14.1 in stage 2.0 (TID 110, hadoop2, executor 8): ExecutorLostFailure (executor 8 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 156055 ms
19/04/25 11:48:31 WARN TaskSetManager: Lost task 7.1 in stage 2.0 (TID 113, hadoop2, executor 8): ExecutorLostFailure (executor 8 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 156055 ms
19/04/25 11:48:31 WARN TaskSetManager: Lost task 20.1 in stage 2.0 (TID 112, hadoop2, executor 8): ExecutorLostFailure (executor 8 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 156055 ms
19/04/25 11:48:31 WARN TaskSetManager: Lost task 11.1 in stage 2.0 (TID 114, hadoop2, executor 8): ExecutorLostFailure (executor 8 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 156055 ms
19/04/25 11:48:31 WARN TaskSetManager: Lost task 2.1 in stage 2.0 (TID 111, hadoop2, executor 8): ExecutorLostFailure (executor 8 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 156055 ms
19/04/25 11:48:31 INFO YarnClientSchedulerBackend: Requesting to kill executor(s) 8
19/04/25 11:48:31 INFO YarnClientSchedulerBackend: Actual list of executor(s) to be killed is 8
19/04/25 11:48:31 INFO DAGScheduler: Executor lost: 8 (epoch 9)
19/04/25 11:48:31 INFO BlockManagerMasterEndpoint: Trying to remove executor 8 from BlockManagerMaster.
19/04/25 11:48:31 INFO BlockManagerMasterEndpoint: Removing block manager BlockManagerId(8, hadoop2, 40058, None)
19/04/25 11:48:31 INFO BlockManagerMaster: Removed 8 successfully in removeExecutor
19/04/25 11:48:31 INFO DAGScheduler: Shuffle files lost for executor: 8 (epoch 9)
19/04/25 11:48:31 INFO DAGScheduler: Host added was in lost list earlier: hadoop2
19/04/25 11:48:36 INFO YarnSchedulerBackend$YarnDriverEndpoint: Disabling executor 8.
19/04/25 11:48:36 INFO DAGScheduler: Executor lost: 8 (epoch 10)
19/04/25 11:48:36 INFO BlockManagerMasterEndpoint: Trying to remove executor 8 from BlockManagerMaster.
19/04/25 11:48:36 INFO BlockManagerMaster: Removed 8 successfully in removeExecutor
19/04/25 11:48:36 INFO DAGScheduler: Shuffle files lost for executor: 8 (epoch 10)
19/04/25 11:48:36 ERROR YarnScheduler: Lost executor 8 on hadoop2: Container container_e1037_1555417068416_0066_01_000009 exited from explicit termination request.
19/04/25 11:48:38 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.22:43676) with ID 10
19/04/25 11:48:38 INFO TaskSetManager: Starting task 2.2 in stage 2.0 (TID 120, hadoop2, executor 10, partition 2, NODE_LOCAL, 5111 bytes)
19/04/25 11:48:38 INFO TaskSetManager: Starting task 11.2 in stage 2.0 (TID 121, hadoop2, executor 10, partition 11, NODE_LOCAL, 5111 bytes)
19/04/25 11:48:38 INFO TaskSetManager: Starting task 20.2 in stage 2.0 (TID 122, hadoop2, executor 10, partition 20, NODE_LOCAL, 5111 bytes)
19/04/25 11:48:38 INFO TaskSetManager: Starting task 7.2 in stage 2.0 (TID 123, hadoop2, executor 10, partition 7, NODE_LOCAL, 5111 bytes)
19/04/25 11:48:38 INFO TaskSetManager: Starting task 14.2 in stage 2.0 (TID 124, hadoop2, executor 10, partition 14, NODE_LOCAL, 5111 bytes)
19/04/25 11:48:38 INFO BlockManagerMasterEndpoint: Registering block manager hadoop2:41775 with 4.1 GB RAM, BlockManagerId(10, hadoop2, 41775, None)
19/04/25 11:48:39 INFO BlockManagerInfo: Added broadcast_4_piece0 in memory on hadoop2:41775 (size: 8.0 KB, free: 4.1 GB)
19/04/25 11:48:51 INFO BlockManagerInfo: Added broadcast_4_piece0 in memory on hadoop4:33964 (size: 8.0 KB, free: 4.1 GB)
19/04/25 11:49:31 WARN HeartbeatReceiver: Removing executor 6 with no recent heartbeats: 123724 ms exceeds timeout 120000 ms
19/04/25 11:49:31 ERROR YarnScheduler: Lost executor 6 on hadoop3: Executor heartbeat timed out after 123724 ms
19/04/25 11:49:31 WARN TaskSetManager: Lost task 16.1 in stage 2.0 (TID 107, hadoop3, executor 6): ExecutorLostFailure (executor 6 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 123724 ms
19/04/25 11:49:31 WARN TaskSetManager: Lost task 13.1 in stage 2.0 (TID 106, hadoop3, executor 6): ExecutorLostFailure (executor 6 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 123724 ms
19/04/25 11:49:31 WARN TaskSetManager: Lost task 19.0 in stage 2.0 (TID 109, hadoop3, executor 6): ExecutorLostFailure (executor 6 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 123724 ms
19/04/25 11:49:31 WARN TaskSetManager: Lost task 10.1 in stage 2.0 (TID 105, hadoop3, executor 6): ExecutorLostFailure (executor 6 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 123724 ms
19/04/25 11:49:31 WARN TaskSetManager: Lost task 17.1 in stage 2.0 (TID 108, hadoop3, executor 6): ExecutorLostFailure (executor 6 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 123724 ms
19/04/25 11:49:31 INFO DAGScheduler: Executor lost: 6 (epoch 11)
19/04/25 11:49:31 INFO BlockManagerMasterEndpoint: Trying to remove executor 6 from BlockManagerMaster.
19/04/25 11:49:31 INFO BlockManagerMasterEndpoint: Removing block manager BlockManagerId(6, hadoop3, 37745, None)
19/04/25 11:49:31 INFO YarnClientSchedulerBackend: Requesting to kill executor(s) 6
19/04/25 11:49:31 INFO YarnClientSchedulerBackend: Actual list of executor(s) to be killed is 6
19/04/25 11:49:31 INFO BlockManagerMaster: Removed 6 successfully in removeExecutor
19/04/25 11:49:31 INFO DAGScheduler: Shuffle files lost for executor: 6 (epoch 11)
19/04/25 11:49:31 INFO DAGScheduler: Host added was in lost list earlier: hadoop3
19/04/25 11:49:35 INFO YarnSchedulerBackend$YarnDriverEndpoint: Disabling executor 6.
19/04/25 11:49:35 INFO DAGScheduler: Executor lost: 6 (epoch 12)
19/04/25 11:49:35 INFO BlockManagerMasterEndpoint: Trying to remove executor 6 from BlockManagerMaster.
19/04/25 11:49:35 INFO BlockManagerMaster: Removed 6 successfully in removeExecutor
19/04/25 11:49:35 INFO DAGScheduler: Shuffle files lost for executor: 6 (epoch 12)
19/04/25 11:49:35 ERROR YarnScheduler: Lost executor 6 on hadoop3: Container container_e1037_1555417068416_0066_01_000011 exited from explicit termination request.
19/04/25 11:49:37 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.23:55322) with ID 11
19/04/25 11:49:37 INFO TaskSetManager: Starting task 17.2 in stage 2.0 (TID 125, hadoop3, executor 11, partition 17, NODE_LOCAL, 5111 bytes)
19/04/25 11:49:37 INFO TaskSetManager: Starting task 10.2 in stage 2.0 (TID 126, hadoop3, executor 11, partition 10, NODE_LOCAL, 5111 bytes)
19/04/25 11:49:37 INFO TaskSetManager: Starting task 19.1 in stage 2.0 (TID 127, hadoop3, executor 11, partition 19, NODE_LOCAL, 5111 bytes)
19/04/25 11:49:37 INFO TaskSetManager: Starting task 13.2 in stage 2.0 (TID 128, hadoop3, executor 11, partition 13, NODE_LOCAL, 5111 bytes)
19/04/25 11:49:37 INFO TaskSetManager: Starting task 16.2 in stage 2.0 (TID 129, hadoop3, executor 11, partition 16, NODE_LOCAL, 5111 bytes)
19/04/25 11:49:37 INFO BlockManagerMasterEndpoint: Registering block manager hadoop3:41473 with 4.1 GB RAM, BlockManagerId(11, hadoop3, 41473, None)
19/04/25 11:49:38 INFO BlockManagerInfo: Added broadcast_4_piece0 in memory on hadoop3:41473 (size: 8.0 KB, free: 4.1 GB)
19/04/25 11:49:38 INFO BlockManagerInfo: Added broadcast_3_piece0 in memory on hadoop3:41473 (size: 33.2 KB, free: 4.1 GB)
19/04/25 11:51:31 WARN HeartbeatReceiver: Removing executor 5 with no recent heartbeats: 128820 ms exceeds timeout 120000 ms
19/04/25 11:51:31 ERROR YarnScheduler: Lost executor 5 on hadoop1: Executor heartbeat timed out after 128820 ms
19/04/25 11:51:31 WARN TaskSetManager: Lost task 1.1 in stage 2.0 (TID 95, hadoop1, executor 5): ExecutorLostFailure (executor 5 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 128820 ms
19/04/25 11:51:31 WARN TaskSetManager: Lost task 15.1 in stage 2.0 (TID 98, hadoop1, executor 5): ExecutorLostFailure (executor 5 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 128820 ms
19/04/25 11:51:31 WARN TaskSetManager: Lost task 4.1 in stage 2.0 (TID 97, hadoop1, executor 5): ExecutorLostFailure (executor 5 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 128820 ms
19/04/25 11:51:31 WARN TaskSetManager: Lost task 12.1 in stage 2.0 (TID 96, hadoop1, executor 5): ExecutorLostFailure (executor 5 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 128820 ms
19/04/25 11:51:31 WARN TaskSetManager: Lost task 8.1 in stage 2.0 (TID 99, hadoop1, executor 5): ExecutorLostFailure (executor 5 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 128820 ms
19/04/25 11:51:31 INFO DAGScheduler: Executor lost: 5 (epoch 13)
19/04/25 11:51:31 INFO BlockManagerMasterEndpoint: Trying to remove executor 5 from BlockManagerMaster.
19/04/25 11:51:31 INFO BlockManagerMasterEndpoint: Removing block manager BlockManagerId(5, hadoop1, 38879, None)
19/04/25 11:51:31 INFO YarnClientSchedulerBackend: Requesting to kill executor(s) 5
19/04/25 11:51:31 INFO YarnClientSchedulerBackend: Actual list of executor(s) to be killed is 5
19/04/25 11:51:31 INFO BlockManagerMaster: Removed 5 successfully in removeExecutor
19/04/25 11:51:31 INFO DAGScheduler: Shuffle files lost for executor: 5 (epoch 13)
19/04/25 11:51:31 INFO DAGScheduler: Host added was in lost list earlier: hadoop1
19/04/25 11:51:33 WARN TransportChannelHandler: Exception in connection from /192.168.51.21:32808
java.io.IOException: Connection reset by peer
	at sun.nio.ch.FileDispatcherImpl.read0(Native Method)
	at sun.nio.ch.SocketDispatcher.read(SocketDispatcher.java:39)
	at sun.nio.ch.IOUtil.readIntoNativeBuffer(IOUtil.java:223)
	at sun.nio.ch.IOUtil.read(IOUtil.java:192)
	at sun.nio.ch.SocketChannelImpl.read(SocketChannelImpl.java:380)
	at io.netty.buffer.PooledUnsafeDirectByteBuf.setBytes(PooledUnsafeDirectByteBuf.java:221)
	at io.netty.buffer.AbstractByteBuf.writeBytes(AbstractByteBuf.java:899)
	at io.netty.channel.socket.nio.NioSocketChannel.doReadBytes(NioSocketChannel.java:275)
	at io.netty.channel.nio.AbstractNioByteChannel$NioByteUnsafe.read(AbstractNioByteChannel.java:119)
	at io.netty.channel.nio.NioEventLoop.processSelectedKey(NioEventLoop.java:643)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeysOptimized(NioEventLoop.java:566)
	at io.netty.channel.nio.NioEventLoop.processSelectedKeys(NioEventLoop.java:480)
	at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:442)
	at io.netty.util.concurrent.SingleThreadEventExecutor$2.run(SingleThreadEventExecutor.java:131)
	at io.netty.util.concurrent.DefaultThreadFactory$DefaultRunnableDecorator.run(DefaultThreadFactory.java:144)
	at java.lang.Thread.run(Thread.java:748)
19/04/25 11:51:33 INFO YarnSchedulerBackend$YarnDriverEndpoint: Disabling executor 5.
19/04/25 11:51:33 INFO DAGScheduler: Executor lost: 5 (epoch 14)
19/04/25 11:51:33 INFO BlockManagerMasterEndpoint: Trying to remove executor 5 from BlockManagerMaster.
19/04/25 11:51:33 ERROR YarnScheduler: Lost executor 5 on hadoop1: Container container_e1037_1555417068416_0066_01_000006 exited from explicit termination request.
19/04/25 11:51:33 INFO BlockManagerMaster: Removed 5 successfully in removeExecutor
19/04/25 11:51:33 INFO DAGScheduler: Shuffle files lost for executor: 5 (epoch 14)
19/04/25 11:51:36 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.21:34384) with ID 12
19/04/25 11:51:36 INFO TaskSetManager: Starting task 8.2 in stage 2.0 (TID 130, hadoop1, executor 12, partition 8, NODE_LOCAL, 5111 bytes)
19/04/25 11:51:36 INFO TaskSetManager: Starting task 12.2 in stage 2.0 (TID 131, hadoop1, executor 12, partition 12, NODE_LOCAL, 5111 bytes)
19/04/25 11:51:36 INFO TaskSetManager: Starting task 4.2 in stage 2.0 (TID 132, hadoop1, executor 12, partition 4, NODE_LOCAL, 5111 bytes)
19/04/25 11:51:36 INFO TaskSetManager: Starting task 15.2 in stage 2.0 (TID 133, hadoop1, executor 12, partition 15, NODE_LOCAL, 5111 bytes)
19/04/25 11:51:36 INFO TaskSetManager: Starting task 1.2 in stage 2.0 (TID 134, hadoop1, executor 12, partition 1, NODE_LOCAL, 5111 bytes)
19/04/25 11:51:36 INFO BlockManagerMasterEndpoint: Registering block manager hadoop1:38204 with 4.1 GB RAM, BlockManagerId(12, hadoop1, 38204, None)
19/04/25 11:51:37 INFO BlockManagerInfo: Added broadcast_4_piece0 in memory on hadoop1:38204 (size: 8.0 KB, free: 4.1 GB)
19/04/25 11:51:38 INFO BlockManagerInfo: Added broadcast_3_piece0 in memory on hadoop1:38204 (size: 33.2 KB, free: 4.1 GB)
19/04/25 11:51:43 INFO BlockManagerInfo: Added broadcast_3_piece0 in memory on hadoop4:33964 (size: 33.2 KB, free: 4.1 GB)
19/04/25 11:51:48 INFO BlockManagerInfo: Added broadcast_3_piece0 in memory on hadoop2:41775 (size: 33.2 KB, free: 4.1 GB)
19/04/25 11:58:31 WARN HeartbeatReceiver: Removing executor 12 with no recent heartbeats: 162802 ms exceeds timeout 120000 ms
19/04/25 11:58:31 ERROR YarnScheduler: Lost executor 12 on hadoop1: Executor heartbeat timed out after 162802 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 12.2 in stage 2.0 (TID 131, hadoop1, executor 12): ExecutorLostFailure (executor 12 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 162802 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 1.2 in stage 2.0 (TID 134, hadoop1, executor 12): ExecutorLostFailure (executor 12 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 162802 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 15.2 in stage 2.0 (TID 133, hadoop1, executor 12): ExecutorLostFailure (executor 12 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 162802 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 8.2 in stage 2.0 (TID 130, hadoop1, executor 12): ExecutorLostFailure (executor 12 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 162802 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 4.2 in stage 2.0 (TID 132, hadoop1, executor 12): ExecutorLostFailure (executor 12 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 162802 ms
19/04/25 11:58:31 WARN HeartbeatReceiver: Removing executor 11 with no recent heartbeats: 157829 ms exceeds timeout 120000 ms
19/04/25 11:58:31 ERROR YarnScheduler: Lost executor 11 on hadoop3: Executor heartbeat timed out after 157829 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 13.2 in stage 2.0 (TID 128, hadoop3, executor 11): ExecutorLostFailure (executor 11 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 157829 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 17.2 in stage 2.0 (TID 125, hadoop3, executor 11): ExecutorLostFailure (executor 11 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 157829 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 19.1 in stage 2.0 (TID 127, hadoop3, executor 11): ExecutorLostFailure (executor 11 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 157829 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 16.2 in stage 2.0 (TID 129, hadoop3, executor 11): ExecutorLostFailure (executor 11 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 157829 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 10.2 in stage 2.0 (TID 126, hadoop3, executor 11): ExecutorLostFailure (executor 11 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 157829 ms
19/04/25 11:58:31 WARN HeartbeatReceiver: Removing executor 9 with no recent heartbeats: 134212 ms exceeds timeout 120000 ms
19/04/25 11:58:31 ERROR YarnScheduler: Lost executor 9 on hadoop4: Executor heartbeat timed out after 134212 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 5.2 in stage 2.0 (TID 119, hadoop4, executor 9): ExecutorLostFailure (executor 9 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 134212 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 6.2 in stage 2.0 (TID 116, hadoop4, executor 9): ExecutorLostFailure (executor 9 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 134212 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 18.2 in stage 2.0 (TID 115, hadoop4, executor 9): ExecutorLostFailure (executor 9 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 134212 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 9.2 in stage 2.0 (TID 118, hadoop4, executor 9): ExecutorLostFailure (executor 9 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 134212 ms
19/04/25 11:58:31 WARN TaskSetManager: Lost task 0.2 in stage 2.0 (TID 117, hadoop4, executor 9): ExecutorLostFailure (executor 9 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 134212 ms
19/04/25 11:58:31 INFO DAGScheduler: Executor lost: 12 (epoch 15)
19/04/25 11:58:31 INFO BlockManagerMasterEndpoint: Trying to remove executor 12 from BlockManagerMaster.
19/04/25 11:58:31 INFO BlockManagerMasterEndpoint: Removing block manager BlockManagerId(12, hadoop1, 38204, None)
19/04/25 11:58:31 INFO BlockManagerMaster: Removed 12 successfully in removeExecutor
19/04/25 11:58:31 INFO DAGScheduler: Shuffle files lost for executor: 12 (epoch 15)
19/04/25 11:58:31 INFO DAGScheduler: Executor lost: 11 (epoch 16)
19/04/25 11:58:31 INFO BlockManagerMasterEndpoint: Trying to remove executor 11 from BlockManagerMaster.
19/04/25 11:58:31 INFO BlockManagerMasterEndpoint: Removing block manager BlockManagerId(11, hadoop3, 41473, None)
19/04/25 11:58:31 INFO YarnClientSchedulerBackend: Requesting to kill executor(s) 12
19/04/25 11:58:31 INFO YarnClientSchedulerBackend: Actual list of executor(s) to be killed is 12
19/04/25 11:58:31 INFO BlockManagerMaster: Removed 11 successfully in removeExecutor
19/04/25 11:58:31 INFO DAGScheduler: Shuffle files lost for executor: 11 (epoch 16)
19/04/25 11:58:31 INFO DAGScheduler: Executor lost: 9 (epoch 17)
19/04/25 11:58:31 INFO BlockManagerMasterEndpoint: Trying to remove executor 9 from BlockManagerMaster.
19/04/25 11:58:31 INFO BlockManagerMasterEndpoint: Removing block manager BlockManagerId(9, hadoop4, 33964, None)
19/04/25 11:58:31 INFO BlockManagerMaster: Removed 9 successfully in removeExecutor
19/04/25 11:58:31 INFO DAGScheduler: Shuffle files lost for executor: 9 (epoch 17)
19/04/25 11:58:31 INFO DAGScheduler: Host added was in lost list earlier: hadoop1
19/04/25 11:58:31 INFO DAGScheduler: Host added was in lost list earlier: hadoop3
19/04/25 11:58:31 INFO DAGScheduler: Host added was in lost list earlier: hadoop4
19/04/25 11:58:32 INFO YarnClientSchedulerBackend: Requesting to kill executor(s) 11
19/04/25 11:58:32 INFO YarnClientSchedulerBackend: Actual list of executor(s) to be killed is 11
19/04/25 11:58:32 INFO YarnClientSchedulerBackend: Requesting to kill executor(s) 9
19/04/25 11:58:32 INFO YarnClientSchedulerBackend: Actual list of executor(s) to be killed is 9
19/04/25 11:58:33 INFO YarnSchedulerBackend$YarnDriverEndpoint: Disabling executor 9.
19/04/25 11:58:33 INFO DAGScheduler: Executor lost: 9 (epoch 18)
19/04/25 11:58:33 INFO BlockManagerMasterEndpoint: Trying to remove executor 9 from BlockManagerMaster.
19/04/25 11:58:33 INFO BlockManagerMaster: Removed 9 successfully in removeExecutor
19/04/25 11:58:33 INFO DAGScheduler: Shuffle files lost for executor: 9 (epoch 18)
19/04/25 11:58:33 ERROR YarnScheduler: Lost executor 9 on hadoop4: Container container_e1037_1555417068416_0066_01_000013 exited from explicit termination request.
19/04/25 11:58:34 INFO YarnSchedulerBackend$YarnDriverEndpoint: Disabling executor 12.
19/04/25 11:58:34 INFO DAGScheduler: Executor lost: 12 (epoch 19)
19/04/25 11:58:34 INFO BlockManagerMasterEndpoint: Trying to remove executor 12 from BlockManagerMaster.
19/04/25 11:58:34 INFO BlockManagerMaster: Removed 12 successfully in removeExecutor
19/04/25 11:58:34 INFO DAGScheduler: Shuffle files lost for executor: 12 (epoch 19)
19/04/25 11:58:34 ERROR YarnScheduler: Lost executor 12 on hadoop1: Container container_e1037_1555417068416_0066_01_000010 exited from explicit termination request.
19/04/25 11:58:34 INFO YarnSchedulerBackend$YarnDriverEndpoint: Disabling executor 11.
19/04/25 11:58:34 INFO DAGScheduler: Executor lost: 11 (epoch 20)
19/04/25 11:58:34 INFO BlockManagerMasterEndpoint: Trying to remove executor 11 from BlockManagerMaster.
19/04/25 11:58:34 INFO BlockManagerMaster: Removed 11 successfully in removeExecutor
19/04/25 11:58:34 INFO DAGScheduler: Shuffle files lost for executor: 11 (epoch 20)
19/04/25 11:58:34 ERROR YarnScheduler: Lost executor 11 on hadoop3: Container container_e1037_1555417068416_0066_01_000015 exited from explicit termination request.
19/04/25 11:58:36 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.21:35366) with ID 14
19/04/25 11:58:36 INFO TaskSetManager: Starting task 9.3 in stage 2.0 (TID 135, hadoop1, executor 14, partition 9, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO TaskSetManager: Starting task 18.3 in stage 2.0 (TID 136, hadoop1, executor 14, partition 18, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO TaskSetManager: Starting task 6.3 in stage 2.0 (TID 137, hadoop1, executor 14, partition 6, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO TaskSetManager: Starting task 10.3 in stage 2.0 (TID 138, hadoop1, executor 14, partition 10, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO TaskSetManager: Starting task 16.3 in stage 2.0 (TID 139, hadoop1, executor 14, partition 16, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.24:44224) with ID 13
19/04/25 11:58:36 INFO TaskSetManager: Starting task 0.3 in stage 2.0 (TID 140, hadoop4, executor 13, partition 0, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO TaskSetManager: Starting task 5.3 in stage 2.0 (TID 141, hadoop4, executor 13, partition 5, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO TaskSetManager: Starting task 19.2 in stage 2.0 (TID 142, hadoop4, executor 13, partition 19, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO TaskSetManager: Starting task 17.3 in stage 2.0 (TID 143, hadoop4, executor 13, partition 17, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO TaskSetManager: Starting task 1.3 in stage 2.0 (TID 144, hadoop4, executor 13, partition 1, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO BlockManagerMasterEndpoint: Registering block manager hadoop1:44587 with 4.1 GB RAM, BlockManagerId(14, hadoop1, 44587, None)
19/04/25 11:58:36 INFO BlockManagerMasterEndpoint: Registering block manager hadoop4:36645 with 4.1 GB RAM, BlockManagerId(13, hadoop4, 36645, None)
19/04/25 11:58:36 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.23:49770) with ID 15
19/04/25 11:58:36 INFO TaskSetManager: Starting task 13.3 in stage 2.0 (TID 145, hadoop3, executor 15, partition 13, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO TaskSetManager: Starting task 4.3 in stage 2.0 (TID 146, hadoop3, executor 15, partition 4, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO TaskSetManager: Starting task 8.3 in stage 2.0 (TID 147, hadoop3, executor 15, partition 8, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO TaskSetManager: Starting task 15.3 in stage 2.0 (TID 148, hadoop3, executor 15, partition 15, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO TaskSetManager: Starting task 12.3 in stage 2.0 (TID 149, hadoop3, executor 15, partition 12, NODE_LOCAL, 5111 bytes)
19/04/25 11:58:36 INFO BlockManagerMasterEndpoint: Registering block manager hadoop3:33294 with 4.1 GB RAM, BlockManagerId(15, hadoop3, 33294, None)
19/04/25 11:58:37 INFO BlockManagerInfo: Added broadcast_4_piece0 in memory on hadoop3:33294 (size: 8.0 KB, free: 4.1 GB)
19/04/25 11:59:31 WARN HeartbeatReceiver: Removing executor 10 with no recent heartbeats: 151116 ms exceeds timeout 120000 ms
19/04/25 11:59:31 ERROR YarnScheduler: Lost executor 10 on hadoop2: Executor heartbeat timed out after 151116 ms
19/04/25 11:59:31 WARN TaskSetManager: Lost task 20.2 in stage 2.0 (TID 122, hadoop2, executor 10): ExecutorLostFailure (executor 10 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 151116 ms
19/04/25 11:59:31 WARN TaskSetManager: Lost task 14.2 in stage 2.0 (TID 124, hadoop2, executor 10): ExecutorLostFailure (executor 10 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 151116 ms
19/04/25 11:59:31 WARN TaskSetManager: Lost task 11.2 in stage 2.0 (TID 121, hadoop2, executor 10): ExecutorLostFailure (executor 10 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 151116 ms
19/04/25 11:59:31 WARN TaskSetManager: Lost task 2.2 in stage 2.0 (TID 120, hadoop2, executor 10): ExecutorLostFailure (executor 10 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 151116 ms
19/04/25 11:59:31 WARN TaskSetManager: Lost task 7.2 in stage 2.0 (TID 123, hadoop2, executor 10): ExecutorLostFailure (executor 10 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 151116 ms
19/04/25 11:59:31 INFO YarnClientSchedulerBackend: Requesting to kill executor(s) 10
19/04/25 11:59:31 INFO DAGScheduler: Executor lost: 10 (epoch 21)
19/04/25 11:59:31 INFO YarnClientSchedulerBackend: Actual list of executor(s) to be killed is 10
19/04/25 11:59:31 INFO BlockManagerMasterEndpoint: Trying to remove executor 10 from BlockManagerMaster.
19/04/25 11:59:31 INFO BlockManagerMasterEndpoint: Removing block manager BlockManagerId(10, hadoop2, 41775, None)
19/04/25 11:59:31 INFO BlockManagerMaster: Removed 10 successfully in removeExecutor
19/04/25 11:59:31 INFO DAGScheduler: Shuffle files lost for executor: 10 (epoch 21)
19/04/25 11:59:31 INFO DAGScheduler: Host added was in lost list earlier: hadoop2
19/04/25 11:59:33 INFO YarnSchedulerBackend$YarnDriverEndpoint: Disabling executor 10.
19/04/25 11:59:33 INFO DAGScheduler: Executor lost: 10 (epoch 22)
19/04/25 11:59:33 INFO BlockManagerMasterEndpoint: Trying to remove executor 10 from BlockManagerMaster.
19/04/25 11:59:33 INFO BlockManagerMaster: Removed 10 successfully in removeExecutor
19/04/25 11:59:33 INFO DAGScheduler: Shuffle files lost for executor: 10 (epoch 22)
19/04/25 11:59:33 ERROR YarnScheduler: Lost executor 10 on hadoop2: Container container_e1037_1555417068416_0066_01_000012 exited from explicit termination request.
19/04/25 11:59:35 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.22:44530) with ID 16
19/04/25 11:59:35 INFO TaskSetManager: Starting task 7.3 in stage 2.0 (TID 150, hadoop2, executor 16, partition 7, NODE_LOCAL, 5111 bytes)
19/04/25 11:59:35 INFO TaskSetManager: Starting task 2.3 in stage 2.0 (TID 151, hadoop2, executor 16, partition 2, NODE_LOCAL, 5111 bytes)
19/04/25 11:59:35 INFO TaskSetManager: Starting task 11.3 in stage 2.0 (TID 152, hadoop2, executor 16, partition 11, NODE_LOCAL, 5111 bytes)
19/04/25 11:59:35 INFO TaskSetManager: Starting task 14.3 in stage 2.0 (TID 153, hadoop2, executor 16, partition 14, NODE_LOCAL, 5111 bytes)
19/04/25 11:59:35 INFO TaskSetManager: Starting task 20.3 in stage 2.0 (TID 154, hadoop2, executor 16, partition 20, NODE_LOCAL, 5111 bytes)
19/04/25 11:59:35 INFO BlockManagerMasterEndpoint: Registering block manager hadoop2:41921 with 4.1 GB RAM, BlockManagerId(16, hadoop2, 41921, None)
19/04/25 11:59:36 INFO BlockManagerInfo: Added broadcast_4_piece0 in memory on hadoop2:41921 (size: 8.0 KB, free: 4.1 GB)
19/04/25 11:59:36 INFO BlockManagerInfo: Added broadcast_3_piece0 in memory on hadoop2:41921 (size: 33.2 KB, free: 4.1 GB)
19/04/25 11:59:48 INFO BlockManagerInfo: Added broadcast_3_piece0 in memory on hadoop3:33294 (size: 33.2 KB, free: 4.1 GB)
19/04/25 11:59:48 INFO BlockManagerInfo: Added broadcast_4_piece0 in memory on hadoop1:44587 (size: 8.0 KB, free: 4.1 GB)
19/04/25 11:59:48 INFO BlockManagerInfo: Added broadcast_4_piece0 in memory on hadoop4:36645 (size: 8.0 KB, free: 4.1 GB)
19/04/25 11:59:48 INFO BlockManagerInfo: Added broadcast_3_piece0 in memory on hadoop4:36645 (size: 33.2 KB, free: 4.1 GB)
19/04/25 11:59:49 INFO BlockManagerInfo: Added broadcast_3_piece0 in memory on hadoop1:44587 (size: 33.2 KB, free: 4.1 GB)
19/04/25 12:06:31 WARN HeartbeatReceiver: Removing executor 16 with no recent heartbeats: 130052 ms exceeds timeout 120000 ms
19/04/25 12:06:31 ERROR YarnScheduler: Lost executor 16 on hadoop2: Executor heartbeat timed out after 130052 ms
19/04/25 12:06:31 WARN TaskSetManager: Lost task 2.3 in stage 2.0 (TID 151, hadoop2, executor 16): ExecutorLostFailure (executor 16 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 130052 ms
19/04/25 12:06:31 ERROR TaskSetManager: Task 2 in stage 2.0 failed 4 times; aborting job
19/04/25 12:06:31 WARN TaskSetManager: Lost task 20.3 in stage 2.0 (TID 154, hadoop2, executor 16): ExecutorLostFailure (executor 16 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 130052 ms
19/04/25 12:06:31 WARN TaskSetManager: Lost task 7.3 in stage 2.0 (TID 150, hadoop2, executor 16): ExecutorLostFailure (executor 16 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 130052 ms
19/04/25 12:06:31 WARN TaskSetManager: Lost task 14.3 in stage 2.0 (TID 153, hadoop2, executor 16): ExecutorLostFailure (executor 16 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 130052 ms
19/04/25 12:06:31 WARN TaskSetManager: Lost task 11.3 in stage 2.0 (TID 152, hadoop2, executor 16): ExecutorLostFailure (executor 16 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 130052 ms
19/04/25 12:06:31 INFO YarnClientSchedulerBackend: Requesting to kill executor(s) 16
19/04/25 12:06:31 INFO YarnClientSchedulerBackend: Actual list of executor(s) to be killed is 16
19/04/25 12:06:31 INFO YarnScheduler: Cancelling stage 2
19/04/25 12:06:31 INFO YarnScheduler: Stage 2 was cancelled
19/04/25 12:06:31 INFO DAGScheduler: ResultStage 2 (foreachPartition at DU2Rockfs.scala:43) failed in 2049.529 s due to Job aborted due to stage failure: Task 2 in stage 2.0 failed 4 times, most recent failure: Lost task 2.3 in stage 2.0 (TID 151, hadoop2, executor 16): ExecutorLostFailure (executor 16 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 130052 ms
Driver stacktrace:
19/04/25 12:06:32 INFO DAGScheduler: Job 1 failed: foreachPartition at DU2Rockfs.scala:43, took 2049.609175 s
19/04/25 12:06:32 INFO DAGScheduler: Executor lost: 16 (epoch 23)
19/04/25 12:06:32 INFO BlockManagerMasterEndpoint: Trying to remove executor 16 from BlockManagerMaster.
19/04/25 12:06:32 INFO BlockManagerMasterEndpoint: Removing block manager BlockManagerId(16, hadoop2, 41921, None)
19/04/25 12:06:32 INFO BlockManagerMaster: Removed 16 successfully in removeExecutor
19/04/25 12:06:32 INFO DAGScheduler: Shuffle files lost for executor: 16 (epoch 23)
19/04/25 12:06:32 INFO DAGScheduler: Host added was in lost list earlier: hadoop2
Exception in thread "main" org.apache.spark.SparkException: Job aborted due to stage failure: Task 2 in stage 2.0 failed 4 times, most recent failure: Lost task 2.3 in stage 2.0 (TID 151, hadoop2, executor 16): ExecutorLostFailure (executor 16 exited caused by one of the running tasks) Reason: Executor heartbeat timed out after 130052 ms
Driver stacktrace:
	at org.apache.spark.scheduler.DAGScheduler.org$apache$spark$scheduler$DAGScheduler$$failJobAndIndependentStages(DAGScheduler.scala:1517)
	at org.apache.spark.scheduler.DAGScheduler$$anonfun$abortStage$1.apply(DAGScheduler.scala:1505)
	at org.apache.spark.scheduler.DAGScheduler$$anonfun$abortStage$1.apply(DAGScheduler.scala:1504)
	at scala.collection.mutable.ResizableArray$class.foreach(ResizableArray.scala:59)
	at scala.collection.mutable.ArrayBuffer.foreach(ArrayBuffer.scala:48)
	at org.apache.spark.scheduler.DAGScheduler.abortStage(DAGScheduler.scala:1504)
	at org.apache.spark.scheduler.DAGScheduler$$anonfun$handleTaskSetFailed$1.apply(DAGScheduler.scala:814)
	at org.apache.spark.scheduler.DAGScheduler$$anonfun$handleTaskSetFailed$1.apply(DAGScheduler.scala:814)
	at scala.Option.foreach(Option.scala:257)
	at org.apache.spark.scheduler.DAGScheduler.handleTaskSetFailed(DAGScheduler.scala:814)
	at org.apache.spark.scheduler.DAGSchedulerEventProcessLoop.doOnReceive(DAGScheduler.scala:1732)
	at org.apache.spark.scheduler.DAGSchedulerEventProcessLoop.onReceive(DAGScheduler.scala:1687)
	at org.apache.spark.scheduler.DAGSchedulerEventProcessLoop.onReceive(DAGScheduler.scala:1676)
	at org.apache.spark.util.EventLoop$$anon$1.run(EventLoop.scala:48)
	at org.apache.spark.scheduler.DAGScheduler.runJob(DAGScheduler.scala:630)
	at org.apache.spark.SparkContext.runJob(SparkContext.scala:2029)
	at org.apache.spark.SparkContext.runJob(SparkContext.scala:2050)
	at org.apache.spark.SparkContext.runJob(SparkContext.scala:2069)
	at org.apache.spark.SparkContext.runJob(SparkContext.scala:2094)
	at org.apache.spark.rdd.RDD$$anonfun$foreachPartition$1.apply(RDD.scala:926)
	at org.apache.spark.rdd.RDD$$anonfun$foreachPartition$1.apply(RDD.scala:924)
	at org.apache.spark.rdd.RDDOperationScope$.withScope(RDDOperationScope.scala:151)
	at org.apache.spark.rdd.RDDOperationScope$.withScope(RDDOperationScope.scala:112)
	at org.apache.spark.rdd.RDD.withScope(RDD.scala:362)
	at org.apache.spark.rdd.RDD.foreachPartition(RDD.scala:924)
	at org.apache.spark.sql.Dataset$$anonfun$foreachPartition$1.apply$mcV$sp(Dataset.scala:2341)
	at org.apache.spark.sql.Dataset$$anonfun$foreachPartition$1.apply(Dataset.scala:2341)
	at org.apache.spark.sql.Dataset$$anonfun$foreachPartition$1.apply(Dataset.scala:2341)
	at org.apache.spark.sql.execution.SQLExecution$.withNewExecutionId(SQLExecution.scala:65)
	at org.apache.spark.sql.Dataset.withNewExecutionId(Dataset.scala:2828)
	at org.apache.spark.sql.Dataset.foreachPartition(Dataset.scala:2340)
	at com.rich.apps.DU2Rockfs$.main(DU2Rockfs.scala:43)
	at com.rich.apps.DU2Rockfs.main(DU2Rockfs.scala)
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.lang.reflect.Method.invoke(Method.java:498)
	at org.apache.spark.deploy.SparkSubmit$.org$apache$spark$deploy$SparkSubmit$$runMain(SparkSubmit.scala:782)
	at org.apache.spark.deploy.SparkSubmit$.doRunMain$1(SparkSubmit.scala:180)
	at org.apache.spark.deploy.SparkSubmit$.submit(SparkSubmit.scala:205)
	at org.apache.spark.deploy.SparkSubmit$.main(SparkSubmit.scala:119)
	at org.apache.spark.deploy.SparkSubmit.main(SparkSubmit.scala)
19/04/25 12:06:32 INFO SparkContext: Invoking stop() from shutdown hook
19/04/25 12:06:32 INFO SparkUI: Stopped Spark web UI at http://192.168.51.23:4040
19/04/25 12:06:32 INFO YarnClientSchedulerBackend: Interrupting monitor thread
19/04/25 12:06:32 INFO YarnClientSchedulerBackend: Shutting down all executors
19/04/25 12:06:32 INFO YarnSchedulerBackend$YarnDriverEndpoint: Asking each executor to shut down
19/04/25 12:06:32 INFO SchedulerExtensionServices: Stopping SchedulerExtensionServices
(serviceOption=None,
 services=List(),
 started=false)
19/04/25 12:06:32 INFO YarnClientSchedulerBackend: Stopped
19/04/25 12:06:32 INFO MapOutputTrackerMasterEndpoint: MapOutputTrackerMasterEndpoint stopped!
19/04/25 12:06:32 INFO MemoryStore: MemoryStore cleared
19/04/25 12:06:33 INFO BlockManager: BlockManager stopped
19/04/25 12:06:33 INFO BlockManagerMaster: BlockManagerMaster stopped
19/04/25 12:06:33 INFO OutputCommitCoordinator$OutputCommitCoordinatorEndpoint: OutputCommitCoordinator stopped!
19/04/25 12:06:33 INFO SparkContext: Successfully stopped SparkContext
19/04/25 12:06:33 INFO ShutdownHookManager: Shutdown hook called
19/04/25 12:06:33 INFO ShutdownHookManager: Deleting directory /tmp/spark-209477c1-c178-450e-b37a-fe7542600115
```

从日志可以看出`HeartbeatReceiver`已经有`132036ms`没有收到过`executor 3`的`heartbeat`了，超过了阈值`120000ms`，很担心它，以为它死了，所以把它丢了，接着你就看到了`Lost executor3...`的日志，发生这种事情的原因不一定是`executor 3`真的死了，也可能只是因为它真的很忙。这个故事告诉我们，再忙也要在担心阈值时间内给家里打个电话，不然可能以为你死了就把你逐出家门了。

要解决这个问题可以从两个方面入手。
* 第一检查一下自己的 task 是不是太大或太复杂导致内存不够引发 OOM 或者 CPU 飙升，一般情况下可以通过`repartition`进一步拆分 task 去解决
* 第二跟家里商量商量提高一下担心你的阈值，比如`--conf spark.network.timeout=10000000ms`(`default=120000ms`)，这个值会被`spark.core.connection.ack.wait.timeout`、`spark.storage.blockManagerSlaveTimeoutMs`、`spark.shuffle.io.connectionTimeout`、`spark.rpc.askTimeout`、`spark.rpc.lookupTimeout`多个配置项引用为默认值，当然这些配置项也可以单独指定具体值。另外需要了解的是`--conf spark.executor.heartbeatInterval=100000`，这个参数控制了`executor`向`driver`汇报心跳的时间间隔，因此这个值必须小于`spark.network.timeout`，但因为很多原因`executor`并不能保证及时汇报心跳，比如`executor`在 GC。
