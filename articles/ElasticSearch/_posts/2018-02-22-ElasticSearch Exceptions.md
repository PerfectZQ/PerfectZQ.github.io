---
layout: post
title: ElasticSearch Exceptions
tag: ElasticSearch
---

## ElasticSearch
### Cannot determine write shards...
```console
org.elasticsearch.hadoop.EsHadoopIllegalArgumentException: Cannot determine write shards for [SafetyCenter_YBRZ/docs]; likely its format is incorrect (maybe it contains illegal characters?)
at org.elasticsearch.hadoop.util.Assert.isTrue(Assert.java:50)
    at org.elasticsearch.hadoop.rest.RestService.initSingleIndex(RestService.java:439)
    at org.elasticsearch.hadoop.rest.RestService.createWriter(RestService.java:400)
    at org.elasticsearch.spark.rdd.EsRDDWriter.write(EsRDDWriter.scala:40)
    at org.elasticsearch.spark.rdd.EsSpark$$anonfun$saveToEs$1.apply(EsSpark.scala:67)
    at org.elasticsearch.spark.rdd.EsSpark$$anonfun$saveToEs$1.apply(EsSpark.scala:67)
    at org.apache.spark.scheduler.ResultTask.runTask(ResultTask.scala:66)
    at org.apache.spark.scheduler.Task.run(Task.scala:89)
    at org.apache.spark.executor.Executor$TaskRunner.run(Executor.scala:213
```

原因：elasticsearch的index的字符只能是小写的，不能包含大写字符

解决：将index`SafetyCenter_YBRZ/docs`改为`safety_center_ybrz/docs`就可以了

### ClusterBlockException\[blocked by: \[SERVICE_UNAVAILABLE/1/state not recovered / initialized]
```json
{
  "error" : {
    "root_cause" : [
      {
        "type" : "cluster_block_exception",
        "reason" : "blocked by: [SERVICE_UNAVAILABLE/1/state not recovered / initialized];"
      }
    ],
    "type" : "cluster_block_exception",
    "reason" : "blocked by: [SERVICE_UNAVAILABLE/1/state not recovered / initialized];"
  },
  "status" : 503
}
```

