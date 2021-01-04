---
layout: post
title: Spark Memory Management
tag: Spark
---

## Spark Memory
对于运行在 JVM 上的数据密集型程序，不良的内存管理可能会增加 GC 的长时停顿，这部分开销也是相当大的，Spark 在 1.6 引入了`Off-heap`内存，这样可以通过编写内存优化的代码并使用堆外内存存储来减少这种影响。

Spark 内存由两大部分构成
* 由 JVM 管理的堆内存 - Java Heap
* 由 Application 管理的堆外内存 - Off-Heap

## Heap Memory

## Off-Heap Memroy

## Reference
* [Memory Management Overview](https://spark.apache.org/docs/latest/tuning.html#memory-management-overview)
* [Apache Spark Memory Management](https://medium.com/analytics-vidhya/apache-spark-memory-management-49682ded3d42)
* [Apache Spark and off-heap memory](https://www.waitingforcode.com/apache-spark/apache-spark-off-heap-memory/read)
* [On-heap vs off-heap storage](https://www.waitingforcode.com/off-heap/on-heap-off-heap-storage/read)
* [Spark Executor内存管理](http://arganzheng.life/spark-executor-memory-management.html)
