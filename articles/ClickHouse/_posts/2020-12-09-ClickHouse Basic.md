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
ClickHouse 可以在查询(External tables could be sent only with select query)的时候加载外部数据，例如使用 Command-line Client 的时候可以使用如下参数

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
# -–structure   The table structure in the formatUserID UInt64, URL String. Defines the column names and types.
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
                                                                              │
│ FailedQuery                             │           39 │ Number of failed queries.
                                                                              │
│ FailedInsertQuery                       │           32 │ Same as FailedQuery, but only for INSERT queries.
                                                                              │
│ QueryTimeMicroseconds                   │    382148412 │ Total time of all queries.
                                                                              │
│ SelectQueryTimeMicroseconds             │       672996 │ Total time of SELECT queries.
                                                                              │
│ InsertQueryTimeMicroseconds             │    377959654 │ Total time of INSERT queries.
                                                                              │
│ FileOpen                                │       129880 │ Number of files opened.
                                                                              │
│ Seek                                    │        25713 │ Number of times the 'lseek' function was called.
                                                                              │
│ ReadBufferFromFileDescriptorRead        │       267578 │ Number of reads (read/pread) from a file descriptor. Does not include sockets.
                                                                              │
│ ReadBufferFromFileDescriptorReadBytes   │   5180584898 │ Number of bytes read from file descriptors. If the file is compressed, this will show the compressed data size.
                                                                              │
│ WriteBufferFromFileDescriptorWrite      │        90375 │ Number of writes (write/pwrite) to a file descriptor. Does not include sockets.
                                                                              │
│ WriteBufferFromFileDescriptorWriteBytes │   9812029421 │ Number of bytes written to file descriptors. If the file is compressed, this will show compressed data size.
                                                                              │
│ ReadCompressedBytes                     │   9155637184 │ Number of bytes (the number of bytes before decompression) read from compressed sources (files, network).
                                                                              │
│ CompressedReadBufferBlocks              │       465059 │ Number of compressed blocks (the blocks of data that are compressed independent of each other) read from compressed sources (files, network).
                                                                              │
│ CompressedReadBufferBytes               │ 103040420282 │ Number of uncompressed bytes (the number of bytes after decompression) read from compressed sources (files, network).
                                                                              │
│ IOBufferAllocs                          │       280048 │
                                                                              │
│ IOBufferAllocBytes                      │  71824624609 │
                                                                              │
│ ArenaAllocChunks                        │          429 │
                                                                              │
│ ArenaAllocBytes                         │      2658304 │
                                                                              │
│ FunctionExecute                         │         3266 │
                                                                              │
│ MarkCacheHits                           │           56 │
                                                                              │
│ MarkCacheMisses                         │           56 │
                                                                              │
│ CreatedReadBufferOrdinary               │        52836 │
                                                                              │
│ CreatedWriteBufferOrdinary              │        75726 │
                                                                              │
│ DiskReadElapsedMicroseconds             │   8094087848 │ Total time spent waiting for read syscall. This include reads from page cache.
                                                                              │
│ DiskWriteElapsedMicroseconds            │      6575044 │ Total time spent waiting for write syscall. This include writes to page cache.
                                                                              │
│ NetworkReceiveElapsedMicroseconds       │     66101609 │
                                                                              │
│ NetworkSendElapsedMicroseconds          │     68596716 │
                                                                              │
│ ReplicatedPartFetches                   │           23 │ Number of times a data part was downloaded from replica of a ReplicatedMergeTree table.
                                                                              │
│ ReplicatedPartMerges                    │            8 │ Number of times data parts of ReplicatedMergeTree tables were successfully merged.
                                                                              │
│ InsertedRows                            │    196383451 │ Number of rows INSERTed to all tables.
                                                                              │
│ InsertedBytes                           │  94201262046 │ Number of bytes (uncompressed; for columns as they stored in memory) INSERTed to all tables.
                                                                              │
│ ZooKeeperInit                           │            2 │
                                                                              │
│ ZooKeeperTransactions                   │        12074 │
                                                                              │
│ ZooKeeperList                           │         5530 │
                                                                              │
│ ZooKeeperCreate                         │          108 │
                                                                              │
│ ZooKeeperRemove                         │           65 │
                                                                              │
│ ZooKeeperExists                         │          577 │
                                                                              │
│ ZooKeeperGet                            │         5489 │
                                                                              │
│ ZooKeeperSet                            │            1 │
                                                                              │
│ ZooKeeperMulti                          │          304 │
                                                                              │
│ ZooKeeperWatchResponse                  │           83 │
                                                                              │
│ ZooKeeperWaitMicroseconds               │     61965394 │
                                                                              │
│ ZooKeeperBytesSent                      │      1160930 │
                                                                              │
│ ZooKeeperBytesReceived                  │      1273914 │
                                                                              │
│ SelectedParts                           │            8 │ Number of data parts selected to read from a MergeTree table.
                                                                              │
