---
layout: post
title: ClickHouse Exceptions
tag:  ClickHouse
---

## ClickHouse 写入数据丢失
### Backgroud
压测时，向 ClickHouse Distrubuted Table 写入 1000W 条相同的数据，查询总数时总是丢数据

```shell
# Distributed Table DDL
clickhouse-3.clickhouse.dlink-prod.svc.cluster.local :) show create table dlink.stress_log
SHOW CREATE TABLE dlink.stress_log
Query id: 8b965edc-98d5-46f0-87f9-a3cdea1e8400
┌─statement──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CREATE TABLE dlink.stress_log
(
    `stream` Nullable(String),
    `docker` Nullable(String),
    `kubernetes` String,
    `remote_addr` Nullable(String),
    `request` Nullable(String),
    `status` Nullable(String),
    `request_time` Nullable(Float64),
    `connection_requests` Nullable(String),
    `http_user_agent` Nullable(String),
    `service_name` String,
    `tag` Nullable(String),
    `time` DateTime('Asia/Shanghai'),
    `dt` String
)
ENGINE = Distributed('dog', 'dlink', 'stress_log_shard', rand()) │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
1 rows in set. Elapsed: 0.076 sec.

# Shard Table DDL
clickhouse-3.clickhouse.dlink-prod.svc.cluster.local :) show create table dlink.stress_log_shard
SHOW CREATE TABLE dlink.stress_log_shard
Query id: 9b80f966-880d-4d73-9acd-b60e5952239d
┌─statement──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ CREATE TABLE dlink.stress_log_shard
(
    `stream` Nullable(String),
    `docker` Nullable(String),
    `kubernetes` String,
    `remote_addr` Nullable(String),
    `request` Nullable(String),
    `status` Nullable(String),
    `request_time` Nullable(Float64),
    `connection_requests` Nullable(String),
    `http_user_agent` Nullable(String),
    `service_name` String,
    `tag` Nullable(String),
    `time` DateTime('Asia/Shanghai'),
    `dt` String
)
ENGINE = ReplicatedMergeTree('/clickhouse/tables/{shard_dog}/dlink.stress_log_shard', '{replica_dog}')
PARTITION BY (service_name, dt)
ORDER BY time
SETTINGS index_granularity = 8192 │
└────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
1 rows in set. Elapsed: 0.085 sec.

## Test Case 1
### Conditions
# 数据量: 100W 随机数据
# 每批次吞吐限制: maxRatePerPartition * batchWindowTime * topicPartitions = 10000 * 10s * 6 = 600000
# Sink: 写入分布式表
# 6 Shards, 1 Replica (cluster: dog)

### Result
# 期望结果 100W，实际结果 100W
clickhouse-3.clickhouse.dlink-prod.svc.cluster.local :) select count(*) from dlink.stress_log
SELECT count(*)
FROM dlink.stress_log
Query id: e3445521-bdaa-463b-8a7e-f8ea10491e9d
┌─count()─┐
│ 1000000 │
└─────────┘
1 rows in set. Elapsed: 0.095 sec.

## Test Case 2
### Conditions
# 数据量: 100W 相同数据
# 每批次吞吐限制: maxRatePerPartition * batchWindowTime * topicPartitions = 10000 * 10s * 6 = 600000
# Sink: 写入分布式表
# 6 Shards, 1 Replica (cluster: dog)

### Result
# 期望结果 100W，实际结果 981446
clickhouse-3.clickhouse.dlink-prod.svc.cluster.local :) select count(*) from dlink.stress_log
SELECT count(*)
FROM dlink.stress_log
Query id: 36f21809-0646-4bef-bc40-5c182c2fd22f
┌─count()─┐
│ 981446  │
└─────────┘
1 rows in set. Elapsed: 0.005 sec.

## Test Case 3
### Conditions
# 数据量: 100W 随机数据
# 每批次吞吐限制: maxRatePerPartition * batchWindowTime * topicPartitions = 10000 * 10s * 6 = 600000
# Sink: 写入 Shard 表
# 6 Shards, 1 Replica (cluster: dog)

### Result
# 期望结果 100W，实际结果 100W
clickhouse-3.clickhouse.dlink-prod.svc.cluster.local :) select count(*) from dlink.stress_log
SELECT count(*)
FROM dlink.stress_log
Query id: 17d91824-a19f-4910-b556-62088663d2d9
┌─count()─┐
│ 1000000 │
└─────────┘
1 rows in set. Elapsed: 0.005 sec.

## Test Case 4
### Conditions
# 数据量: 100W 相同数据
# 每批次吞吐限制: maxRatePerPartition * batchWindowTime * topicPartitions = 10000 * 10s * 6 = 600000
# Sink: 写入 Shard 表
# 6 Shards, 1 Replica (cluster: dog)

### Result
# 期望结果 100W，实际结果 420000
clickhouse-3.clickhouse.dlink-prod.svc.cluster.local :) select count(*) from dlink.stress_log
SELECT count(*)
FROM dlink.stress_log
Query id: 4b2c4bbf-1cbe-4cfc-9801-b8b85c371fdf
┌─count()─┐
│ 420000  │
└─────────┘
1 rows in set. Elapsed: 0.094 sec.
```

