---
layout: post
title: Spark Execution Process
tag: Spark
---

## 介绍
通过详细拆解 spark log，来了解 spark 程序从提交到执行结束所经历的整个过程。其中`-`是我的注释，不是输出日志

## Spark on YARN
```console
19/04/25 11:27:30 WARN Spark$: 
..................... 我佛慈悲 .....................

                      _oo0oo_
                     o6666666o
                     66" . "66
                     (| -_- |)
                     0\  =  /0
                   ___/`---'\___
                 .' \\|     |// '.
                / \\|||  :  |||// \
               / _||||| -卍-|||||- \
              |   | \\\  -  /// |   |
              | \_|  ''\---/''  |_/ |
              \  .-\__  '-'  ___/-. /
            ___'. .'  /--.--\  `. .'___
         ."" '<  `.___\_<|>_/___.' >' "".
        | | :  `- \`.;`\ _ /`;.`/ - ` : | |
        \  \ `_.   \_ __\ /__ _/   .-` /  /
    =====`-.____`.___ \_____/___.-`___.-'=====
                      `=---='

................. 佛祖开光, 永无八哥 ..................

- 在 SparkContext 对象构造时输出 SPARK_VERSION 和提交 app 的 spark.app.name
19/04/25 11:27:30 INFO SparkContext: Running Spark version 2.2.0.2.6.4.0-91
19/04/25 11:27:31 INFO SparkContext: Submitted application: Load DU results to rockfs
- Access Control List，ACL，访问控制列表，Spark 安全认证机制更新 ACLS
19/04/25 11:27:31 INFO SecurityManager: Changing view acls to: root
19/04/25 11:27:31 INFO SecurityManager: Changing modify acls to: root
19/04/25 11:27:31 INFO SecurityManager: Changing view acls groups to: 
19/04/25 11:27:31 INFO SecurityManager: Changing modify acls groups to: 
- spark.authenticate 参数控制是否启用安全认证机制，这里没有启用
19/04/25 11:27:31 INFO SecurityManager: SecurityManager: authentication disabled; ui acls disabled; users  with view permissions: Set(root); groups with view permissions: Set(); users  with modify permissions: Set(root); groups with modify permissions: Set()
- Utils.startServiceOnPort(): * Attempt to start a service on the given port, or fail after a number of attempts.
                              * Each subsequent attempt uses 1 + the port used in the previous attempt (unless the port is 0).
- 这里启动的 service 是 'sparkDriver'
19/04/25 11:27:31 INFO Utils: Successfully started service 'sparkDriver' on port 39673.
- SparkEnv: * :: DeveloperApi ::
            * Holds all the runtime environment objects for a running Spark instance (either master or worker),
            * including the serializer, RpcEnv, block manager, map output tracker, etc. Currently
            * Spark code finds the SparkEnv through a global variable, so all the threads can access the same
            * SparkEnv. It can be accessed by SparkEnv.get (e.g. after creating a SparkContext).
            *
            * NOTE: This is not intended for external use. This is exposed for Shark and may be made private
            *       in a future release.
19/04/25 11:27:31 INFO SparkEnv: Registering MapOutputTracker
19/04/25 11:27:31 INFO SparkEnv: Registering BlockManagerMaster
19/04/25 11:27:31 INFO BlockManagerMasterEndpoint: Using org.apache.spark.storage.DefaultTopologyMapper for getting topology information
19/04/25 11:27:31 INFO BlockManagerMasterEndpoint: BlockManagerMasterEndpoint up
19/04/25 11:27:31 INFO DiskBlockManager: Created local directory at /tmp/blockmgr-a5fadcf4-9158-44aa-b6e3-5e7edc8a4d95
19/04/25 11:27:31 INFO MemoryStore: MemoryStore started with capacity 366.3 MB
19/04/25 11:27:31 INFO SparkEnv: Registering OutputCommitCoordinator
19/04/25 11:27:31 INFO Utils: Successfully started service 'SparkUI' on port 4040.
19/04/25 11:27:31 INFO SparkUI: Bound SparkUI to 0.0.0.0, and started at http://192.168.51.23:4040
19/04/25 11:27:31 INFO SparkContext: Added JAR file:/root/violent_search/spark/target/spark-1.0-SNAPSHOT.jar at spark://192.168.51.23:39673/jars/spark-1.0-SNAPSHOT.jar with timestamp 1556162851931
19/04/25 11:27:32 INFO RMProxy: Connecting to ResourceManager at hadoop2/192.168.51.22:8050
19/04/25 11:27:33 INFO Client: Requesting a new application from cluster with 4 NodeManagers
19/04/25 11:27:33 INFO Client: Verifying our application has not requested more than the maximum memory capability of the cluster (30208 MB per container)
19/04/25 11:27:33 INFO Client: Will allocate AM container, with 896 MB memory including 384 MB overhead
19/04/25 11:27:33 INFO Client: Setting up container launch context for our AM
19/04/25 11:27:33 INFO Client: Setting up the launch environment for our AM container
19/04/25 11:27:33 INFO Client: Preparing resources for our AM container
19/04/25 11:27:34 INFO Client: Uploading resource file:/tmp/spark-209477c1-c178-450e-b37a-fe7542600115/__spark_conf__7473599835651552912.zip -> hdfs://hadoop3:8020/user/root/.sparkStaging/application_1555417068416_0066/__spark_conf__.zip
19/04/25 11:27:34 INFO SecurityManager: Changing view acls to: root
19/04/25 11:27:34 INFO SecurityManager: Changing modify acls to: root
19/04/25 11:27:34 INFO SecurityManager: Changing view acls groups to: 
19/04/25 11:27:34 INFO SecurityManager: Changing modify acls groups to: 
19/04/25 11:27:34 INFO SecurityManager: SecurityManager: authentication disabled; ui acls disabled; users  with view permissions: Set(root); groups with view permissions: Set(); users  with modify permissions: Set(root); groups with modify permissions: Set()
19/04/25 11:27:34 INFO Client: Submitting application application_1555417068416_0066 to ResourceManager
19/04/25 11:27:35 INFO YarnClientImpl: Submitted application application_1555417068416_0066
19/04/25 11:27:35 INFO SchedulerExtensionServices: Starting Yarn extension services with app application_1555417068416_0066 and attemptId None
19/04/25 11:27:36 INFO Client: Application report for application_1555417068416_0066 (state: ACCEPTED)
19/04/25 11:27:36 INFO Client: 
         client token: N/A
         diagnostics: AM container is launched, waiting for AM container to Register with RM
         ApplicationMaster host: N/A
         ApplicationMaster RPC port: -1
         queue: default
         start time: 1556162854843
         final status: UNDEFINED
         tracking URL: http://hadoop2:8088/proxy/application_1555417068416_0066/
         user: root
19/04/25 11:27:37 INFO Client: Application report for application_1555417068416_0066 (state: ACCEPTED)
19/04/25 11:27:38 INFO Client: Application report for application_1555417068416_0066 (state: ACCEPTED)
19/04/25 11:27:39 INFO Client: Application report for application_1555417068416_0066 (state: ACCEPTED)
19/04/25 11:27:40 INFO Client: Application report for application_1555417068416_0066 (state: ACCEPTED)
19/04/25 11:27:41 INFO Client: Application report for application_1555417068416_0066 (state: ACCEPTED)
19/04/25 11:27:41 INFO YarnClientSchedulerBackend: Add WebUI Filter. org.apache.hadoop.yarn.server.webproxy.amfilter.AmIpFilter, Map(PROXY_HOSTS -> hadoop2, PROXY_URI_BASES -> http://hadoop2:8088/proxy/application_1555417068416_0066), /proxy/application_1555417068416_0066
19/04/25 11:27:41 INFO JettyUtils: Adding filter: org.apache.hadoop.yarn.server.webproxy.amfilter.AmIpFilter
19/04/25 11:27:42 INFO Client: Application report for application_1555417068416_0066 (state: ACCEPTED)
19/04/25 11:27:42 INFO YarnSchedulerBackend$YarnSchedulerEndpoint: ApplicationMaster registered as NettyRpcEndpointRef(spark-client://YarnAM)
19/04/25 11:27:43 INFO Client: Application report for application_1555417068416_0066 (state: RUNNING)
19/04/25 11:27:43 INFO Client: 
         client token: N/A
         diagnostics: N/A
         ApplicationMaster host: 192.168.51.22
         ApplicationMaster RPC port: 0
         queue: default
         start time: 1556162854843
         final status: UNDEFINED
         tracking URL: http://hadoop2:8088/proxy/application_1555417068416_0066/
         user: root
19/04/25 11:27:43 INFO YarnClientSchedulerBackend: Application application_1555417068416_0066 has started running.
19/04/25 11:27:43 INFO Utils: Successfully started service 'org.apache.spark.network.netty.NettyBlockTransferService' on port 38401.
19/04/25 11:27:43 INFO NettyBlockTransferService: Server created on 192.168.51.23:38401
19/04/25 11:27:43 INFO BlockManager: Using org.apache.spark.storage.RandomBlockReplicationPolicy for block replication policy
19/04/25 11:27:43 INFO BlockManagerMaster: Registering BlockManager BlockManagerId(driver, 192.168.51.23, 38401, None)
19/04/25 11:27:43 INFO BlockManagerMasterEndpoint: Registering block manager 192.168.51.23:38401 with 366.3 MB RAM, BlockManagerId(driver, 192.168.51.23, 38401, None)
19/04/25 11:27:43 INFO BlockManagerMaster: Registered BlockManager BlockManagerId(driver, 192.168.51.23, 38401, None)
19/04/25 11:27:43 INFO BlockManager: Initialized BlockManager: BlockManagerId(driver, 192.168.51.23, 38401, None)
19/04/25 11:27:43 INFO EventLoggingListener: Logging events to hdfs:///spark2-history/application_1555417068416_0066
19/04/25 11:28:02 INFO YarnClientSchedulerBackend: SchedulerBackend is ready for scheduling beginning after waiting maxRegisteredResourcesWaitingTime: 30000(ms)
19/04/25 11:28:02 INFO SharedState: loading hive config file: file:/etc/spark2/2.6.4.0-91/0/hive-site.xml
19/04/25 11:28:02 INFO SharedState: Setting hive.metastore.warehouse.dir ('null') to the value of spark.sql.warehouse.dir ('hdfs:///apps/hive/warehouse').
19/04/25 11:28:02 INFO SharedState: Warehouse path is 'hdfs:///apps/hive/warehouse'.
19/04/25 11:28:02 INFO HiveUtils: Initializing HiveMetastoreConnection version 1.2.1 using Spark classes.
19/04/25 11:28:03 INFO metastore: Trying to connect to metastore with URI thrift://hadoop3:9083
19/04/25 11:28:03 INFO metastore: Connected to metastore.
19/04/25 11:28:24 INFO SessionState: Created local directory: /tmp/cec5c916-6ba3-4306-94a7-e2d68d8a03ea_resources
19/04/25 11:28:24 INFO SessionState: Created HDFS directory: /tmp/hive/root/cec5c916-6ba3-4306-94a7-e2d68d8a03ea
19/04/25 11:28:24 INFO SessionState: Created local directory: /tmp/root/cec5c916-6ba3-4306-94a7-e2d68d8a03ea
19/04/25 11:28:24 INFO SessionState: Created HDFS directory: /tmp/hive/root/cec5c916-6ba3-4306-94a7-e2d68d8a03ea/_tmp_space.db
19/04/25 11:28:24 INFO HiveClientImpl: Warehouse location for Hive client (version 1.2.1) is hdfs:///apps/hive/warehouse
19/04/25 11:28:24 INFO SQLStdHiveAccessController: Created SQLStdHiveAccessController for session context : HiveAuthzSessionContext [sessionString=cec5c916-6ba3-4306-94a7-e2d68d8a03ea, clientType=HIVECLI]
19/04/25 11:28:24 INFO metastore: Mestastore configuration hive.metastore.filter.hook changed from org.apache.hadoop.hive.metastore.DefaultMetaStoreFilterHookImpl to org.apache.hadoop.hive.ql.security.authorization.plugin.AuthorizationMetaStoreFilterHook
19/04/25 11:28:24 INFO metastore: Trying to connect to metastore with URI thrift://hadoop3:9083
19/04/25 11:28:24 INFO metastore: Connected to metastore.
19/04/25 11:28:25 INFO metastore: Mestastore configuration hive.metastore.filter.hook changed from org.apache.hadoop.hive.ql.security.authorization.plugin.AuthorizationMetaStoreFilterHook to org.apache.hadoop.hive.metastore.DefaultMetaStoreFilterHookImpl
19/04/25 11:28:25 INFO metastore: Trying to connect to metastore with URI thrift://hadoop3:9083
19/04/25 11:28:25 INFO metastore: Connected to metastore.
19/04/25 11:28:25 INFO SessionState: Created local directory: /tmp/fadcb3e9-3926-4236-804b-dce5091e6a52_resources
19/04/25 11:28:25 INFO SessionState: Created HDFS directory: /tmp/hive/root/fadcb3e9-3926-4236-804b-dce5091e6a52
19/04/25 11:28:25 INFO SessionState: Created local directory: /tmp/root/fadcb3e9-3926-4236-804b-dce5091e6a52
19/04/25 11:28:25 INFO SessionState: Created HDFS directory: /tmp/hive/root/fadcb3e9-3926-4236-804b-dce5091e6a52/_tmp_space.db
19/04/25 11:28:25 INFO HiveClientImpl: Warehouse location for Hive client (version 1.2.1) is hdfs:///apps/hive/warehouse
19/04/25 11:28:25 INFO SQLStdHiveAccessController: Created SQLStdHiveAccessController for session context : HiveAuthzSessionContext [sessionString=fadcb3e9-3926-4236-804b-dce5091e6a52, clientType=HIVECLI]
19/04/25 11:28:25 INFO metastore: Mestastore configuration hive.metastore.filter.hook changed from org.apache.hadoop.hive.metastore.DefaultMetaStoreFilterHookImpl to org.apache.hadoop.hive.ql.security.authorization.plugin.AuthorizationMetaStoreFilterHook
19/04/25 11:28:25 INFO metastore: Trying to connect to metastore with URI thrift://hadoop3:9083
19/04/25 11:28:25 INFO metastore: Connected to metastore.
19/04/25 11:28:25 INFO StateStoreCoordinatorRef: Registered StateStoreCoordinator endpoint
19/04/25 11:28:26 INFO metastore: Trying to connect to metastore with URI thrift://hadoop3:9083
19/04/25 11:28:26 INFO metastore: Connected to metastore.
19/04/25 11:28:28 INFO CodeGenerator: Code generated in 244.591717 ms
19/04/25 11:28:28 INFO CodeGenerator: Code generated in 15.53937 ms
19/04/25 11:28:29 INFO MemoryStore: Block broadcast_0 stored as values in memory (estimated size 363.9 KB, free 365.9 MB)
19/04/25 11:28:29 INFO MemoryStore: Block broadcast_0_piece0 stored as bytes in memory (estimated size 33.1 KB, free 365.9 MB)
19/04/25 11:28:29 INFO BlockManagerInfo: Added broadcast_0_piece0 in memory on 192.168.51.23:38401 (size: 33.1 KB, free: 366.3 MB)
19/04/25 11:28:29 INFO SparkContext: Created broadcast 0 from 
19/04/25 11:28:29 INFO ContextCleaner: Cleaned accumulator 0
19/04/25 11:28:30 INFO PerfLogger: <PERFLOG method=OrcGetSplits from=org.apache.hadoop.hive.ql.io.orc.ReaderImpl>
19/04/25 11:28:30 INFO deprecation: mapred.input.dir is deprecated. Instead, use mapreduce.input.fileinputformat.inputdir
19/04/25 11:28:30 INFO OrcInputFormat: FooterCacheHitRatio: 0/38
19/04/25 11:28:30 INFO PerfLogger: </PERFLOG method=OrcGetSplits start=1556162910091 end=1556162910373 duration=282 from=org.apache.hadoop.hive.ql.io.orc.ReaderImpl>
19/04/25 11:28:30 INFO SparkContext: Starting job: count at DU2Rockfs.scala:37
19/04/25 11:28:30 INFO DAGScheduler: Registering RDD 6 (count at DU2Rockfs.scala:37)
19/04/25 11:28:30 INFO DAGScheduler: Got job 0 (count at DU2Rockfs.scala:37) with 1 output partitions
19/04/25 11:28:30 INFO DAGScheduler: Final stage: ResultStage 1 (count at DU2Rockfs.scala:37)
19/04/25 11:28:30 INFO DAGScheduler: Parents of final stage: List(ShuffleMapStage 0)
19/04/25 11:28:30 INFO DAGScheduler: Missing parents: List(ShuffleMapStage 0)
19/04/25 11:28:30 INFO DAGScheduler: Submitting ShuffleMapStage 0 (MapPartitionsRDD[6] at count at DU2Rockfs.scala:37), which has no missing parents
19/04/25 11:28:30 INFO MemoryStore: Block broadcast_1 stored as values in memory (estimated size 13.0 KB, free 365.9 MB)
19/04/25 11:28:30 INFO MemoryStore: Block broadcast_1_piece0 stored as bytes in memory (estimated size 6.5 KB, free 365.9 MB)
19/04/25 11:28:30 INFO BlockManagerInfo: Added broadcast_1_piece0 in memory on 192.168.51.23:38401 (size: 6.5 KB, free: 366.3 MB)
19/04/25 11:28:30 INFO SparkContext: Created broadcast 1 from broadcast at DAGScheduler.scala:1006
19/04/25 11:28:30 INFO DAGScheduler: Submitting 74 missing tasks from ShuffleMapStage 0 (MapPartitionsRDD[6] at count at DU2Rockfs.scala:37) (first 15 tasks are for partitions Vector(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14))
19/04/25 11:28:30 INFO YarnScheduler: Adding task set 0.0 with 74 tasks
19/04/25 11:28:45 WARN YarnScheduler: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient resources
19/04/25 11:29:00 WARN YarnScheduler: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient resources
19/04/25 11:29:15 WARN YarnScheduler: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient resources
19/04/25 11:29:30 WARN YarnScheduler: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient resources
19/04/25 11:29:45 WARN YarnScheduler: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient resources
19/04/25 11:30:00 WARN YarnScheduler: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient resources
19/04/25 11:30:15 WARN YarnScheduler: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient resources
19/04/25 11:30:30 WARN YarnScheduler: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient resources
19/04/25 11:30:45 WARN YarnScheduler: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient resources
19/04/25 11:31:00 WARN YarnScheduler: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient resources
19/04/25 11:31:15 WARN YarnScheduler: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient resources
19/04/25 11:31:30 WARN YarnScheduler: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient resources
19/04/25 11:31:45 WARN YarnScheduler: Initial job has not accepted any resources; check your cluster UI to ensure that workers are registered and have sufficient resources
19/04/25 11:31:49 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.22:42428) with ID 2
19/04/25 11:31:49 INFO TaskSetManager: Starting task 0.0 in stage 0.0 (TID 0, hadoop2, executor 2, partition 0, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 2.0 in stage 0.0 (TID 1, hadoop2, executor 2, partition 2, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 3.0 in stage 0.0 (TID 2, hadoop2, executor 2, partition 3, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 4.0 in stage 0.0 (TID 3, hadoop2, executor 2, partition 4, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 5.0 in stage 0.0 (TID 4, hadoop2, executor 2, partition 5, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO BlockManagerMasterEndpoint: Registering block manager hadoop2:44747 with 4.1 GB RAM, BlockManagerId(2, hadoop2, 44747, None)
19/04/25 11:31:49 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.24:43146) with ID 1
19/04/25 11:31:49 INFO TaskSetManager: Starting task 1.0 in stage 0.0 (TID 5, hadoop4, executor 1, partition 1, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 6.0 in stage 0.0 (TID 6, hadoop4, executor 1, partition 6, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 7.0 in stage 0.0 (TID 7, hadoop4, executor 1, partition 7, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 9.0 in stage 0.0 (TID 8, hadoop4, executor 1, partition 9, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 17.0 in stage 0.0 (TID 9, hadoop4, executor 1, partition 17, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO BlockManagerMasterEndpoint: Registering block manager hadoop4:42088 with 4.1 GB RAM, BlockManagerId(1, hadoop4, 42088, None)
19/04/25 11:31:49 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.21:59578) with ID 3
19/04/25 11:31:49 INFO TaskSetManager: Starting task 8.0 in stage 0.0 (TID 10, hadoop1, executor 3, partition 8, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 10.0 in stage 0.0 (TID 11, hadoop1, executor 3, partition 10, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 11.0 in stage 0.0 (TID 12, hadoop1, executor 3, partition 11, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 12.0 in stage 0.0 (TID 13, hadoop1, executor 3, partition 12, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 13.0 in stage 0.0 (TID 14, hadoop1, executor 3, partition 13, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO YarnSchedulerBackend$YarnDriverEndpoint: Registered executor NettyRpcEndpointRef(spark-client://Executor) (192.168.51.23:37280) with ID 4
19/04/25 11:31:49 INFO TaskSetManager: Starting task 14.0 in stage 0.0 (TID 15, hadoop3, executor 4, partition 14, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 15.0 in stage 0.0 (TID 16, hadoop3, executor 4, partition 15, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 16.0 in stage 0.0 (TID 17, hadoop3, executor 4, partition 16, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 18.0 in stage 0.0 (TID 18, hadoop3, executor 4, partition 18, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO TaskSetManager: Starting task 19.0 in stage 0.0 (TID 19, hadoop3, executor 4, partition 19, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:49 INFO BlockManagerMasterEndpoint: Registering block manager hadoop1:36037 with 4.1 GB RAM, BlockManagerId(3, hadoop1, 36037, None)
19/04/25 11:31:49 INFO BlockManagerMasterEndpoint: Registering block manager hadoop3:36148 with 4.1 GB RAM, BlockManagerId(4, hadoop3, 36148, None)
19/04/25 11:31:50 INFO BlockManagerInfo: Added broadcast_1_piece0 in memory on hadoop2:44747 (size: 6.5 KB, free: 4.1 GB)
19/04/25 11:31:50 INFO BlockManagerInfo: Added broadcast_1_piece0 in memory on hadoop4:42088 (size: 6.5 KB, free: 4.1 GB)
19/04/25 11:31:50 INFO BlockManagerInfo: Added broadcast_0_piece0 in memory on hadoop2:44747 (size: 33.1 KB, free: 4.1 GB)
19/04/25 11:31:50 INFO BlockManagerInfo: Added broadcast_1_piece0 in memory on hadoop1:36037 (size: 6.5 KB, free: 4.1 GB)
19/04/25 11:31:50 INFO BlockManagerInfo: Added broadcast_1_piece0 in memory on hadoop3:36148 (size: 6.5 KB, free: 4.1 GB)
19/04/25 11:31:50 INFO BlockManagerInfo: Added broadcast_0_piece0 in memory on hadoop4:42088 (size: 33.1 KB, free: 4.1 GB)
19/04/25 11:31:50 INFO BlockManagerInfo: Added broadcast_0_piece0 in memory on hadoop1:36037 (size: 33.1 KB, free: 4.1 GB)
19/04/25 11:31:50 INFO BlockManagerInfo: Added broadcast_0_piece0 in memory on hadoop3:36148 (size: 33.1 KB, free: 4.1 GB)
19/04/25 11:31:52 INFO TaskSetManager: Starting task 20.0 in stage 0.0 (TID 20, hadoop2, executor 2, partition 20, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:52 INFO TaskSetManager: Finished task 5.0 in stage 0.0 (TID 4) in 3087 ms on hadoop2 (executor 2) (1/74)
19/04/25 11:31:52 INFO TaskSetManager: Starting task 21.0 in stage 0.0 (TID 21, hadoop2, executor 2, partition 21, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:52 INFO TaskSetManager: Finished task 3.0 in stage 0.0 (TID 2) in 3092 ms on hadoop2 (executor 2) (2/74)
19/04/25 11:31:52 INFO TaskSetManager: Starting task 22.0 in stage 0.0 (TID 22, hadoop4, executor 1, partition 22, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:52 INFO TaskSetManager: Starting task 23.0 in stage 0.0 (TID 23, hadoop4, executor 1, partition 23, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:52 INFO TaskSetManager: Finished task 1.0 in stage 0.0 (TID 5) in 3193 ms on hadoop4 (executor 1) (3/74)
19/04/25 11:31:52 INFO TaskSetManager: Finished task 17.0 in stage 0.0 (TID 9) in 3192 ms on hadoop4 (executor 1) (4/74)
19/04/25 11:31:52 INFO TaskSetManager: Starting task 24.0 in stage 0.0 (TID 24, hadoop1, executor 3, partition 24, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:52 INFO TaskSetManager: Finished task 11.0 in stage 0.0 (TID 12) in 3077 ms on hadoop1 (executor 3) (5/74)
19/04/25 11:31:52 INFO TaskSetManager: Starting task 25.0 in stage 0.0 (TID 25, hadoop1, executor 3, partition 25, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:52 INFO TaskSetManager: Finished task 13.0 in stage 0.0 (TID 14) in 3168 ms on hadoop1 (executor 3) (6/74)
19/04/25 11:31:52 INFO TaskSetManager: Starting task 27.0 in stage 0.0 (TID 26, hadoop3, executor 4, partition 27, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:52 INFO TaskSetManager: Finished task 15.0 in stage 0.0 (TID 16) in 3192 ms on hadoop3 (executor 4) (7/74)
19/04/25 11:31:52 INFO TaskSetManager: Starting task 26.0 in stage 0.0 (TID 27, hadoop2, executor 2, partition 26, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:52 INFO TaskSetManager: Finished task 21.0 in stage 0.0 (TID 21) in 408 ms on hadoop2 (executor 2) (8/74)
19/04/25 11:31:52 INFO TaskSetManager: Starting task 28.0 in stage 0.0 (TID 28, hadoop4, executor 1, partition 28, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:52 INFO TaskSetManager: Finished task 7.0 in stage 0.0 (TID 7) in 3381 ms on hadoop4 (executor 1) (9/74)
19/04/25 11:31:52 INFO TaskSetManager: Starting task 29.0 in stage 0.0 (TID 29, hadoop4, executor 1, partition 29, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:52 INFO TaskSetManager: Finished task 9.0 in stage 0.0 (TID 8) in 3397 ms on hadoop4 (executor 1) (10/74)
19/04/25 11:31:52 INFO TaskSetManager: Starting task 30.0 in stage 0.0 (TID 30, hadoop4, executor 1, partition 30, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:52 INFO TaskSetManager: Finished task 23.0 in stage 0.0 (TID 23) in 330 ms on hadoop4 (executor 1) (11/74)
19/04/25 11:31:53 INFO TaskSetManager: Starting task 31.0 in stage 0.0 (TID 31, hadoop1, executor 3, partition 31, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:53 INFO TaskSetManager: Finished task 25.0 in stage 0.0 (TID 25) in 412 ms on hadoop1 (executor 3) (12/74)
19/04/25 11:31:53 INFO TaskSetManager: Starting task 32.0 in stage 0.0 (TID 32, hadoop4, executor 1, partition 32, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:53 INFO TaskSetManager: Finished task 29.0 in stage 0.0 (TID 29) in 349 ms on hadoop4 (executor 1) (13/74)
19/04/25 11:31:53 INFO TaskSetManager: Starting task 33.0 in stage 0.0 (TID 33, hadoop3, executor 4, partition 33, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:53 INFO TaskSetManager: Finished task 19.0 in stage 0.0 (TID 19) in 3681 ms on hadoop3 (executor 4) (14/74)
19/04/25 11:31:53 INFO TaskSetManager: Starting task 34.0 in stage 0.0 (TID 34, hadoop3, executor 4, partition 34, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:53 INFO TaskSetManager: Finished task 27.0 in stage 0.0 (TID 26) in 508 ms on hadoop3 (executor 4) (15/74)
19/04/25 11:31:53 INFO TaskSetManager: Starting task 35.0 in stage 0.0 (TID 35, hadoop1, executor 3, partition 35, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:53 INFO TaskSetManager: Finished task 31.0 in stage 0.0 (TID 31) in 210 ms on hadoop1 (executor 3) (16/74)
19/04/25 11:31:53 INFO TaskSetManager: Starting task 42.0 in stage 0.0 (TID 36, hadoop3, executor 4, partition 42, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:53 INFO TaskSetManager: Finished task 33.0 in stage 0.0 (TID 33) in 161 ms on hadoop3 (executor 4) (17/74)
19/04/25 11:31:53 INFO TaskSetManager: Starting task 36.0 in stage 0.0 (TID 37, hadoop1, executor 3, partition 36, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:53 INFO TaskSetManager: Finished task 35.0 in stage 0.0 (TID 35) in 178 ms on hadoop1 (executor 3) (18/74)
19/04/25 11:31:55 INFO TaskSetManager: Starting task 37.0 in stage 0.0 (TID 38, hadoop2, executor 2, partition 37, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:55 INFO TaskSetManager: Finished task 20.0 in stage 0.0 (TID 20) in 3451 ms on hadoop2 (executor 2) (19/74)
19/04/25 11:31:55 INFO TaskSetManager: Starting task 38.0 in stage 0.0 (TID 39, hadoop4, executor 1, partition 38, NODE_LOCAL, 5100 bytes)
...
19/04/25 11:31:58 INFO TaskSetManager: Starting task 71.0 in stage 0.0 (TID 73, hadoop1, executor 3, partition 71, NODE_LOCAL, 5100 bytes)
19/04/25 11:31:58 INFO TaskSetManager: Finished task 12.0 in stage 0.0 (TID 13) in 9088 ms on hadoop1 (executor 3) (55/74)
19/04/25 11:31:58 INFO TaskSetManager: Finished task 8.0 in stage 0.0 (TID 10) in 9129 ms on hadoop1 (executor 3) (56/74)
19/04/25 11:31:58 INFO TaskSetManager: Finished task 10.0 in stage 0.0 (TID 11) in 9273 ms on hadoop1 (executor 3) (57/74)
19/04/25 11:31:58 INFO TaskSetManager: Finished task 38.0 in stage 0.0 (TID 39) in 3075 ms on hadoop4 (executor 1) (58/74)
19/04/25 11:31:59 INFO TaskSetManager: Finished task 40.0 in stage 0.0 (TID 41) in 3199 ms on hadoop2 (executor 2) (59/74)
19/04/25 11:31:59 INFO TaskSetManager: Finished task 44.0 in stage 0.0 (TID 44) in 3068 ms on hadoop4 (executor 1) (60/74)
19/04/25 11:31:59 INFO TaskSetManager: Finished task 46.0 in stage 0.0 (TID 45) in 3476 ms on hadoop4 (executor 1) (61/74)
19/04/25 11:31:59 INFO TaskSetManager: Finished task 54.0 in stage 0.0 (TID 53) in 2934 ms on hadoop4 (executor 1) (62/74)
19/04/25 11:31:59 INFO TaskSetManager: Finished task 50.0 in stage 0.0 (TID 50) in 3147 ms on hadoop4 (executor 1) (63/74)
19/04/25 11:32:00 INFO TaskSetManager: Finished task 52.0 in stage 0.0 (TID 52) in 3250 ms on hadoop3 (executor 4) (64/74)
19/04/25 11:32:00 INFO TaskSetManager: Finished task 48.0 in stage 0.0 (TID 48) in 3543 ms on hadoop1 (executor 3) (65/74)
19/04/25 11:32:00 INFO TaskSetManager: Finished task 58.0 in stage 0.0 (TID 58) in 3156 ms on hadoop3 (executor 4) (66/74)
19/04/25 11:32:00 INFO TaskSetManager: Finished task 56.0 in stage 0.0 (TID 56) in 3414 ms on hadoop2 (executor 2) (67/74)
19/04/25 11:32:00 INFO TaskSetManager: Finished task 60.0 in stage 0.0 (TID 60) in 3157 ms on hadoop3 (executor 4) (68/74)
19/04/25 11:32:00 INFO TaskSetManager: Finished task 61.0 in stage 0.0 (TID 61) in 3267 ms on hadoop1 (executor 3) (69/74)
19/04/25 11:32:00 INFO TaskSetManager: Finished task 63.0 in stage 0.0 (TID 63) in 3282 ms on hadoop3 (executor 4) (70/74)
19/04/25 11:32:01 INFO TaskSetManager: Finished task 67.0 in stage 0.0 (TID 67) in 3269 ms on hadoop2 (executor 2) (71/74)
19/04/25 11:32:01 INFO TaskSetManager: Finished task 69.0 in stage 0.0 (TID 69) in 3341 ms on hadoop3 (executor 4) (72/74)
19/04/25 11:32:01 INFO TaskSetManager: Finished task 65.0 in stage 0.0 (TID 65) in 3557 ms on hadoop2 (executor 2) (73/74)
19/04/25 11:32:01 INFO TaskSetManager: Finished task 71.0 in stage 0.0 (TID 73) in 3243 ms on hadoop1 (executor 3) (74/74)
19/04/25 11:32:01 INFO YarnScheduler: Removed TaskSet 0.0, whose tasks have all completed, from pool 
19/04/25 11:32:01 INFO DAGScheduler: ShuffleMapStage 0 (count at DU2Rockfs.scala:37) finished in 211.086 s
19/04/25 11:32:01 INFO DAGScheduler: looking for newly runnable stages
19/04/25 11:32:01 INFO DAGScheduler: running: Set()
19/04/25 11:32:01 INFO DAGScheduler: waiting: Set(ResultStage 1)
19/04/25 11:32:01 INFO DAGScheduler: failed: Set()
19/04/25 11:32:01 INFO DAGScheduler: Submitting ResultStage 1 (MapPartitionsRDD[9] at count at DU2Rockfs.scala:37), which has no missing parents
19/04/25 11:32:01 INFO MemoryStore: Block broadcast_2 stored as values in memory (estimated size 7.0 KB, free 365.9 MB)
19/04/25 11:32:01 INFO MemoryStore: Block broadcast_2_piece0 stored as bytes in memory (estimated size 3.7 KB, free 365.9 MB)
19/04/25 11:32:01 INFO BlockManagerInfo: Added broadcast_2_piece0 in memory on 192.168.51.23:38401 (size: 3.7 KB, free: 366.3 MB)
19/04/25 11:32:01 INFO SparkContext: Created broadcast 2 from broadcast at DAGScheduler.scala:1006
19/04/25 11:32:01 INFO DAGScheduler: Submitting 1 missing tasks from ResultStage 1 (MapPartitionsRDD[9] at count at DU2Rockfs.scala:37) (first 15 tasks are for partitions Vector(0))
19/04/25 11:32:01 INFO YarnScheduler: Adding task set 1.0 with 1 tasks
19/04/25 11:32:01 INFO TaskSetManager: Starting task 0.0 in stage 1.0 (TID 74, hadoop3, executor 4, partition 0, NODE_LOCAL, 4737 bytes)
19/04/25 11:32:01 INFO BlockManagerInfo: Added broadcast_2_piece0 in memory on hadoop3:36148 (size: 3.7 KB, free: 4.1 GB)
19/04/25 11:32:01 INFO MapOutputTrackerMasterEndpoint: Asked to send map output locations for shuffle 0 to 192.168.51.23:37280
19/04/25 11:32:01 INFO MapOutputTrackerMaster: Size of output statuses for shuffle 0 is 252 bytes
19/04/25 11:32:01 INFO TaskSetManager: Finished task 0.0 in stage 1.0 (TID 74) in 137 ms on hadoop3 (executor 4) (1/1)
19/04/25 11:32:01 INFO YarnScheduler: Removed TaskSet 1.0, whose tasks have all completed, from pool 
19/04/25 11:32:01 INFO DAGScheduler: ResultStage 1 (count at DU2Rockfs.scala:37) finished in 0.138 s
19/04/25 11:32:02 INFO DAGScheduler: Job 0 finished: count at DU2Rockfs.scala:37, took 211.549910 s
==== count: 767455048
19/04/25 11:32:02 INFO MemoryStore: Block broadcast_3 stored as values in memory (estimated size 364.1 KB, free 365.5 MB)
19/04/25 11:32:02 INFO MemoryStore: Block broadcast_3_piece0 stored as bytes in memory (estimated size 33.2 KB, free 365.5 MB)
19/04/25 11:32:02 INFO BlockManagerInfo: Added broadcast_3_piece0 in memory on 192.168.51.23:38401 (size: 33.2 KB, free: 366.2 MB)
19/04/25 11:32:02 INFO SparkContext: Created broadcast 3 from 
```