参考：[https://discuss.elastic.co/t/clusterblockexception-blocked-by-service-unavailable-1-state-not-recovered-initialized/59793](https://discuss.elastic.co/t/clusterblockexception-blocked-by-service-unavailable-1-state-not-recovered-initialized/59793)

解决：
```shell
$ vim /etc/elasticsearch/elasticsearch.yml
discovery.zen.minimum_master_nodes: 1
gateway.recover_after_nodes: 1
```

### circuit_breaking_exception
```console
org.elasticsearch.ElasticsearchStatusException: Elasticsearch exception [
    type=circuit_breaking_exception, 
    reason=[parent] Data too large, data for [<http_request>] would be [995157378/949mb],
    which is larger than the limit of [986061209/940.3mb],
    real usage: [912376080/870.1mb], 
    new bytes reserved: [82781298/78.9mb],
    usages [
        request=0/0b, 
        fielddata=1532/1.4kb, 
        in_flight_requests=649439016/619.3mb, 
        accounting=6264778/5.9mb
    ]
]
```

ElasticSearch 在内存使用中，为了避免内存乱用过载发生 OOM，设置了一些断路器[Circuit Breaker](https://www.elastic.co/guide/en/elasticsearch/reference/current/circuit-breaker.html)来限制内存的使用。当内存超过限制之后抛出异常，而不是节点宕机。

下面的参数，除了特殊说明是`Static Setting(静态配置)`的参数需要在`elasticsearch.yml`中配置，其他的都可以通过[cluster-update-settings](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-update-settings.html)动态修改参数配置。例如
```
PUT /_cluster/settings
{
  "persistent": {
    "indices.breaker.total.limit": "70%"
  }
} 
```

#### Parent circuit breaker
父级断路器，用于指定所有断路器可以使用的内存总量
* `indices.breaker.total.use_real_memory`: `Static Setting`，确定父级断路器是否应考虑实际内存使用情况`true`，还是仅考虑子级断路器保留的内存量`false`。 默认为`true`。
* `indices.breaker.total.limit`: 所有断路器的内存使用限制，如果`indices.breaker.total.use_real_memory: false`，default `70%` of JVM Heap，否则 default `95%` of JVM Heap。

#### Field data circuit breaker
字段数据断路器，估计字段数据需要加载到内存中的内存量的内存限制，通过抛出异常来防止字段数据加载
* `indices.breaker.fielddata.limit`: 字段数据加载内存限制，default `40%` of JVM Heap
* `indices.breaker.fielddata.overhead`: 所有字段数据估计值都将与该常数相乘以确定最终估计值的常数。 default `1.03`

>Note: 另外，在`elasticsearch.yml`中可以设置 fielddata 缓冲区的大小，这个参数不支持动态配置，默认情况下，设置都是`unbounded`，Elasticsearch 永远都不会从 fielddata 中回收数据。这个默认设置是刻意设置的，因为 fielddata 不是临时缓存，它是驻留内存里的数据结构，必须可以快速执行访问，而且构建它的代价十分高昂。如果每个请求都重载数据，性能会十分糟糕。

```yaml
# 当缓冲区满了之后最久未使用（LRU）的 fielddata 会被回收为新数据腾出空间
indices.fielddata.cache.size:  40%
```
##### Monitoring fielddata
无论是仔细监控 fielddata 的内存使用情况，还是看有无数据被回收都十分重要。高的回收数可以预示严重的资源问题以及性能不佳的原因。
* 按索引使用[indices-stats API](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-stats.html)
```
GET /_stats/fielddata?fields=*
```
* 按节点使用[nodes-stats API](https://www.elastic.co/guide/en/elasticsearch/reference/5.6/cluster-nodes-stats.html)
```
GET /_nodes/stats/indices/fielddata?fields=*
```
* 按索引和节点，使用设置`?fields=*`，可以将内存使用分配到每个字段。
```
GET /_nodes/stats/indices/fielddata?level=indices&fields=*
```

这几个参数需满足下面的关系，当超过之后就会触发缓存清理操作或抛出相应的异常
```
current fielddata cache usage < indices.fielddata.cache.size
current fielddata cache usage + fielddata size of next request usage < indices.breaker.fielddata.limit 
indices.breaker.request.limit + indices.breaker.fielddata.limit < indices.breaker.total.limit
```
#### Request data circuit breaker
请求数据断路器，防止每个请求的数据超过内存限制，for example, memory used for calculating aggregations during a request
* `indices.breaker.request.limit`: default `60%` of JVM Heap
* `indices.breaker.request.overhead`: default `1`

#### In Flight requests circuit breaker
限制传输或HTTP级别上所有当前活动的传入请求的内存使用，内存使用量估算是基于请求本身的`content length`计算的，并且断路器还认为内存不仅需要包含原生的请求的大小，还需要包含乘以`overhead`后结构化的对象内存大小
* `network.breaker.inflight_requests.limit`: default `100%` of JVM Heap. This means that it is bound by the limit configured for the parent circuit breaker.
* `network.breaker.inflight_requests.overhead`: default `2`

#### Accounting requests circuit breaker
限制请求完成时未释放的内存中保留的内容的内存使用量。这包括 Lucene 段内存之类的东西。
* `indices.breaker.accounting.limit`: default `100%` of JVM heap. This means that it is bound by the limit configured for the parent circuit breaker.
* `indices.breaker.accounting.overhead`: default `1`

#### Script compilation circuit breaker 
脚本编译断路器与前面的基于内存的断路器略有不同，它限制了一段时间内内联脚本编译的次数。See the "prefer-parameters" section of the [scripting](https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-scripting-using.html) documentation for more information.
* `script.max_compilations_rate`: Limit for the number of unique dynamic scripts within a certain interval that are allowed to be compiled. Defaults to 75/5m, meaning 75 every 5 minutes.

### this action would add [6] total shards, but this cluster currently has [3000]/[3000] maximum shards open;
```
PUT _cluster/settings
{
  "transient":{
    "cluster.max_shards_per_node": 65535
  }
}
```

## Kibana
### 启动 Kibana 后无法正常访问页面

看日志出现下面的异常

```console
...
Elasticsearch plugin is red
...
Elasticsearch is still initializing the kibana index
...
```

原因：集群部分节点宕机之后，kibana在es中的index .kibana的副本集个数出现问题

解决：参考[stackoverflow](https://stackoverflow.com/questions/31201051/elasticsearch-is-still-initializing-the-kibana-index)

方法1：

```console
# 删掉kibana的所有配置数据
curl -XDELETE http://localhost:9200/.kibana
# 或者
# 删掉 es 里的所有数据
curl -XDELETE http://localhost:9200/*
```

方法2：

```console
curl -s http://localhost:9200/.kibana/_recovery?pretty
curl -XPUT 'localhost:9200/.kibana/_settings' -d '
{
    "index" : {
        "number_of_replicas" : 0
    }
}'
```