---
layout: post title: MySQL Index tag: RDBMS
---

## Commands

```shell
# 创建唯一索引
alter table ${table_name} add constranit ${unique_index_name} unique(${field1}, ${field2})

# 删除索引
alter table ${table_name} drop index ${unique_index_name}
```