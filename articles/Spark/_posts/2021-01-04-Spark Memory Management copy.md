---
layout: post
title: Spark Memory Management
tag: Spark
---

## Spark Memory

一个任务提交后，申请的总内存大小为`(spark.driver.memory + spark.driver.memoryOverhead) + spark.executor.instances * (spark.executor.memory + spark.executor.memoryOverhead)`，其中：
* `spark.driver.memory` <=> `--driver-memory`，默认`1G`
* `spark.driver.memoryOverhead`，默认`spark.driver.memory * MEMORY_OVERHEAD_FACTOR, with minimum of 384`，`MEMORY_OVERHEAD_FACTOR = 0.1` 在 Spark 代码中写死了
* `spark.executor.instances` <=> `--num-executors`，默认`2`，
* `spark.executor.memory` <=> `--executor-memory`， 默认`1G`，
* `spark.executor.memoryOverhead`，默认`spark.executor.memory * MEMORY_OVERHEAD_FACTOR, with minimum of 384MiB`

> `spark.executor.memoryOverhead`: Amount of additional memory to be allocated per executor process in cluster mode, in MiB unless otherwise specified. This is memory that accounts for things like VM overheads, interned strings, other native overheads, etc. This tends to grow with the executor size (typically 6-10%). This option is currently supported on YARN and Kubernetes. Note: Additional memory includes PySpark executor memory (when `spark.executor.pyspark.memory` is not configured) and memory used by other non-executor processes running in the same container. 

当执行`spark-submit`提交到 YARN 时，Executor 运行在 YARN Container，可申请的最大内存受限于`yarn.scheduler.maximum-allocation-mb`，因此当 Executor 申请的内存超过该值的时候就会报错。

