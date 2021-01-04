---
layout: post
title: Spark Memory Management
tag: Spark
---

## Spark Memory
对于运行在 JVM 上的数据密集型程序，不良的内存管理可能会增加 GC 的长时停顿，这部分开销也是相当大的，这样可以通过编写内存优化的代码并使用堆外内存存储来减少这种影响。Spark 堆外内存默认是关闭的，通过`spark.memory.offHeap.enabled=true`来开启，当开启堆外内存时，需要确保`spark.memory.offHeap.size > 0`

Spark 内存由两大部分构成
* 由 JVM 管理的堆内存 - Java Heap
* 由 Application 管理的堆外内存 - Off-Heap，

一个任务提交后，申请的总内存大小为`(spark.driver.memory + spark.driver.memoryOverhead) + spark.executor.instances * (spark.executor.memory + spark.executor.memoryOverhead)`，其中：
* `spark.driver.memory` <=> `--driver-memory`，默认`1G`
* `spark.driver.memoryOverhead`，默认`spark.driver.memory * MEMORY_OVERHEAD_FACTOR, with minimum of 384`，`MEMORY_OVERHEAD_FACTOR = 0.1` 在 Spark 代码中写死了
* `spark.executor.instances` <=> `--num-executors`，默认`2`，
* `spark.executor.memory` <=> `--executor-memory`， 默认`1G`，
* `spark.executor.memoryOverhead`，默认`spark.executor.memory * MEMORY_OVERHEAD_FACTOR, with minimum of 384MiB`

> Amount of additional memory to be allocated per executor process in cluster mode, in MiB unless otherwise specified. This is memory that accounts for things like VM overheads, interned strings, other native overheads, etc. This tends to grow with the executor size (typically 6-10%). This option is currently supported on YARN and Kubernetes. Note: Additional memory includes PySpark executor memory (when `spark.executor.pyspark.memory` is not configured) and memory used by other non-executor processes running in the same container. 

当执行`spark-submit`提交到 YARN 时，Executor 运行在 YARN Container，可申请的最大内存受限于`yarn.scheduler.maximum-allocation-mb`，因此当 Executor 申请的内存超过该值的时候就会报错。

在 Spark 2.4.5，以及之前的版本，当开启堆外内存后，`spark.yarn.executor.memoryOverhead`需要包含`spark.memory.offHeap.size`，以向 YARN 申请足够的内存去启动 Executor，但在 Spark 3.0 之后，`spark.executor.memoryOverhead`不再需要包含`spark.memory.offHeap.size`，具体可以参考[Difference between `spark.yarn.executor.memoryOverhead` and `spark.memory.offHeap.size`](https://stackoverflow.com/a/61723456/6470969)

> The maximum memory size of container to running executor is determined by the sum of `spark.executor.memoryOverhead`, `spark.executor.memory`, `spark.memory.offHeap.size` and `spark.executor.pyspark.memory`.


## Heap Memory

## Off-Heap Memroy

## Storage Memory
![有帮助的截图]({{ site.url }}/assets/spark_storage_memory.png)

> Storage Memory = On Heap Storage Memory + Off Heap Storage Memory
* On Heap Storage Memory = `(spark.executor.memory - 300M) * spark.storage.memoryFraction * spark.storage.safetyFraction`
* Off Heap Storage Memory = `spark.memory.offHeap.size`



## Reference
* [Memory Management Overview](https://spark.apache.org/docs/latest/tuning.html#memory-management-overview)
* [Apache Spark Memory Management](https://medium.com/analytics-vidhya/apache-spark-memory-management-49682ded3d42)
* [Apache Spark and off-heap memory](https://www.waitingforcode.com/apache-spark/apache-spark-off-heap-memory/read)
* [On-heap vs off-heap storage](https://www.waitingforcode.com/off-heap/on-heap-off-heap-storage/read)
* [Spark Executor内存管理](http://arganzheng.life/spark-executor-memory-management.html)
* [Spark Memory Management](https://0x0fff.com/spark-memory-management/)
* [Spark on Yarn 之 Executor 内存管理](https://www.jianshu.com/p/10e91ace3378)
* [Spark参数spark.executor.memoryOverhead与spark.memory.offHeap.size的区别](https://blog.csdn.net/lquarius/article/details/106698097)