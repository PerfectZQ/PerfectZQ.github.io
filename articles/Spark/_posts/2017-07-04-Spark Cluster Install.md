---
layout: post
title: Spark Cluster Install
tag: Spark
---

## Standalone 模式部署
[official reference - Spark Standalone Mode](http://spark.apache.org/docs/latest/spark-standalone.htmls)

### 下载
[download](http://spark.apache.org/downloads.html)下载对应版本的Spark，解压。

### 配置域名
```shell
vim /etc/hosts
# 将集群的所有节点都添加进去，各个节点都需要配置，否则会出现 net exception
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
10.4.121.202 s121202
10.4.121.203 s121203
10.4.121.204 s121204
10.4.121.205 s121205
10.4.121.206 s121206
```

### 修改 Spark 环境变量
```shell
cd $SPARK_HOME/conf
cp spark-env.sh.template spark-env.sh
# Spark 在启动的时候会加载该文件中配置的环境变量信息
vi spark-env.sh
# 指定主节点host地址，端口号默认是7077
export SPARK_MASTER_HOST=s121202 # 前提是在hosts文件中指定了域名
# 指定特定的JDK，不配置则使用系统默认的jdk
export JAVA_HOME=/usr/java/jdk1.8.0_121
# 如果想通过域名地址而不是ip地址读取hdfs，则需要两个文件，/etc/hadoop/conf/下的hdfs-site.xml和core-site.xml
# 一般hadoop会配置HA策略，如果你访问hdfs的时候使用hdfs://10.4.121.79:8020/spark/logs，
# 当这个节点挂掉之后，HA策略会将主节点换成另一个IP，这样程序就会出现异常。
# 配置好后就可以在指定hdfs地址的时候使用域名访问，如 hdfs://hdp.neusoft.com/spark/logs
# 这样就算某个节点挂了，程序依然能正确的访问hdfs
# 方式1：指定 hadoop conf 文件夹路径
export HADOOP_CONF_DIR=/etc/hadoop/conf
# 方式2：将这两个文件拷贝到 $SPARK_HOME/conf/下，该文件夹包含在 spark classpath 中
cp $HADOOP_HOME/conf/hdfs-site.xml $SPARK_HOME/conf/
cp $HADOOP_HOME/conf/core-site.xml $SPARK_HOME/conf/
```

### 配置系统环境变量
```shell
vi ~/.bash_profile
SPARK_HOME=/opt/neu/spark-2.1.1-bin-hadoop2.6
export SPARK_HOME
PATH=$PATH:$SPARK_HOME/bin:$SPARK_HOME/sbin
export PATH
```

### 版本验证 
`spark-shell`

### 将从节点配置到slaves文件中
```shell
vi $SPARK_HOME/conf/slaves
# 添加下面的从节点
s121203
s121204
s121205
s121206
```

### 配置Master免密登陆Slaves节点
```shell
# 记得将机器的防火墙关掉
service iptables stop
# 如果系统没有ssh，可能需要安装
yum -y install openssh-server
# 生成公钥 其中：-t 是类型 -P 是密码
ssh-keygen -t rsa -P ""
# 将生成的公钥内容写入到各个要免密登录节点的~/.ssh/authorized_keys文件。
# 方式1：
# 这种方式最简单，也最安全，公钥的内容直接追加到~/.ssh/authorized_keys文件，不会出现覆盖文件的情况。
ssh-copy-id -i ~/.ssh/id_rsa.pub s121204
# 如果出现 -bash: ssh-copy-id: command not found
yum -y install openssh-clients
# 方式2：
# 注意：这种方式会将目标节点原有的 authorized_keys 文件替换掉。
# 如果目标节点之前就有 authorized_keys 文件，需要通过另一种方式写入私钥。
scp -p ~/.ssh/id_rsa.pub neu@10.4.121.204:~/.ssh/authorized_keys
# 方式3: 
# 首先将公钥发送到目标节点的根目录。
# 注意：发送到根目录，而不是.ssh文件夹，以防将目标节点原有的公钥文件覆盖掉。
scp -p ~/.ssh/id_rsa.pub neu@10.4.121.204:~
# 在 10.4.121.204(目标节点) 上执行，将公钥追加到.ssh/authorized_keys文件。
cat ~/id_rsa.pub >> .ssh/authorized_keys
# 刷新
sudo /etc/init.d/sshd reload
# ssh验证配置
ssh localhost
# 登陆验证
ssh s121203
# 如果免密登陆失败，可以通过下面的命令查看原因
ssh -vvv 目标机器ip
# 可能原因1：.ssh 文件夹的权限不是700
chmod 700 ~/.ssh
# 可能原因2：.ssh/authorized_keys 文件的权限不是644
chmod 644 ~/.ssh/authorized_keys
```

### 将spark项目和hosts文件发送到各个子节点
```shell
scp -rp /opt/neu/spark-2.1.1-bin-hadoop2.6 neu@s121203:/opt/neu/
sudo scp /etc/hosts root@s121203:/etc/ 
```

### 启动集群
```shell
cd $SPARK_HOME/
./sbin/start-all.sh
```

### 查看启动情况
```shell
# 主节点可以看到Master进程，从节点可以看到Worker进程。
# 如果主节点也配置在了slaves文件中，那么主节点将会看到Master和Worker两个进程。
jps 
```