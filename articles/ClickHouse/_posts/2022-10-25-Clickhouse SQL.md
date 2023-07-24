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
[Colocate Join: ClickHouse的一种高性能分布式join查询模型](https://z.itpub.net/article/detail/1DD8359632F35B4F76EA6F08294C6D14)Ï

## SQL Optimization
### distributed_product_mode
distributed_product_mode ，适用于分布式表子查询，且有分片键保证数据可以在 Local 节点完成计算的情况，优化效果很好，减少数据的 shuffle
```sql
-- 现方案，查询耗时 30s+
select  toYYYYMM(`accounting_period`) as `accounting_period_alias`,
        toInt64(toYYYYMMDD(`expense_begin_date`) / 100) as `expense_begin_time_alias`,
        `payer_id`,
        `seller_id`,
        `owner_id`,
        `account_id`,
        `business_mode`,
        `product`,
        `billing_mode`,
        `settlement_type`,
        `bill_category`,
        `instance_no`,
        `bill_type`,
        `data_display_rule`,
        sum(`sum_original_bill_amount`) as `original_bill_amount`,
        sum(`sum_preferential_bill_amount`) as `preferential_bill_amount`,
        sum(`sum_discount_bill_amount`) as `discount_bill_amount_alias`,
        sum(`sum_coupon_deduction_amount`) as `coupon_deduction_amount`,
        sum(`sum_payable_amount`) as `payable_amount`,
        sum(`sum_paid_amount`) as `paid_amount`,
        sum(`sum_unpaid_amount`) as `unpaid_amount`,
        sum(`sum_round_amount`) as `round_amount`,
        if(max(`max_region_code`) = min(`min_region_code`), max(`max_region_code`), null) as `region_code`,
        if(
            max(`max_instance_name`) = min(`min_instance_name`),
            max(`max_instance_name`),
            null
        ) as `instance_name_alias`,
        if(max(`max_zone_code`) = min(`min_zone_code`), max(`max_zone_code`), null) as `zone_code`,
        if(max(`max_subject_no`) = min(`min_subject_no`), max(`max_subject_no`), null) as `subject_no_alias`,
        `subject_no` as `subject_no_alias_v2`,
        if(max(`max_project`) = min(`min_project`), max(`max_project`), null) as `project_alias`,
        if(max(`max_tag`) = min(`min_tag`), max(`max_tag`), null) as `tag_alias`,
        if(
            max(`max_selling_mode`) = min(`min_selling_mode`),
            max(`max_selling_mode`),
            null
        ) as `selling_mode_alias`,
        if(max(`max_solution`) = min(`min_solution`), max(`max_solution`), null) as `solution_alias`,
        if(max(`max_solution_zh`) = min(`min_solution_zh`), max(`max_solution_zh`), null) as `solution_zh_alias`,
        toYYYYMM(`biz_period`) as `biz_period_alias`
from    `eps_data_bc_hl`.`app_trade_bc_bill_charge_item_daily_rf` as `app_trade_bc_bill_charge_item_daily_rf`
where   `biz_period` >= '2008-01-01 00:00:00'
and     `accounting_period` = '2023-06-01'
and     `bill_owner_id_type` = 'account_id'
and     `bill_type` = 'normal'
and     `subject_no` in ('3423', '2065')
and     `data_display_rule` in ('2', '3')
group by
        `accounting_period`,
        `expense_begin_time_alias`,
        `payer_id`,
        `buyer_id`,
        `seller_id`,
        `owner_id`,
        `account_id`,
        `business_mode`,
        `product`,
        `billing_mode`,
        `settlement_type`,
        `bill_category`,
        `instance_no`,
        `bill_type`,
        `data_display_rule`,
        `subject_no_alias_v2`,
        `biz_period`
having  `discount_bill_amount_alias` != 0
order by
        `accounting_period` desc,
        `expense_begin_time_alias` desc,
        `payer_id`,
        `account_id`,
        `business_mode`,
        `product`,
        `billing_mode`,
        `bill_category`,
        `instance_no`,
        `bill_type`,
        `data_display_rule`
limit   10, 20 
SETTINGS enable_optimize_predicate_expression = 0, 
distributed_product_mode = 'local',
prefer_localhost_replica = 0;


-- 优化方案1，测试：耗时6s-12s
select  toYYYYMM(main.accounting_period) as accounting_period_alias,
        toInt64(toYYYYMMDD(main.expense_begin_date) / 100) as expense_begin_time_alias,
        main.payer_id,
        main.seller_id,
        main.owner_id,
        main.account_id,
        main.business_mode,
        main.product,
        main.billing_mode,
        main.settlement_type,
        main.bill_category,
        main.instance_no,
        main.bill_type,
        main.data_display_rule,
        sum(sum_original_bill_amount) as original_bill_amount,
        sum(sum_preferential_bill_amount) as preferential_bill_amount,
        sum(sum_discount_bill_amount) as discount_bill_amount_alias,
        sum(sum_coupon_deduction_amount) as coupon_deduction_amount,
        sum(sum_payable_amount) as payable_amount,
        sum(sum_paid_amount) as paid_amount,
        sum(sum_unpaid_amount) as unpaid_amount,
        sum(sum_round_amount) as round_amount,
        if(max(max_region_code) = min(min_region_code), max(max_region_code), null) as region_code,
        if(
            max(max_instance_name) = min(min_instance_name),
            max(max_instance_name),
            null
        ) as instance_name_alias,
        if(max(max_zone_code) = min(min_zone_code), max(max_zone_code), null) as zone_code,
        if(max(max_subject_no) = min(min_subject_no), max(max_subject_no), null) as subject_no_alias,
        subject_no as subject_no_alias_v2,
        if(max(max_project) = min(min_project), max(max_project), null) as project_alias,
        if(max(max_tag) = min(min_tag), max(max_tag), null) as tag_alias,
        if(
            max(max_selling_mode) = min(min_selling_mode),
            max(max_selling_mode),
            null
        ) as selling_mode_alias,
        if(max(max_solution) = min(min_solution), max(max_solution), null) as solution_alias,
        if(max(max_solution_zh) = min(min_solution_zh), max(max_solution_zh), null) as solution_zh_alias,
        toYYYYMM(biz_period) as biz_period_alias
from    eps_data_bc_hl.app_trade_bc_bill_charge_item_daily_rf as main
-- 这里写 global join 优先级更高
join    (
            select  accounting_period,
                    toInt64(toYYYYMMDD(expense_begin_date) / 100) as expense_begin_time_alias,
                    payer_id,
                    buyer_id,
                    seller_id,
                    owner_id,
                    account_id,
                    business_mode,
                    product,
                    billing_mode,
                    settlement_type,
                    bill_category,
                    instance_no,
                    bill_type,
                    data_display_rule,
                    subject_no,
                    biz_period
            from    eps_data_bc_hl.app_trade_bc_bill_charge_item_daily_rf as app_trade_bc_bill_charge_item_daily_rf
            where   biz_period >= '2008-01-01 00:00:00'
            and     accounting_period = '2023-06-01'
            and     bill_owner_id_type = 'account_id'
            and     bill_type = 'normal'
            and     subject_no in ('3423', '2065')
            and     data_display_rule in ('2', '3')
            group by
                    accounting_period,
                    toInt64(toYYYYMMDD(expense_begin_date) / 100),
                    payer_id,
                    buyer_id,
                    seller_id,
                    owner_id,
                    account_id,
                    business_mode,
                    product,
                    billing_mode,
                    settlement_type,
                    bill_category,
                    instance_no,
                    bill_type,
                    data_display_rule,
                    subject_no,
                    biz_period
            having  sum(sum_discount_bill_amount) != 0
            order by
                    accounting_period desc,
                    toInt64(toYYYYMMDD(expense_begin_date) / 100) desc,
                    payer_id,
                    account_id,
                    business_mode,
                    product,
                    billing_mode,
                    bill_category,
                    instance_no,
                    bill_type,
                    data_display_rule
            limit   10, 10
                    -- 这里不能开 no_merge 否则数据排序会有问题，必须全局排序
                    SETTINGS distributed_group_by_no_merge = 0
        ) as dim
on      main.accounting_period = dim.accounting_period
and     toInt64(toYYYYMMDD(main.expense_begin_date) / 100) = dim.expense_begin_time_alias
and     main.payer_id = dim.payer_id
and     main.buyer_id = dim.buyer_id
and     main.seller_id = dim.seller_id
and     main.owner_id = dim.owner_id
and     main.account_id = dim.account_id
and     main.business_mode = dim.business_mode
and     main.product = dim.product
and     main.billing_mode = dim.billing_mode
and     main.settlement_type = dim.settlement_type
and     main.bill_category = dim.bill_category
and     main.instance_no = dim.instance_no
and     main.bill_type = dim.bill_type
and     main.data_display_rule = dim.data_display_rule
and     main.subject_no = dim.subject_no
and     main.biz_period = dim.biz_period
where   main.biz_period >= '2008-01-01 00:00:00'
and     main.accounting_period = '2023-06-01'
and     main.bill_owner_id_type = 'account_id'
and     main.bill_type = 'normal'
and     main.subject_no in ('3423', '2065')
and     main.data_display_rule in ('2', '3')
group by
        accounting_period,
        expense_begin_time_alias,
        payer_id,
        buyer_id,
        seller_id,
        owner_id,
        account_id,
        business_mode,
        product,
        billing_mode,
        settlement_type,
        bill_category,
        instance_no,
        bill_type,
        data_display_rule,
        subject_no_alias_v2,
        biz_period
order by
        `accounting_period` desc,
        `expense_begin_time_alias` desc,
        `payer_id`,
        `account_id`,
        `business_mode`,
        `product`,
        `billing_mode`,
        `bill_category`,
        `instance_no`,
        `bill_type`,
        `data_display_rule` SETTINGS enable_optimize_predicate_expression = 0,
        -- 这里分布式子查询必须是 `global` 不然，每个节点的 10，10 数据返回不一样
        -- `global` — Replaces the IN/JOIN query with GLOBAL IN/GLOBAL JOIN
        -- 不写这个参数，上面用 global join 也一样，这个参数优先级不如 global join 高
        distributed_product_mode = 'global',
        -- 这里可以开启 group_by_no_merge，bill_owner_id 分片键已经限制了节点聚合数据
        -- 但整体感觉没什么用... 开不开效果一样不知道是不是继承了子查询的配置
        distributed_group_by_no_merge = 1,
        prefer_localhost_replica = 0;
        
 -- 优化方案2: 深分页场景性能不好，但浅分页很快, 2s 左右
 select  toYYYYMM(main.accounting_period) as accounting_period_alias,
        toInt64(toYYYYMMDD(main.expense_begin_date) / 100) as expense_begin_time_alias,
        main.payer_id,
        main.seller_id,
        main.owner_id,
        main.account_id,
        main.business_mode,
        main.product,
        main.billing_mode,
        main.settlement_type,
        main.bill_category,
        main.instance_no,
        main.bill_type,
        main.data_display_rule,
        sum(sum_original_bill_amount) as original_bill_amount,
        sum(sum_preferential_bill_amount) as preferential_bill_amount,
        sum(sum_discount_bill_amount) as discount_bill_amount_alias,
        sum(sum_coupon_deduction_amount) as coupon_deduction_amount,
        sum(sum_payable_amount) as payable_amount,
        sum(sum_paid_amount) as paid_amount,
        sum(sum_unpaid_amount) as unpaid_amount,
        sum(sum_round_amount) as round_amount,
        if(max(max_region_code) = min(min_region_code), max(max_region_code), null) as region_code,
        if(
            max(max_instance_name) = min(min_instance_name),
            max(max_instance_name),
            null
        ) as instance_name_alias,
        if(max(max_zone_code) = min(min_zone_code), max(max_zone_code), null) as zone_code,
        if(max(max_subject_no) = min(min_subject_no), max(max_subject_no), null) as subject_no_alias,
        subject_no as subject_no_alias_v2,
        if(max(max_project) = min(min_project), max(max_project), null) as project_alias,
        if(max(max_tag) = min(min_tag), max(max_tag), null) as tag_alias,
        if(
            max(max_selling_mode) = min(min_selling_mode),
            max(max_selling_mode),
            null
        ) as selling_mode_alias,
        if(max(max_solution) = min(min_solution), max(max_solution), null) as solution_alias,
        if(max(max_solution_zh) = min(min_solution_zh), max(max_solution_zh), null) as solution_zh_alias,
        toYYYYMM(biz_period) as biz_period_alias
from    eps_data_bc_hl.app_trade_bc_bill_charge_item_daily_rf as main
join    (
            select  accounting_period,
                    toInt64(toYYYYMMDD(expense_begin_date) / 100) as expense_begin_time_alias,
                    payer_id,
                    buyer_id,
                    seller_id,
                    owner_id,
                    account_id,
                    business_mode,
                    product,
                    billing_mode,
                    settlement_type,
                    bill_category,
                    instance_no,
                    bill_type,
                    data_display_rule,
                    subject_no,
                    biz_period
            from    eps_data_bc_hl.app_trade_bc_bill_charge_item_daily_rf as app_trade_bc_bill_charge_item_daily_rf
            where   biz_period >= '2008-01-01 00:00:00'
            and     accounting_period = '2023-06-01'
            and     bill_owner_id_type = 'account_id'
            and     bill_type = 'normal'
            and     subject_no in ('3423', '2065')
            and     data_display_rule in ('2', '3')
            group by
                    accounting_period,
                    toInt64(toYYYYMMDD(expense_begin_date) / 100),
                    payer_id,
                    buyer_id,
                    seller_id,
                    owner_id,
                    account_id,
                    business_mode,
                    product,
                    billing_mode,
                    settlement_type,
                    bill_category,
                    instance_no,
                    bill_type,
                    data_display_rule,
                    subject_no,
                    biz_period
            having  sum(sum_discount_bill_amount) != 0
            order by
                    accounting_period desc,
                    toInt64(toYYYYMMDD(expense_begin_date) / 100) desc,
                    payer_id,
                    account_id,
                    business_mode,
                    product,
                    billing_mode,
                    bill_category,
                    instance_no,
                    bill_type,
                    data_display_rule
            -- 取第 10-20 条时，也把每个节点的 0-20 条全部查出来排序，保证数据全局有序
            -- Offset 永远是 0， 类似 ES 的分页查询
            limit   0, 20 
        ) as dim
on      main.accounting_period = dim.accounting_period
and     toInt64(toYYYYMMDD(main.expense_begin_date) / 100) = dim.expense_begin_time_alias
and     main.payer_id = dim.payer_id
and     main.buyer_id = dim.buyer_id
and     main.seller_id = dim.seller_id
and     main.owner_id = dim.owner_id
and     main.account_id = dim.account_id
and     main.business_mode = dim.business_mode
and     main.product = dim.product
and     main.billing_mode = dim.billing_mode
and     main.settlement_type = dim.settlement_type
and     main.bill_category = dim.bill_category
and     main.instance_no = dim.instance_no
and     main.bill_type = dim.bill_type
and     main.data_display_rule = dim.data_display_rule
and     main.subject_no = dim.subject_no
and     main.biz_period = dim.biz_period
where   main.biz_period >= '2008-01-01 00:00:00'
and     main.accounting_period = '2023-06-01'
and     main.bill_owner_id_type = 'account_id'
and     main.bill_type = 'normal'
and     main.subject_no in ('3423', '2065')
and     main.data_display_rule in ('2', '3')
group by
        accounting_period,
        expense_begin_time_alias,
        payer_id,
        buyer_id,
        seller_id,
        owner_id,
        account_id,
        business_mode,
        product,
        billing_mode,
        settlement_type,
        bill_category,
        instance_no,
        bill_type,
        data_display_rule,
        subject_no_alias_v2,
        biz_period
order by
        `accounting_period` desc,
        `expense_begin_time_alias` desc,
        `payer_id`,
        `account_id`,
        `business_mode`,
        `product`,
        `billing_mode`,
        `bill_category`,
        `instance_no`,
        `bill_type`,
        `data_display_rule`
limit   10, 10 SETTINGS enable_optimize_predicate_expression = 0,
        -- Only applied for IN and JOIN subqueries.
        -- Only if the FROM section uses a distributed table containing more than one shard.
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