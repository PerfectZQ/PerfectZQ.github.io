---
layout: post
title: ClickHouse Basic
tag:  ClickHouse
---

## Install Command-line Client
* [Install ClickHouse](https://clickhouse.tech/docs/en/getting-started/install/)
* [Command-line Client](https://clickhouse.tech/docs/en/interfaces/cli/)

```shell
$ sudo apt-get install apt-transport-https ca-certificates dirmngr
$ sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv E0C56BD4

$ echo "deb https://repo.clickhouse.tech/deb/stable/ main/" | sudo tee \
    /etc/apt/sources.list.d/clickhouse.list
$ sudo apt-get update

$ sudo apt-get install -y clickhouse-server clickhouse-client

$ sudo service clickhouse-server start
$ clickhouse-client
```


## External Data
* [External Data for Query Processing](https://clickhouse.tech/docs/en/engines/table-engines/special/external-data/)
ClickHouse 可以在查询(**External tables could be sent only with select query**)的时候加载外部数据，例如使用 Command-line Client 的时候可以使用如下参数

```shell
$ clickhouse-client --help
...
External tables options:
  --file arg                   data file or - for stdin
  --name arg (=_data)          name of the table
  --format arg (=TabSeparated) data format
  --structure arg              structure
  --types arg                  types

# Usage
# --external    Marks the beginning of a clause.
# -–file        Path to the file with the table dump, or `-`, which refers to stdin. Only a single table can be retrieved from stdin.
# 以下的参数是可选的
# –-name        Name of the table. If omitted, `_data` is used. (Optional)
# –-format      Data format in the file. If omitted, `TabSeparated` is used. (Optional)
# 下面两个参数必须指定一个
# -–types       A list of comma-separated column types. For example: UInt64,String. The columns will be named _1, _2, …
# -–structure   The table structure in the format UserID UInt64, URL String. Defines the column names and types.
$ clickhouse-client \
--external --file=... [--name=...] [--format=...] [--types=...|--structure=...]

# examples

$ clickhouse-client --host 172.16.105.16 --port 31234 \
--user admin --password xxxxxxxx \
--query "SELECT * FROM external_lineorder" \
--external \
--file=lineorder.tbl \
--name=external_lineorder \
–-format=CSV \
--structure="LO_ORDERKEY UInt32, LO_LINENUMBER UInt8, LO_CUSTKEY UInt32, LO_PARTKEY UInt32, LO_SUPPKEY UInt32, LO_ORDERDATE Date, LO_ORDERPRIORITY LowCardinality(String), LO_SHIPPRIORITY UInt8, LO_QUANTITY UInt8, LO_EXTENDEDPRICE UInt32, LO_ORDTOTALPRICE UInt32, LO_DISCOUNT UInt8, LO_REVENUE UInt32, LO_SUPPLYCOST UInt32, LO_TAX UInt8, LO_COMMITDATE Date, LO_SHIPMODE LowCardinality(String)"
```

> 对于`--format`,详细的可以参考[Formats for Input and Output Data](https://clickhouse.tech/docs/en/interfaces/formats/)

## Operation
* [ClickHouse 之 DBA 运维宝典](https://cloud.tencent.com/developer/article/1654602)

### System Tables
* [System Tables](https://clickhouse.tech/docs/en/operations/system-tables/)

```shell
# 查看集群 SQL 执行队列
SELECT query_id, user, address, query FROM system.processes ORDER BY query_id ASC
Query id: f148aae4-f0e3-460b-9481-65371ca13113

┌─query_id─────────────────────────────┬─user──┬─address────────────┬─query─────────────────────────────────────────────────────────────────────────────┐
│ f148aae4-f0e3-460b-9481-65371ca13113 │ admin │ ::ffff:10.240.1.27 │ SELECT query_id, user, address, query FROM system.processes ORDER BY query_id ASC │
└──────────────────────────────────────┴───────┴────────────────────┴───────────────────────────────────────────────────────────────────────────────────┘

1 rows in set. Elapsed: 0.003 sec.

# 终止某个 SQL 的执行
KILL QUERY WHERE query_id = 'query_id'

# 查询集群事件
SELECT * FROM system.events
Query id: 3dc8e9f7-852a-4917-846e-eb8220b403c2

┌─event───────────────────────────────────┬────────value─┬─description──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
──────────────────────────────────────────────────────────────────────────────┐
│ Query                                   │          257 │ Number of queries to be interpreted and potentially executed. Does not include queries that failed to parse or were rejected due to AST size limits, quota limits or limits o
n the number of simultaneously running queries. May include internal queries initiated by ClickHouse itself. Does not count subqueries. │
│ SelectQuery                             │          150 │ Same as Query, but only for SELECT queries.
                                                                              │
│ InsertQuery                             │           76 │ Same as Query, but only for INSERT queries.
...
77 rows in set. Elapsed: 0.003 sec.

```
## Import Data
### Import TSV
```shell
# Connect to clickhouse container
$ kubectl.exe exec -it clickhouse-5 -- bash

# Connect to clickhouse cli
$ /usr/bin/clickhouse-client --host clickhouse-5.clickhouse -u admin --password xxxxxxxx

CREATE DATABASE dlink ON CLUSTER cat

CREATE TABLE dlink.avro_schemas_shard ON CLUSTER cat
(
id UInt32,
cluster LowCardinality(String),
filePath String,
schema Nullable(String),
fileNums Int32
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard_cat}/dlink.avro_schemas_shard', '{replica_cat}')
ORDER BY (id)

CREATE TABLE dlink.avro_schemas ON CLUSTER cat AS dlink.avro_schemas_shard 
ENGINE = Distributed('cat', 'dlink', 'avro_schemas_shard', rand())

# Import tsv data
$ nohup  /usr/bin/clickhouse-client --host clickhouse-5.clickhouse -u admin --password xxxxxxxx --query 'INSERT INTO dlink.avro_schemas FORMAT TabSeparated' --max_insert_block_size=100000 < /tmp/hdfs_avro_schemas.txt >import.log 2>&1 &

```

### Import Data from HDFS
```sql
-- 关联 hdfs 目录
CREATE TABLE dlink.hdfs_bj_avro_inner_file_uid
(
    md5 String,
    filePath String,
	fileSize Nullable(UInt64),
    rowNumber Nullable(UInt32),
	bytesFieldName Nullable(String)
)
ENGINE = HDFS('hdfs://sensetime-data-hadoop/user/sre.bigdata/avro_file_uniqueId_parquet', 'Parquet')

CREATE TABLE dlink.hdfs_bj_all_file_uid
(
    md5 String,
    filePath String,
	fileSize Nullable(UInt64)
)
ENGINE = HDFS('hdfs://sensetime-data-hadoop/user/sre.bigdata/all_file_uniqueId.parquet', 'Parquet')

-- 创建本地表
CREATE TABLE IF NOT EXISTS dlink.file_uid_info_shard ON CLUSTER cat
(
	md5 String,
	cluster LowCardinality(String),
	isInnerAvro UInt8, -- Boolean Type
	filePath String,
	fileSize Nullable(UInt64),
	rowNumber Nullable(UInt32),
	bytesFieldName Nullable(String)
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard_cat}/dlink.file_uid_info_shard', '{replica_cat}')
ORDER BY (md5)

-- 创建分布式表
CREATE TABLE dlink.file_uid_info ON CLUSTER cat AS dlink.file_uid_info_shard 
ENGINE = Distributed('cat', 'dlink', 'file_uid_info_shard', rand())

-- 导入本地表
INSERT INTO dlink.file_uid_info (md5, filePath, fileSize, cluster, isInnerAvro) SELECT *, 'hadoop', 1 FROM dlink.hdfs_bj_avro_inner_file_uid;
INSERT INTO dlink.file_uid_info SELECT *, "hadoop" as cluster, 0 as isInnerAvro FROM dlink.hdfs_bj_all_file_uid;

```

### Import Data from File
* [Table Engines - File](https://clickhouse.tech/docs/en/engines/table-engines/special/file/)
```sql
CREATE TABLE dlink.bj_avro_inner_file_uid
(
    md5 String,
    filePath String,
	fileSize Nullable(UInt64),
    rowNumber Nullable(UInt32),
	bytesFieldName Nullable(String)
)
ENGINE = File(TabSeparated)
```

* [Table Functions - file](https://clickhouse.tech/docs/en/sql-reference/table-functions/file/)
> Note: file 只能读到 [user_files_path](https://clickhouse.tech/docs/en/operations/server-configuration-parameters/settings/#server_configuration_parameters-user_files_path) 下的文件
```sql
INSERT INTO dlink.file_uid_info (md5, filePath, fileSize, cluster, isInnerAvro) SELECT md5, filePath, fileSize, 'hadoop', 1 FROM file(
    "/var/lib/clickhouse/user_files/sre.bigdata/all_file_uniqueId.parquet/*", "PARQUET", 
    "md5 String, filePath String, fileSize Nullable(UInt64)"
)
```

## Practices
### Execute sql file
```shell
# 初始化表
clickhouse-client --host 10.53.26.177 --port 31234 -u admin --password Dlink@2020 --multiquery < init_table.sql

cluster="hadoop"
prefix="bj"

clickhouse-client --host 10.53.26.177 --port 31234 -u admin --password Dlink@2020 --query "truncate table dlink.${prefix}_all_file_uid"
# 遍历文件夹中的文件
for FILENAME in /data/analysis/$cluster/user/sre.bigdata/all_file_uniqueId.parquet/*.parquet; do
    # Log Engine 写入的时候整个表会锁住，任何读取操作会被阻塞，当没有写操作的时候支持并发读
    cat $FILENAME | clickhouse-client \
          --host 10.53.26.177 --port 31234 -u admin --password Dlink@2020 \
          --query "INSERT INTO dlink.${prefix}_all_file_uid FORMAT Parquet" \
          --max_insert_block_size=100000
done
clickhouse-client --host 10.53.26.177 --port 31234 -u admin --password Dlink@2020 \
	--query "INSERT INTO dlink.file_uid_info(md5, filePath, fileSize, cluster, isInnerAvro) SELECT md5, filePath, fileSize, '$cluster', 0 FROM dlink.${prefix}_all_file_uid"
clickhouse-client --host 10.53.26.177 --port 31234 -u admin --password Dlink@2020 --query "drop table dlink.${prefix}_all_file_uid"


clickhouse-client --host 10.53.26.177 --port 31234 -u admin --password Dlink@2020 --query "truncate table dlink.${prefix}_avro_inner_file_uid"
for FILENAME in /data/analysis/$cluster/user/sre.bigdata/avro_file_uniqueId_parquet/*.parquet; do
    # Log Engine 写入的时候整个表会锁住，任何读取操作会被阻塞，当没有写操作的时候支持并发读
    cat $FILENAME | clickhouse-client \
          --host 10.53.26.177 --port 31234 -u admin --password Dlink@2020 \
          --query "INSERT INTO dlink.${prefix}_avro_inner_file_uid FORMAT Parquet" \
          --max_insert_block_size=100000
done
clickhouse-client --host 10.53.26.177 --port 31234 -u admin --password Dlink@2020 \
        --query "INSERT INTO dlink.file_uid_info(md5, filePath, fileSize, rowNumber, bytesFieldName, cluster, isInnerAvro) SELECT md5, filePath, fileSize, rowNumber, bytesFieldName, '$cluster', 1 FROM dlink.${prefix}_avro_inner_file_uid"
clickhouse-client --host 10.53.26.177 --port 31234 -u admin --password Dlink@2020 --query "drop table dlink.${prefix}_avro_inner_file_uid"
```