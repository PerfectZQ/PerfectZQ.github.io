---
layout: post 
title: ClickHouse SQL 
tag:  ClickHouse
---

## Reference

* [window-functions](https://clickhouse.com/docs/en/sql-reference/window-functions/)
* [ClickHouse 开窗函数](https://blog.csdn.net/liuyingying0418/article/details/120269624)
* [开窗函数之 first_value 和 last_value](https://blog.csdn.net/anyitian/article/details/117067098)


## Window Functions
### row_number
```sql
-- 线索转化情况
select  field_name,
        count(distinct sf_id) as num
from    (
            select  sf_id,
                    field_name,
                    before_value,
                    after_value,
                    modified_time,
                    -- row_number() 可以不指定窗口范围
                    row_number() over w as row_id
            from    eps_clickhouse.app_cloud_lead_modification_history_rt
            where   field_name in (
                                   'converted_opportunity_id', -- 商机
                                   'converted_account_id', -- 客户
                                   'converted_contact_id' -- 联系人
                    )
            and     modified_time between 1666000000 and 1666181576
            and     after_value is not null
            window  w as (
                partition by
                    sf_id, field_name
                order by
                    modified_time desc
                rows    between unbounded preceding and unbounded following
            
        )
where   row_id = 1
and     after_value != '' -- 不为空值代表有转换商机/客户/联系人
group by
    field_name;
```

### first_value
```sql
-- 有效线索变化情况
select  count(
            distinct if(
                -- 最早一条记录的原始值不属于有效线索
                first_before_value not in (
                                           'Transfer Account', --  转出客户
                                           'Transfer Contact', -- 转出联系人
                                           'Transfer Opportunities', -- 转出商机
                                           'General Lead', -- 一般线索
                                           'Lead Nurture', -- 线索培育
                                           'Insufficient Budget' -- 费用不足
                )
                -- 最新一条记录的变更值属于有效线索
                and last_after_value in (
                                         'Transfer Account', --  转出客户
                                         'Transfer Contact', -- 转出联系人
                                         'Transfer Opportunities', -- 转出商机
                                         'General Lead', -- 一般线索
                                         'Lead Nurture', -- 线索培育
                                         'Insufficient Budget' -- 费用不足
                ),
                sf_id,
                null
            )
        ) as effect_lead_increment, -- 有效线索增加
        count(
            distinct if(
                -- 最早一条记录的原始值属于有效线索
                first_before_value in (
                                       'Transfer Account', --  转出客户
                                       'Transfer Contact', -- 转出联系人
                                       'Transfer Opportunities', -- 转出商机
                                       'General Lead', -- 一般线索
                                       'Lead Nurture', -- 线索培育
                                       'Insufficient Budget' -- 费用不足
                )
                -- 最新一条记录的变更值不属于有效线索
                and last_after_value in (
                                         'Transfer Account', --  转出客户
                                         'Transfer Contact', -- 转出联系人
                                         'Transfer Opportunities', -- 转出商机
                                         'General Lead', -- 一般线索
                                         'Lead Nurture', -- 线索培育
                                         'Insufficient Budget' -- 费用不足
                ),
                sf_id,
                null
            )
        ) as effect_lead_reduce -- 有效线索减少
from    (
            select  sf_id,
                    -- first_value() & last_value() 开窗必须指定 rows 窗口范围，否则返回的是当前的值 
                    first_value(before_value) over w as first_before_value, --最早一条记录的原始值
                    last_value(after_value) over w as last_after_value -- 最新一条记录的变更值
            from    eps_clickhouse.app_cloud_lead_modification_history_rt
            where   field_name in ('lead_follow_up_status')
            and     modified_time between 1666000000 and 1666181576
            window  w as (
                partition by
                    sf_id
                order by
                    modified_time asc
                rows    between unbounded preceding and unbounded following
            )
        );
```

## ClickHouse Join 查询模型原理
[Colocate Join: ClickHouse的一种高性能分布式join查询模型](https://www.cnblogs.com/huaweiyun/p/16572471.html)

## SQL Optimization
### distributed_product_mode
[distributed_product_mode](https://clickhouse.com/docs/en/operations/settings/settings#distributed-product-mode)，适用于分布式表 IN/JOIN 子查询，优化效果很好，取消数据的 shuffle 的网络 IO 开销

参数使用限制
* 仅适用于 IN/JOIN 的子查询语句
* 仅适用当主 FROM 表是包含 1 个分片以上的分布式表
* 如果涉及的子查询表是包含 1 个分片上分布式表(不然没啥效果)
* 不能用于 table-valued 远程函数(Not used for a table-valued [remote](https://clickhouse.com/docs/en/sql-reference/table-functions/remote) function.)

可选参数值
* `deny` — 默认值，禁止使用两个分布式表 IN/JOIN 类型的子查询 (返回 `Double-distributed in/JOIN subqueries is denied` 异常)
* `local` — 将子查询中的分布式数据库和表替换成远程分片的本地数据库和表，只在每个远程节点本地进行 IN/JOIN 计算(Normal IN/JOIN)。**`Colocate/Local Join`需要分片键保证参与 JOIN 的数据都分布在一个 Shard 节点上才可以，否则会得出错误的结果。例如涉及 JOIN 的几张表都按 bill_owner_id 作为分片键存储，IN/JOIN 条件包含 bill_owner_id 字段，保证相关联的两条数据都在一个节点上，就可以进行本地计算**
* `global` — 将 IN/JOIN 替换成 `GLOBAL IN` 或 `GLOBAL JOIN`
* `allow` — 允许使用这些类型的子查询

```sql
-- 常规分页查询实现，查询耗时 30s+ (涉及全部数据排序，并且分组聚合计算字段很多，大概几十个...)
select  accounting_period,
        owner_id,
        sum(original_bill_amount) as original_bill_amount,
        ......
from    eps_data_bc.app_trade_bc_bill_charge_item_daily_rf as main
where   biz_period >= '2008-01-01 00:00:00'
......
group by
        accounting_period,
        owner_id
        ......
having  original_bill_amount != 0
order by
        accounting_period desc,
        ......
limit   10, 20 
SETTINGS enable_optimize_predicate_expression = 0, 
prefer_localhost_replica = 0;


-- 优化方案1，测试：耗时6s-12s
select  main.accounting_period,
        main.owner_id,
        sum(original_bill_amount) as original_bill_amount,
        ......
from    eps_data_bc.app_trade_bc_bill_charge_item_daily_rf as main
-- 这里换成 global join 优先级更高，会覆盖 distributed_product_mode 参数配置
join    (
            select  accounting_period,
                    owner_id,
                    ......
            from    eps_data_bc.app_trade_bc_bill_charge_item_daily_rf
            where   biz_period >= '2008-01-01 00:00:00'
            ......
            group by
                    accounting_period,
                    owner_id
                    ......
            having  sum(original_bill_amount) != 0 -- 这个条件就会增加 2-4s 的查询时长
            order by
                    accounting_period desc,
                    ......
            limit   10, 10
                    -- 这里不能开 no_merge 否则数据排序会有问题，必须全局排序，开的话就成每个节点单独排序了，会返回 50 条数据
                    SETTINGS distributed_group_by_no_merge = 0
        ) as dim
        -- 和分组字段一致，且包含分片键 owner_id
on      main.accounting_period = dim.accounting_period
and     main.owner_id = dim.owner_id
and     ......
where   main.biz_period >= '2008-01-01 00:00:00'
......
group by
        accounting_period,
        owner_id
        ......
order by
        accounting_period desc,
        ......
SETTINGS
        -- 这里分布式子查询必须是 `global` 不然，每个节点的 10，10 数据返回不一样
        -- `global` — Replaces the IN/JOIN query with GLOBAL IN/GLOBAL JOIN
        -- 不写这个参数，上面用 global join 也一样，这个参数优先级不如 global join 高
        distributed_product_mode = 'global',
        -- 这里可以开启 group_by_no_merge，bill_owner_id 分片键已经限制了节点聚合数据
        -- 但整体感觉没什么用... 开不开效果一样不知道是不是继承了子查询的配置
        distributed_group_by_no_merge = 1;
        
 -- 优化方案2: 深分页场景性能不好，但浅分页很快, 2s 左右
select  accounting_period,
        owner_id,
        sum(original_bill_amount) as original_bill_amount,
        ......
from    eps_data_bc.app_trade_bc_bill_charge_item_daily_rf as main
join    (
            select  accounting_period,
                owner_id,
                ......
            from    eps_data_bc.app_trade_bc_bill_charge_item_daily_rf
            where   biz_period >= '2008-01-01 00:00:00'
            ......
            group by
                accounting_period,
                owner_id
                ......
            having  sum(original_bill_amount) != 0
            order by
                accounting_period desc,
                ......           
            -- 取第 10-20 条时，也把每个节点的 0-20 条全部查出来排序，保证数据全局有序
            -- Offset 永远是 0，类似 ES 的分页查询，但会随着分页的增加，这里需要查询排序的数据会越来越大
            limit   0, 20 
        ) as dim
on      main.accounting_period = dim.accounting_period
and     main.owner_id = dim.owner_id
and     ......
group by
        accounting_period,
        owner_id
        ......
order by
        accounting_period desc,
        ......
limit   10, 10 SETTINGS
        -- 1. Only applied for IN and JOIN subqueries.
        -- 2. Only if the FROM section uses a distributed table containing more than one shard.
        -- Join 只做本地节点的关联聚合，不做全局的关联聚合，需要保证相关联的数据在分布在一个节点上
        distributed_product_mode = 'local', prefer_localhost_replica = 0;
```

### IN 子查询优化
```sql
-- 用 IN 子查询（排序键）加速查询
select  id,
        toYYYYMM(accounting_period) as accounting_period_alias,
        bill_id,
        payer_id,
        seller_id,
        owner_id,
        account_id,
        business_mode,
        expense_begin_time,
        expense_end_time,
        product,
        billing_mode,
        bill_category,
        instance_no,
        instance_name,
        bill_type,
        sub_bill_type,
        bill_category_parent,
        settlement_type,
        data_display_rule
from    data_bc_lf.app_trade_bc_bill_rf
where
        accounting_period = '2023-05-01'
and     bill_owner_id = 2100215562
and     uid in (
            select  uid -- 其中 uid 为排序键
            from    data_bc_lf.app_trade_bc_bill_rf
            where   accounting_period = '2023-05-01'
            and     bill_owner_id = 2100215562
            and     bill_type = 'normal'
            and     subject_no in ('3423', '2065')
            and     data_display_rule in ('2', '3')
            order by
            expense_begin_time desc,
            uid
            limit   1000, 10
        ) SETTINGS enable_optimize_predicate_expression = 0, max_threads = 80, distributed_group_by_no_merge = 1, prefer_localhost_replica = 0
        if bill_owner_id is not empty
        , distributed_product_mode = 'local'
```