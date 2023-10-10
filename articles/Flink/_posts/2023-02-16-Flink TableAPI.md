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

## 多流 Join
```
CREATE  FUNCTION TIMESTAMP_TO_LONG AS 'com.xxxxdance.flink.udf.udf.time.TimestampToLong';

CREATE  FUNCTION EPS_MAP_TO_JSON AS 'com.xxxxdance.eps.flink.udf.MapToJson';

CREATE  FUNCTION nanoTime AS 'com.xxxxdance.data.bp.udf.bsu.udf.stream.NanoTime';

---------------------------------------------------------------------------------
--------------------------- Hybrid Source Definations ---------------------------
---------------------------------------------------------------------------------
......
CREATE  VIEW delta_view_partner_passport_grant_his_hive AS
SELECT  CAST(`id` AS BIGINT) AS `id`, -- 'ID'
        CAST(`passport_id` AS VARCHAR) AS `passport_id`, -- '伙伴账号'
        CAST(`partner_type` AS TINYINT) AS `partner_type`, -- '伙伴类型'
        CAST(`grant_type` AS INT) AS `grant_type`, -- '授权类型'
        CAST(`effect_time` AS BIGINT) AS `effect_time`, -- '起始时间'
        CAST(`expire_time` AS BIGINT) AS `expire_time`, -- '失效时间'
        CAST(`created_time` AS BIGINT) AS `created_time`, -- '创建时间'
        CAST(`updated_time` AS BIGINT) AS `updated_time`, -- '更新时间'
        CAST(`status` AS TINYINT) AS `status`, -- '状态'
        0 AS _delete,
        CAST(0 AS BIGINT) AS process_nano_time
FROM    hive.@{hive_db}.@{hive_partner_passport_grant_his_table}
WHERE   `date` = '@{hive_date}';

CREATE  VIEW delta_view_partner_passport_grant_his_binlog AS
SELECT  IF (binlog_body.event_type <> 'DELETE', `id`.after_value, `id`.before_value) AS `id`,
        IF (
            binlog_body.event_type <> 'DELETE',
            `passport_id`.after_value,
            `passport_id`.before_value
        ) AS `passport_id`,
        IF (
            binlog_body.event_type <> 'DELETE',
            `partner_type`.after_value,
            `partner_type`.before_value
        ) AS `partner_type`,
        IF (
            binlog_body.event_type <> 'DELETE',
            `grant_type`.after_value,
            `grant_type`.before_value
        ) AS `grant_type`,
        TIMESTAMP_TO_LONG(
            IF (
                binlog_body.event_type <> 'DELETE',
                `effect_time`.after_value,
                `effect_time`.before_value
            )
        ) / 1000 AS `effect_time`,
        TIMESTAMP_TO_LONG(
            IF (
                binlog_body.event_type <> 'DELETE',
                `expire_time`.after_value,
                `expire_time`.before_value
            )
        ) / 1000 AS `expire_time`,
        TIMESTAMP_TO_LONG(
            IF (
                binlog_body.event_type <> 'DELETE',
                `created_time`.after_value,
                `created_time`.before_value
            )
        ) / 1000 AS `created_time`,
        TIMESTAMP_TO_LONG(
            IF (
                binlog_body.event_type <> 'DELETE',
                `updated_time`.after_value,
                `updated_time`.before_value
            )
        ) / 1000 AS `updated_time`,
        IF (
            binlog_body.event_type <> 'DELETE',
            `status`.after_value,
            `status`.before_value
        ) AS `status`,
        IF (binlog_body.event_type = 'DELETE', 1, 0) AS _delete,
        nanoTime() AS process_nano_time
FROM    partner_passport_grant_his_binlog_source
WHERE   binlog_body.event_type IN ('INSERT', 'UPDATE', 'DELETE');

CREATE  hybrid source partner_passport_grant_his_hybrid AS delta_view_partner_passport_grant_his_binlog
AND     delta_view_partner_passport_grant_his_hive;

CREATE  VIEW deduplicated_partner_passport_grant_his_hybrid AS
SELECT  *
FROM    (
            -- * 包含 process_nano_time，row_number() Top1 优化对于 SELECT 字段内容完全一样的会过滤
            -- 这里用 * 就包含了 process_nano_time, 不触发该优化
            SELECT  *,
                    row_number() OVER(
                        PARTITION BY
                                id
                        ORDER BY
                                process_nano_time DESC
                    ) AS rn
            FROM    partner_passport_grant_his_hybrid
        ) AS temp
WHERE
        -- 触发消息回撤
        rn = 1
AND     _delete <> 1
AND     status <> 1;

---------------------------------------------------------------------------------------
------------------------------------ 业务分割线 -----------------------------------------
---------------------------------------------------------------------------------------
CREATE  TABLE redis_sink (
            customer_passport_id VARCHAR, -- Redis key_format `pch:${customer_passport_id}`
            id                   VARCHAR, -- Hash field，伙伴客户绑定关系历史记录ID，主键ID
            json_record          VARCHAR -- Hash value
        )
        WITH (
            'connector' = 'byte-redis',
            'cluster' = '@{redis_sink_cluster}',
            'value-type' = 'hash',
            'lookup.enable-input-keyby' = 'false',
            'sink.ignore-delete' = 'false'
        );

INSERT INTO redis_sink
SELECT  CONCAT_WS(':', 'pch', customer_passport_id) AS customer_passport_id,
        CAST(id AS STRING) AS id,
        EPS_MAP_TO_JSON(
            MAP [
                'pid',
                CAST(partner_id AS STRING),
                'cid',
                CAST(customer_id AS STRING),
                'ppid',
                CAST(partner_passport_id AS STRING),
                'cpid',
                CAST(customer_passport_id AS STRING),
                'cpi',
                CAST(customer_passport_identity AS STRING),
                'cvn',
                CAST(customer_verify_name AS STRING),
                'eft',
                CAST(effect_time AS STRING),
                'ext',
                CAST(expire_time AS STRING),
                'bt',
                CAST(biz_type AS STRING),
                'pc',
                CAST(partner_code AS STRING),
                'isv',
                CAST(is_same_verification AS STRING),
                'rc',
                CAST(relation_code AS STRING)
            ]
        ) AS json_record
FROM    (
            SELECT  his.id AS id, -- 伙伴-客户绑定历史关系ID
                    -- 当 Join 的关联键包含非主键字段时，字段值有可能发生变化，导致 keyby 数据分到不同的 TM 上
                    -- 变成 TM1(append1, retract1), TM2(append2) 这样有可能出现乱序问题，这里用 LAST_VALUE 检测
                    -- https://xxxxdance.xxxshu.cn/docs/doccn8EHqkbJ8ONdnte4hBYcvYe?source_type=message&from=message
                    -- https://xxxxdance.xxxshu.cn/wiki/wikcnMReawPz3qww7KzJmzdnSin
                    LAST_VALUE(partner_passport.partner_id) AS partner_id, -- 伙伴ID
                    LAST_VALUE(customer.id) AS customer_id, -- 客户ID
                    LAST_VALUE(his.account_id1) AS partner_passport_id, -- 伙伴火山账号ID
                    LAST_VALUE(customer.passport_id) AS customer_passport_id, -- 客户火山账号ID
                    LAST_VALUE(customer.passport_identity) AS customer_passport_identity, -- 客户火山账号登陆名
                    LAST_VALUE(customer.verify_name) AS customer_verify_name, -- 客户实名认证名称
                    CASE WHEN LAST_VALUE(start_time) = 0 THEN NULL ELSE LAST_VALUE(start_time) END AS effect_time, -- 伙伴-客户关系绑定生效时间
                    LAST_VALUE(his.end_time) AS expire_time, -- 伙伴-客户关系绑定失效时间
                    LAST_VALUE(partner_grant.grant_type) AS biz_type,
                    LAST_VALUE(partner_info.code) AS partner_code,
                    LAST_VALUE(customer.is_same_verification) AS is_same_verification,
                    LAST_VALUE(his.relation_code) AS relation_code
            FROM    deduplicated_partner_his_relation_hybrid AS his
            JOIN    deduplicated_customer_passport_hybrid AS customer
            ON      customer.status <> 1
            AND     customer.passport_id = his.account_id2
            JOIN    deduplicated_partner_passport_hybrid AS partner_passport
            ON      partner_passport.status <> 1
            AND     his.account_id1 = partner_passport.passport_id
            JOIN    deduplicated_partner_new_hybrid AS partner_info
            ON      partner_info.status <> 1
            AND     partner_passport.partner_id = partner_info.id
            JOIN    (
                        SELECT  passport_id AS partner_passport_id,
                                grant_type
                        FROM    deduplicated_partner_passport_grant_his_hybrid
                        GROUP BY
                                passport_id,
                                grant_type
                    ) AS partner_grant
            ON      his.account_id1 = partner_grant.partner_passport_id
                    -- 这里是确保客户绑定关系确实有对应授权类型的伙伴
                    -- 通过客户绑定关系对应的授权类型映射关系，取伙伴授权记录是否存在对应授权类型的伙伴
            AND     CASE
                         WHEN his.relation_code IN (1001, 1002) THEN 101
                         WHEN his.relation_code IN(2001, 2002) THEN 102
                         ...
                         ELSE 0
                    END = partner_grant.grant_type
            WHERE
                    his.relation_code IN (3001, 1002, 5001)
            AND     his.status <> 1
            GROUP BY
                    his.id
        );
```

## 下游存储不支持 Retract 的情况
```
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