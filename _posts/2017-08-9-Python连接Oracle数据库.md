---
layout: post
title: Python连接Oracle数据库
tag: Python
---
### 下载 instant_oracle
[官方下载地址](http://www.oracle.com/technetwork/cn/database/features/instant-client/index-097480.html)
Windows版本文件下载清单以及配置步骤：
* 下载 `instantclient-basic-nt-11.2.0.4.0.zip`
* 下载 `instantclient-sqlplus-nt-11.2.0.4.0.zip`
* 下载 `instantclient-tools-nt-11.2.0.4.0.zip`
* 下载 `instantinstantclient-jdbc-nt-11.2.0.4.0.zip`
* 将文件解压到同一文件夹下 `D:\Oracle\stantclieinnt_11_2`
* 添加文件 `tnsnames.ora`
* 配置环境变量 
```
TNS_ADMIN=D:\Oracle\instantclient_11_2
NLS_LANG=SIMPLIFIED CHINESE_CHINA.ZHS16GBK #设置oracle的语言
```


Mac版本文件下载清单以及配置步骤：
* 下载 `instantclient-basic-macos.x64-12.1.0.2.0.zip`
* 下载 `instantclient-sqlplus-macos.x64-12.1.0.2.0.zip`
* 下载 `instantclient-sdk-macos.x64-12.1.0.2.0.zip` 不然会出现找不到`oci.h`的错误
* 将文件解压到同一文件夹下 `/opt/oracle/instantclient_12_1`
* 添加文件 `tnsnames.ora`到`/opt/oracle/instantclient_12_1/network/admin`下
* 配置环境变量
```
vim ~/.bash_profile

# Setting PATH for oracle_instant_12_1
export ORACLE_HOME=/opt/oracle/instantclient_12_1/
export DYLD_LIBRARY_PATH=$ORACLE_HOME
export SQLPATH=$ORACLE_HOME
export TNS_ADMIN=$ORACLE_HOME/network/admin
export LANG=en_US.UTF8
export NLS_LANG=AMERICAN_AMERICA.UTF8
export NLS_DATE_FORMAT="yyyy-mm-dd HH24:MI:SS"
export PATH=$ORACLE_HOME:$PATH

source ~.bash_profile
```
* Add links to $HOME/lib or /usr/local/lib to enable applications to find the libraries. For example, OCI based applications could do:
```
$ cd /opt/oracle/instantclient_12_1
$ ln -s libclntsh.dylib.12.1 libclntsh.dylib
# OCCI programs will additionally need:
$ ln -s libocci.dylib.12.1 libocci.dylib
$ mkdir ~/lib
$ ln -s ~/instantclient_12_1/libclntsh.dylib ~/lib/
```


### 下载 cx_Oracle
```
$ pip install cx_Oracle
```
或者 [安装文件的下载地址](https://sourceforge.net/projects/cx-oracle/?source=directory)

注意事项：
* cx_Oracle下载的位数版本一定要和Python的位数版本相同，例如本地装的32位的Python，就一定要装32位的cx_Oracle。
* 本地oracle_instant的版本也必须得是32位的，因为在`import cx_Oracle`的时候会出现`ImportError: DLL load failed: 找不到指定的模块。`的问题，需要将instant_oracle安装目录`D:\Oracle\instantclient_11_2`中的`oci.dll，oraociei11.dll，ocijdbc11.dll`添加到`\Python27\Lib\site-packages`目录下，而`oci.dll`不同位数的版本下是不一样的。
* 在PyCharm中开发时，如果你的PyCharm是64位的，那么`import cx_Oracle`会报错。但是可以运行。

因此必须要保证 Python、cx_Oracle、instant_oracle 位数版本一致，要么都是32位的要么都是64位的。PyCharm 位数版本最好也一致，如果你有强迫症的话。 

Note: Custom OCI applications, such as those that bundle Instant Client, may want to link with -rpath set to the directory containing Instant Client 12.1 instead of relying on libraries being in ~/lib.

出现下面的问题时
```
ImportError: dlopen(/Library/Python/2.7/site-packages/cx_Oracle.so, 2): Library not loaded: @rpath/libclntsh.dylib.12.1
      Referenced from: /Library/Python/2.7/site-packages/cx_Oracle.so
      Reason: image not found
```
手动将@rpath对应的LC_RPATH添加到cx_Oracle.so中，[出现上面的问题的详细解释](http://blog.csdn.net/u013613428/article/details/77045360)
```
$ install_name_tool -add_rpath /opt/oracle/instantclient_12_1/ /Library/Frameworks/Python.framework/Versions/2.7/lib/python2.7/site-packages/cx_Oracle.so 
```
### cx_Oracle 的使用