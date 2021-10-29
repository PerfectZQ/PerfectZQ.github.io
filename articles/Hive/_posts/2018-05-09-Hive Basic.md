---
layout: post
title: Hive Basic
tag: Hive
---
## 参考
* 官方手册[Hive Tutorial](https://cwiki.apache.org/confluence/display/Hive/Tutorial)
* 官方手册[Hive LanguageManual](https://cwiki.apache.org/confluence/display/Hive/LanguageManual)

## 数据单位
按粒度从大大到小
### Databases
数据库限定一个命名空间，这样就可以避免表、视图、分区、列的命名冲突。也可以限定一组用户的访问权限。
### Tables
具有相同模式(Schema)的同类数据构成的集合，存储到一张表中。例如一张表的模式包含`userid`、`username`、`password`、`datetime`等列。
### Partitions
表可以用一到多个`partitionKeys`决定数据的存储方式。Partition 除了作为存储单元之外，还允许用户高效的识别满足特定标准的行(记录)，例如有两个类型为`STRING`的`partitionKey`，`date_partiton`和`counrty_partiton`，每一个唯一的`partitionKey`值，如`date_partition=2018-05-09`都对应了表中的一个`partition`。另外需要注意的是，`date_partiton=2018-05-09`的数据并不一定就是`2018-05-09`这一天的全部数据，他不能代替`select * from table.t where t.datetime = '2018-05-09'`，只要你将一条数据的`date_partiton`指定为`2018-05-09`，不管它的`datetime`列实际上是哪一天的，他都会被分到`date_partition=2018-05-09`这个分区。指定`partitionKey`只是为了方便查询、加快分析速度，并且**分区列是虚拟列，它们不是数据本身的一部分，而是在加载时派生的。**
```sql
-- 创建一个分区表
CREATE TABLE `eps_volc_sla.ods_cloud_sla_sli_rds_hf`(
  `id` bigint COMMENT 'ID',
  `status` bigint COMMENT '状态',
  `sli_key` string COMMENT '唯一SLI名',
  `product` string COMMENT '售卖产品',
  `functions` string COMMENT '计算方式'
)
PARTITIONED BY (
  `date` string COMMENT '日期分区，yyyyMMdd',
  `hour` string COMMENT '小时分区，HH'
)
ROW FORMAT SERDE
  'org.apache.hadoop.hive.ql.io.parquet.serde.ParquetHiveSerDe'
STORED AS INPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetInputFormat'
OUTPUTFORMAT
  'org.apache.hadoop.hive.ql.io.parquet.MapredParquetOutputFormat'
LOCATION
  'hdfs://westeros/user/tiger/warehouse/eps_volc_sla.db/ods_cloud_sla_sli_rds_hf'
TBLPROPERTIES (
  'is_core'='true',
  'is_starred'='false',
  'primary_key'='',
  'source_from'='coral_ng',
  'status'='3',
  'transient_lastDdlTime'='1633758742',
  'ttl'='0',
  'ttl_extension'='{\"type\":\"mtime\"}')
```

分区的物理存储结构
```shell
$ hadoop fs -ls -R hdfs://westeros/user/tiger/warehouse/eps_volc_sla.db/ods_cloud_sla_sli_rds_hf/date=20211029/hour=16
-rw-r--r--   3 zhangqiang supergroup          0 2021-10-29 17:02 hdfs://westeros/user/tiger/warehouse/eps_volc_sla.db/ods_cloud_sla_sli_rds_hf/date=20211029/hour=16/_SUCCESS
-rw-r--r--   3 zhangqiang supergroup       3828 2021-10-29 17:02 hdfs://westeros/user/tiger/warehouse/eps_volc_sla.db/ods_cloud_sla_sli_rds_hf/date=20211029/hour=16/dts-hive-100009146-202473139-0
-rw-r--r--   3 zhangqiang supergroup        369 2021-10-29 17:02 hdfs://westeros/user/tiger/warehouse/eps_volc_sla.db/ods_cloud_sla_sli_rds_hf/date=20211029/hour=16/dts-hive-100009146-202473139-1
```
#### 静态分区
在执行插入操作的时候指定分区字段的值，就是静态分区。例如:
```sql
-- 其中 date, hour 都是动态分区
INSERT OVERWRITE TABLE eps_volc_sla.dim_sla_sli_hf PARTITION (date = '20211029', hour = '04')
SELECT  id, --	ID
        status, --	状态
        sli_key, --	产品唯一 SLI Key
        product, --	售卖产品
        `functions` --	计算方式
FROM    eps_volc_sla.ods_cloud_sla_sli_rds_hf
WHERE   date = '20211029'
AND     hour = '04';
```
#### 动态分区
在执行插入操作的时候动态计算分区字段的值
```sql
-- 使用动态分区需要先打开动态分区的开关
hive> set hive.exec.dynamic.partition=true; 
-- 其中 date 是静态分区， hour 是动态分区，会根据 ods_cloud_sla_sli_rds_hf 表 hour 字段的值决定 dim_sla_sli_hf 的 hour 分区
INSERT OVERWRITE TABLE eps_volc_sla.dim_sla_sli_hf PARTITION (date = '20211029', hour)
SELECT  id, --	ID
        status, --	状态
        sli_key, --	唯一SLO名
        product, --	售卖产品
        `functions` --	计算方式
FROM    eps_volc_sla.ods_cloud_sla_sli_rds_hf
WHERE   date = '20211029';
```
> Note: 动态分区不允许主分区(date)采用动态列而副分区(hour)采用静态列，这样将导致所有的主分区都要创建副分区静态列所定义的分区。

```sql
-- 动态分区可以允许所有的分区列都是动态分区列，但是需要设置参数，默认是 strict
hive> set hive.exec.dynamic.partition.mode=nonstrict;
-- 在每个执行 MR 的节点上，最大可以创建多少个动态分区。
-- 例如源数据共有 24 个 hour 分区，共 2 个 MR 计算节点， hive.exec.max.dynamic.partitions.pernode=10 就会有问题
hive> set hive.exec.max.dynamic.partitions.pernode=100
-- 在所有执行 MR 的节点上，最大一共可以创建多少个动态分区。
hive> set hive.exec.max.dynamic.partitions=1000
-- 整个 MR Job 中，最大可以创建多少个 HDFS 文件
hive> set hive.exec.max.created.files=100000
```

### Buckets(or Clusters)
每个分区的数据可以根据表中的实际列的Hash值进行分段(簇)。注意是表中的实列，而不是分区列。这样可以针对数据集执行高效的采样查询。

不一定非要把表进行分区或分段，但是分区或分段可以大幅度的缩减查询数据集，从而提高查询效率。

## 数据类型
Hive 支持原始(primitive)和复杂(complex)数据类型。
### Primitive Type

#### Integers
* TINYINT：  1 byte integer
* SMALLINT： 2 byte integer
* INT：      4 byte integer
* BIGINT：   8 byte integer

#### Boolean type
* BOOLEAN：  TRUE/FALSE

#### Floating point numbers
* FLOAT：  Single precision
* DOUBLE： Double precision

#### Fixed point numbers
* DECIMAL：a fixed point value of user defined scale and precision

#### String types
* STRING： sequence of characters in a specified character set
* VARCHAR：sequence of characters in a specified character set with a maximum length
* CHAR：   sequence of characters in a specified character set with a defined length

#### Date and time types
* TIMESTAMP：a specific point in time, up to nanosecond precision
* DATE：a date

#### Binary types
* BINARY：a sequence of bytes

隐式类型转换规则：`PrimitiveType > Number > DOUBLE > FLOAT > BIGINT > INT > SMALLINT > TINYINT`、`STRING > BOOLEAN`

当查询表达式所需要的数据类型`Type1`是元数据类型`Type2`的父类型，那么元数据就会被隐式转换为`Type1`。另外，Hive 的类型层次允许将`STRING`隐式转换成`DOUBLE`。

对于显示类型转换，可以使用 Hive 的`cast`Operator。

## Built In Operators and Functions
**所有Hive关键字都不区分大小写，包括Hive运算符和函数的名称。**

```sql
-- 查看最新的函数使用方法
SHOW FUNCTIONS;
-- 方法介绍
DESCRIBE FUNCTION <function_name>;
-- 方法扩展功能介绍，有例子，比上面的更详细
DESCRIBE FUNCTION EXTENDED <function_name>;
```
## Creating, Showing, Altering, and Dropping Tables
Hive 表名、列名都是不区分大小写的
### Creating Tables

* 可以为表或者字段添加注释
* 指定分区列`dt STRING, country STRING`(不是真实的数据列，它不会与实际的数据存储在一起)
* 指定分段列`userid`、按字段`viewTime`排序并将数据集分到`32`个桶中
* 指定行内不同类型数据的分隔符：字段之间用`1`分隔、集合中的元素用`2`分隔、Map 中的 Key 和 Value 用`3`分隔
* 将数据以二进制的形式存储在 HDFS 上

```sql

-- 建表语法
CREATE TABLE page_view( -- 字段
                viewTime INT, 
                userid BIGINT,
                page_url STRING, 
                referrer_url STRING,
                friends ARRAY<BIGINT>, 
                properties MAP<STRING, STRING>,
                ip STRING COMMENT '字段注释')
COMMENT '表注释'
PARTITIONED BY(dt STRING, country STRING) -- 分区字段
CLUSTERED BY(userid) SORTED BY(viewTime) INTO 32 BUCKETS -- 分桶
ROW FORMAT DELIMITED -- 指定行分隔符
        FIELDS TERMINATED BY '1' -- 字段之间用字符`1`分割
        COLLECTION ITEMS TERMINATED BY '2' -- 集合之间用字符`2`分割
        MAP KEYS TERMINATED BY '3' -- Map key value 用字符`3`分割
STORED AS SEQUENCEFILE; -- 存储类型

-- 举个例子
CREATE TABLE `public_opinion_article`(
  `docid` string, 
  `field` string, 
  `termid` int, 
  `term` string, 
  `tfidf` double)
PARTITIONED BY ( 
  `dt` date)
ROW FORMAT SERDE 
  'org.apache.hadoop.hive.ql.io.orc.OrcSerde' 
WITH SERDEPROPERTIES ( 
  'path'='hdfs://hadoop3:8020/apps/hive/warehouse/tfidf.db/public_opinion_article') 
STORED AS 
  INPUTFORMAT 
    'org.apache.hadoop.hive.ql.io.orc.OrcInputFormat' 
  OUTPUTFORMAT 
    'org.apache.hadoop.hive.ql.io.orc.OrcOutputFormat'
LOCATION
  'hdfs://hadoop3:8020/apps/hive/warehouse/tfidf.db/public_opinion_article'
TBLPROPERTIES (
  'spark.sql.create.version'='2.4.0', 
  'spark.sql.partitionProvider'='catalog', 
  'spark.sql.sources.provider'='orc', 
  'spark.sql.sources.schema.numPartCols'='1', 
  'spark.sql.sources.schema.numParts'='1', 
  'spark.sql.sources.schema.part.0'='{\"type\":\"struct\",\"fields\":[{\"name\":\"docId\",\"type\":\"string\",\"nullable\":true,\"metadata\":{}},{\"name\":\"field\",\"type\":\"string\",\"nullable\":true,\"metadata\":{}},{\"name\":\"termId\",\"type\":\"integer\",\"nullable\":true,\"metadata\":{}},{\"name\":\"term\",\"type\":\"string\",\"nullable\":true,\"metadata\":{}},{\"name\":\"tfIdf\",\"type\":\"double\",\"nullable\":true,\"metadata\":{}},{\"name\":\"dt\",\"type\":\"date\",\"nullable\":true,\"metadata\":{}}]}', 
  'spark.sql.sources.schema.partCol.0'='dt', 
  'transient_lastDdlTime'='1555657655')
```

### Browsing Tables and Partitions

```sql
-- 查看所有表
SHOW TABLES;

-- 可以使用正则表达式
SHOW TABLES 'page.*';

-- 查看表的分区字段，如果表没有被分区则抛出错误信息
SHOW PARTITIONS page_view;

-- 查看表的所有字段和字段类型
DESCRIBE page_view;
DESC page_view;

-- 额外显示表的其他属性，常用于debugging
DESCRIBE EXTENDED page_view;

-- 查看表的分区字段和字段类型，以及分区的所有其他属性信息
DESCRIBE EXTENDED page_view PARTITION (ds='2008-08-08');

-- 查看表的创建语句，常用于查看表 SerDe 等信息
SHOW CREATE TABLE page_view;
```

### Altering Tables
[LanguageManual+ORC](https://cwiki.apache.org/confluence/display/Hive/LanguageManual+ORC)

```sql
-- 合并分区小文件为更大的文件
ALTER TABLE table_name [PARTITION partition_spec] CONCATENATE;
```

### Dropping Tables and Partitions
注意删除数据后就没有办法恢复了
```sql
-- 删表
DROP TABLE pv_users;
-- 删除指定分区数据
ALTER TABLE pv_users DROP PARTITION (ds='2008-08-08')
```

### Load datafile
```sql
CREATE TABLE IF NOT EXISTS test_zq.full_dimension
(
    id varchar(20),
    name varchar(20),
    age int,
    birthday date,
    farther_id string
)
PARTITIONED BY (dt string)
ROW FORMAT DELIMITED FIELDS TERMINATED BY ','
STORED AS textfile;

LOAD DATA INPATH 'hdfs:///zq_test/full_dimensions_test_data'
INTO TABLE test_zq.full_dimension
PARTITION (dt = '2018-11-22');
```

### 导出数据
```sql
-- 导出到本地，注意 insert into 后面只能跟表名，所以需要使用 insert overwrite
-- 字段分割符默认是 ^A(ascii=\00001)
INSERT OVERWRITE LOCAL DIRECTORY '/home/zhangqiang/hive'
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t'
SELECT * FROM temp;

-- 导出到 hdfs
INSERT OVERWRITE DIRECTORY '/home/zhangqiang/hive'
ROW FORMAT DELIMITED FIELDS TERMINATED BY '\t'
SELECT * FROM temp;
```

## Functions

### ROW_NUMBER() OVER
* [LanguageManual WindowingAndAnalytics](https://cwiki.apache.org/confluence/display/Hive/LanguageManual+WindowingAndAnalytics)

```sql
-- Usage: 按照COLUMN1进行分组，按照COLUMN2在分组内排序，然后分组内按顺序从1开始为每条数据编号
ROW_NUMBER() OVER(PARTITION BY COLUMN1 ORDER BY COLUMN2)

-- Example: 按照 DocID 进行去重(分组)，只保留最新版本的 Document
SELECT * 
FROM(
  SELECT *, ROW_NUMBER() OVER (PARTITION BY doc_id ORDER BY insert_time DESC) num 
  FROM my_table
  ) t 
WHERE t.num = 1; 
```

## Common Operations
### 小文件合并
将小文件合并成每个 150M 的 gz 文件
```shell
set hive.hadoop.supports.splittable.combineinputformat=true;
set mapred.max.split.size=150000000;
set mapred.min.split.size.per.node=150000000;
set mapred.min.split.size.per.rack=150000000;
set mapred.max.split.size.per.node=150000000;
set mapred.max.split.size.per.rack=150000000;
set hive.exec.compress.output=true;
set mapred.output.compression.codec=org.apache.hadoop.io.compress.GzipCodec;

insert overwrite table t_temp partition(date_partition='${v_day}')
select a, b, ... from t where date_partition='${v_day}' ;

load data inpath 'hdfs:///user/hive/warehouse/mydb.db/t_temp/date_partition=${v_day}' OVERWRITE into table t partition(date_partition='${v_day}');
```

### 大文件拆分
用`distribute by rand()`强制 shuffle 数据，通过 reduce 将文件分割成 150M 大小。
```shell
set hive.exec.reducers.bytes.per.reducer=150000000;
set hive.exec.compress.output=true;
set mapred.output.compression.codec=org.apache.hadoop.io.compress.GzipCodec;

insert overwrite table t_temp partition(date_partition='${v_day}')
select a, b, ...  from t where date_partition='${v_day}' distribute by rand();

load data inpath 'hdfs:///user/hive/warehouse/mydb.db/t_temp/date_partition=${v_day}' OVERWRITE into table t partition(date_partition='${v_day}');
```