---
layout: post
title: 本地Git搭建
tag: Git
---

## 用yum安装git，并配置IDEA上传项目到本地git库中
	
### 1）升级yum系统(当时未升级)
```shell
yum update
```
### 2) 卸载旧版本git（如果有的话）
```shell
yum remove git -y	
```
### 3)安装相关的依赖包
```shell
yum install curl-devel expat-devel gettext-devel openssl-devel zlib-devel gcc perl-ExtUtils-MakeMaker
# -bash: wget: command not found 解决方法
yum -y install wget
```

### 4)下载Git源码并解压
```shell
# git各版本源码下载地址：https://www.kernel.org/pub/software/scm/git
wget https://www.kernel.org/pub/software/scm/git/git-2.11.1.tar.gz -P /usr/zhangqiang/git
cd /usr/zhangqiang/git && tar -zxvf git-2.11.1.tar.gz && cd git-2.11.1
```
### 5)编译安装
```shell
# prefix的作用是指定安装目录，用了—prefix选项的另一个好处是卸载软件或移植软件。
# 当某个安装的软件不再需要时，只须简单的删除该安装目录，就可以把软件卸载得干干净净；
# 移植软件只需拷贝整个目录到另外一个机器即可（相同的操作系统）。
# configure（配置）[prefix 就是configure当中的参数之一] make（编译） make install（安装）
make prefix=/usr/git all && make prefix=/usr/git install
```
###	6)配置git环境变量 
```shell
echo "export PATH=$PATH:/usr/git/bin" >> /etc/bashrc && source /etc/bashrc
# 或者	
vim /etc/bashrc
# 在最后一行添加 
export PATH=/usr/git/bin:$PATH
source /etc/bashrc 
```
### 7)验证是否安装成功 
```shell	
git --version(提示版本号说明安装成功)
```
###	8)基本配置 
```shell
git config --global user.name 'zhangqiang' 
git config --global user.email 'intelli_zq@163.com'
# 不配置下面的选项可能会出现下面的警告
# LF will be replaced by CRLF in .....
# The file will have its original line endings in your working directory. 
# 因为windows和*nix(包括MAC)用不同的字符集去标记一行的末尾。git默认会自动把LF转换成CRLF
# 然后输出上面的警告来告诉你他做了什么
git config --global core.autocrlf false
```
###	9)新建git用户
```shell
useradd git
```
###	10)给新建的用户赋予sudo权限
```shell
visudo || vi /etc/sudoers
# 添加下面的代码，保存退出
git     ALL=(ALL)       NOPASSWD: ALL
```
### 11)在git用户下生成.ssh文件夹
```shell
ssh-keygen -t rsa
```
###	12)创建git远程库并初始化
```shell
mkdir sample.git
cd sample.git
# 在初始化远程仓库时最好使用 git --bare init   而不要使用：git init
# 如果使用了git init初始化，则远程仓库的目录下，也包含work tree，当本地仓库向远程仓库push时，
# 如果远程仓库正在push的分支上（如果当时不在push的分支，就没有问题）, 那么push后的结果不会反应在work tree上,  
# 也即在远程仓库的目录下对应的文件还是之前的内容，必须得使用git reset --hard才能看到push后的内容.
git --bare init 
```
### 13)在客户端(windows)安装git下载地址 
```shell
https://git-scm.com/download/win
```
###	14)运行windows git bash
```shell
ssh-keygen -t rsa -C "zhang_qiang_neu@neusoft.com"
```
### 15)将生成的密钥放在linux服务器上的 /home/git/.ssh/authorized_keys
```shell		
sudo cat /usr/zhangqiang/id_rsa.pub >> /home/git/.ssh/authorized_keys
或者 scp id_rsa.pub git@10.4.120.83:.ssh/authorized_keys
# 注：.ssh文件夹的权限应该是700, authorized_keys文件的权限应该是644
```
### 16)验证ssh
```shell
ssh git@10.4.120.83
```
### 17)在IDEA上配置Git
```shell
Settings(Ctrl+Alt+S) -> Version Control -> Git -> 设置Path to Git executable为git.exe所在的路径 
```
### 18)在windows上使用git bash提交变更到远程库	
```shell
# 初始化git本地库
git init
# 是将当前文件夹下的所有文件添加到git的跟踪中，意思就是交给git经管，提交到本地库	
git add . 
# 注：当添加所有文件出现下面的warning或者fatal时
warning: unable to access 'target/streams/$global/assemblyOption/$global/streams/assembly/c8f224cf1e9a0cf353b55c4300b89c57ffc8addc_212c534c5b030594ccf5c4b929e8f7cbf26eb1ba/META-INF/maven/org.glassfish.jersey.containers/jersey-container-servlet-core/.gitignore'
: Filename too long
fatal: unable to stat 'target/streams/$global/assemblyOption/$global/streams/assembly/0105b79b5dad9671c4cace315599240d0646b5e2_2776dabbf8c3f2ae6824e772ef9647d35c01a750/commongodb/casbah/commons/MongoDBObject$$anonfun$2$$anonfun$apply$1$$anonfun$apply$2.class'
: Filename too long
# 将git项目下所有的streams文件夹都忽略掉
echo streams >> .gitignore
# 或者将某一个streams文件夹忽略掉
echo assemblyOption >> .gitignore
# 或者单独添加一个文件夹或者一个文件提交到本地库
git add src
# 写提交信息
git commit -m "first commit"
# 设置远程库
git remote add origin git@10.4.120.83:/home/git/sample.git
# 注：遇到 fatal: remote origin already exists. 问题时
# 使用 git remote rm origin
# 将本地变更推送到远程库	
git push -u origin master
# 一些常用git命令
# 将远程库变更更新到本地库
git pull --rebase origin master
# 将github上的项目down下来。
git clone git＠github.com:ellocc/gittest.git  
# 注：用IDEA clone git项目，出现clone failed. Could not read from remote repository错误时
Settings -> Version Control -> Git -> SSH Executable 把 Built-in 改成 Native
# 状态查询命令
git status
```
###	19)右键idea项目中的src(之前add到git库的文件夹)，此时会有Git选项，可以通过此选项进行相关的操作
```shell
如果没有Git选项，确认上面的操作无误后，idea菜单栏，VCS -> Enable Version Control Integration... -> 下拉框选 Git
```
###	20)禁止git用户的shell登陆
```shell
vi /etc/passwd 
将 git:x:501:501::/home/git:/bin/bash 修改为 git:x:501:501::/home/git:/usr/git/bin/git-shell
```
