---
layout: post
title: Kerberos Authentication
tag: Hadoop
---

## 参考
[kerberos 认证原理](https://blog.csdn.net/wulantian/article/details/42418231)

[kerberos 体系下的应用(yarn, spark on yarn)](https://www.jianshu.com/p/ae5a3f39a9af)

[kerberos 入坑指南](https://www.jianshu.com/p/fc2d2dbd510b)

## 认证实际要解决的问题
证明某个人确确实实就是他或她所声称的那个人

## 怎么解决
如果一个`secret`只有你我知道，那么我就可以用这个`secret`来向你证明自己我就是我。

### 如何生成一个只有你(Server)我(Client)知道的Secret
Kerberos Distribution Center - KDC 作为 Client 和 Server 共同信任的第三方，为双方提供`secret`。KDC 由 Authentication Service(AS-认证服务) 和 Ticket Granting Service(TGS) 组成

Client 要想获取 Server 端的资源，就得先通过 Server 的认证。首先 Client 向 Server 提供从 KDC 获得的一个有 Server 的 Master Key 进行加密的 Session Ticket(Session Key + Client Info)

## 搭建KDC
### 下载和安装
```
# krb5-admin-server: kdc管理员程序，可以让使用者远程管理kdc数据库。
# krb5-kdc: kdc主程序
# krb5-user: kerberos的一些客户端命令，用来获取、查看、销毁ticket等等。
apt-get install krb5-admin-server krb5-kdc krb5-user krb5-config
```
### 配置
配置kdc、kerberos客户端，以及调用 kerberos api 时都会使用到。

* ticket_lifetime: 指定 kdc 授权 ticket 的过期时长
* renew_lifetime: 指定允许更新现有 ticket 的时长。
* realms: 指定 kdc 和 admin_server 路径

```shell
$ vim /etc/krb5.conf
[logging]
 default = FILE:/var/log/krb5libs.log
 kdc = FILE:/var/log/krb5kdc.log
 admin_server = FILE:/var/log/kadmind.log

[libdefaults]
 default_realm = EXAMPLE.COM
 dns_lookup_realm = false
 dns_lookup_kdc = false
 ticket_lifetime = 400
 renew_lifetime = 600
 forwardable = true
 udp_preference_limit = 1

[realms]
 EXAMPLE.COM = {
   kdc = 127.0.0.1:88
   admin_server = 127.0.0.1
 }
```

kdc的专属配置，可以根据修改 kdc 数据库的存放目录。比如放在`/etc/krb5kdc/example`目录下。这个目录，需要提前建立好。
```shell
$ vim /etc/krb5kdc/kdc.conf
[kdcdefaults]
    kdc_ports = 750,88

[realms]
    EXAMPLE.COM = {
        database_name = /etc/krb5kdc/example/principal
        admin_keytab = FILE:/etc/krb5kdc/example/kadm5.keytab
        acl_file = /etc/krb5kdc/example/kadm5.acl
        key_stash_file = /etc/krb5kdc/example/stash
        kdc_ports = 750,88
        max_life = 10h 0m 0s
        max_renewable_life = 7d 0h 0m 0s
        master_key_type = des3-hmac-sha1
        supported_enctypes = aes256-cts:normal arcfour-hmac:normal des3-hmac-sha1:normal des-cbc-crc:normal des:normal des:v4 des:norealm des:onlyrealm des:afs3
        default_principal_flags = +preauth
    }
```


## Kerberos 基本概念
### Principals
类似于多用户系统的用户名，每个 server 都对应一个 principal，principal 就是一个用户的唯一标识

principals 的构成如下
```
# @ 前面是一个 principals 的具体身份，它可能由多个部分组成，使用`/`分割。
# @ 后面是一个 principals 必不可少的部分 REALM(域名)，为大写英文字符。
component1/component2@REALM
```

principals 又可以分为两种
```
# User Principals
# 代表的是一个属于 domain XXX.COM 的用户 zq
zq@XXX.COM

# Service Principals
# / 前面的部分为 yarn，说明它代表的是 yarn 的服务，/ 后面的部分则是DNS域名，@后面的则是每个principals都必须有的 REALM
yarn/xxx.net@XXX.COM
```

## 常用命令
### 创建数据库 和 principal 相关操作
[http://web.mit.edu/kerberos/krb5-1.12/doc/admin/admin_commands/kadmin_local.html](http://web.mit.edu/kerberos/krb5-1.12/doc/admin/admin_commands/kadmin_local.html)

```
# 创建数据库，用于存放 principal 
$ kdb5_util create -r EXAMPLE.COM -s

# 进入 kadmin
$ kinit admin/admin
Password for admin/admin@RICHINFOAI.COM:
$ kadmin
Authenticating as principal admin/admin@RICHINFOAI.COM with password.
Password for admin/admin@XXX.COM: 

# 添加 principal
kadmin: add_principal test/test@XXX.COM
WARNING: no policy specified for test/test@XXX.COM; defaulting to no policy
Enter password for principal "test/test@XXX.COM":
Re-enter password for principal "test/test@XXX.COM":
Principal "test/test@XXX.COM" created.

# 为 principal 指定 keytab
kadmin: ktadd -k /etc/krb5.keytab test/test@XXX.COM

# 查看所有的 principals
kadmin: list_principals test*

# 退出 kadmin
kadmin: q
```

### 启动KDC
```
# kdc 主程序
$ systemctl start krb5-kdc
# kdc 管理员程序，可以让使用者远程管理 kdc 数据库
$ systemctl start krb5-admin-server
```

### 向KDC申请TGT
```
# 使用密码向KDC申请TGT
$ kinit hdfs-kerambari0
Password for hdfs-kerambari0@XXX.COM:

# 使用keytab向KDC申请TGT
$ kinit -kt /etc/security/keytabs/hdfs.headless.keytab hdfs-kerambari0@XXX.COM
```

### 销毁当前的TGT
```
$ kdestroy
```

### 显示当前的TGT
```
# 如果当前没有TGT会显示如下
$ klist
klist: No credentials cache found (filename: /tmp/krb5cc_0)

# 如果申请了TGT显示如下
Ticket cache: FILE:/tmp/krb5cc_0
Default principal: hdfs-kerambari0@XXX.COM

Valid starting       Expires              Service principal
01/09/2019 10:48:24  01/10/2019 10:48:24  krbtgt/XXX.COM@XXX.COM
```

### 刷新TGT
从上面可以看到 TGT 是有实效性的，超过 Expires 日期就不可以再使用，但是可以在过期之前使用下面命令刷新
```
$ kinit -R
```

### 切换admin
```
$ kinit admin/admin
```