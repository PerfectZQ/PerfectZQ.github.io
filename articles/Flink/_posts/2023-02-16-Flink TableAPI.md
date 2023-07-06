---
layout: post
title: Flink TableAPI
tag: Flink
---

## 参考
* [User-defined Sources & Sinks](https://nightlies.apache.org/flink/flink-docs-release-1.16/docs/dev/table/sourcessinks/)

## DIM Table
Flink SQL 使用`FOR SYSTEM_TIME AS OF PROC_TIME()`来标识维表 JOIN，目前仅支持`INNER JOIN`和`LEFT JOIN`

语法
```
-- 主表一般用 Kafka，RocketMQ 这种实时的流
CREATE TABLE main_table (
    id VARCHAR,
    proc_time AS PROTIME(),
    PRIMARY KEY(id) NOT ENFORCED
) WITH (...);

-- 维度表一般用 HBase，Redis，Mysql 这种适合 Point Lookup 的存储服务
CREATE TABLE dim_table (
    id VARCHAR, 
    info MAP<VARCHAR, VARCHAR> 
) WITH (...);

SELECT  *
FROM    main_table [AS main_table_alias]
[LEFT] JOIN
        -- Note: main_table.proc_time 是主表的 proctime 属性（可以使用计算列）
        dim_table FOR SYSTEM_TIME AS OF main_table.proc_time [AS dim_table_alias]
ON      main_table.id = dim_table.id;
```

示例
```
-- 定义 RocketMQ Binlog 流
CREATE  TABLE sub_orders_binlog_source(
            `id`                          ROW<before_value BIGINT, after_value BIGINT, after_updated BOOLEAN>, -- 
            ...
            proc                          AS PROCTIME() -- 当前处理时间
        )
        WITH (
            'scan.startup-mode' = 'timestamp',
            'connector' = 'rocketmq',
            'cluster' = '@{binlog_cluster}',
            'topic' = '@{binlog_topic}',
            'group' = 'rocket_eps_sub_orders_de0e882d_@{dc}',
            'format' = 'binlog',
            'tag' = 'sub_orders',
            'binlog.target-table' = 'sub_orders',
            'scan.force-auto-commit-enabled' = 'true',
            'scan.startup.timestamp-millis' = '@{source_startup_timestamp}',
            'properties.request.timeout.ms' = '120000'
        );

CREATE  VIEW delta_view_sub_orders_binlog AS
SELECT  IF (binlog_body.event_type <> 'DELETE', `id`.after_value, `id`.before_value) AS `id`,
        ...
        IF (binlog_body.event_type = 'DELETE', 1, 0) AS _delete,
        binlog_header.`timestamp` AS binlog_generated_time,
        CAST(
            REPLACE(
                binlog_header.props[2].`value`,
                'mysql-bin.',
                ''
            ) AS BIGINT
        ) AS binlog_file_index,
        CAST(binlog_header.props[3].`value` AS BIGINT) AS binlog_offset,
        nanoTime() AS process_nano_time
FROM    sub_orders_binlog_source
WHERE   binlog_body.event_type IN ('INSERT', 'UPDATE', 'DELETE')

CREATE  VIEW sub_orders AS
SELECT  *
FROM    (
         -- * 包含 process_nano_time，row_number() Top1 优化对于 SELECT 字段内容完全一样的会过滤
         -- 这里用 * 就包含了 process_nano_time, 不触发该优化
         SELECT  *,
                 row_number() OVER(
                     PARTITION BY
                             id
                     ORDER BY
                             binlog_generated_time DESC,
                             binlog_file_index DESC,
                             binlog_offset DESC
                 ) AS rn
         FROM    sub_orders_hybrid
        ) AS temp
WHERE
     -- 触发消息回撤
     rn = 1
AND  _delete <> 1;

-- 定义一张 Redis 维表
CREATE  TABLE account_dim (
            id VARCHAR, -- redis key
            info MAP<VARCHAR, VARCHAR> -- redis hash
        )
        WITH (
            -- 'lookup.cache.max-rows' = '20000',
            -- 'lookup.cache.ttl' = '10000' -- 缓存 10s
            'connector' = 'redis',
            'cluster' = '@{redis_sink}',
            'value-type' = 'hash'
        );

-- 维表 JOIN
CREATE  VIEW sub_orders_detail AS
SELECT  sub_orders.*,
        account.info
FROM    (
            SELECT  *,
                    PROCTIME() AS proc -- 当前处理时间
            FROM    deduped_sub_orders_hybrid
        ) AS sub_orders
LEFT JOIN
        account_dim FOR SYSTEM_TIME AS OF sub_orders.proc AS account
ON      sub_orders.owner_id = account.id;
```