---
layout: post
title: Python连接Oracle数据库
tag: Python
---
### 下载 instant_oracle
[官方下载地址](http://www.oracle.com/technetwork/cn/database/features/instant-client/index-097480.html)
文件下载清单以及配置步骤：
* 下载 `instantclient-basic-nt-11.2.0.4.0.zip`
* 下载 `instantclient-sqlplus-nt-11.2.0.4.0.zip`
* 下载 `instantclient-tools-nt-11.2.0.4.0.zip`
* 下载 `instantinstantclient-jdbc-nt-11.2.0.4.0.zip
* 将文件解压到同一文件夹下 `D:\Oracle\instantclient_11_2`
* 添加文件 `tnsnames.ora`
* 配置环境变量 `TNS_ADMIN=D:\Oracle\instantclient_11_2`
* 配置环境变量 `NLS_LANG=SIMPLIFIED CHINESE_CHINA.ZHS16GBK` ，设置oracle的语言

### 下载 cx_Oracle
```
pip install cx_Oracle
```
或者 windows .msi [下载地址](https://sourceforge.net/projects/cx-oracle/?source=directory)

注意事项：
* cx_Oracle下载的位数版本一定要和Python的位数版本相同，例如本地装的32位的Python，就一定要装32位的cx_Oracle。
* 本地oracle_instant的版本也必须得是32位的，因为在`import cx_Oracle`的时候会出现`ImportError: DLL load failed: 找不到指定的模块。`的问题，需要将instant_oracle安装目录`D:\Oracle\instantclient_11_2`中的`oci.dll，oraociei11.dll，ocijdbc11.dll`添加到`\Python27\Lib\site-packages`目录下，而`oci.dll`不同位数的版本下是不一样的。
* 在PyCharm中开发时，如果你的PyCharm是64位的，那么`import cx_Oracle`会报错。但是可以运行。

因此必须要保证 Python、cx_Oracle、instant_oracle 位数版本一致，要么都是32位的要么都是64位的。PyCharm 位数版本最好也一致，如果你有强迫症的话。 

### cx_Oracle 的使用