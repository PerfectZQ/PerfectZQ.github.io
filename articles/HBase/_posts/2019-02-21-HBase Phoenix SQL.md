---
layout: post
title: HBase Phoenix SQL
tag: HBase
---

## HDP 开启 Phoenix
`HBase`->`Configs`->`Phoenix SQL`->`Enable Phoenix`

建议修改配置项
```shell
# hbase regionserver wal 编码，默认 org.apache.hadoop.hbase.regionserver.wal.WALCellCodec
hbase.regionserver.wal.codec = org.apache.hadoop.hbase.regionserver.wal.IndexedWALEditCodec
# 允许使用 UDF
phoenix.functions.allowUserDefinedFunctions = true
hbase.region.server.rpc.scheduler.factory.class = org.apache.hadoop.hbase.ipc.PhoenixRpcSchedulerFactory
```

## 常用命令
```shell
# 启动 sqlline
$PHOENIX_HOME/bin/sqlline.py hadoop1:2181:/hbase-unsecure
0: jdbc:phoenix:> 
# 查看帮助，也可以使用 help 
0: jdbc:phoenix:> !?
!all                Execute the specified SQL against all the current connections
!autocommit         Set autocommit mode on or off
!batch              Start or execute a batch of statements
!brief              Set verbose mode off
!call               Execute a callable statement
!close              Close the current connection to the database
!closeall           Close all current open connections
!columns            List all the columns for the specified table
!commit             Commit the current transaction (if autocommit is off)
!connect            Open a new connection to the database.
!dbinfo             Give metadata information about the database
!describe           Describe a table
!dropall            Drop all tables in the current database
!exportedkeys       List all the exported keys for the specified table
!go                 Select the current connection
!help               Print a summary of command usage
!history            Display the command history
!importedkeys       List all the imported keys for the specified table
!indexes            List all the indexes for the specified table
!isolation          Set the transaction isolation for this connection
!list               List the current connections
!manual             Display the SQLLine manual
!metadata           Obtain metadata information
!nativesql          Show the native SQL for the specified statement
!outputformat       Set the output format for displaying results
                    (table,vertical,csv,tsv,xmlattrs,xmlelements)
!primarykeys        List all the primary keys for the specified table
!procedures         List all the procedures
!properties         Connect to the database specified in the properties file(s)
!quit               Exits the program
!reconnect          Reconnect to the database
!record             Record all output to the specified file
!rehash             Fetch table and column names for command completion
!rollback           Roll back the current transaction (if autocommit is off)
!run                Run a script from the specified file
!save               Save the current variabes and aliases
!scan               Scan for installed JDBC drivers
!script             Start saving a script to a file
!set                Set a sqlline variable

Variable Value
                    Description
=============== ==========
                    ================================
autoCommit true/false
                    Enable/disable automatic
transaction commit
autoSave
                    true/false Automatically save preferences
color true/false
                    Control whether color is used
for display
fastConnect
                    true/false Skip building table/column list
for
                    tab-completion
force true/false Continue running script
                    even
after errors
headerInterval integer The interval between
                    which
headers are displayed
historyFile path File in which to
                    save command
history. Default is
$HOME/.sqlline/history
                    (UNIX,
Linux, Mac OS),
$HOME/sqlline/history
                    (Windows)
incremental true/false Do not receive all rows
                    from
server before printing the first
row. Uses fewer
                    resources,
especially for long-running
queries, but column
                    widths may
be incorrect.
isolation LEVEL Set transaction
                    isolation level
maxColumnWidth integer The maximum width to
                    use when
displaying columns
maxHeight integer The maximum
                    height of the
terminal
maxWidth integer The maximum width of
                    the
terminal
numberFormat pattern Format numbers
                    using
DecimalFormat pattern
outputFormat
                    table/vertical/csv/tsv Format mode for
result
                    display
propertiesFile path File from which SqlLine
                    reads
properties on startup; default
                    is
$HOME/.sqlline/sqlline.properties
(UNIX, Linux, Mac
                    OS),
$HOME/sqlline/sqlline.properties
(Windows)
rowLimit
                    integer Maximum number of rows returned
from a query; zero
                    means no
limit
showElapsedTime true/false Display execution
                    time when
verbose
showHeader true/false Show column names in
                    query
results
showNestedErrs true/false Display nested
                    errors
showWarnings true/false Display connection
                    warnings
silent true/false Be more silent
timeout integer
                    Query timeout in seconds; less
than zero means no
                    timeout
trimScripts true/false Remove trailing spaces
                    from
lines read from script files
verbose true/false Show
                    verbose error messages and
debug info
!sql                Execute a SQL command
!tables             List all the tables in the database
!typeinfo           Display the type map for the current connection
!verbose            Set verbose mode on

Comments, bug reports, and patches go to ???
```

## 与已存在 hbase 表关联
```sql
-- Phoenix 不管你输入的是大写还是小写都默认把它转成大写的，如果要小写的话必须加上引号
-- hbase 表 rowkey，默认为 ROW 必须大写，并且加双引号。
create table "my_table"("ROW" varchar primary key, "info"."name" varchar);
```