在 Spark 2.4.5，以及之前的版本，当开启堆外内存后，`spark.yarn.executor.memoryOverhead`需要包含`spark.memory.offHeap.size`，以向 YARN 申请足够的内存去启动 Executor，也就是说如果你设置`spark.memory.offHeap.size=4G`，提交到 YARN 的时候`spark.yarn.executor.memoryOverhead`就得大于`4G`，但在 Spark 3.0 之后，`spark.executor.memoryOverhead`不再需要包含`spark.memory.offHeap.size`，具体可以参考[Difference between `spark.yarn.executor.memoryOverhead` and `spark.memory.offHeap.size`](https://stackoverflow.com/a/61723456/6470969)

> The maximum memory size of container to running executor is determined by the sum of `spark.executor.memoryOverhead`, `spark.executor.memory`, `spark.memory.offHeap.size` and `spark.executor.pyspark.memory`.

从 Spark3.0 开始，Spark 申请的内存可以划分成三大部分
* On-Heap memory：`spark.executor.memory`
* Off-Heap Memory：`spark.memory.offHeap.size`
* Additional memory：也就是`spark.executor.memoryOverhead`，用于额外的内存开销，比如 VM Overheads、interned strings、other native overheads，如果没有设置`spark.executor.pyspark.memory`，那么这部分内存也从额外的内存当中划分，还有在 container 中运行的其他 non-executor 进程所使用的内存

## On-Heap Memory
对于 Heap Memory 可以划分为三块：
* Spark Memory：`(spark.executor.memory - 300MB) * spark.memory.fraction`，该部分内存主要用于 Spark 程序运行时，这部分内存使用大致可以分为两类，Storage 和 Execution，在 UnifiedMemoryManager 中，它们共享该区域的内存，且可以互相借用，具体借用规则下面会说，这里先简单了解下
    * On-Heap Storage Memory: `Spark Memory * spark.memory.storageFraction`，主要用于存储 Spark 的 Cache 数据，需要在集群内传播的内部数据。例如 RDD 的缓存、广播（Broadcast）数据、和 Unroll 数据
    * On-Heap Execution Memory: `Spark Memory * (1 - spark.memory.storageFraction)`，主要用于 Shuffle、Join、Sort、Aggregation 计算
* Other/User Memory：`(spark.executor.memory - 300MB) * (1 - spark.memory.fraction)`，其他/用户内存，reserved for user data structures, internal metadata in Spark, and safeguarding against OOM errors in the case of sparse and unusually large records.
* Reserved Memory: `300MB`，在 Spark 中硬编码写死了，是为系统预留的内存，比如存储 Spark 内部对象。统一内存管理最初版本是没有固定 300M 的设置，但是如果给定的内存较低时，例如 `spark.executor.memory = 1G`，`spark.memory.fraction = 0.75`这样用于 non-storage、non-execution 的内存就只有 250MB，在启动时出现 OOM，因此，对于 Other/User Memory 这部分内存做了修改，先划出 300M 内存。具体可以参考 [SPARK-12081](https://issues.apache.org/jira/browse/SPARK-12081)。

Spark Heap Memory 中有两个比较重要的参数

<style>
table th:first-of-type {
    width: 30%;
}
table th:nth-of-type(2) {
    width: 10%;
}
table th:nth-of-type(3) {
    width: 50%;
}
table th:nth-of-type(4) {
    width: 10%;
}
</style>

| Property Name | Default | Meaning | Since Version |
| :-------- | :-------- | :-------- | :-------- |
| spark.memory.fraction | 0.6 | Fraction of (heap space - 300MB) used for execution and storage. The lower this is, the more frequently spills and cached data eviction occur. The purpose of this config is to set aside memory for internal metadata, user data structures, and imprecise size estimation in the case of sparse, unusually large records. Leaving this at the default value is recommended. For more detail, including important information about correctly tuning JVM garbage collection when increasing this value, see [this description](http://spark.apache.org/docs/latest/tuning.html#memory-management-overview). | 1.6.0 | 
| spark.memory.storageFraction | 0.5 | Amount of storage memory immune to eviction, expressed as a fraction of the size of the region set aside by spark.memory.fraction. The higher this is, the less working memory may be available to execution and tasks may spill to disk more often. Leaving this at the default value is recommended. For more detail, see [this description](http://spark.apache.org/docs/latest/tuning.html#memory-management-overview). | 1.6.0 | 

## Off-Heap Memroy
对于运行在 JVM 上的数据密集型程序，不良的内存管理可能会增加 GC 的长时停顿，这部分开销也是相当大的。自从 Spark1.6，Spark 引入了 Off-Heap memory (详见[SPARK-11389](https://issues.apache.org/jira/browse/SPARK-11389))，通过编写内存优化的代码并使用堆外内存存储来减少这种影响，这种模式使用 Java 的 unsafe API 直接向操作系统申请内存，堆外内存可以被精确地申请和释放，这样就避免频繁的 GC 内存开销，提升了处理性能；对于序列化数据的占用空间，可以被精确计算，相比堆内内存来说降低了管理的难度。但缺点也很明显，就是要自己写代码管理内存的申请和释放。

Spark 堆外内存默认是关闭的，通过`spark.memory.offHeap.enabled=true`来开启，当开启堆外内存时，需要确保`spark.memory.offHeap.size > 0`，自从 Spark1.6 开始，Spark 使用[UnifiedMemoryManager](https://github.com/apache/spark/blob/branch-3.1/core/src/main/scala/org/apache/spark/memory/ExecutionMemoryPool.scala)替代[StaticMemoryManager](https://github.com/apache/spark/blob/branch-1.6/core/src/main/scala/org/apache/spark/memory/StaticMemoryManager.scala)

相比 On-Heap Memroy，Off-Heap Memroy 只包含 Off-Heap Storage Memory 和 Off-Heap Execution Memory，同样也由`spark.memory.storageFraction`控制，堆外内存被启用后，Executor 内将同时存在堆内和堆外内存，这时`Storage Memory = On-Heap Storage Memory + Off-Heap Storage Memory`，同理，`Execution Memory = On-Heap Execution Memory + Off-Heap Execution Memory`。

## Unified Memory Management
在 Spark 统一内存管理机制中，Storage 和 Execution 共享一个统一的区域（M）。当不使用 Execution 内存时，Storage 可以获取所有可用内存，反之亦然。如果有必要，Execution 可能会驱逐 Storage 占用的内存，但只有当总的 Storage Memory 使用量下降到某个阈值（R）以下时，才可以执行该操作。换句话说，R 描述了 M 内的一个子区域，在该子区域中，缓存的块从不会被驱逐（但是如果空闲，可以被 Execution 占用）。Storage 可能无法驱逐 Execution 占用的内存，因为需要考虑 Shuffle 过程中的很多因素，实现起来较为复杂，而且 Shuffle 过程产生的文件在后面一定会被使用到，而 Cache 在内存的数据不一定在后面使用。详细可以参考 [Unified Memory Management in Spark 1.6](https://www.linuxprobe.com/wp-content/uploads/2017/04/unified-memory-management-spark-10000.pdf)

这种设计确保了几种理想的情况。首先，不使用缓存的应用程序可以将整个空间用于执行，从而避免了不必要的磁盘溢出。其次，使用缓存的应用程序可以保留最小的存储空间（R），以免其数据块被逐出。最后，这种方法可为不同的负载场景提供开箱即用的配置，无需用户了解如何在内部划分内存，只要根据需要改变配置即可。

* `M = (spark.executor.memory - 300MB) * spark.memory.fraction`
* `R = M * spark.memory.stoargeFraction`

> 上面说的借用对方的内存需要借用方和被借用方的内存类型都一样，都是堆内内存或者都是堆外内存，不存在堆内内存不够去借用堆外内存的空间。

### Storage Memory
![有帮助的截图]({{ site.url }}/assets/spark_storage_memory.png)

Storage Memory = On Heap Storage Memory + Off Heap Storage Memory
* On-Heap Storage Memory = `(spark.executor.memory - 300M) * spark.memory.fraction * spark.memory.storageFraction`
* Off-Heap Storage Memory = `spark.memory.offHeap.size * spark.memory.storageFraction`


## Reference
* [Memory Management Overview](https://spark.apache.org/docs/latest/tuning.html#memory-management-overview)
* [Apache Spark Memory Management](https://medium.com/analytics-vidhya/apache-spark-memory-management-49682ded3d42)
* [Apache Spark and off-heap memory](https://www.waitingforcode.com/apache-spark/apache-spark-off-heap-memory/read)
* [On-heap vs off-heap storage](https://www.waitingforcode.com/off-heap/on-heap-off-heap-storage/read)
* [Spark Executor 内存管理](http://arganzheng.life/spark-executor-memory-management.html)
* [Spark Memory Management](https://0x0fff.com/spark-memory-management/)
* [Spark on Yarn 之 Executor 内存管理](https://www.jianshu.com/p/10e91ace3378)
* [Spark 参数 spark.executor.memoryOverhead 与 spark.memory.offHeap.size 的区别](https://blog.csdn.net/lquarius/article/details/106698097)