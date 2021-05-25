

## Log
* [Log Engine Family](https://clickhouse.tech/docs/en/engines/table-engines/log-family/)
```sql
CREATE TABLE IF NOT EXISTS dlink.bj_all_file_uid
(
    md5 String,
    filePath String,
	fileSize Nullable(UInt64)
)
ENGINE = Log

CREATE TABLE IF NOT EXISTS dlink.bj_avro_inner_file_uid
(
    md5 String,
    filePath String,
	fileSize Nullable(UInt64),
    rowNumber Nullable(UInt32),
	bytesFieldName Nullable(String)
)
ENGINE = Log

CREATE TABLE IF NOT EXISTS dlink.sh_avro_inner_file_uid AS dlink.bj_avro_inner_file_uid ENGINE = Log

```

写数据
```shell
# 遍历文件夹中的文件
for FILENAME in /data/analysis/hadoop/user/sre.bigdata/all_file_uniqueId.parquet/*.parquet; do
    # 写入的时候整个表会锁住，任何读取操作会被阻塞，当没有写操作的时候支持并发读
    cat $FILENAME | clickhouse-client \
          --host 10.53.26.177 --port 31234 -u admin --password xxxxxx \
          --query 'INSERT INTO dlink.bj_all_file_uid FORMAT Parquet' \
          --max_insert_block_size=100000 >> hadoop-all.log 2>&1 &
done
```