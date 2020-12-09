---
layout: post
title: ClickHouse Exceptions
tag:  ClickHouse
---

## 写入数据丢失
### 问题
压测时，向 ClickHouse 写入 1000W 条相同的数据，查询总数时总是缺少 10% 左右的数据

### Reference
* [ClickHouse 插入数据成功但是没有数据的问题](https://blog.csdn.net/cwg_1992/article/details/100691109)
