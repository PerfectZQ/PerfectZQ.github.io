---
layout: post
title: ClickHouse Basic
tag:  ClickHouse
---

## Install Command-line Client
* [Install ClickHouse](https://clickhouse.tech/docs/en/getting-started/install/)
* [Command-line Client](https://clickhouse.tech/docs/en/interfaces/cli/)

```shell
$ sudo apt-get install apt-transport-https ca-certificates dirmngr
$ sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv E0C56BD4

$ echo "deb https://repo.clickhouse.tech/deb/stable/ main/" | sudo tee \
    /etc/apt/sources.list.d/clickhouse.list
$ sudo apt-get update

$ sudo apt-get install -y clickhouse-server clickhouse-client

$ sudo service clickhouse-server start
$ clickhouse-client
```


## External Data
* [External Data for Query Processing](https://clickhouse.tech/docs/en/engines/table-engines/special/external-data/)
ClickHouse 可以在查询(External tables could be sent only with select query)的时候加载外部数据，例如使用 Command-line Client 的时候可以使用如下参数

```shell
$ clickhouse-client --help
...
External tables options:
  --file arg                   data file or - for stdin
  --name arg (=_data)          name of the table
  --format arg (=TabSeparated) data format
  --structure arg              structure
  --types arg                  types

# Usage
# --external    Marks the beginning of a clause.
# -–file        Path to the file with the table dump, or `-`, which refers to stdin. Only a single table can be retrieved from stdin.
# 以下的参数是可选的
# –-name        Name of the table. If omitted, `_data` is used. (Optional)
# –-format      Data format in the file. If omitted, `TabSeparated` is used. (Optional)
# 下面两个参数必须指定一个
# -–types       A list of comma-separated column types. For example: UInt64,String. The columns will be named _1, _2, …
# -–structure   The table structure in the formatUserID UInt64, URL String. Defines the column names and types.
$ clickhouse-client \
--external --file=... [--name=...] [--format=...] [--types=...|--structure=...]

# examples

$ clickhouse-client --host 172.16.105.16 --port 31234 \
--user admin --password Dlink@2020 \
--query "SELECT * FROM external_lineorder" \
--external \
--file=lineorder.tbl \
--name=external_lineorder \
–-format=CSV \
--structure="LO_ORDERKEY UInt32, LO_LINENUMBER UInt8, LO_CUSTKEY UInt32, LO_PARTKEY UInt32, LO_SUPPKEY UInt32, LO_ORDERDATE Date, LO_ORDERPRIORITY LowCardinality(String), LO_SHIPPRIORITY UInt8, LO_QUANTITY UInt8, LO_EXTENDEDPRICE UInt32, LO_ORDTOTALPRICE UInt32, LO_DISCOUNT UInt8, LO_REVENUE UInt32, LO_SUPPLYCOST UInt32, LO_TAX UInt8, LO_COMMITDATE Date, LO_SHIPMODE LowCardinality(String)"
```

> 对于`--format`,详细的可以参考[Formats for Input and Output Data](https://clickhouse.tech/docs/en/interfaces/formats/)