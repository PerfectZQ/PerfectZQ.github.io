---
layout: post
title: Multiple SparkSession for one SparkContext
tag: Spark SQL
---

## Multiple SparkContext For One JVM
To better understand the problem discussed in this post it's important to define what we'll discuss about. The first discussion point is SparkContext. Historically it's an entry point for all Apache Spark pipelines located on the driver. It's a materialized connection to a Spark cluster providing all required abstractions to create RDDs, accumulators and broadcast variables. In our pipeline definition we can only use a single one active SparkContext. Otherwise the framework will throw an Only one SparkContext may be running in this JVM (see SPARK-2243). error. This behavior can change though when we set the `spark.driver.allowMultipleContexts` configuration flag to `true`.

> Since Spark 3.0, SPARK-26362 Removed 'spark.driver.allowMultipleContexts' to disallow multiple creation of SparkContexts

## Reference
* [Multiple SparkSession for one SparkContext](https://www.waitingforcode.com/apache-spark-sql/multiple-sparksession-one-sparkcontext/read#SparkSessions_sharing_SparkContext)