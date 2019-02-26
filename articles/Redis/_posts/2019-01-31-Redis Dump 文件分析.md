---
layout: post
title: Redis Dump 文件分析
tag: Redis
---

## download
rdb 文件分析工具[redis-db-tools](https://github.com/sripathikrishnan/redis-rdb-tools)

页面管理工具，免费版本的功能会有所限制[manager-tools-gui](https://rdbtools.com)

```shell
$ wget -O rdbtools "https://binaries.rdbtools.com/v0.9.33/rdbtools-linux64-v0.9.33" \
    && sudo mv ./rdbtools /usr/local/bin/ \
    && sudo chmod +x /usr/local/bin/rdbtools

$ rdbtools
```

## install
```shell
$ cd redis-rdb-tools
$ sudo python setup.py install
```

## analyser
```shell
# dump 文件转储为 json 文件
$ rdb --command json /var/redis/6379/dump.rdb

# 生成内存快照的
$ 
```