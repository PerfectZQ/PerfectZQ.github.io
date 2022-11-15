---
layout: post 
title: Spark SQL Optimization
tag: Spark SQL
---

## Reference
* [SparkSQL Performance Tuning](https://spark.apache.org/docs/latest/sql-performance-tuning.html)

## AQE
* [SparkSQL - Adaptive Query Execution(AQE)](https://www.cnblogs.com/importbigdata/p/14318575.html)

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