---
layout: post
title: Hadoop Delegation Token
tag: Hadoop
---

## Spark Submit On YARN
```console
21/07/05 17:30:21 WARN NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable
Using Spark's default log4j profile: org/apache/spark/log4j-defaults.properties
# Principal 和 Keytab 信息
21/07/05 17:30:21 INFO Client: Kerberos credentials: principal = sre.bigdata, keytab = /home/zhangqiang/IdeaProjects/bigdata-jobs/avro-schema-detector/submit/manual/../..//../hadoop/conf/hadoop/kerberos/sre.bigdata.hadoop.keytab
21/07/05 17:30:21 INFO Client: Requesting a new application from cluster with 202 NodeManagers
21/07/05 17:30:22 INFO Client: Verifying our application has not requested more than the maximum memory capability of the cluster (32768 MB per container)
# 申请分配 AM(Driver) 内存， Overhead Memory 默认为 `driver.memory` 的 10%
21/07/05 17:30:22 INFO Client: Will allocate AM container, with 18022 MB memory including 1638 MB overhead
21/07/05 17:30:22 INFO Client: Setting up container launch context for our AM
21/07/05 17:30:22 INFO Client: Setting up the launch environment for our AM container
21/07/05 17:30:22 INFO Client: Preparing resources for our AM container
# 通过 Keytab 登陆，并将 Credentials 写到分布式缓存，供 Tasks 访问
21/07/05 17:30:22 INFO Client: To enable the AM to login from keytab, credentials are being copied over to the AM via the YARN Secure Distributed Cache.
# 上传相关配置文件与依赖文件到分布式缓存
21/07/05 17:30:22 INFO Client: Uploading resource file:/home/zhangqiang/IdeaProjects/bigdata-jobs/hadoop/conf/hadoop/kerberos/sre.bigdata.hadoop.keytab -> hdfs://sensetime-data-hadoop/user/sre.bigdata/.sparkStaging/application_1623833737056_0818/sre.bigdata.hadoop.keytab
21/07/05 17:30:23 WARN Client: Neither spark.yarn.jars nor spark.yarn.archive is set, falling back to uploading libraries under SPARK_HOME.
21/07/05 17:30:27 INFO Client: Uploading resource file:/tmp/spark-316ac78e-4ec8-4774-8ef4-3001abdd6215/__spark_libs__5638554711021957627.zip -> hdfs://sensetime-data-hadoop/user/sre.bigdata/.sparkStaging/application_1623833737056_0818/__spark_libs__5638554711021957627.zip
21/07/05 17:30:29 INFO Client: Uploading resource file:/home/zhangqiang/IdeaProjects/bigdata-jobs/avro-schema-detector/target/avro-schema-detector-1.0.jar -> hdfs://sensetime-data-hadoop/user/sre.bigdata/.sparkStaging/application_1623833737056_0818/avro-schema-detector-1.0.jar
21/07/05 17:30:30 INFO Client: Uploading resource file:/home/zhangqiang/IdeaProjects/bigdata-jobs/hadoop/conf/hadoop/kerberos/sre.bigdata.keytab -> hdfs://sensetime-data-hadoop/user/sre.bigdata/.sparkStaging/application_1623833737056_0818/sre.bigdata.keytab
21/07/05 17:30:31 INFO Client: Uploading resource file:/tmp/spark-316ac78e-4ec8-4774-8ef4-3001abdd6215/__spark_conf__2522121785403620017.zip -> hdfs://sensetime-data-hadoop/user/sre.bigdata/.sparkStaging/application_1623833737056_0818/__spark_conf__.zip
21/07/05 17:30:31 INFO SecurityManager: Changing view acls to: zhangqiang,sre.bigdata
21/07/05 17:30:31 INFO SecurityManager: Changing modify acls to: zhangqiang,sre.bigdata
21/07/05 17:30:31 INFO SecurityManager: Changing view acls groups to:
21/07/05 17:30:31 INFO SecurityManager: Changing modify acls groups to:
21/07/05 17:30:31 INFO SecurityManager: SecurityManager: authentication disabled; ui acls disabled; users  with view permissions: Set(zhangqiang, sre.bigdata); groups with view permissions: Set(); users  with modify permissions: Set(zhangqiang, sre.bigdata); groups with modify permissions: Set()
# 登陆 KDC
21/07/05 17:30:31 INFO HadoopDelegationTokenManager: Attempting to login to KDC using principal: sre.bigdata
21/07/05 17:30:31 INFO HadoopDelegationTokenManager: Successfully logged into KDC.
21/07/05 17:30:31 INFO HiveConf: Found configuration file null
# 获取 Delegation Token，type=HDFS_DELEGATION_TOKEN，renewer=rm/bj-idc1-10-53-7-150@HADOOP.DATA.SENSETIME.COM
21/07/05 17:30:31 INFO HadoopFSDelegationTokenProvider: getting token for: DFS[DFSClient[clientName=DFSClient_NONMAPREDUCE_1086645798_1, ugi=sre.bigdata@HADOOP.DATA.SENSETIME.COM (auth:KERBEROS)]] with renewer rm/bj-idc1-10-53-7-150@HADOOP.DATA.SENSETIME.COM
21/07/05 17:30:31 INFO DFSClient: Created HDFS_DELEGATION_TOKEN token 58015922 for sre.bigdata on ha-hdfs:sensetime-data-hadoop
# 获取 Delegation Token，type=HDFS_DELEGATION_TOKEN，renewer=sre.bigdata@HADOOP.DATA.SENSETIME.COM
21/07/05 17:30:32 INFO HadoopFSDelegationTokenProvider: getting token for: DFS[DFSClient[clientName=DFSClient_NONMAPREDUCE_1086645798_1, ugi=sre.bigdata@HADOOP.DATA.SENSETIME.COM (auth:KERBEROS)]] with renewer sre.bigdata@HADOOP.DATA.SENSETIME.COM
21/07/05 17:30:32 INFO DFSClient: Created HDFS_DELEGATION_TOKEN token 58015923 for sre.bigdata on ha-hdfs:sensetime-data-hadoop
# 没有找到 type=kms-dt 的 Delegation Token
21/07/05 17:30:32 WARN Token: Cannot find class for token kind kms-dt
# HDFS_DELEGATION_TOKEN Renewal interval is 86400143
21/07/05 17:30:32 INFO HadoopFSDelegationTokenProvider: Renewal interval is 86400143 for token HDFS_DELEGATION_TOKEN
21/07/05 17:30:32 WARN Token: Cannot find class for token kind kms-dt
21/07/05 17:30:33 INFO Client: Submitting application application_1623833737056_0818 to ResourceManager
21/07/05 17:30:34 INFO YarnClientImpl: Submitted application application_1623833737056_0818
21/07/05 17:30:35 INFO Client: Application report for application_1623833737056_0818 (state: ACCEPTED)
21/07/05 17:30:35 INFO Client:
client token: Token { kind: YARN_CLIENT_TOKEN, service:  }
diagnostics: N/A
ApplicationMaster host: N/A
ApplicationMaster RPC port: -1
queue: other
start time: 1625477434115
final status: UNDEFINED
tracking URL: https://master001.hadoop.data.sensetime.com:8090/proxy/application_1623833737056_0818/
user: sre.bigdata
21/07/05 17:30:36 INFO Client: Application report for application_1623833737056_0818 (state: ACCEPTED)
21/07/05 17:30:37 INFO Client: Application report for application_1623833737056_0818 (state: ACCEPTED)
21/07/05 17:30:38 INFO Client: Application report for application_1623833737056_0818 (state: ACCEPTED)
21/07/05 17:30:39 INFO Client: Application report for application_1623833737056_0818 (state: ACCEPTED)
21/07/05 17:30:40 INFO Client: Application report for application_1623833737056_0818 (state: ACCEPTED)
21/07/05 17:30:41 INFO Client: Application report for application_1623833737056_0818 (state: ACCEPTED)
21/07/05 17:30:42 INFO Client: Application report for application_1623833737056_0818 (state: ACCEPTED)
21/07/05 17:30:43 INFO Client: Application report for application_1623833737056_0818 (state: ACCEPTED)
21/07/05 17:30:44 INFO Client: Application report for application_1623833737056_0818 (state: ACCEPTED)
21/07/05 17:30:45 INFO Client: Application report for application_1623833737056_0818 (state: RUNNING)
21/07/05 17:30:45 INFO Client:
client token: Token { kind: YARN_CLIENT_TOKEN, service:  }
diagnostics: N/A
ApplicationMaster host: slave070.hadoop.data.sensetime.com
ApplicationMaster RPC port: 33588
queue: other
start time: 1625477434115
final status: UNDEFINED
tracking URL: https://master001.hadoop.data.sensetime.com:8090/proxy/application_1623833737056_0818/
user: sre.bigdata
21/07/05 17:30:46 INFO Client: Application report for application_1623833737056_0818 (state: RUNNING)
21/07/05 17:30:47 INFO Client: Application report for application_1623833737056_0818 (state: RUNNING)
21/07/05 17:30:48 INFO Client: Application report for application_1623833737056_0818 (state: RUNNING)
21/07/05 17:30:49 INFO Client: Application report for application_1623833737056_0818 (state: RUNNING)
21/07/05 17:30:50 INFO Client: Application report for application_1623833737056_0818 (state: RUNNING)
```
