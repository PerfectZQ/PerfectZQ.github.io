---
layout: post
title: Python安装(Linux)
tag: Python
---

## 编译、安装过程  
　　首先去官网下载python包，地址：http://www.python.org/download/，然后将tgz格式包解压进入解压目录下，执行以下操作
```shell
# 配置并且检查，然后生成编译安装所需要的文件，如：
./configure --prefix /usr/local/python2.7

# --prefix用于指定python的安装路径于/usr/local/python2.7

# 生成文件如下：
configure: creating ./config.status
config.status: creating Makefile
config.status: creating m4/Makefile
config.status: creating lib/Makefile
config.status: creating lib/contrib/Makefile
config.status: creating src/Makefile
config.status: creating doc/Makefile
config.status: creating doc/drafts/Makefile
config.status: creating po/Makefile.in
config.status: creating doc/texi2pod.pl
config.status: creating config.h
config.status: executing depfiles commands
config.status: executing default-1 commands
config.status: creating po/POTFILES
config.status: creating po/Makefile

# 编译源代码，并生成执行文件
make

# 安装，实际上是将编译生成的可执行文件拷贝到Linux系统中必要的目录下，比如拷贝到/usr/local/bin 下(默认情况)。如果在 
# ./configure 使用--prefix指定安装路径为/usr/local/python2.7，就会将可执行文件拷贝到/usr/local/python2.7中
make install
```

## 更换Python版本
　　完成上述安装后，执行 `python -V` 命令，如果发现系统上的python版本仍然是自带的旧版本。执行 `which python` 查看，旧的python安装在`/usr/local/bin/python`下，其实这是一个软连接。其实新的python也在`/usr/local/bin`下，`/usr/local/bin/python2.7`。可以直接通过更改软连接指向的python更换版本
```shell
# 如果前面没有指定 --prefix 可以忽略这一步
ln -s /usr/local/python2.7 /usr/local/bin/
```

## 如果yum出现异常
```shell
vim /usr/bin/yum
# 将头部 #!/usr/bin/python 改为正确的链接
```
