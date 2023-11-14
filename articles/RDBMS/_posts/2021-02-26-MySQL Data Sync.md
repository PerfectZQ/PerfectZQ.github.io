---
layout: post
title: MySQL Data Sync
tag: RDBMS
---

## 需求
将 Mysql 数据同步到 ElasticSearch

## Mysql 数据同步方案
* [Elastic Logstash](https://github.com/elastic/logstash)
    * 优点：无侵入性，无需开发，配置即可，标准的ELK技术栈
    * 缺点：实时性不高，定期按条件查询mysql，然后同步数据，有可能会造成资源浪费
* [Alibaba Canal](https://github.com/alibaba/canal)
    * 优点：成熟的数据库同步方案，
    * 缺点：实时性不高，定期按条件查询mysql，然后同步数据，有可能会造成资源浪费
* [go-mysql-elasticsearch](https://github.com/siddontang/go-mysql-elasticsearch)
    * 优点：无侵入性，无需开发，配置即可，标准的ELK技术栈
    * 缺点：实时性不高，定期按条件查询mysql，然后同步数据，有可能会造成资源浪费