### Reference
* [ClickHouse 插入数据成功但是没有数据的问题](https://blog.csdn.net/cwg_1992/article/details/100691109)
* [ClickHouse/issues#2712](https://github.com/ClickHouse/ClickHouse/issues/2712)
* [ClickHouse settings-insert-deduplicate ](https://clickhouse.tech/docs/en/operations/settings/settings/#settings-insert-deduplicate)
* [Data Replication](https://clickhouse.tech/docs/en/engines/table-engines/mergetree-family/replication/)

### Solved
```shell
# 添加配置项
$ vim /etc/clickhouse-server/configd/user.xml
<yandex>
  <profiles>
    ...
    <writer>
      <max_memory_usage>10000000000</max_memory_usage>
      <use_uncompressed_cache>0</use_uncompressed_cache>
      <load_balancing>random</load_balancing>
      <!-- Enables(1, defalut) or disables(0) block deduplication of INSERT (for Replicated* tables). -->
      <insert_deduplicate>0</insert_deduplicate>
    </writer>
    ...
  </profiles>
  <users>
    ...
    <writer>
      <password>{{ .Values.clickhouse.writerPass }}</password>
      <profile>writer</profile>
      <quota>default</quota>
      <networks>
        <ip>::/0</ip>
      </networks>
    </writer>
    ...
  </users>  
</yandex>

# 验证是否生效
$ clickhouse-client --user writer --password xxxxxx --host clickhouse
clickhouse-1.clickhouse.dlink-prod.svc.cluster.local :) SELECT getSetting('insert_deduplicate')
SELECT getSetting('insert_deduplicate')
Query id: 099af07f-2d8b-4c81-9581-5795d59ace0e
┌─getSetting('insert_deduplicate')─┐
│                                0 │
└──────────────────────────────────┘
1 rows in set. Elapsed: 0.002 sec.

# 重启写入程序，数据不再丢失
```

## Memory limit exceeded 
### Memory limit (total) exceeded
```
Code: 241, e.displayText() = DB::Exception: Memory limit (total) exceeded: would use 24.63 GiB (attempt to allocate chunk of 131072 bytes), maximum: 24.63 GiB: (while reading column account_id): (while reading from part /data00/clickhouse/data/data/eps_data_beta/app_trade_eco_bill_rf_local/20220622_21761_21761_0/ from mark 0 with max_rows_to_read = 8192) (version 19.5.3.8)
```

ClickHouse 每个节点上服务器使用最大内存上限是 [max_server_memory_usage](https://clickhouse.com/docs/en/operations/server-configuration-parameters/settings/#max_server_memory_usage)
> default: 0, 0 代表 Auto，默认情况下的计算公式： max_server_memory_usage = memory_amount（内存总量） * max_server_memory_usage_to_ram_ratio（占比分数值）

Clickhouse 服务器的总物理 RAM 量比例 [max_server_memory_usage_to_ram_ratio](https://clickhouse.com/docs/en/operations/server-configuration-parameters/settings/#max_server_memory_usage_to_ram_ratio)
> default：0, Clickhouse 服务器可以使用所有可用的 RAM，在具有低 RAM 和交换容量的主机上，可能需要将 max_server_memory_usage_to_ram_ratio 设置为大于 1


### Memory limit (for query) exceeded
ClickHouse 单服务器运行查询可使用的内存上限是 [max_memory_usage](https://clickhouse.com/docs/en/operations/settings/query-complexity/#settings_max_memory_usage)
> default: 10g, 超大表 Join/Union 容易触发内存上限，可以选择调大配置或者优化 SQL，比如减少 Select 字段数量或者 Where 条件内置

ClickHouse 在单服务器上运行用户查询的内存上限是 [max_memory_usage_for_user]()
> default: 0, 0 表示不受限，默认值定义在 [Settings.h](https://github.com/ClickHouse/ClickHouse/blob/master/src/Core/Settings.h)

分组聚合超过内存上限时可以设置 [max_bytes_before_external_group_by](https://clickhouse.com/docs/en/operations/settings/query-complexity/#settings-max_bytes_before_external_group_by) 参数，当 GroupBy 操作内存超过该指定大小时会溢写到磁盘，避免查询内存溢出