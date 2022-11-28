---
layout: post 
title: MySQL Index
tag: RDBMS
---

## Commands

```shell
# 创建普通索引
alter table ${table_name} add index ${index_name}(${field1}, ${field2});

# 创建唯一索引
alter table ${table_name} add unique index ${unique_index_name}(${field1}, ${field2});
# 或者
alter table ${table_name} add constraint ${unique_index_name} unique(${field1}, ${field2});
# 或者
create unique index ${unique_index_name} on ${table_name} (${field1}, ${field2});

# 删除索引
alter table ${table_name} drop index ${unique_index_name}
```