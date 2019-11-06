---
layout: post
title: Git Commands
tag: Git
---

## 教程参考
* [Git Reference Manual](https://git-scm.com/docs)
* [Pro Git -  Scott Chacon & Ben Straub](https://git-scm.com/book/en/v2)
* [Become a git guru](https://www.atlassian.com/git/tutorials)
* [Git scm](https://git-scm.com/book/zh/v2)

## 查看命令介绍
```shell
# 查看$ git命令介绍
$ git [command] -h,--help
```

## 初始化本地库
```shell
# 创建一个本地库，在当前文件夹下生成 .git 文件夹，用于 trace 当前文件夹下和子文件夹下的所有文件
$ git init

# 查看处于暂处(staging)状态的修改记录
$ git status
```

## 提交更新到本地库
```shell
# 添加变更信息，将文件添加暂存区(staging area)，Git 会监控暂存区的所有文件的变更
# 并通过 commit 将变更提交到 git repository
$ git add file [file1 file2 ...]

# 提交 staging area 中的文件变更
# -m 变更注释
$ git commit file [file1 file2 ...] -m "commit comment"

# -a 提交 staging area 所有文件的变更
$ git commit -a -m "commit comment"
```

## 删除
```shell
# 删除磁盘文件，并删除本地库中的文件
$ git rm -r target/

# 只删除存储库中的文件
$ git rm -r --cached target/
```

## 远程库
```shell
# 添加远程库，`origin`是远程库的名字
$ git remote add origin https://github.com/git-username/program-name.git 

# 查看当前关联的所有远程库(远程库名称、远程库地址)，什么都不显示表示没有
$ git remote -v

# 删除已经关联的远程库
$ git remote rm origin
```

## 分支
```shell
# 查看本地的所有分支
$ git branch

# 查看所有分支，包括远程分支
$ git branch -a

# 创建分支
$ git branch dev/zhangqiang

# 删除分支
$ git branch -d dev/zhangqiang

# 强制删除分支
$ git branch -D dev/zhangqiang

# 删除远程库中的分支，需要验证信息
$ git push origin :dev/zhangqiang

# 本地分支重命名
$ git branch -m old_name new_name

# 查看各个分支的最后一次提交的信息
$ git branch -v

# 切换分支
$ git checkout dev/zhangqiang

# 从指定分支(比如master)创建一个新的分支，并切换到新的分支，如果不指定分支，则默认从当前的分支创建新分支
$ git checkout -b dev/zhangqiang master

# 从远程分支创建一个新的分支，并切换到新的分支
$ git checkout -b dev/zhangqaing origin/remotebranch

# 合并指定分支到当前分支(master)
$ git checkout master
# 默认将合并指定分支的所有 commits，这样保留了原来的所有 commit messages
$ git merge dev/zhangqiang

# 合并远程分支到当前分支
$ git merge origin dev/zhangqiang

# 查看已经合并进当前分支的其他分支
$ git branch --merged

# 查看还没有合并进当前分支的其他分支
$ git branch --no-merged

# 将 dev/zhangqiang 分支的所有 commits merge 到当前分支(master)，但合并的时候只保留一条 commit 记录
$ git checkout master
# --squash 会暂停 commits 提交，并将所有的 commits 压缩为一条 commit 不加 --squash 参数的话默认会自
# 动提交要合并分支的所有的 commits
$ git merge --squash dev/zhangqiang
# 提交 commit，并指定 commit message
$ git commit -m 'develop:finished import data interface'

# 恢复已经删除的分支，需要配合 git reflog 查找 <hash_val>
$ git reflog
...
104e242 HEAD@{8}: checkout: moving from master to dev/zhangqiang
...
# 从历史分支中创建一个分支
$ git branch dev/zhangqiang_recovery HEAD@{8}
```

## 打标签
[Git 基础 - 打标签](https://git-scm.com/book/zh/v1/Git-%E5%9F%BA%E7%A1%80-%E6%89%93%E6%A0%87%E7%AD%BE)

Git 使用的标签有两种类型：轻量级的（lightweight）和含附注的（annotated）。轻量级标签就像是个不会变化的分支，实际上它就是个指向特定提交对象的引用。而含附注标签，实际上是存储在仓库中的一个独立对象，它有自身的校验和信息，包含着标签的名字，电子邮件地址和日期，以及标签说明，标签本身也允许使用 GNU Privacy Guard (GPG) 来签署或验证。一般我们都建议使用含附注型的标签，以便保留相关信息；当然，如果只是临时性加注标签，或者不需要旁注额外信息，用轻量级标签也没问题。
```shell
# 添加一个含附注的标签
$ git tag -a v1.4 -m 'my version 1.4'

# 查看已经存在的标签
$ git tag
v1.4

# 查看某个标签的具体信息
$ git show v1.4
tag v1.4
Tagger: zhangqiang <inteli_zq@163.com>
Date:   Fri Apr 26 19:39:51 2019 +0800

my version 1.4

commit 024a6490b37326ab39ee0cbb88cc449f6ff6f6df (HEAD -> my_branch, tag: v1.4)
```

## 操作远程库
```shell
# 将本地库以提交的变更推送到远程库
# `origin`是远程库名称
# `dev/zhangqiang`是分支名称
# -u 可省略
$ git push -u origin dev/zhangqiang

# 强制推送(不检查不提醒、有可能覆盖别人更新的代码，慎用！！！！)
$ git push -f origin dev/zhangqiang

# 将远程库数据更新到本地
$ git fetch origin
```

## 查看提交历史信息
```shell
# 查看 git 提交日志，按`q`退出
# --pretty=online 可以简化输出信息
$ git log

# 查看本地所有分支的所有操作记录（包括`commit`、`reset`的操作和甚至已经被删除的
# `commit`记录。`git log`不能看已经删除了的`commit`记录，因此回退之后想再回到
# 之前的版本就需要这个命令了
$ git reflog
```

## 重写历史
[Rewriting History](https://www.atlassian.com/git/tutorials/rewriting-history)

### 修改最近一次的 Git commit
```shell
# 修改最近一次的 commit

# --amend 可以获取最近的 commit，并向它添加新的暂存(staging)更改。因此可以先向 Git 暂存区
# 域(staging area)添加新的更改，再用 --amend 修改之前的 commit。另外，即便暂存区域没有任
# 何新的修改，--amend 也会提示你修改上次 commit 的 commit message。
$ git commit --amend

# 如果我们本来想 commit a.txt 和 b.txt 两个文件，但是发现少提交了一个文件，可以使用
# --amend 来修改上次的 commit，并将暂存区域的 b.txt 也 commit 到 git，--no-edit
# 表示不修改上次 commit 的 commit message
$ git add a.txt
$ git commit "commit a.txt and b.txt"
$ git add b.txt
$ git commit --amend --no-edit
```

>Amended commits 实际上是全新的提交，之前被修改的 commit 将不会再存在于当前的分支上，因此应该尽量避免在公共分支上使用该参数，以免删掉其他开发人员的 commit 记录，或使得别人感到困惑，(我 commit 呢？！/我记得我之前的 commit 不是这样的啊，真是见鬼了！)

### 修改多个 Git commits
[git rebase](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)

Rebasing 是集成上游变更到本地库的常用方式，当使用`git merge`合并上游变更时往往会导致多余的 commit，而 rebase 会生成完美的线性提交历史，更加清爽。

```shell
# 将一系列 commits 组合成一个新的 commit
$ git rebase --help

# 准备工作
# 基于 master 分支创建一个新分支 feature
$ git checkout -b feature master
# 修改文件，然后提交
$ git commit -a -m "Adds new feature"

# 使用 rebase 之前保证当前分支所有处于 staging area 的文件都已 commit

# 标准模式: rebase 会自动将当前分支中的所有新的 commits(不包括和 <base> 中相同的 commits)添加
# 到 <base> 之上，然后将 <base> 中的变更合并到 <current branch>，这个过程可能会发生合并冲突。
# 换句话说，rebase 就是把我的变更 <current branch> 建立在所有其他人 <base> 已做过的变更之上，
# 当然如果 <current branch> 没有任何新的变更操作，就会单纯的把 <base> 的变更合并进 <current 
# branch>。
# <base> 可以是任何类型的 commit reference(e.g.: commit id、branch name、a tag or a
# relativereference to HEAD)

$ git rebase <base>
First, rewinding head to replay your work on top of it...
Applying: modify

# 交互模式: 通过删除、拆分和更改现有的一系列提交来清理历史记录，可以更改流程中的单个 commit，而不是
# 盲目的移动所有的 commits，交互模式会打开一个编辑器，可以输入命令为每个要 rebase 的 commit 进行
# 操作，确定如何将单个 commit 传输到新 base。还可以对 commit list 重新排序，一旦为 rebase 中的
# 每个 commit 指定了命令，Git 就开始回放 commits，从上到下一次执行每条 rebase 命令
# 使用 -i,--interactive  进入交互模式

$ git rebase -i
pick 826ad2a modify

# Rebase 6fa5c6f..826ad2a onto 6fa5c6f (1 command)
#
# Commands:
# - 保留该 commit 不做任何操作
# p, pick <commit> = use commit
# - 保留该 commit，但需要修改 commit message
# r, reword <commit> = use commit, but edit the commit message
# - 保留该 commit，但需要暂停回放，进行修改
# e, edit <commit> = use commit, but stop for amending
# - 保留该 commit，但需要将其合并上一个 commit
# s, squash <commit> = use commit, but meld into previous commit
# - 类似 squash ，但需要丢掉 commit message
# f, fixup <commit> = like "squash", but discard this commit's log message
# - 用 shell 执行命令(剩下的所有的行都认为是命令的一部分)，因此写在最后面
# x, exec <command> = run command (the rest of the line) using shell 
# - 删除 commit
# d, drop <commit> = remove commit
# - 给当前的 HEAD 起一个表签名
# l, label <label> = label current HEAD with a name
# - 重置到指定的 label
# t, reset <label> = reset HEAD to a label
# m, merge [-C <commit> | -c <commit>] <label> [# <oneline>]
# .       create a merge commit using the original merge commit's
# .       message (or the oneline, if no original merge commit was
# .       specified). Use -c <commit> to reword the commit message.
#
# These lines can be re-ordered; they are executed from top to bottom.
#
# If you remove a line here THAT COMMIT WILL BE LOST.
#
#       However, if you remove everything, the rebase will be aborted.
#
#
# Note that empty commits are commented out

# 在 rebase 交互模式中，edit 或 e 命令将在该提交上暂停 rebase playback(回放)，Git 会打断回
# 放，然后显示一条消息，并允许使用 git commit --amend 添加其他修改，如下
Stopped at 5d025d1... formatting
You can amend the commit now, with
git commit --amend
Once you are satisfied with your changes, run
git rebase --continue
```

>由于新 commit 将替换掉旧的 commit，因此不要在已公开的 commit 中使用 git rebase，否则项目历史记录将会消失。

## 撤销提交和更改
[Undoing Commits & Changes](https://www.atlassian.com/git/tutorials/undoing-changes)
### reset
[Git Reset](https://www.atlassian.com/git/tutorials/undoing-changes/git-reset)

`reset`是一个用于撤销变更的复杂且通用的命令，它主要有三种调用形式，`--soft`、`--mixed`、`--hard`，分别对应了 Git 的三种内部状态管理机制，即 Commit Tree(Head)、The Staging Index、The Working Directory 要正确理解改命令的使用，我们必须先了解下 Git 内部状态管理机制，有时候这些机制又被称为 Git 的 three trees，称为树可能用词不当，因为他们并不是严格的传统树数据结构，但他们是 Git 用于跟踪编辑时间线的基于节点和指针的数据结构

```shell
$ git reset

```

## Links local repo to multi remote repos
[Git 将本地仓库连接多个远程仓库](https://blog.csdn.net/qq_36667170/article/details/79336760)