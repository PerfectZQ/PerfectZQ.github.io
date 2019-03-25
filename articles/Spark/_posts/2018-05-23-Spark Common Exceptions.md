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
  * JVM 类加载机制: 与在编译时需要进行连接工作的语言不用，Java 类型的加载、连接和初始化都是在程序运行期间完成的。                                                                                                                                         
  * JVM 会在我们尝试实例化(new、clone、deserialize、reflect...)一个对象的时候，先检测相关类是否已经初始化，
  * 如果没有初始化，则通过 ClassLoader.loadClass() 将相关类(.class 文件)加载到内存、然后验证、准备并初始化。
  * 
  * 注: 使用这种方式需要确保 RedisUtil 在 Executor 上执行之前没有被 Driver JVM 加载
  * 过，即 Driver 端没有代码调用过 RedisUtil 类
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

如果是 HDP 集群，则直接进入 Ambari Manager -> YARN -> Configs -> Settings -> CPU Node -> Enable CPU Scheduling