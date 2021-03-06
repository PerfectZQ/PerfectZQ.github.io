---
layout: post
title: Kerberos Authentication 
tag: Hadoop
---

## 前要

为了更好的理解 Kerberos 认证的原理，先了解加密相关的一些重要的基本概念

* `Symmetric-key algorithm`：[对称密钥算法](https://zh.wikipedia.org/wiki/%E5%B0%8D%E7%A8%B1%E5%AF%86%E9%91%B0%E5%8A%A0%E5%AF%86)，又称对称加密算法，私钥加密，共享密钥算法。

具体的加密原理可以参考[《密码学安全算法-对称加密》](https://blog.csdn.net/Holmofy/article/details/72861821)。这里只说整个加密过程中涉及的几个概念：
* **明文**：需要被加密的原始数据
* **加密算法**：对明文进行各种*替换*或者*转换*操作的一种算法。
* **密钥(Key)**：密钥也是加/解密算法的输入之一，对明文进行的*替换*或者*转换*操作就依赖密钥，比如加密算法是`明文 & 密钥 => 密文`
* **密文**：明文和密钥经过加密算法打乱后的输出，对于相同的明文如果密钥不同，经过加密算法输出的密文也就不同。
* **解密算法**：本质上是加密算法的逆过程，对于对称加密算法来说加密和解密使用的是相同的密钥。

密钥类型：
* `Long-term Key / Master Key`：在 Security 领域，有的 Key 可能是长期不变的，比如你的密码可能很多年都不变，那么用来对你的明文密码进行加/解密的 Key 以及由此 Key 派生出的 Key
  称为`Long-term Key`。对于用这种 Key 加密的后的数据原则上是不应该在网络上进行传输的，因为一旦这些被加密的数据包被其他人获取，理论上只要有充足的时间就可以通过计算破解出你用来加密的`Long-term Key`
  ，这样他就知道你们之间的`secret`了。任何加密算法都不可能做到绝对保密。你的密码应该只有你自己知道明文密码具体是什么，对于服务器
  Administrator，这个明文的密码也应该是保密的，但是服务器需一个凭证验证你的身份，所以需要基于你的密码派生出一个一一对应的信息来证明你的用户身份，一般是通过某种 Hash 算法，对你的明文密码进行 Hash 得到一个 Hash
  Code，一般把这个 Hash Code 叫做`Master Key`，Hash 算法是不可逆的(在目前的算力下)，同时保证明文密码和`Master Key`是一一对应的，这样就既保证了你密码的保密性，又能确认你的身份。
* `Short-term Key / Session Key`：对于一些需要能在网络中传输的加密信息，采用`Short-term Key`进行加密，因为这种 Key 只在一段时间内有效，即便加密数据被其他人获取了破解了 Key，这个
  Key 也早就过期了。

## Kerberos 简介
Kerberos 是一种使用对称密钥机制进行密钥管理的系统，用于**在非安全的网络环境下，安全的证明某个人确确实实就是他所声称的那个人**。也可以简单理解为一个用于安全认证的第三方服务。

怎么证明？**如果一个`secret`只有你我知道，那么我就可以用这个`secret`来向你证明自己我就是我。** 这样就会涉及到 3 个重要的关于`authentication`方面的问题:

1. 怎么生成一个`secret`只有你我知道？在对称加密算法中，只有你我知道的`secret`就是`密钥(Key)`
2. 我(client)怎么向你(server)提供`secret`。
3. 你(server)怎么识别`secret`。

### Kerberos 涉及的角色
![有帮助的截图]({{ site.url }}/assets/kerberos/kerberos_roles.jpg)

1. Client：用户，任何软件的服务。 
2. Server：托管受Kerberos保护的资源/服务的服务器
3. KDC：受信任的第三方身份验证服务

### Kerberos 认证服务组成
1. KDC: Key Distribution Center, 密钥分发中心
2. AS: Authentication Server, 认证服务器
3. TGS: Ticket Granting Server, 票据授权服务器

## Kerberos V5 Concepts
### Principal

类似于多用户系统的用户名，每个 server 都对应一个 principal，principal 就是一个用户的唯一标识，principal 的构成如下
```
# @ 前面是一个 principals 的具体身份，它可能由多个部分组成，使用`/`分割。
# @ 后面是一个 principals 必不可少的部分 REALM(域名)，为大写英文字符。
component1/component2@REALM
```

principal 又可以分为两种
```
# User Principals
# 代表的是一个属于 REALM：HADOOP-BJ.MYCOMPANY.COM 的用户 zhangqiang/admin
zhangqiang/admin@HADOOP-BJ.MYCOMPANY.COM

# Service Principals
# / 前面的部分为 yarn，说明它代表的是 yarn 的服务，/ 后面的部分则是DNS域名，@后面的则是每个principals都必须有的 REALM
yarn/xxx.net@HADOOP-BJ.MYCOMPANY.COM
```
### Keytab
[What is Keytab?](https://web.mit.edu/kerberos/krb5-1.15/doc/basic/keytab_def.html)

## Kerberos 简要认证流程

![有帮助的截图]({{ site.url }}/assets/kerberos/kerberos_simple_process.webp)

#### Kerberos 是怎么解决关于 Authentication 涉及的三个问题的

Kerberos 用一个`key`，即一个*密钥*来表示`secret`(只有真正的 client 和 server 本身知道这个`Key`)。

client 为了让 server 对自己进行有效的认证，向 server 提供

* `Identity`，一个能够唯一确定 client 自身信息的明文(用于解密后进行校验使用)
* `Encrypt Identity`，采用对称加密算法(使用相同的密钥加密/解密)，用`Key`对`Identity`
  进行加密后的密文。关于对称加密和非对称加密，参考[图解非对称加密和对称加密](https://medium.com/mr-efacani-teatime/%E5%9C%96%E8%A7%A3-%E9%9D%9E%E5%B0%8D%E7%A8%B1-%E8%88%87-%E5%B0%8D%E7%A8%B1-%E5%8A%A0%E5%AF%86%E6%8A%80%E8%A1%93-37c01f3651dc)

server 收到 client 的这两组信息，先通过`key`对`Encrypt Identity`解密，然后和明文的`Identity`进行校验，因为这个`secret`只有真正的 client 和 server
知道，只要校验完全相同则可以确认 client 就是真正的 client。

### 如何生成一个只有你 (Server) 我 (Client) 知道的 secret

认证过程需要 client 向 server 提供一个`Encrypt Identity`，需要在网络中传输加密数据，所以它只能是一个`Session Key`，仅在 client 和 server 的一个 session
中有效，我们暂且称这个 key 叫`SKclient-server`。

#### SKclient-server 从哪来

`Kerberos Distribution Center - KDC`作为 Client 和 Server 共同信任的第三方，为双方提供`secret`。`KDC`由`Authentication Service(AS-认证服务)`
和`Ticket Granting Service(TGS-票据授权服务)`组成，它维护着一个用于存储该 domain 中所有账户的`Account Database`，也就是说它拥有每个 Account 的名称和派生于该
Account's Password 的`MasterKey`。

#### KDC 是如何分发 SKclient-server 的呢

首先 client_X 向 KDC 发送一个`我是 client_X，想要访问 server_Y，需要申请一个 Session Key`的请求，KDC 收到请求就生成一个`SKclient-server`，为了只有 client_X
和它想访问的 server_Y 两个人知道，KDC 分别生成`SKclient-server`的两个 copy，供 client 和 server 使用，然后去`Account Database`查询 Account client_X 和
server_Y 的`MasterKey`作为密钥分别对两个`SessionKey`进行加密。对于 server_Y，一起加密的除了`SessionKey`还有关于 client 的一些信息`ClientInfo`
，这两个信息合起来称为`SessionTicket`。注意分发的时候 KDC 并不是直接将加密后的`SessionKey`分别发给 client 和 server 的，因为这样会有两个问题：

* 一个 server 通常会面对多个不同的 client，而每个 client 又需要一个不同的 Session Key，这样的话 Server 就需要为所有的 client 维护一个 Session Key 列表，每次 client
  来请求验证的时候还要去查，对于 Server 来说这样既麻烦又低效。
* 网络传输是不确定的，分两个请求分别发送给 client 和 server 是不安全的，有可能 server 端根本就没收到 Session Key，这样 client 永远就不能被成功认证了。

为了解决这些问题，kerbros 选择将这两个被加密的 Session Key 一起发送给 client，在 client 向 server 发送认证请求的时候，一起把属于 server 端的 Session Key 带过去。

#### 为什么要用 Account client_X 的 Master Key 进行加密呢

如果有个 client_Z 假装自己是 client_X 去向 KDC 申请属于 client_X 的 Session Key，他实际上得到的是用 client_X 的 Passowrd 派生出的 Master Key
加密后的密文，client_X 的明文密码只有 client_X 自己知道，client_Z 是没有办法解密出属于 client_X 的 Session Key 的。

### 完整的认证过程

`Kerbros`一词源自希腊神话，是一只守护冥界长着三个脑袋的神犬，Kerberos 完整的认证过程就由`Client`、`Server`、`KDC`这三个脑袋共同完成的。

KDC 分发完 Session Key 后，Client 手中有两组信息，`Encrypt(ClientMasterKey: SessionKey)`
和`Encrypt(ServerMasterKey: SessionTicket<SessionKey, ClientInfo>)`，在网络环境中传输的加密信息还有有安全漏洞的，这个 SessionKey
还是有可能被破解的，为了证明自己没有问题，Client 还需要提供更多的证明信息，如`ClientInfo`和`CurrentTimestamp`，这些证明信息称为`Authenticator`。

Client 要想获取 Server 端的资源，就得先通过 Server 的认证。首先 Client 通过自己的 Master Key 对`Encrypt(ClientMasterKey: SessionKey)`进行解密获取
Session Key，然后创建`Authenticator<CurrentTimestamp, ClientInfo>`，然后用 Session Key
对其进行加密，然后将`Encrypt(SessionKey: Authenticator<CurrentTimestamp, ClientInfo>)`
和`Encrypt(ServerMasterKey: SessionTicket<SessionKey, ClientInfo>)`一起发送给 Server。当 Server 收到两组信息后，先用自己的 MasterKey 解密获取
SessionTicket，拿到 SessionKey 和 ClientInfo，然后用 SessionKey 解密获取 Authenticator，最后通过比较 SessionTicket 和 Authenticator 中的两个
ClientInfo 实现对 Client 的验证。

#### CurrentTimestamp 干什么的

## Kerberos 基本概念



## Kerberos Install

```
# krb5-admin-server: kdc 管理员程序，可以让使用者远程管理 kdc 数据库。
# krb5-kdc: kdc 主程序
# krb5-user: kerberos 的一些客户端命令，用来获取、查看、销毁ticket等等。
apt-get install krb5-admin-server krb5-kdc krb5-user krb5-config

# OSX 自带，不需要装
```

### Configuration

配置 kdc、kerberos 客户端，指定日志写入路径、realm 信息、kdc、admin-server 服务器地址等。

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

kdc 的专属配置，可以根据修改 kdc 数据库的存放目录。比如放在`/etc/krb5kdc/example`目录下。这个目录，需要提前建立好。

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

## 常用命令

### 创建数据库 和 principal 相关操作

[http://web.mit.edu/kerberos/krb5-1.12/doc/admin/admin_commands/kadmin_local.html](http://web.mit.edu/kerberos/krb5-1.12/doc/admin/admin_commands/kadmin_local.html)

```
# 创建数据库，用于存放 principal 
$ kdb5_util create -r HADOOP-BJ.MYCOMPANY.COM -s

# 进入 kadmin
$ kinit admin/admin
Password for admin/admin@HADOOP-BJ.MYCOMPANY.COM:
$ kadmin
Authenticating as principal admin/admin@HADOOP-BJ.MYCOMPANY.COM with password.
Password for admin/admin@HADOOP-BJ.MYCOMPANY.COM: 

# 添加 principal
kadmin: add_principal zhangqiang/admin@HADOOP-BJ.MYCOMPANY.COM
WARNING: no policy specified for zhangqiang/admin@HADOOP-BJ.MYCOMPANY.COM; defaulting to no policy
Enter password for principal "zhangqiang/admin@HADOOP-BJ.MYCOMPANY.COM":
Re-enter password for principal "zhangqiang/admin@HADOOP-BJ.MYCOMPANY.COM":
Principal "zhangqiang/admin@HADOOP-BJ.MYCOMPANY.COM" created.

# 为 principal 指定 keytab
kadmin: ktadd -k /etc/krb5.keytab zhangqiang/admin@HADOOP-BJ.MYCOMPANY.COM

# 查看所有的 principals
kadmin: list_principals zhangqiang*

# 退出 kadmin
kadmin: q
```

### 启动 KDC

```
# 启动 kdc 主程序
$ systemctl start krb5-kdc
# 启动 kdc 管理员程序，可以让使用者远程管理 kdc 数据库
$ systemctl start krb5-admin-server
```

### 向 KDC 申请 TGT

```
# 使用密码向KDC申请TGT
$ kinit hdfs-kerambari0
Password for hdfs-kerambari0@HADOOP-BJ.MYCOMPANY.COM:

# 使用keytab向KDC申请TGT
$ kinit -kt /etc/security/keytabs/hdfs.headless.keytab hdfs-kerambari0@HADOOP-BJ.MYCOMPANY.COM
```

### 销毁当前的 TGT

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
Default principal: hdfs-kerambari0@HADOOP-BJ.MYCOMPANY.COM

Valid starting       Expires              Service principal
01/09/2019 10:48:24  01/10/2019 10:48:24  krbtgt/HADOOP-BJ.MYCOMPANY.COM@HADOOP-BJ.MYCOMPANY.COM
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

## Config Ubuntu Chrome Kerberos Authentication

```shell
# Close all Chrome windows
$ vim /usr/bin/google-chrome
# Replace the last code on bottom
>>>>>>
exec -a "$0" "$HERE/chrome" "$@"
=======================
# Make sure that the profile directory specified in the environment, 
# if any, overrides the default.
if [[ -n "$CHROME_USER_DATA_DIR" ]]; then
  # Note: exec -a below is a bashism.
  exec -a "$0" "$HERE/chrome"  \
    --auth-server-whitelist="*.sensetime.com" \
    --user-data-dir="$CHROME_USER_DATA_DIR" "$@"
else
  exec -a "$0" "$HERE/chrome" \
    --auth-server-whitelist="*.sensetime.com" \
    "$@"
fi
<<<<<<
```

## 参考
* [Kerberos 安全体系详解](https://www.cnblogs.com/wukenaihe/p/3732141.html)
* [图解 Kerberos 协议原理](http://www.nosqlnotes.com/technotes/kerberos-protocol/)
* [Kerberos基本概念及原理汇总](https://841809077.github.io/2018/12/18/Kerberos%E5%9F%BA%E6%9C%AC%E6%A6%82%E5%BF%B5%E5%8F%8A%E5%8E%9F%E7%90%86%E6%B1%87%E6%80%BB.html)
* [Kerberos 认证原理](https://blog.csdn.net/wulantian/article/details/42418231)
* [Kerberos 体系下的应用(yarn, spark on yarn)](https://www.jianshu.com/p/ae5a3f39a9af)
* [Kerberos 入坑指南](https://www.jianshu.com/p/fc2d2dbd510b)
* [HDFS 配置 Kerberos 认证](https://yq.aliyun.com/articles/25636)
* [Windows 域认证 Kerberos 详解](https://blog.csdn.net/wy_97/article/details/87649262)
* [美团数据平台 Kerberos 优化实战](https://tech.meituan.com/2018/05/20/kerberos-big-data-platform.html)
