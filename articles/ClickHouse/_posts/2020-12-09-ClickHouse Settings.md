---
layout: post
title: ClickHouse Settings
tag:  ClickHouse
---


## Settings Introduction
* [Settings Overview](https://clickhouse.com/docs/en/operations/settings)
* [Command-line Client](https://clickhouse.tech/docs/en/interfaces/cli/)

```shell
# 查看配置项
$ clickhouse-client --help
...
--max_insert_threads arg                                         The maximum number of threads to execute the INSERT SELECT query. Values 0 or 1 means that INSERT SELECT is
                                                                not run in parallel. Higher values will lead to higher memory usage. Parallel INSERT SELECT has effect only if
                                                                the SELECT part is run on parallel, see 'max_threads' setting.
--max_final_threads arg                                          The maximum number of threads to read from table with FINAL.
--max_threads arg                                                The maximum number of threads to execute the request. By default, it is determined automatically.
...

# 连接
$ clickhouse-client --user admin --password xxxxxx --host clickhouse-0 --port 9000
# 查看当前实例的配置
$ clickhouse-client --user admin --password xxxxxx \
--host clickhouse-0 --port 9000 \
--query "SELECT * FROM system.settings LIMIT 1"
...
┌─name────────────────────┬─value─┬─changed─┬─description───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┬─min──┬─max──┬─readonly─┬─type───┐
│ min_compress_block_size │ 65536 │       0 │ The actual size of the block to compress, if the uncompressed data less than max_compress_block_size is no less than this value and no less than the volume of data for one mark. │ ᴺᵁᴸᴸ │ ᴺᵁᴸᴸ │        0 │ UInt64 │
└─────────────────────────┴───────┴─────────┴───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┴──────┴──────┴──────────┴────────┘
...
# 查看当前 Session 生效的配置
$ clickhouse-client --user admin --password xxxxxx \
--host clickhouse-0 --port 9000 \
--query "SELECT getSetting('max_threads')"
4
```

## References
* [How to config Settings of ClickHouse](https://clickhouse.tech/docs/en/operations/settings/)