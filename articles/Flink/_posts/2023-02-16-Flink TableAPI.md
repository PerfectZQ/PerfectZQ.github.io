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

下游存储不支持 Retract 的情况
```
-- *******************************************************
-- 请输入SQL模板，利用@{参数}定义模板的输入参数，使用示例如下：
-- select @{type1}, @{type2} from @{tablename}...
-- *******************************************************
CREATE  FUNCTION nanoTime AS 'com.xxxx.data.bp.udf.bsu.udf.stream.NanoTime';

CREATE  TABLE origin_eps_bill_detail (
            id                        BIGINT, --id 
            tm_id                     BIGINT,
            bill_detail_id            VARCHAR, --账单明细ID 
            bill_id                   VARCHAR, --账单ID 
            bill_type                 VARCHAR, --账单类型 
            sub_bill_type             VARCHAR, --sub_bill_type 
            `period`                  TINYINT, --结算周期 
            account_id                BIGINT, --账号ID 
            ......
        )
        WITH (
            'scan.startup.mode' = 'timestamp',
            'connector' = 'kafka-0.10',
            'properties.cluster' = '@{bmq_cluster}',
            'topic' = '@{source_bmq_topic}',
            'properties.group.id' = 'job_eps_dwm_trade_bc_bill_instance_detail_rf_8106ece3_@{dc}',
            'parallelism' = '20',
            'format' = 'json',
            'scan.partition-fields' = 'bill_owner_id,id',
            'scan.manually-commit-offsets-interval' = '5000ms',
            'scan.startup.timestamp-millis' = '@{source_startup_timestamp}'
        );

CREATE  VIEW bill_detail AS
SELECT  *
FROM    (
            SELECT  id,
                    tm_id,
                    bill_detail_id,
                    bill_id,
                    bill_type,
                    sub_bill_type,
                    `period`,
                    account_id,
                    .....
                    ROW_NUMBER() OVER(
                        PARTITION BY
                                bill_owner_id,
                                bill_id,
                                id
                        ORDER BY
                                process_nano_time DESC
                    ) AS rn
            FROM    origin_eps_bill_detail
        )
WHERE   rn = 1;

CREATE  TABLE sink_kafka_eps_instance_detail (
            unique_id                    VARCHAR,
            id                           BIGINT,
            accounting_period            VARCHAR,
            biz_period                   VARCHAR,
            .....
            -- 联合唯一键(需要保证每一个字段不存在 null 数据)，这里主要是为了服务参数 'sink.delete-normalizer' = 'null_for_non_primary_fields'，
            -- 当上游发生 retract 消息时，由于 BMQ 没有实现 retract 流导致回撤无法下发到下游依赖任务，这个参数的解决方案会将所有非 primary 字段置为
            -- null，以此来透传回撤消息。但下游 CH 表中有很多非 Nullable 类型的字段，需要保证数据不能为 null，这里主要是主键/排序/分区键，其他非 Nullable
            -- 字段在下游任务里面会做默认值处理，因此这里虽然 unique_id 已经可以判读唯一，但仍然需要加上下游不准为空的字段，以防止 sink.delete-normalizer 
            -- 错误的将字段置为 null 
            -- 下游消费 BMQ 数据时消费到 null 数据主动设置 is_deleted = 1，感知回撤消息
            PRIMARY                      KEY (
                unique_id,
                id,
                accounting_period,
                bill_owner_id
            ) NOT ENFORCED
        )
        WITH (
            'json.timestamp-format.standard' = 'RFC_3339',
            'connector' = 'kafka-0.10',
            'properties.cluster' = '@{bmq_cluster}',
            'topic' = '@{sink_bmq_topic}',
            -- https://stackoverflow.com/questions/49802686/understanding-the-max-inflight-property-of-kafka-producer
            -- https://medium.com/@felipedutratine/kafka-ordering-guarantees-99320db8f87f
            'properties.max.in.flight.requests.per.connection' = '1',
            'format' = 'json',
            'scan.manually-commit-offsets-interval' = '5000ms',
            'sink.delete-normalizer' = 'null_for_non_primary_fields',
            'sink.partition-fields' = 'bill_owner_id',
            'sink.partitioner' = 'row-fields-hash'
        );

INSERT INTO sink_kafka_eps_instance_detail
SELECT  CONCAT_WS(
            '_',
            COALESCE(CAST(accounting_period AS VARCHAR), ''),
            .....
        ) AS unique_id,
        MAX(id) AS id,
        accounting_period,
        biz_period,
        expense_begin_date,
        expense_begin_time,
        expense_end_time,
        account_id,
        ....
        SUM(original_bill_amount) AS sum_original_bill_amount,
        ....
        0 AS is_deleted,
        UNIX_TIMESTAMP() as process_time,
        SUM(credit_carried_amount) as sum_credit_carried_amount,
        MAX(product_form) AS max_product_form,
        MIN(product_form) AS min_product_form
FROM    bill_detail
WHERE   display_status = 1 and is_deleted <> 1
GROUP BY
        accounting_period,
        biz_period,
        payer_id,
        account_id,
        .....
```