---
layout: post
title: Spark Lineage and Tolerance
tag: Spark
---

## Spark Lineage
> RDDs are immutable distributed collection of elements of your data that can be stored in memory or disk across a cluster of machines. The data is partitioned across machines in your cluster that can be operated in parallel with a low-level API that offers transformations and actions. **RDDs are fault tolerant as they track data lineage information to rebuild lost data automatically on failure**

## Reference
* [what-is-lineage-in-spark](https://stackoverflow.com/questions/45751113/what-is-lineage-in-spark)
* [How does lineage get passed down in RDDs in Apache Spark](https://stackoverflow.com/questions/30699530/how-does-lineage-get-passed-down-in-rdds-in-apache-spark)
* [Internal Work of Spark](https://stackoverflow.com/questions/30691385/internal-work-of-spark/30691654#30691654)