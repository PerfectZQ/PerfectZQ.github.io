---
layout: post
title: HBase Integration
tag: Hive
---
## 参考
　　[官方手册](https://cwiki.apache.org/confluence/display/Hive/HBaseIntegration)
## StorageHandlers
　　StorageHandlers 是 Hive 的一个独立的模块，以模块化，可扩展的方式访问由其他系统(HBase、Kafka、JDBC...)存储和管理的数据。
## Terminology
　　在 StorageHandlers 之前，Hive 的表可分为：
* **managed tables**：在 Hive Metastore 中进行管理的表，以及由 Hive 负责其数据存储的表。
* **external tables**：由某个外部目录或系统进行管理的表，这些表并不属于 Hive，表在 Hive 中被删除的时候，真实的数据不会被删除。

　　在 StorageHandlers 中，又将 Hive 表分为：
* **native tables**：本地表，Hive 可以直接管理和访问。
* **non-native tables**：非本地表，Hive 无法直接访问，需要通过 StorageHandlers 程序去处理访问。

　　这两种分类(managed、external 和 native、non-native)是正交的，因此 Hive 的表可以分为四个类型

* **managed native**：默认情况下使用`CREATE TABLE`创建的表。
* **external native**：使用`CREATE EXTERNAL TABLE`，并且没有指定`STORED BY`子句创建的表。
* **managed non-native**：指定`STORED BY`子句，使用`CREATE TABLE`创建的表。Hive 将表定义存储在 HiveMetastore 中，其本身不会创建任何文件，而是调用 StorageHandlers 程序创建相应的对象结构。创建 Hive 表的时候同时也会在外部系统创建新的表。
* **external non-native**：指定`STORED BY`子句，使用`CREATE EXTERNAL TABLE`创建的表。Hive 将表定义存储在 HiveMetastore 中，并调用存储处理程序检查它是否与其他外部系统中的主定义相匹配。用于关联外部系统**已经存在的表**。

## Hive DDL
　　Hive DDL 语法格式

```
CREATE [EXTERNAL] TABLE [IF NOT EXISTS] table_name
  [(col_name data_type [COMMENT col_comment], ...)]
  [COMMENT table_comment]
  [PARTITIONED BY (col_name data_type [col_comment], col_name data_type [COMMENT col_comment], ...)]
  [CLUSTERED BY (col_name, col_name, ...) [SORTED BY (col_name, ...)] INTO num_buckets BUCKETS]
  [
    ROW FORMAT row_format [STORED AS file_format] 
    | STORED BY 'storage.handler.class.name' [WITH SERDEPROPERTIES (...)]
  ]
  [LOCATION hdfs_path]
  [AS select_statement]
```

　　注意当使用`STORED BY`子句时，就不能指定`row_format(DELIMITED|SERDE)`和`STORED AS`了。而可选的`WITH SERDEPROPERTIES (...)`是`STORED BY`子句的一部分，用于指定 StorageHandlers 程序的 serde 的属性。

## HBase Integration
　　对于 HBase 中已经存在的表，对于 Hive 来说，既不属于 Hive(external)，也无法用 Hive 的语法去访问 HBase 中的表(non-native)，所以要创建一个 Hive 表与 HBase 表进行关联，写法如下。
```
CREATE EXTERNAL TABLE hsyk_his_custom_disease_test
  (rowkey string, card_no string, diagnose string, oper_date date)
  STORED BY 'org.apache.hadoop.hive.hbase.HBaseStorageHandler'
    WITH SERDEPROPERTIES (
      "hbase.columns.mapping" = ":key,INFO:CARD_NO,INFO:DIAGNOSE,INFO:OPER_DATE",
      "hbase.table.name" = "hsyk_his_custom_disease_test",
      "hbase.mapred.output.outputtable" = "hsyk_his_custom_disease_test"
    );
```

　　其中`:key`代表 HBase 表的`rowkey`(注意 HBase 和 Hive不同，列簇和列修饰符都是区分大小写的！)，`INFO`是列簇，`CARD_NO,DIAGNOSE,OPER_DATE`是列修饰符，分别对应 Hive 表的`rowkey,card_no,diagnose,oper_date`字段。`hbase.table.name`属性是可选的，如果不额外指定，那么 Hive 和 HBase 表名相同。`hbase.mapred.output.outputtable`属性也是可选的，如果想通过 Hive 把数据插入 HBase 表，就需要指定它，它将被`hbase.mapreduce.TableOutputFormat`所使用。 

　　由于`WAL`，当写入大量数据的时候会比较慢，可以禁用`WAL`，但是如果你没有其他的数据恢复策略，当 HBase 有失败发生的时候可能会造成数据丢失。

```
# 在写入数据之前，禁用 WAL
set hive.hbase.wal.enabled=false;
```