---
layout: post
title: ElasticSearch APIs
tag: ElasticSearch
---
## 声明
　　本文章是作者在阅读官方文档时的整理，因为作者水平有限，可能会有理解或翻译的不正确的地方，如果有读者发现，可以联系作者`inteli_zq@163.com`。文章都发布在[Github](https://github.com/PerfectZQ/PerfectZQ.github.io/blob/master/articles/)上，所以也可以直接在 Github 上提 Issues，我都能看到哦。
## ElasticSearch APIs 简介
　　和ElasticSearch交互的方式取决于是否用Java，如果使用Java，可以使用ElasticSearch的Java Client，否则使用RESTful API with JSON over HTTP

　　ElasticSearch 支持的所有语言的 client 的说明文档可以在这里找到:[Elasticsearch Clients](https://www.elastic.co/guide/en/elasticsearch/client/index.html)

### Java API
　　Java Client，主要分为两种：

* 节点客户端（Node client）：节点客户端会作为一个非数据节点加入到集群中。
* 传输客户端（Transport client）：传输客户端是轻量级的，他本身不会作为节点加入到集群中，他会将请求转发到集群中的某个节点上。

　　这两种客户端都是通过`9300`端口，使用ElasticSearch的原生`传输协议`和集群交互。集群中的节点都是通过`9300`端口进行交互的，换言之，如果这个端口被关闭了，集群就无法正常交互了。

### RESTful API with JSON over HTTP

　　所有其他的语言则可以通过 RESTful API 通过端口`9200`和ElasticSearch通信。你可以通过web客户端发送http请求ElasticSearch，甚至直接使用curl。

　　一个 ElasticSearch 的请求格式

```console
curl -X<VERB> '<PROTOCOL>://<HOST>:<PORT>/<PATH>?<QUERY_STRING>' -d '<BODY>'
# VERB : 适当的HTTP方法或谓词 GET(查询)、POST、PUT(添加或修改)、HEAD(验证文档是否存在) 或者 DELETE(删除)
# PROTOCOL : http 或者 https（如果你在 Elasticsearch 前面有一个 https 代理）
# HOST : ElasticSearch 节点的 host
# PORT : ElasticSearch 的 http 端口，默认是9200
# PATH : API终端路径，如 _count返回集群中命中文档的数量。可能由多个组件（路径）组成，如 _cluster/stats
# QUERY_STRING : 任意可选的查询字符串参数。如 ?pretty 将格式化地输出 JSON 返回值，使其更容易阅读
# BODY : 一个 JSON 格式的请求体 (如果请求需要的话)
```

　　ElasticSearch 请求响应会返回一个HTTP状态码和一个JSON格式的返回值(HEAD请求不会返回)。如果想在返回结果中看到HTTP头信息，可以使用curl的`-i`参数。 `curl -i -XGET ...`

　　如果使用kibana的Dev Tools，只需要`<VERB> <PATH>?<QUERY_STRING> <BODY>`就可以了，kibana会自己添加其他的部分，写多了反而会出错！

## ElasticSearch APIs 的组成
　　本文主要讲解 RESTful API with JSON over HTTP 部分的 ElasticSearchAPIs，包含下面几个部分：

* API Conventions
* Document APIs
* Search APIs
* Aggregations
* Query DSL
* Indices APIs
* cat APIs
* Cluster APIs

　　下面的章节会依次进行介绍。

## API Conventions
　　本章讲述API的公约，来源参考[official reference](https://www.elastic.co/guide/en/elasticsearch/reference/current/api-conventions.html)

　　ElasticSearch允许通过HTTP公开APIs，关于HTTP的设置目前不能动态改变，只能通过设置`elasticsearch.yml`生效。详细的配置参数参考[official reference](https://www.elastic.co/guide/en/elasticsearch/reference/current/modulElasticSearch-http.html)
### Multiple IndicElasticSearch
　　大多数引用`index`参数的API支持跨多个索引执行，例如同时对三个索引`index1`、`index2`、`index3`执行查询操作，`GET /index1,index2,index3/_search?q=tag:wow`。`_all`代表所有的索引，除此之外还支持通配符`*`，如`index*`、`in*ex*`。如果只想查询`index1`和`index2`还可以使用`-`排除索引，如`index*,-index3`。

　　所有支持`Multiple IndicElasticSearch`的APIs还支持下面的url查询参数

* `ignore_unavailable`:可以指定为`true`或者`false`。是否需要忽略**不存在**或者**被关闭**的`index`
* `allow_no_indicElasticSearch`:可以指定为`true`或者`false`。如果通配符匹配不到具体的索引，请求是否失败。此设置适用于`*`、`_all`或者不指定索引，也适用于`alias`以防别名指向已经被关闭的索引。
* `expand_wildcards`:可以指定为`open`、`closed`、`open,closed`、`all`、`none`。指定通配符要匹配哪些状态的索引。`open`是只匹配打开状态的索引，`closed`是只匹配关闭状态的索引，`open,closed`等同于`all`，匹配所有状态的索引，`none`表示关闭通配符。

　　这些参数的默认值取决于使用他们的API

> 单索引APIs(Single index APIs)，例如`Document APIs`和`single-index alias APIs`是不支持`Multiple IndicElasticSearch`特性的。

### Date math support in index namElasticSearch
　　索引名称支持日期表达式

## Document APIs
　　本章节主要讲解，对ElasticSearch Document的`CRUD`操作，即`增查改删`。ElasticSearch Document APIs 分为两个部分：Single document APIs 和 Multi-document APIs。
### Single document APIs

#### Index API

#### Get API

#### Delete API

#### Update API

### Multi-document APIs

#### Multi Get API

#### Bulk API

#### Delete By Query API

#### Update By Query API

#### Reindex API

## Search APIs
### 搜索前的准备
　　方便演示，首先添加几条数据
```javascript
// 其中1是特定雇员的ID，ElasticSearch中的每个文档有默认属性_id，这里是使_id=1
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
　　简单查询

```console
# 查找_id=1的雇员信息
GET /megacorp/employee/1
```
　　返回结果如下：

```javascript
{
  "_index" :   "megacorp", // 索引名称 
  "_type" :    "employee", // 索引类型
  "_id" :      "1",        // 文档ID
  "_version" : 1,          // 版本信息
  "found" :    true,
  "_source" :  {           // 查找结果的原始JSON文档
      "first_name" :  "John",
      "last_name" :   "Smith",
      "age" :         25,
      "about" :       "I love to go rock climbing",
      "interElasticSearchts":  [ "sports", "music" ]
  }
}
```

### Search APIs 简介
　　SearchAPIs 使用关键字`_search`进行搜索，例如查询`index = megacorp`，`type = employee`的所有文档，具体语法如下：
```console
GET /megacorp/employee/_search
```

　　返回结果如下：
```javascript
{
   "took":      6,     // 花费时间，单位毫秒
   "timed_out": false,
   "_shards": { ... }, // 分片信息
   "hits": {           // 查询结果
      "total":      3, // 总共命中3个文档
      "max_score":  1, // 最大得分
      "hits": [        // 所有命中的文档JSON，默认只显示前10个
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
　　对于 SearchAPI 的条件搜索可以分为两种：

* 更轻量的查询字符串(Query-String)
* 使用领域特定语言(DSL, Domain Specific Language)，使用一个JSON请求体作为参数进行搜索

### Search APIs 条件搜索：查询字符串(Query-String)
```console
# 搜索姓氏为 Smith 的雇员
GET /megacorp/employee/_search?q=last_name:Smith
```
　　返回结果如下：

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
　　使用`?q=`查询字符串参数，通过命令进行临时性的即席搜索非常方便，但是还是有局限性，比如查询参数会被URL编码(%编码)，可读性差、更加难懂，不利于调试，而且还有可能暴露隐私信息。因此不推荐直接向用户暴露此功能(有点像get请求)。因此生产环境更推荐requElasticSearcht body(post请求)。

### Search APIs 条件搜索：领域特定语言(DSL)

　　使用DSL，需指定使用一个JSON请求体作为参数，替代query-string。这种方式支持构建更复杂和健壮的查询。
```javascript
GET /megacorp/employee/_search
{
    "query" : {
        "match" : { // match 查询，查询类型之一
            "last_name" : "Smith"
        }
    }
}
```
　　详细的QueryDSL语法可以查看[Query DSL](#query-dsl)章节。

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

### 组合查询:bool嵌套
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

## Cluster APIs

## Query DSL
　　ElasticSearch 的 Query DSL 是基于 JSON 的，可以将 Query DSL 看作查询的 AST(Abstract Syntax Tree)，它由两类查询子句构成：

1. *Leaf query clauses*：叶子查询子句，用于查找某特定字段为特定值的文档，例如查找`name = zhangqiang`的文档，`match`、`term`或者`range`查询都属于叶子查询子句，并且他们可以单独使用。
2. *Compound query clauses*：复合查询子句，复合查询子句包含叶子查询子句或者复合查询子句，他用逻辑操作(例如`bool`或`dis_max`)将多个查询子句进行组合，或者修改他们的行为(例如`constant_score`查询)。

　　在`query context`和`filter context`使用查询子句的行为是不同的。

1. `query context`中使用的查询子句，返回的结果是"这个文档与此查询子句有多么匹配"，除了决定文档是否匹配外，它还会计算一个得分`_score`，表示文档和查询子句的匹配程度。
2. `filter context`中使用的查询子句，返回的结果是"这个文档和此查询子句是否匹配"，是就是，不是就不是。

　　炒个官方的栗子：

```javascript
GET /_search
{
  "query": { // 用关键字 query 指明下面的查询子句用于 query context
    "bool": { // bool 和下面的两个 match 子句都属于 query context，用于说明文档有多匹配
      "must": [
        { "match": { "title":   "Search"        }}, 
        { "match": { "content": "Elasticsearch" }}  
      ],
      "filter": [ // 用关键字 filter 指明下面的查询子句用于 filter context
        { "term":  { "status": "published" }}, // term 和 range 子句属于 filter context
        { "range": { "publish_date": { "gte": "2015-01-01" }}} // 他们会将不匹配的文档过滤掉
      ]
    }
  }
}
```

　　**上下文的使用原则**：将影响文档匹配程度的查询子句放在`query context`中，其他的查询子句放在`filter context`中。

　　按照文档内容(各字段的值)，是否需要分词(analyse)，可以将查询子句分成两种`Full text queries`和`Term level queries`。
### Full text queries

### Term level queries