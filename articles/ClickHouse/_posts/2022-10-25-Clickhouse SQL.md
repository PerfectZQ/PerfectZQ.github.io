---
layout: post title: ClickHouse SQL tag:  ClickHouse
---

## Reference

* [window-functions](https://clickhouse.com/docs/en/sql-reference/window-functions/)
* [ClickHouse 开窗函数](https://blog.csdn.net/liuyingying0418/article/details/120269624)
* [开窗函数之 first_value 和 last_value](https://blog.csdn.net/anyitian/article/details/117067098)

## 开窗函数
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