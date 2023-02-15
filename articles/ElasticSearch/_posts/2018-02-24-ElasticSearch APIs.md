---
layout: post
title: ElasticSearch APIs
tag: ElasticSearch
---
## 声明
本文章是作者在阅读官方文档时的整理，因为作者水平有限，可能会有理解或翻译的不正确的地方，可以在下方留言

## ElasticSearch APIs Introduction
用户和 ElasticSearch 交互的方式有两种，可以使用 ElasticSearch 的 Java Client，或者使用 RESTful API with JSON over HTTP。

* [Elasticsearch Clients](https://www.elastic.co/guide/en/elasticsearch/client/index.html)

### Java API (Deprecated)
Java API，主要分为两种：
* 节点客户端（Node Client）：节点客户端会作为一个非数据节点加入到集群中。
* 传输客户端（Transport Client）：传输客户端是轻量级的，他本身不会作为节点加入到集群中，他会将请求转发到集群中的某个节点上。

这两种客户端都是通过`9300`端口，使用 ElasticSearch 的原生`传输协议`和集群交互。集群中的节点都是通过`9300`端口进行交互的，换言之，如果这个端口被关闭了，集群就无法正常交互了。

### RESTful API with JSON over HTTP
所有编程语言则可以通过 RESTful API 通过端口`9200`和 ElasticSearch 通信，也是官方目前主推的方式，比如[Java REST Client](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/index.html)。你可以通过 Web 客户端发送 http 请求 ElasticSearch，甚至直接使用`curl`。一个 ElasticSearch 的请求格式
```console
curl -X <VERB> '<PROTOCOL>://<HOST>:<PORT>/<PATH>?<QUERY_STRING>' -H 'Content-Type: application/json' -d '<BODY>'
# VERB : 适当的 HTTP 方法或谓词 GET（查询）、POST、PUT（添加或修改）、HEAD（验证文档是否存在） 或者 DELETE（删除）
# PROTOCOL : http 或者 https（如果你在 Elasticsearch 前面有一个 https 代理）
# HOST : ElasticSearch 节点的 host
# PORT : ElasticSearch 的 http 端口，默认是 9200
# PATH : API终端路径，如 _count 返回集群中命中文档的数量。可能由多个组件（路径）组成，如 _cluster/stats
# QUERY_STRING : 任意可选的查询字符串参数。如 ?pretty 将格式化地输出 JSON 返回值，使其更容易阅读
# BODY : 一个 JSON 格式的请求体 （如果请求需要的话）
```

ElasticSearch 请求响应会返回一个 HTTP 状态码和一个 JSON 格式的返回值(HEAD 请求不会返回)。如果想在返回结果中看到 HTTP 头信息，可以使用`curl`的`-i`参数。 `curl -i -XGET ...`
```shell
$ curl -XPUT "http://47.95.116.74:9200/_settings" -u username:password -H 'Content-Type: application/json' -d'
{
  "index": {
      "max_result_window": "10000"
  }
}'
```

>Note: 如果使用 Kibana 的 Dev Tools，只需要`<VERB> <PATH>?<QUERY_STRING> <BODY>`就可以了，Kibana 会自己添加其他的部分，写多了反而会出错！

接下来主要是介绍 RESTful API with JSON over HTTP 部分的 ElasticSearchAPIs

## API Conventions
[API Conventions](https://www.elastic.co/guide/en/elasticsearch/reference/current/api-conventions.html)，API 公约，就是 API 各部分参数在使用方式上的一些约定。ElasticSearch 允许通过 HTTP 公开 APIs，关于 HTTP 的设置目前不能动态改变，只能通过设置`elasticsearch.yml`生效。[详细的配置参数](https://www.elastic.co/guide/en/elasticsearch/reference/current/modulElasticSearch-http.html)

### Multiple Indic
ElasticSearch 大多数引用`index`参数的 API 支持跨多个索引执行，例如同时对三个索引`index1`、`index2`、`index3`执行查询操作，`GET /index1,index2,index3/_search?q=tag:wow`，或者`GET /_all/_search?q=tag:wow`，其中`_all`代表所有的索引，除此之外还支持通配符`*`，如`index*`、`in*ex*`。如果只想查询`index1`和`index2`还可以使用`-`排除索引，如`index*,-index3`。所有支持`Multiple IndicElasticSearch`公约的 APIs 还支持下面的 URL 查询参数(`?`后面的查询参数)：
* `ignore_unavailable`: `true`或者`false`。是否需要忽略**不存在**或者**被关闭**的`index`
* `allow_no_indicElasticSearch`: `true`或者`false`。如果通配符匹配不到具体的索引，请求是否失败。此设置适用于`*`、`_all`或者不指定索引，也适用于`alias`以防别名指向已经被关闭的索引。
* `expand_wildcards`: 可以指定为`open`、`closed`、`open,closed`、`all`、`none`。指定通配符要匹配哪些状态的索引。`open`是只匹配打开状态的索引，`closed`是只匹配关闭状态的索引，`open,closed`等同于`all`，匹配所有状态的索引，`none`表示关闭通配符。

> URL 参数的使用取决于使用他们的 API 类型，单索引 APIs(Single-index APIs)，例如`Document APIs`和`Single-index Alias APIs`是不支持`Multiple IndicElasticSearch`特性的。

### Date math support in index namElasticSearch
索引名称支持日期表达式


## Document APIs
Document APIs 是对 ElasticSearch Document 的`CRUD`操作，即`增查改删`，主要是`增删改`，对于查询逻辑除了`Get API`之外，大部分是由`Search APIs`实现。Document APIs 按照数据的操作方式可以分为：
### Single-document APIs
单条数据操作
#### Index API
对数据建立一条索引数据
#### Get API
根据文档的唯一`_id`查询一条文档，可以理解为主键查询。
#### Delete API
删除一条文档
#### Update API
更新一条文档
### Multi-document APIs
多条数据操作
#### Multi Get API

#### Bulk API

#### Delete By Query API

#### Update By Query API

#### Reindex API
* [Reindex](https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-reindex.html): 复制一个 Index 的 Documents 到另一个 Index

```javascript
POST _reindex?slices=5&refresh
{
  "source": {
    "index": "twitter"
  },
  "dest": {
    "index": "new_twitter"
  }
}
```

## Search APIs
根据字段的值查询满足条件的文档，相对于 Get API，可以简单理解为条件查询。
### Preparation before search
方便演示，首先添加几条数据，其中`1`是特定雇员的 ID，ElasticSearch 中的每个文档有默认属性`_id`作为唯一键，不写的话会默认生成一个`uuid`作为唯一键，这里设置`_id = 1`
```javascript
PUT /megacorp/employee/1
{
    "first_name" : "John",
    "last_name" :  "Smith",
    "age" :        25,
    "about" :      "I love to go rock climbing",
    "interElasticSearchts": [ "sports", "music" ]
}
PUT /megacorp/employee/2
{
    "first_name" :  "Jane",
    "last_name" :   "Smith",
    "age" :         32,
    "about" :       "I like to collect rock albums",
    "interElasticSearchts":  [ "music" ]
}
PUT /megacorp/employee/3
{
    "first_name" :  "Douglas",
    "last_name" :   "Fir",
    "age" :         35,
    "about":        "I like to build cabinets",
    "interElasticSearchts":  [ "forElasticSearchtry" ]
}
```

先用 Get API 查找`_id=1`的雇员信息，做下验证
```console
GET /megacorp/employee/1
```

Result:
```javascript
{
  "_index" :   "megacorp",                // 索引名称 
  "_type" :    "employee",                // 索引类型
  "_id" :      "1",                       // 文档ID
  "_version" : 1,                         // 版本信息
  "found" :    true,
  "_source" :  {                          // 查找结果的原始 JSON 文档
      "first_name" :  "John",
      "last_name" :   "Smith",
      "age" :         25,
      "about" :       "I love to go rock climbing",
      "interElasticSearchts":  [ "sports", "music" ]
  }
}
```

### Search APIs Introduction
Search APIs 使用关键字`_search`进行搜索，例如查询`index=megacorp`，`type=employee`的**所有**文档，具体语法如下：
```console
GET /megacorp/employee/_search
```

>Note: 高版本启用了了`type`，直接忽略即可

Result:
```javascript
{
   "took":      6,                        // 花费时间，单位毫秒
   "timed_out": false,
   "_shards": { ... },                    // 分片信息
   "hits": {                              // 查询结果
      "total":      3,                    // 总共命中 3 个文档
      "max_score":  1,                    // 最大得分
      "hits": [                           // 所有命中的文档 JSON，默认只显示前 10 个
         {
            "_index":         "megacorp",
            "_type":          "employee",
            "_id":            "3",
            "_score":         1,
            "_source": {
               "first_name":  "Douglas",
               "last_name":   "Fir",
               "age":         35,
               "about":       "I like to build cabinets",
               "interests": [ "forElasticSearchtry" ]
            }
         },
         {
            "_index":         "megacorp",
            "_type":          "employee",
            "_id":            "1",
            "_score":         1,
            "_source": {
               "first_name":  "John",
               "last_name":   "Smith",
               "age":         25,
               "about":       "I love to go rock climbing",
               "interests": [ "sports", "music" ]
            }
         },
         {
            "_index":         "megacorp",
            "_type":          "employee",
            "_id":            "2",
            "_score":         1,
            "_source": {
               "first_name":  "Jane",
               "last_name":   "Smith",
               "age":         32,
               "about":       "I like to collect rock albums",
               "interests": [ "music" ]
            }
         }
      ]
   }
}
```

对于 Search APIs 的条件搜索可以分为两类：
* Query-String: 更轻量的查询字符串，语法简洁（但这并不意味着易读）
* DSL(Domain Specific Language): 使用领域特定语言，使用一个 JSON 请求体作为参数进行搜索，适用于条件复杂的查询与分析，例如聚合计算

#### Query-String
搜索姓氏为 Smith 的雇员
```console
GET /megacorp/employee/_search?q=last_name:Smith
```

Result:
```javascript
{
   ...
   "hits": {
      "total":      2,
      "max_score":  0.30685282,
      "hits": [
         {
            ...
            "_source": {
               "first_name":  "John",
               "last_name":   "Smith",
               "age":         25,
               "about":       "I love to go rock climbing",
               "interests": [ "sports", "music" ]
            }
         },
         {
            ...
            "_source": {
               "first_name":  "Jane",
               "last_name":   "Smith",
               "age":         32,
               "about":       "I like to collect rock albums",
               "interests": [ "music" ]
            }
         }
      ]
   }
}
```

使用`?q=`查询字符串参数，通过命令进行临时性的即时搜索非常方便，但是还是有局限性，比如查询参数会被 URL 编码(% 编码)，可读性差、更加难懂，不利于调试，而且还有可能暴露隐私信息。因此不推荐直接向用户暴露此功能（有点像 Get 请求）。因此生产环境更推荐 RequestBody（Post 请求）。

#### DSL
使用 DSL，需指定使用一个 JSON 请求体作为参数，替代 Query-String，这种方式支持构建更复杂和健壮的查询，同样搜索姓氏为 Smith 的雇员。
```javascript
GET /megacorp/employee/_search
{
    "query": {
        "match": {  // match 查询，查询类型之一
            "last_name" : "Smith"
        }
    }
}
```

ElasticSearch 的 Query DSL 是基于 JSON 的，可以将 Query DSL 看作查询的 AST(Abstract Syntax Tree)，下面说一下 DSL 的使用规则，它由两类查询子句构成：
1. *Leaf query clauses*：叶子查询子句，用于查找某特定字段为特定值的文档，例如查找`name=zhangqiang`的文档，`match`、`term`或者`range`查询都属于叶子查询子句，并且他们可以单独使用。
2. *Compound query clauses*：复合查询子句，复合查询子句包含叶子查询子句或者复合查询子句，他用逻辑操作（例如`bool`或`dis_max`）将多个查询子句进行组合，或者修改他们的行为，如`constant_score`查询。

在`query context`和`filter context`使用查询子句的行为是不同的。
1. `query context`中使用的查询子句，返回的结果是**这个文档与此查询子句有多么匹配**，除了决定文档是否匹配外，它还会计算一个得分`_score`，表示文档和查询子句的匹配程度。
2. `filter context`中使用的查询子句，返回的结果是**这个文档和此查询子句是否匹配**，是就是，不是就不是。使用过滤往往会被 elasticsearch 自动缓存起来以提高性能

炒个官方的栗子，来了解下`query context`和`filter context`
```javascript
GET /secisland/_search
{
    "query": { // 用关键字 query 指明它所对应的查询子句用于 query context
        "bool": { // bool 和下面的两个 match 子句都属于 query context，用于说明文档有多么匹配
            "must": [
                { "match": { "title":   "Search"        }}, 
                { "match": { "content": "Elasticsearch" }}  
            ],
            "filter": [ // 用关键字 filter 指明它所对应的查询子句用于 filter context，不影响 query 计算文档的 _score
                { "term":  { "status": "published" }}, // term 和 range 子句属于 filter context
                { "range": { "publish_date": { "gte": "2015-01-01" }}} // 他们会将不匹配的文档过滤掉
            ]
        }
    }
}
```

>**Context 的使用原则**：将影响文档匹配程度的查询子句放在`query context`中，其他的查询子句放在`filter context`中。

按照查询字段的类型(`text`,`keyword`)，以及字段的值是否被分词，可以将查询子句分为`Full text queries`和`Term level queries`。
##### Full text queries
首先了解下 Analysis 阶段，它会按照设定的分词器(Analyser)，对类型为`text`的字段内容进行分词，分词器可以是 Elasticsearch 内置的，也可以是自定义的。分词发生在下面的两种情况下：
* Index Time Analysis: 在建立索引的时候对字段类型为`text`的字段进行分词，每个`text`类型的字段都可以指定一个`analyser`，例如：
  ```javascript
  // 为字段 title 配置单独的分词器
  PUT my_index
  {
    "mappings": {
      "_doc": {
        "properties": {
          "title": {
            "type": "text",
            // 在索引阶段，text 类型的字段如果没有指定 analyser，它会在 Index Settings 中
            // 查找名为 default 的 analyzer，如果没找到则默认使用 standard 分词器
            "analyzer": "standard"
          }
        }
      }
    }
  }
  // 为 index 设置全局的分词器
  PUT my_index
  {
      "settings": {
          "analysis": {
              "analyzer": {
                  "default": {
                      "type": "ik_max_word"
                  }
              }
          }
      }
  }
  // 与上面的等价
  PUT my_index
  {
    "settings": {
          "index.analysis.analyzer.default.type": "ik_max_word"
      }
  }
  ```
* Search Time Analysis: 在搜索的时候对`query string`进行分词。默认会按照下面的优先级来选择应该使用哪一个分词器
  1. An `analyzer` specified in the full-text query itself.
  ```javascript
  GET /my_index/_search
  {
      "query": {
          "match" : {
              "message": "身份证",
              "analyser": "ik_smart" 
          }
      }
  }
  ```
  2. The `search_analyzer` defined in the field mapping.
  ```javascript
  PUT my_index
  {
    "settings": {
      "analysis": {
        "analyzer": {
          "my_ngram_analyzer": {
            "tokenizer": "my_ngram_tokenizer"
          }
        },
        "tokenizer": {
          "my_ngram_tokenizer": {
            "type": "ngram",
            "min_gram": 3,
            "max_gram": 3,
            "token_chars": [
              "letter",
              "digit"
            ]
          }
        }
      }
    }
  }
  PUT my_index
  {
    "mappings": {
      "_doc": {
        "properties": {
          "title": {
            "type": "text",
            "search_analyzer": "my_ngram_analyzer"
          }
        }
      }
    }
  }
  ```
  3. The `analyzer` defined in the field mapping.
  ```javascript
  PUT my_index
  {
    "settings": {
      "analysis": {
        "analyzer": {
          "my_ngram_analyzer": {
            "tokenizer": "my_ngram_tokenizer"
          }
        },
        "tokenizer": {
          "my_ngram_tokenizer": {
            "type": "ngram",
            "min_gram": 3,
            "max_gram": 3,
            "token_chars": [
              "letter",
              "digit"
            ]
          }
        }
      }
    }
  }
  PUT my_index
  {
    "mappings": {
      "_doc": {
        "properties": {
          "title": {
            "type": "text",
            "analyzer": "my_ngram_analyzer"
          }
        }
      }
    }
  }
  ```
  4. An analyzer named `default_search` in the index settings.
  ```javascript
  PUT my_index
  {
      "settings": {
          "analysis": {
              "analyzer": {
                  "default_search": {
                      "type": "ik_max_word"
                  }
              }
          }
      }
  }
  // 或者下面的写法
  PUT my_index
  {
    "settings": {
          "index.analysis.analyzer.default_search.type": "ik_max_word"
      }
  }
  ```
  5. An analyzer named `default` in the index settings.
  ```javascript
  PUT my_index
  {
      "settings": {
          "analysis": {
              "analyzer": {
                  "default": {
                      "type": "ik_max_word"
                  }
              }
          }
      }
  }
  // 或者下面的写法
  PUT my_index
  {
    "settings": {
          "index.analysis.analyzer.default.type": "ik_max_word"
      }
  }
  ```
  6. The `standard` analyzer.

###### match
`match query`可以查询`text/numric/dates`类型的字段，`match`实质上是`bool`查询，也就是说它是对分词后的文本构造`bool query`，`operator`可以设置为`or(default)`或`and`，来控制匹配结果。下面举个例子

```javascript
// 添加一条数据
PUT /my_index/_doc/1
{
  "title": "brown fox"
}
// operator 默认是 or，
// `blue fox`会被 analyser 分词成为`blue`和`fox`，
// `brown fox`会被 analyser 分词为`brown`和`fox`
// 其中`fox`可以匹配上，因此是可以匹配到`brown fox`的
GET my_index/_search
{
    "query": {
        "match" : {
            "title": {
              "query": "blue fox"
              // operator 默认为 or
            }
        }
    }
}
// 上面的查询和下面的查询等价
GET /my_index/_search
{
    "query": {
        "bool": {
            "should": [
              { "term": { "title": "brown" }},
              { "term": { "title": "fox"   }}
            ]
        }
    }
}
// 下面把`operator`变成`and`，因为`blue`没有正确的匹配到结果，
// `false and true => false`因此这个查询匹配不到`brown fox`
GET /my_index/_search
{
    "query": {
        "match" : {
            "title": {
              "query": "blue fox",
              "operator": "and"
            }
        }
    }
}
// 上面的查询和下面的查询等价
GET /my_index/_search
{
    "query": {
        "bool": {
            "must": [
              { "term": { "title": "brown" }},
              { "term": { "title": "fox"   }}
            ]
        }
    }
}
```

可以使用`minimum_should_match`控制至少要匹配的`should`子句数，的详细介绍可以参考[minimum_should_match](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-minimum-should-match.html)
```javascript
// 如果加上 minimum_should_match，它会直接传入到 bool 查询中，详细的介绍可以参考
GET /my_index/_search
{
    "query": {
        "match": {
            "title": {
                "query": "quick brown fox",
                // 3 * 75% 向下取整 = 2
                "minimum_should_match": "75%"
            }
        }
    }
}
// 上面的查询和下面的查询等价
GET /my_index/_search
{
    "query": {
        "bool": {
            "should": [
                { "term": { "title": "brown" }},
                { "term": { "title": "fox"   }},
                { "term": { "title": "quick" }}
            ],
            "minimum_should_match": 2 
        }
    }
}
```

>Note: 如果`index time analysis`和`search time analysis`指定了不同分词器，有可能会匹配不到，比如对于`身份证`：`index time analysis`指定为`standard`，会分词为`身、份、证`，而`search time analysis`指定为`ik_smart`会分词为`身份证`，这样就没有能正确匹配上的term项，从而导致没有查询结果。

#### Term level queries


### 组合查询：bool
`minimum_should_match`指明最少满足几个`should`条件才匹配，如果一个`bool`操作中只有`should`操作，那么`minimum_should_match`默认为`1`，如果除了`should`还有`must`、`filter`等其他操作，`minimum_should_match`默认为`0`
```javascript
GET hsyk_diseases_info/_search
{
  "query": {
    "bool":{
      "must": [
        { "term":{ "PROVINCE.keyword": "辽宁省" } }
      ], 
      "should": [
        { "term":{ "CITY.keyword": "大连市" } },
        { "term":{ "CITY.keyword": "沈阳市" } }
      ],
      "filter": [
        
      ],
      "minimum_should_match" : 1
    }
  },
  "aggs" : {
      "group_by_district" : {
          "terms" : {
              "field":"DISTRICT.keyword"
          }
      }
    }
}
```

#### 组合查询:bool嵌套
```javascript
GET hsyk_diseases_info/_search
{
  "query": {
    "bool": {
      "filter": [
        {
          "bool": {
            "should": [
              { "term":
                {"PROVINCE.keyword": "辽宁省"}
              }
            ]
          }
        },
        {
          "bool": {
            "should": [
              { "terms":
                { "CITY.keyword": ["沈阳市", "大连市"]}
              }
            ]
          }
        }
      ]
    }
  },
  "aggs": {
      "group_by_district": {
          "terms": {
              "field": "DISTRICT.keyword"
          }
      }
    }
}
```


## Aggregations

## Indices APIs

## cat APIs
[cat APIs](https://www.elastic.co/guide/en/elasticsearch/reference/current/cat.html)，主要用于集群维护，用来查看集群相关的一些信息，例如节点信息，索引状态等

```shell
# 查看主节点信息
GET /_cat/master
u_n93zwxThWHi1PDBJAGAg master 127.0.0.1 node-1

# 通用参数 `v` verbose output，显示 header
GET /_cat/master?v
id                     host      ip      node
u_n93zwxThWHi1PDBJAGAg master 127.0.0.1 node-1

# 通用参数 `help`，显示命令包含的所有列的说明
GET /_cat/master?help
id   |   | node id
host | h | host name
ip   |   | ip address
node | n | node name

# 通用参数 `h`，指定要查看的列
GET /_cat/nodes?h=ip,port,heapPercent,name
127.0.0.1 9300 27 node-1
# 也可使用通配符，如
GET /_cat/thread_pool?h=ip,queue*

# numberic formats
# 对于一些提供数字类型输出的命令，如 bytes、size、time，默认都是方便人阅读的，如`3763212`
# 会转换成`3.5mb`，这样就无法进行排序了，如果想排序就需要转换成 numberic 类型的值
$curl '192.168.56.10:9200/_cat/indices?bytes=b' | sort -rnk8
green wiki2 3 0 10000   0 105274918 105274918
green wiki1 3 0 10000 413 103776272 103776272
green foo   1 0   227   0   2065131   2065131

# repsonse as text(default),json,smile,yaml,cbor
# `pretty` 结果格式化
$curl 'localhost:9200/_cat/indices?format=json&pretty'
[
  {
    "pri.store.size": "650b",
    "health": "yellow",
    "status": "open",
    "index": "twitter",
    "pri": "5",
    "rep": "1",
    "docs.count": "0",
    "docs.deleted": "0",
    "store.size": "650b"
  }
]
```

## Cluster APIs




## Common Operations
### 定期删除过期的 Indices
`_ttl`属性在`5.0+`弃用了，`7.0+`出现`ilm`的概念，即`Index lifecycle management`

* [define policy](https://www.elastic.co/guide/en/elasticsearch/reference/current/ilm-put-lifecycle.html)，超过 30 天删除。
```
PUT _ilm/policy/logs_expire_policy   
{
  "policy": {                       
    "phases": {
      "delete": {
        "min_age": "30d",           
        "actions": {
          "delete": {}              
        }
      }
    }
  }
}
```
* [create index template](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-templates.html)，指定`index.lifecycle.name`
```
// 对于 index name 为 logs-* 的索引，使用 logs_expire_policy ilm，优先级为 10
PUT _template/logs_date_detection
{
    "order" : 10,
    "index_patterns" : ["logs-*"],
    "settings": {
      "index.lifecycle.name": "logs_expire_policy"
    }, 
    "mappings": {
      "date_detection" : true
  }
}
```

>Note：指定`min_age=30d`并不是恰巧在过了`30d`整的时候删除，而是需要等到 ILM 去检查的时候发现已经过了`30d`才会删除，如果对时间要求严格，还是自己写`crontab`吧


