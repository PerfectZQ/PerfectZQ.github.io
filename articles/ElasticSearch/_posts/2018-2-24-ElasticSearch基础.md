---
layout: post
title: ElasticSearch 基础
tag: ElasticSearch
---
## 基本概念
　　ElasticSearch是面向文档的，其中存储的所有对象都称之为`文档`。ElasticSearch的所有行为叫做`索引`(动词)，即存储一个文档到ElasticSearch中。一个ElasticSearch集群可以包含多个`index`(索引,名词)，一个索引可以包含多种`type`(类型)的文档，一个`type`又可以包含多个`document`(文档)

* index ：索引(名词)，相当于关系数据库中的数据库
* type ： 类型，相当于数据库中的一张表，同类型的文档，相同字段的类型需要一致
* document ：文档，相当于数据库中的一条记录，一个对象。

## 倒排索引