│ SelectedRanges                          │            8 │ Number of (non-adjacent) ranges in all data parts selected to read from a MergeTree table.
                                                                              │
│ SelectedMarks                           │          705 │ Number of marks (index granules) selected to read from a MergeTree table.
                                                                              │
│ SelectedRows                            │    224702412 │ Number of rows SELECTed from all tables.
                                                                              │
│ SelectedBytes                           │ 108749449316 │ Number of bytes (uncompressed; for columns as they stored in memory) SELECTed from all tables.
                                                                              │
│ Merge                                   │         8150 │ Number of launched background merges.
                                                                              │
│ MergedRows                              │     14032395 │ Rows read for background merges. This is the number of rows before merge.
                                                                              │
│ MergedUncompressedBytes                 │   7221384757 │ Uncompressed bytes (for columns as they stored in memory) that was read for background merges. This is the number before merge.
                                                                              │
│ MergesTimeMilliseconds                  │        19897 │ Total time spent for background merges.
                                                                              │
│ MergeTreeDataWriterRows                 │      6791323 │ Number of rows INSERTed to MergeTree tables.
                                                                              │
│ MergeTreeDataWriterUncompressedBytes    │   3246545607 │ Uncompressed bytes (for columns as they stored in memory) INSERTed to MergeTree tables.
                                                                              │
│ MergeTreeDataWriterCompressedBytes      │    331091320 │ Bytes written to filesystem for data INSERTed to MergeTree tables.
                                                                              │
│ MergeTreeDataWriterBlocks               │         2550 │ Number of blocks INSERTed to MergeTree tables. Each block forms a data part of level zero.
                                                                              │
│ MergeTreeDataWriterBlocksAlreadySorted  │         2550 │ Number of blocks INSERTed to MergeTree tables that appeared to be already sorted.
                                                                              │
│ RegexpCreated                           │            5 │ Compiled regular expressions. Identical regular expressions compiled just once and cached forever.
                                                                              │
│ ContextLock                             │        64992 │ Number of times the lock of Context was acquired or tried to acquire. This is global lock.
                                                                              │
│ RWLockAcquiredReadLocks                 │       139460 │
                                                                              │
│ RWLockAcquiredWriteLocks                │            4 │
                                                                              │
│ RWLockReadersWaitMilliseconds           │          394 │
                                                                              │
│ RealTimeMicroseconds                    │  64625405286 │ Total (wall clock) time spent in processing (queries and other tasks) threads (not that this is a sum).
                                                                              │
│ UserTimeMicroseconds                    │    219720000 │ Total time spent in processing (queries and other tasks) threads executing CPU instructions in user space. This include time CPU pipeline was stalled due to cache misses, br
anch mispredictions, hyper-threading, etc.                                    │
│ SystemTimeMicroseconds                  │    149552000 │ Total time spent in processing (queries and other tasks) threads executing CPU instructions in OS kernel space. This include time CPU pipeline was stalled due to cache misse
s, branch mispredictions, hyper-threading, etc.                               │
│ SoftPageFaults                          │     51247799 │
                                                                              │
│ OSCPUWaitMicroseconds                   │      1074854 │ Total time a thread was ready for execution but waiting to be scheduled by OS, from the OS point of view.
                                                                              │
│ OSCPUVirtualTimeMicroseconds            │    369316548 │ CPU time spent seen by OS. Does not include involuntary waits due to virtualization.
                                                                              │
│ OSWriteBytes                            │   8950669312 │ Number of bytes written to disks or block devices. Doesn't include bytes that are in page cache dirty pages. May not include data that was written by OS asynchronously.
                                                                              │
│ OSReadChars                             │     55428460 │ Number of bytes read from filesystem, including page cache.
                                                                              │
│ OSWriteChars                            │   8947226703 │ Number of bytes written to filesystem, including page cache.
                                                                              │
│ CreatedHTTPConnections                  │            1 │ Total amount of created HTTP connections (closed or opened).
                                                                              │
│ CreatedLogEntryForMerge                 │            3 │ Successfully created log entry to merge parts in ReplicatedMergeTree.
                                                                              │
└─────────────────────────────────────────┴──────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
──────────────────────────────────────────────────────────────────────────────┘

77 rows in set. Elapsed: 0.003 sec.

```
## Common
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
INSERT INTO dlink.file_uid_info SELECT *, "hadoop" as cluster, 1 as isInnerAvro FROM dlink.hdfs_bj_avro_inner_file_uid;
INSERT INTO dlink.file_uid_info SELECT *, "hadoop" as cluster, 0 as isInnerAvro FROM dlink.hdfs_bj_all_file_uid;

```

### Import Data from Local File
* [Table Functions - file](https://clickhouse.tech/docs/en/sql-reference/table-functions/file/)
* [Table Engines - File](https://clickhouse.tech/docs/en/engines/table-engines/special/file/)

```sql
INSERT INTO dlink.file_uid_info SELECT *, "hadoop" as cluster, 1 as isInnerAvro FROM file("/data/*.paquet", "PARQUET")
```