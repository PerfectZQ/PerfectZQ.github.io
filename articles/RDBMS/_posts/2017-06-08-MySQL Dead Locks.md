---
layout: post
title: MySQL Dead Locks
tag: RDBMS
---

## 死锁排查
* [MySQL锁优化](https://database.51cto.com/art/201910/604421.htm)
* [线上数据库死锁](https://database.51cto.com/art/201905/596261.htm)

```sql
mysql> SHOW ENGINE INNODB STATUS;
```

```shell
LATEST DETECTED DEADLOCK
------------------------
2020-06-28 14:31:21 0x7f8e40181700
*** (1) TRANSACTION:
TRANSACTION 618925, ACTIVE 0 sec fetching rows
mysql tables in use 3, locked 3
LOCK WAIT 63 lock struct(s), heap size 8400, 8 row lock(s)
MySQL thread id 115798, OS thread handle 140248671397632, query id 10039891 10.53.5.59 dlink updating
UPDATE download_task_file  SET file_status='Running'  
 
 WHERE  task_id='8793c54cfb5940d09fdd19f70e25859a'
 AND task_item_id='f7588a983397426ab9c662e0c2a81cff'
 AND cluster='hadoop'
 AND hdfs_file_path='/data/datum/raw/others/20190617_遗留物体采集_part5_huangshiyao/part-r-00410.avro'
*** (1) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 211 page no 1045 n bits 152 index GEN_CLUST_INDEX of table `dlink`.`download_task_file` trx id 618925 lock_mode X locks rec but not gap waiting
Record lock, heap no 54 PHYSICAL RECORD: n_fields 8; compact format; info bits 0
 0: len 6; hex 000000010b2c; asc      ,;;
 1: len 6; hex 00000009576f; asc     Wo;;
 2: len 7; hex 26000003440975; asc &   D u;;
 3: len 30; hex 383739336335346366623539343064303966646431396637306532353835; asc 8793c54cfb5940d09fdd19f70e2585; (total 32 bytes);
 4: len 6; hex 6861646f6f70; asc hadoop;;
 5: len 30; hex 2f646174612f646174756d2f7261772f6f74686572732f32303139303631; asc /data/datum/raw/others/2019061; (total 77 bytes);
 6: len 7; hex 53756363656564; asc Succeed;;
 7: len 30; hex 383864616232393038343835346164633933636561653461346465383965; asc 88dab29084854adc93ceae4a4de89e; (total 32 bytes);

*** (2) TRANSACTION:
TRANSACTION 618924, ACTIVE 0 sec fetching rows, thread declared inside InnoDB 3591
mysql tables in use 3, locked 3
30 lock struct(s), heap size 3520, 3 row lock(s)
MySQL thread id 115788, OS thread handle 140248937404160, query id 10039890 10.53.5.59 dlink updating
UPDATE download_task_file  SET file_status='Running'  
 
 WHERE  task_id='8793c54cfb5940d09fdd19f70e25859a'
 AND task_item_id='88dab29084854adc93ceae4a4de89e9b'
 AND cluster='hadoop'
 AND hdfs_file_path='/data/datum/raw/others/20190616_遗留物体采集_part4_huangshiyao/part-r-00510.avro'
*** (2) HOLDS THE LOCK(S):
RECORD LOCKS space id 211 page no 1045 n bits 152 index GEN_CLUST_INDEX of table `dlink`.`download_task_file` trx id 618924 lock_mode X locks rec but not gap
Record lock, heap no 54 PHYSICAL RECORD: n_fields 8; compact format; info bits 0
 0: len 6; hex 000000010b2c; asc      ,;;
 1: len 6; hex 00000009576f; asc     Wo;;
 2: len 7; hex 26000003440975; asc &   D u;;
 3: len 30; hex 383739336335346366623539343064303966646431396637306532353835; asc 8793c54cfb5940d09fdd19f70e2585; (total 32 bytes);
 4: len 6; hex 6861646f6f70; asc hadoop;;
 5: len 30; hex 2f646174612f646174756d2f7261772f6f74686572732f32303139303631; asc /data/datum/raw/others/2019061; (total 77 bytes);
 6: len 7; hex 53756363656564; asc Succeed;;
 7: len 30; hex 383864616232393038343835346164633933636561653461346465383965; asc 88dab29084854adc93ceae4a4de89e; (total 32 bytes);

*** (2) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 211 page no 752 n bits 432 index download_task_file_fk of table `dlink`.`download_task_file` trx id 618924 lock_mode X locks rec but not gap waiting
Record lock, heap no 113 PHYSICAL RECORD: n_fields 2; compact format; info bits 0
 0: len 30; hex 383739336335346366623539343064303966646431396637306532353835; asc 8793c54cfb5940d09fdd19f70e2585; (total 32 bytes);
 1: len 6; hex 000000010b2c; asc      ,;;

*** WE ROLL BACK TRANSACTION (2)
------------
TRANSACTIONS
------------
Trx id counter 620395
Purge done for trx's n:o < 620395 undo n:o < 0 state: running but idle
History list length 6
LIST OF TRANSACTIONS FOR EACH SESSION:
---TRANSACTION 421725670569840, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670568016, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670567104, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670568928, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670574400, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670573488, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670572576, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670571664, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670570752, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670566192, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670565280, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670564368, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670563456, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670562544, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670560720, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670561632, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670558896, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670557984, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670555248, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670553424, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670559808, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670556160, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670619088, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670557072, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
---TRANSACTION 421725670554336, not started
0 lock struct(s), heap size 1136, 0 row lock(s)
--------
FILE I/O
--------
I/O thread 0 state: waiting for completed aio requests (insert buffer thread)
I/O thread 1 state: waiting for completed aio requests (log thread)
I/O thread 2 state: waiting for completed aio requests (read thread)
I/O thread 3 state: waiting for completed aio requests (read thread)
I/O thread 4 state: waiting for completed aio requests (read thread)
I/O thread 5 state: waiting for completed aio requests (read thread)
I/O thread 6 state: waiting for completed aio requests (read thread)
I/O thread 7 state: waiting for completed aio requests (read thread)
I/O thread 8 state: waiting for completed aio requests (read thread)
I/O thread 9 state: waiting for completed aio requests (read thread)
I/O thread 10 state: waiting for completed aio requests (write thread)
I/O thread 11 state: waiting for completed aio requests (write thread)
I/O thread 12 state: waiting for completed aio requests (write thread)
I/O thread 13 state: waiting for completed aio requests (write thread)
I/O thread 14 state: waiting for completed aio requests (write thread)
I/O thread 15 state: waiting for completed aio requests (write thread)
I/O thread 16 state: waiting for completed aio requests (write thread)
I/O thread 17 state: waiting for completed aio requests (write thread)
Pending normal aio reads: [0, 0, 0, 0, 0, 0, 0, 0] , aio writes: [0, 0, 0, 0, 0, 0, 0, 0] ,
 ibuf aio reads:, log i/o's:, sync i/o's:
Pending flushes (fsync) log: 0; buffer pool: 0
2901 OS file reads, 1557620 OS file writes, 367881 OS fsyncs
0.00 reads/s, 0 avg bytes/read, 10.80 writes/s, 3.13 fsyncs/s
-------------------------------------
INSERT BUFFER AND ADAPTIVE HASH INDEX
-------------------------------------
Ibuf: size 1, free list len 0, seg size 2, 20 merges
merged operations:
 insert 2, delete mark 0, delete 0
discarded operations:
 insert 0, delete mark 0, delete 0
Hash table size 276707, node heap has 16 buffer(s)
Hash table size 276707, node heap has 9 buffer(s)
Hash table size 276707, node heap has 7 buffer(s)
Hash table size 276707, node heap has 13 buffer(s)
Hash table size 276707, node heap has 15 buffer(s)
Hash table size 276707, node heap has 9 buffer(s)
Hash table size 276707, node heap has 8 buffer(s)
Hash table size 276707, node heap has 72 buffer(s)
242.78 hash searches/s, 5.80 non-hash searches/s
---
LOG
---
Log sequence number 3221726781
Log flushed up to   3221726781
Pages flushed up to 3221726781
Last checkpoint at  3221726772
0 pending log flushes, 0 pending chkp writes
433982 log i/o's done, 1.93 log i/o's/second
----------------------
BUFFER POOL AND MEMORY
----------------------
Total large memory allocated 1099431936
Dictionary memory allocated 829744
Buffer pool size   65536
Free buffers       8192
Database pages     57195
Old database pages 21032
Modified db pages  0
Pending reads      0
Pending writes: LRU 0, flush list 0, single page 0
Pages made young 59088, not young 108859
0.00 youngs/s, 0.00 non-youngs/s
Pages read 2869, created 118629, written 1027166
0.00 reads/s, 0.00 creates/s, 8.00 writes/s
Buffer pool hit rate 1000 / 1000, young-making rate 0 / 1000 not 0 / 1000
Pages read ahead 0.00/s, evicted without access 0.00/s, Random read ahead 0.00/s
LRU len: 57195, unzip_LRU len: 0
I/O sum[728]:cur[0], unzip sum[0]:cur[0]
----------------------
INDIVIDUAL BUFFER POOL INFO
----------------------
---BUFFER POOL 0
Buffer pool size   16384
Free buffers       2048
Database pages     14304
Old database pages 5260
Modified db pages  0
Pending reads      0
Pending writes: LRU 0, flush list 0, single page 0
Pages made young 14890, not young 65743
0.00 youngs/s, 0.00 non-youngs/s
Pages read 794, created 29668, written 205939
0.00 reads/s, 0.00 creates/s, 5.40 writes/s
Buffer pool hit rate 1000 / 1000, young-making rate 0 / 1000 not 0 / 1000
Pages read ahead 0.00/s, evicted without access 0.00/s, Random read ahead 0.00/s
LRU len: 14304, unzip_LRU len: 0
I/O sum[182]:cur[0], unzip sum[0]:cur[0]
---BUFFER POOL 1
Buffer pool size   16384
Free buffers       2048
Database pages     14296
Old database pages 5257
Modified db pages  0
Pending reads      0
Pending writes: LRU 0, flush list 0, single page 0
Pages made young 14495, not young 33000
0.00 youngs/s, 0.00 non-youngs/s
Pages read 650, created 29466, written 164276
0.00 reads/s, 0.00 creates/s, 1.20 writes/s
Buffer pool hit rate 1000 / 1000, young-making rate 0 / 1000 not 0 / 1000
Pages read ahead 0.00/s, evicted without access 0.00/s, Random read ahead 0.00/s
LRU len: 14296, unzip_LRU len: 0
I/O sum[182]:cur[0], unzip sum[0]:cur[0]
---BUFFER POOL 2
Buffer pool size   16384
Free buffers       2048
Database pages     14299
Old database pages 5258
Modified db pages  0
Pending reads      0
Pending writes: LRU 0, flush list 0, single page 0
Pages made young 14992, not young 3059
0.00 youngs/s, 0.00 non-youngs/s
Pages read 701, created 29711, written 457094
0.00 reads/s, 0.00 creates/s, 0.00 writes/s
Buffer pool hit rate 1000 / 1000, young-making rate 0 / 1000 not 0 / 1000
Pages read ahead 0.00/s, evicted without access 0.00/s, Random read ahead 0.00/s
LRU len: 14299, unzip_LRU len: 0
I/O sum[182]:cur[0], unzip sum[0]:cur[0]
---BUFFER POOL 3
Buffer pool size   16384
Free buffers       2048
Database pages     14296
Old database pages 5257
Modified db pages  0
Pending reads      0
Pending writes: LRU 0, flush list 0, single page 0
Pages made young 14711, not young 7057
0.00 youngs/s, 0.00 non-youngs/s
Pages read 724, created 29784, written 199857
0.00 reads/s, 0.00 creates/s, 1.40 writes/s
Buffer pool hit rate 1000 / 1000, young-making rate 0 / 1000 not 0 / 1000
Pages read ahead 0.00/s, evicted without access 0.00/s, Random read ahead 0.00/s
LRU len: 14296, unzip_LRU len: 0
I/O sum[182]:cur[0], unzip sum[0]:cur[0]
--------------
ROW OPERATIONS
--------------
0 queries inside InnoDB, 0 queries in queue
0 read views open inside InnoDB
Process ID=30614, Main thread ID=140248851928832, state: sleeping
Number of rows inserted 6241674, updated 408291, deleted 1615041, read 1893514361
0.00 inserts/s, 1.00 updates/s, 0.00 deletes/s, 4261.05 reads/s
----------------------------
END OF INNODB MONITOR OUTPUT
============================
```