---
layout: post 
title: Spark SQL Optimization
tag: Spark SQL
---

## Reference
* [SparkSQL Performance Tuning](https://spark.apache.org/docs/latest/sql-performance-tuning.html)

## AQE
* [SparkSQL - Adaptive Query Execution(AQE)](https://www.cnblogs.com/importbigdata/p/14318575.html)
* [Spark AQE 的源码初探](https://zhuanlan.zhihu.com/p/535174818)
```
spark.sql.adaptive.allowBroadcastExchange.enabled	true
spark.sql.adaptive.coalescePartitionsSupportUnion.enabled	true
spark.sql.adaptive.enabled	true
spark.sql.adaptive.forceOptimizeSkewedJoin	true
spark.sql.adaptive.join.enabled	true
spark.sql.adaptive.maxNumPostShufflePartitions	500
spark.sql.adaptive.minNumPostShufflePartitions	5
spark.sql.adaptive.multipleSkewedJoin.enabled	true
spark.sql.adaptive.multipleSkewedJoinWithAggOrWin.enabled	true
spark.sql.adaptive.shuffle.targetPostShuffleInputSize	67108864
spark.sql.adaptive.shuffle.targetPostShuffleRowCount	20000000
spark.sql.adaptive.shuffleHashJoin.enabled	true
spark.sql.adaptive.shuffleHashJoin.ignoreStatsAccuracy	true
spark.sql.adaptive.shuffleHashJoin.singleShuffleInput	true
spark.sql.adaptive.skewShuffleHashJoin.enabled	true
spark.sql.adaptive.skewedJoin.enabled	true
spark.sql.adaptive.skewedJoinSupportUnion.enabled	true
spark.sql.adaptive.skewedJoinWithAgg.enabled	true
spark.sql.adaptive.skewedPartitionFactor	3
spark.sql.adaptive.skewedPartitionRowCountThreshold	10000000
spark.sql.adaptive.skewedPartitionSizeThreshold	67108864
spark.sql.adaptiveBroadcastJoinThreshold	-1
```

```
-- Executor 的总内存
spark.executor.memory 8g
-- 
spark.vcore.boost.ratio 2
spark.driver.cores 1
spark.yarn.batch.smart.heuristic 138040435
spark.sql.files.maxPartitionBytes 1073741824
spark.dynamicAllocation.maxExecutors 41
spark.sql.parquet.adaptiveFileSplit true
spark.sql.adaptive.maxNumPostShufflePartitions 80
spark.sql.orc.adaptiveFileSplit true
spark.dynamicAllocation.minExecutors 1
spark.executor.memoryOverhead 4096
spark.dynamicAllocation.initialExecutors 1
spark.executor.instances 1
```

## SparkSQL Physical Plan
[Spark源码阅读(三十一):SparkSQL之物理计划](https://masterwangzx.com/2020/11/08/spark-sql-physical-plan/)

## Spark Exchange
[Spark 3.x 的 Exchange 体系源码解析](https://blog.csdn.net/Shockang/article/details/124112509)