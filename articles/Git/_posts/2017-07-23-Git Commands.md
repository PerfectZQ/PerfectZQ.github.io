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
* [一张脑图带你掌握Git命令](https://juejin.im/post/6869519303864123399#heading-2)

## 查看命令介绍
```shell
# 查看$ git命令介绍
$ git [command] -h,--help
```

## Git 的大致流程
![有帮助的截图]({{ site.url }}/assets/git_flow.image)

## Git 的三种内部状态管理机制
要理解 Git 的原理，我们就需要了解 Git 的三种内部状态管理的机制
* The Working Directory -> Workspace
* The Staging Index -> Index
* Commit Tree(Head) -> Local Repository

理解了这些，对于我们理解和使用命令有很大的帮助。首先我们先做一下准备工作
```shell
# 创建一个用于 Working Directory 映射的本地文件夹
$ mkdir git_reset_test
$ cd git_reset_test/
# 初始化本地 Git 库，会在当前文件夹加生成 .git 文件夹
$ git init .
Initialized empty Git repository in /git_reset_test/.git/
$ touch reset_lifecycle_file
# 将 Working Directory 中的 reset_lifecycle_file 添加到 Staging Index
$ git add reset_lifecycle_file
# 将 Staging Index 中的变更(添加了一个文件)提交到 Commit Tree
$ git commit -m"initial commit"
[master (root-commit) d386d86] initial commit
1 file changed, 0 insertions(+), 0 deletions(-)
create mode 100644 reset_lifecycle_file
```

### The Working Directory
Working Directory 与本地文件系统同步，代表对目录和文件中内容的立即更改，可以简单理解为本地项目代码文件的实时映射。

```shell
# 修改 reset_lifecycle_file 文件内容
$ echo 'hello git reset' > reset_lifecycle_file

# 调用 git status 发现 Git 已经意识到了文件的内容变更，这部分内容变更的记录就存储在 Working Directory
# git status 命令可以查看 Working Directory 的变更记录。
$ git status 
On branch master 
Changes not staged for commit: 
    (use "git add <file>..." to update what will be committed)
    (use "git restore <file>... | git checkout -- ..." to discard changes in working directory)
        modified: reset_lifecycle_file
```

### Staging Index
Staging Index 用于跟踪在 Working Directory 中，由`git add`添加的变更，这些变更会在下一次`git commit`时被存储。Staging index 是一个复杂的内部缓存机制。 Git 通常试图向用户隐藏 Staging index 的实现细节。为了准确查看暂存索引的状态，我们必须利用鲜为人知的Git命令`git ls-files`。 `git ls-files`命令本质上是一个调试实用程序，用于检查暂存索引树的状态。

```shell
# 查看处于 Staging Index 的文件列表，-s, --stage 展示额外的元数据信息。
# 比较重要的是第二列，是当前处于 Staging Index 中文件文本内容的 Hash，即 Object SHA
$ git ls-files -s 
100644 e69de29bb2d1d6434b8b29ae775ad8c2e48c5391 0 reset_lifecycle_file

# 将修改后的 reset_lifecycle_file 添加到 Staging index
$ git add reset_lifecycle_file 
$ git status 
On branch master Changes to be committed: 
Changes to be committed:
  (use "git restore --staged <file>... | git reset HEAD ..." to unstage)
        modified:   reset_lifecycle_file

# 查看文件 Object SHA 已经变了，并会在下次执行 git commit 时存储该变更
$ git ls-files -s
100644 d7d77c1b04b5edd5acfc85de0b592449e5303770 0 reset_lifecycle_file
```
### Commit History
`git commit`命令把变更添加到 Commit History 中的永久快照，快照还包括提交时 Staging Index 的状态。提交后，代码就保存到了`Local Repository`

```shell
$ git commit -am"update content of reset_lifecycle_file"
[master dc67808] update content of reset_lifecycle_file
1 file changed, 1 insertion(+)

$ git status
On branch master
nothing to commit, working tree clean
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
# 删除磁盘文件，并删除已经提交到本地库中的文件
$ git rm -r target/

# 只删除已经提交到本地存储库中的文件，保留磁盘上的文件(即取消 git add)
$ git rm --cached -r target/
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

## 配置
```shell
# 配置用户名
$ git config --global user.name "zhangqiang"

# 配置邮箱
$ git config --global user.email "inteli_zq@163.com"

# 在 config 中配置用户名密码
# ==== 方式1: 
# 设置记住密码，长期
$ git config --global credential.helper store
# 下次输入用户名和密码的时候就会自动保存明文密码到 ~/.git-credentials
# 设置记住密码，默认 15 分钟后失效
$ git config --global credential.helper cache
# 设置记住密码，一个小时之后失效
$ git config credential.helper 'cache --timeout=3600'
# ==== 方式2:
$ echo "http://username:password@gitlab.com" > ~/.git-credentials
$ git config --global credential.helper 'store --file ~/.git-credentials'
# 看到如下信息表示成功
$ cat ~/.gitconfig
[user]
        name = zhangqiang
        email = zhangqiang@sensetime.com
[credential]
        helper = store
# ==== 方式3:
# 访问远程库地址时带上认证信息，特殊字符可以用 URLEncode 代替，比如 @ 可以用 %40 表示
http://yourname:password@github/name/project.git

# 重置远程库登录凭证信息，这样在修改密码后就可以重新设置密码了
$ git config --system --unset credential.helper
```

## 下载已有项目
```shell
# 克隆已有项目到本地，并重命名，不指定默认为 dataplat-meta
$ git clone https://gitlab.bj.example.com/plat-bigdata/dataplat-meta.git dlink-metadata
```

## 分支
### 查看分支
```shell
# 查看本地的所有分支
$ git branch

# 查看所有分支，包括远程分支
$ git branch -a
```

### 修改分支
```shell
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
```

### 常用操作
```shell
# 查看各个分支的最后一次提交的信息
$ git branch -v

# 推送指定本地分支到指定远程分支
$ git push origin test:test

# 切换分支
$ git checkout dev/zhangqiang

# 从指定分支(比如master)创建一个新的分支，并切换到新的分支，如果不指定分支，则默认从当前的分支创建新分支
$ git checkout -b dev/zhangqiang master

# 从远程分支创建一个新的分支，并切换到新的分支
$ git checkout -b dev/zhangqaing origin/remotebranch
```

### 查看分支的差异
```shell
# 查看所有有差异的文件列表
$ git diff branch1 branch2 --stat

# 查看所有有差异的文件的详细差异
$ git diff branch1 branch2
# a 代表 branch1, b 代表 branch2
diff --git a/test/jwt_test.go b/test/jwt_test.go 
index 3c0b9a7..3ee1eec 100644
# branch1 有 branch2 没有的代码用 - 前缀标识 
--- a/test/jwt_test.go
# branch2 有 branch1 没有的代码用 + 前缀标识
+++ b/test/jwt_test.go
# + 号标识的代码是 branch2 新增的
@@ -6,6 +6,8 @@ import (
        "xxx/eps-platform/cloud_sla/pkg/permissionclient"
        "xxx/gopkg/jsonx"
        "github.com/dgrijalva/jwt-go"
+       "os"
+       "runtime/pprof"
        "testing"
        "time"
 )

# 显示指定文件的详细差异
$ git diff branch1 branch2 filePath
```

### 合并分支
```shell
# 合并指定分支到当前分支(master)
$ git checkout master
# 默认将合并指定分支的所有 commits，这样保留了原来的所有 commit messages
$ git merge dev/zhangqiang

# 合并远程分支到当前分支
$ git merge origin dev/zhangqiang

# 当分支 merge 过程中遇到 merge conflict，修改冲突的文件后，执行一下操作
$ git add conflict_file
# 注意 git commit 不需要添加任何文件路径，或者加 -a
$ git commit -m "fix conflicts"
$ git push

# 当遇到 conflicts，放弃 merging
$ git reset --hard HEAD

# 将 dev/zhangqiang 分支的所有 commits merge 到当前分支(master)，但合并的时候只保留一条 commit 记录
$ git checkout master
# --squash 会暂停 commits 提交，并将所有的 commits 压缩为一条 commit 不加 --squash 参数的话默认会自
# 动提交要合并分支的所有的 commits
$ git merge --squash dev/zhangqiang
# 提交 commit，并指定 commit message
$ git commit -m 'develop:finished import data interface'

# 查看已经合并进当前分支的其他分支
$ git branch --merged

# 查看还没有合并进当前分支的其他分支
$ git branch --no-merged

# 合并其他分支单一文件
$ git checkout other_branch_name a/b/abc.txt
# 合并其他分支单一文件，交互式 -p(--patch)
$ git checkout other_branch_name -p a/b/abc.txt

# merge 时排除指定的文件
# 首先需要添加一个名叫 ignore 的 merge driver，true 表示使用这个 merge driver 的文件在 merge 
# 的时候什么都不会做，也就是保持不变
$ git config --global merge.ignore.driver true
$ git checkout test
$ vim .gitattributes
.gitlab-ci.yml merge=ignore
$ git commit .gitattributes -m "init .gitattributes"
$ git checkout master
$ vim .gitattributes
.gitlab-ci.yml merge=ignore
$ git commit .gitattributes -m "init .gitattributes"
# 如果想忽略某个文件，比如.gitlab-ci.yml，需要先修改 test 分支的文件并提交，再修改 master 
# 的文件并提交，然后 merge，才能成功忽略，因为.gitattributes 首次识别时是由文件的更新时间
# 来确定保留识别的，如果 test 的某个文件的修改不想合并到 master 分支上的话，那么 master 的
# 文件上的修改时间必须在 test 的修改时间之后，否则忽略不成功。以后 test 再对该文件的修改就
# 不会合并到 master 上了。
```
当你仅仅需要另一个分支的某几个 commits 时，并非全部的代码变更，可以使用`Cherry pick`
* [git cherry-pick](https://www.ruanyifeng.com/blog/2020/04/git-cherry-pick.html)


### 恢复删除的分支
```
# 恢复已经删除的分支，需要配合 git reflog 查找 <hash_val>
$ git reflog
...
104e242 HEAD@{8}: checkout: moving from master to dev/zhangqiang
...
# 从历史分支中创建一个分支
$ git branch dev/zhangqiang_recovery HEAD@{8}
```


## 打标签
* [Git 基础 - 打标签](https://git-scm.com/book/zh/v1/Git-%E5%9F%BA%E7%A1%80-%E6%89%93%E6%A0%87%E7%AD%BE)

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

# push 所有 tags 到远程库
$ git push --tags

# 删除本地标签
$ git tag -d v1.4
# 删除远程标签
$ git push origin :refs/tags/v1.4
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

# 查看本地 所有分支(注意不只是当前分支的) 的所有操作记录(包括`checkout`、`commit`、`reset`的操作和甚至已经被删除的
# `commit`记录)。`git log`不能看已经删除了的`commit`记录，因此回退之后想再回到之前的版本就需要这个命令了
$ git reflog
...
104e242 HEAD@{8}: checkout: moving from master to dev/zhangqiang
...

# 显示 commit 的相对时间，而非序号
$ git reflog --relative-date
...
104e242 HEAD@{3 days ago}: checkout: moving from master to dev/zhangqiang
...
```

## 重写历史
* [Rewriting History](https://www.atlassian.com/git/tutorials/rewriting-history)

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
* [git rebase](https://www.atlassian.com/git/tutorials/rewriting-history/git-rebase)

Rebasing 是集成上游变更到本地库的常用方式，当使用`git merge`合并上游变更时往往会导致多余的 commit，而 rebase 会生成完美的线性提交历史，更加清爽。

```shell
# 将一系列 commits 组合成一个新的 commit
$ git rebase --help
```

> 使用`rebase`之前保证当前分支所有处于`staging area`的文件都已 commit

```shell
# 标准模式: rebase 会自动将当前分支中的所有新的 commits(不包括和 <base> 中相同的 commits)添加
# 到 <base> 之上，然后将 <base> 中的变更合并到 <current branch>，这个过程可能会发生合并冲突。
# 换句话说，rebase 就是把我的变更 <current branch> 建立在所有其他人 <base> 已做过的变更之上，
# 当然如果 <current branch> 没有任何新的变更操作，就会单纯的把 <base> 的变更合并进 <current 
# branch>。
# <base> 可以是任何类型的 commit reference(e.g.: commit id、branch name、a tag or a
# relative reference to HEAD)

$ git rebase <base>
First, rewinding head to replay your work on top of it...
Applying: modify


# 交互模式: 通过删除、拆分和更改现有的一系列提交来清理历史记录，可以更改流程中的单个 commit，而不是
# 盲目的移动所有的 commits，交互模式会打开一个编辑器，可以输入命令为每个要 rebase 的 commit 进行
# 操作，确定如何将单个 commit 传输到新 base。还可以对 commit list 重新排序，一旦为 rebase 中的
# 每个 commit 指定了命令，Git 就开始回放 commits，从上到下一次执行每条 rebase 命令
# 使用 -i,--interactive  进入交互模式

$ git rebase -i [base]
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



# ------------------ Example -----------------
# 刪除某次已提交的 commit，假设我要删除 4886a61
# 查看 commitId
$ git log
commit 0b4e1e22646604a4e8e2497af5650d3de60c8920 (HEAD -> master)
Author: zhangqiang <zhangqiang@sensetime.com>
Date:   Wed Jan 6 19:48:51 2021 +0800

    add senselink oss download task

commit 4886a61c2ea51cc3c95aca754c8bcd01b91e316f
Author: zhangqiang <zhangqiang@sensetime.com>
Date:   Wed Jan 6 19:41:28 2021 +0800

    add senselink oss download task

commit 6c65510d3ce98677e7ab9817e696177e619a0501 (gitlab/master)
Author: zhangqiang <zhangqiang@sensetime.com>
Date:   Tue Jan 5 17:42:46 2021 +0800

    add security test scanner
...

# 对 commit id 前几位为 6c65510 的 commit 之后的 commit 进行 rebase
$ git rebase -i 6c65510
# 可以看到之后的 6c65510 之后的 commits 4886a61，0b4e1e2
pick 4886a61 add senselink oss download task
pick 0b4e1e2 add senselink oss download task
# Rebase 6c65510..0b4e1e2 onto 6c65510 (2 commands)
#
...
# 按 i 进入编辑模式后，输入 drop [commitId]，这里的 commitId 就是你要删除的 commitId
# 将 4886a61 前的 pick 修改为 drop
drop 4886a61 add senselink oss download task
pick 0b4e1e2 add senselink oss download task
...
# 按 esc 退出编辑模式 :wq 保存退出

interactive rebase in progress; onto 6c65510
Last commands done (2 commands done):
   drop 4886a61 add senselink oss download task
   pick 0b4e1e2 add senselink oss download task
No commands remaining.
You are currently rebasing branch 'master' on '6c65510'.

nothing to commit, working tree clean
# 6c65510 这个分支已经之前提交过，如果要重复提交，需要做空提交 git commit --allow-empty
The previous cherry-pick is now empty, possibly due to conflict resolution.
If you wish to commit it anyway, use:

    git commit --allow-empty
# 跳过
Otherwise, please use 'git cherry-pick --skip'
Could not apply 0b4e1e2... add senselink oss download task

$ (master|REBASE-i 2/2) git cherry-pick --skip
$ (master|REBASE-i 2/2) git rebase --continue

# 查看之后的 commit 已经都没了，但是 git ref 中还可以看到，因为 rebase 并不是真正的把提交到本地库的文件都删除了，它只是删除了提交记录
# 要删除文件执行 `git rm` 或者 `git rm --cached`
$ git log

# reset 还是可以回到相应的 commit
$ git reset --hard 0b4e1e2
```

>由于新 commit 将替换掉旧的 commit，因此不要在已公开的 commit 中使用 git rebase，否则项目历史记录将会消失。

#### Merge 和 Rebase 合并分支的区别
假设当前提交记录如下
![有帮助的截图]({{ site.url }}/assets/git/git_example.jpg){:width="550px" height="350px"}

使用 merge 的方式把`feat02`合并到`feat01`分支
```shell
$ git checkout feat01
$ git merge feat02
```
![有帮助的截图]({{ site.url }}/assets/git/git_merge.jpg){:width="660px" height="300px"}
其中的虚线表示 feat01 包含上面 feat02 分支当中的两次 commits

使用 rebase 的方式把`feat02`合并到`feat01`分支
```shell
$ git checkout feat02
$ git rebase feat01
```
![有帮助的截图]({{ site.url }}/assets/git/git_rebase_1.jpg){:width="800px" height="300px"}
将 feat02 的两个改动，以续的方式添加到 feat01 的尾部
```shell
# 返回 feat01 
$ git checkout feat01
# 合并 feat02
$ git merge feat02
```
![有帮助的截图]({{ site.url }}/assets/git/git_rebase_2.jpg){:width="730px" height="300px"}
可以看到提交历史是非常线性的，而且拥有完整的提交记录




### 删除某个文件的所有 git 提交记录
当不小心 commit 了某个超大文件，在 push 的时候会出现 `remote: fatal: pack exceeds maximum allowed size`
* [Removing sensitive data from a repository](https://help.github.com/en/github/authenticating-to-github/removing-sensitive-data-from-a-repository)

```shell
# 删除指定文件本地所有历史提交记录
# 注意文件必须使用相对路径，使用绝对路径会出现 xxx is outside repository 的 fatal
# 遍历本地所有 branch 所有的 commits，执行 git rm --cached 操作
$ git filter-branch --force --index-filter \
'git rm --cached --ignore-unmatch articles/Java/_posts/2017-07-20-split\(\)和replace\(\)方法特殊字符的处理.md' \
--prune-empty --tag-name-filter cat -- --all
....
Rewrite 0b30bca6fbc19366d79fe3db40cc98865815991b (2416/2419) (466 seconds passed, remaining 0 predicted)    rm 'articles/Java/_posts/2017-07-20-split()和replace()方法特殊字符的处理.md'
Rewrite 2eb7b50c93766d5baf7b84292b4620b1aa034b72 (2416/2419) (466 seconds passed, remaining 0 predicted)    rm 'articles/Java/_posts/2017-07-20-split()和replace()方法特殊字符的处理.md'
Rewrite 22c48d18d1904cba062a200314f9cb6ec9a901a2 (2416/2419) (466 seconds passed, remaining 0 predicted)    rm 'articles/Java/_posts/2017-07-20-split()和replace()方法特殊字符的处理.md'

Ref 'refs/heads/master' was rewritten
Ref 'refs/remotes/origin/master' was rewritten
Ref 'refs/remotes/origin/develop' was rewritten
WARNING: Ref 'refs/remotes/origin/master' is unchanged

# 同步到所有 branch
$ git push origin --force --all
# 同步到所有 tags
$ git push origin --force --tags

# 强制解除对 local repository 所有对象的引用
$ git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
$ git reflog expire --expire=now --all

# 执行垃圾回收
$ git gc --prune=now
Enumerating objects: 12635, done.
Counting objects: 100% (12635/12635), done.
Delta compression using up to 4 threads
Compressing objects: 100% (6426/6426), done.
Writing objects: 100% (12635/12635), done.
Total 12635 (delta 7933), reused 7429 (delta 4750)

# 查看文件历史记录是否全部被清空
$ git log "articles/Java/_posts/2017-07-20-split\(\)和replace\(\)方法特殊字符的处理.md"
```

## 撤销提交和更改
* [Undoing Commits & Changes](https://www.atlassian.com/git/tutorials/undoing-changes)

### reset
* [Git Reset](https://www.atlassian.com/git/tutorials/undoing-changes/git-reset)

`reset`是一个用于撤销变更的复杂且通用的命令，它主要有三种调用形式，`--soft`、`--mixed`、`--hard`，分别对应了 Git 的三种内部状态管理机制，即 Commit Tree(Head)、The Staging Index、The Working Directory 要正确理解改命令的使用，我们必须先了解下 Git 内部状态管理机制，有时候这些机制又被称为 Git 的 three trees，称为树可能用词不当，因为他们并不是严格的传统树数据结构，但他们是 Git 用于跟踪编辑时间线的基于节点和指针的数据结构

```shell
$ git reset

# 撤销某个文件已经 add 暂存区(Staging Index)，但是还没 commit 到工作区(Working Directory)的修改
# 1) 将文件从索引区移除（但已做的修改会保留在工作区，只是还未提交）
$ git reset HEAD [filename]
# 2) 撤销工作区中文件的修改
$ git checkout [filename]

# 一般配合 git reflog 使用
$ git reflog 
e088c79 (HEAD -> prod, gitlab/test, test) HEAD@{0}: checkout: moving from test to prod
e088c79 (HEAD -> prod, gitlab/test, test) HEAD@{1}: checkout: moving from prod to test
e088c79 (HEAD -> prod, gitlab/test, test) HEAD@{2}: merge test: Fast-forward
bceced2 (gitlab/prod) HEAD@{3}: reset: moving to HEAD@{15}

# 回退到 bceced2 版本的代码
$ git reset --hard HEAD@{3} | git reset --hard bceced2
```

## Links local repo to multi remote repos
* [Git 将本地仓库连接多个远程仓库](https://blog.csdn.net/qq_36667170/article/details/79336760)

```shell
$ git remote add [remote_repository_name_1] [remote_repository_url_1]
$ git remote add [remote_repository_name_2] remote_repository_url_2]
$ git push [remote_repository_name_1] [branch_name]
$ git push [remote_repository_name_2] [branch_name]
```

## Git Extension
下面有一些比较有意思的开源项目
* [git-history](https://github.com/pomber/git-history)，以图形界面的形式展示任意Git Repository中单个文件的Git history，里面有visual code的插件，`Command/Ctrl + Shift + P`输入`Git File History`就可以使用了

## Git Submodule
项目中经常使用别人维护的模块，在git中使用子模块的功能能够大大提高开发效率。使用子模块后，不必负责子模块的维护，只需要在必要的时候同步更新子模块即可。

```shell
# 查看使用帮助
$ git submodule -h
usage: git submodule [--quiet] [--cached]
   or: git submodule [--quiet] add [-b <branch>] [-f|--force] [--name <name>] [--reference <repository>] [--] <repository> [<path>]
   or: git submodule [--quiet] status [--cached] [--recursive] [--] [<path>...]
   or: git submodule [--quiet] init [--] [<path>...]
   or: git submodule [--quiet] deinit [-f|--force] (--all| [--] <path>...)
   or: git submodule [--quiet] update [--init] [--remote] [-N|--no-fetch] [-f|--force] [--checkout|--merge|--rebase] [--[no-]recommend-shallow] [--reference <repository>] [--recursive] [--] [<path>...]   
   or: git submodule [--quiet] set-branch (--default|--branch <branch>) [--] <path>
   or: git submodule [--quiet] set-url [--] <path> <newurl>
   or: git submodule [--quiet] summary [--cached|--files] [--summary-limit <n>] [commit] [--] [<path>...]
   or: git submodule [--quiet] foreach [--recursive] <command>
   or: git submodule [--quiet] sync [--recursive] [--] [<path>...]
   or: git submodule [--quiet] absorbgitdirs [--] [<path>...]
```

### 添加子模块
```shell
$ git submodule add <repository> [path]
# 执行成功后, 可以看到项目修改了 .gitmodules，并增加了一个新文件（刚刚添加的路径）
$ git status 
# 查看修改内容
$ git diff --cached
# 提交子模块
$ git commit .
```

### 初始化子模块
新克隆的项目默认子模块下没有任何内容。需要初始化并完成子模块的加载
```shell
$ git submodule init 
$ git submodule update
# 或者直接执行
$ git submodule update --init --recursive
```

### 更新子模块代码
```shell
# 子模块代码提交之后，在父模块中执行如下操作
$ git pull --recurse-submodules && git submodule update --recursive
$ git submodule foreach git pull origin dev

$ git add submodule_dir_name
$ git commit -m "commit message"
# 将子模块的更新推到父模块库（本地分支:远程分支）
$ git push origin test:test
```

### 删除子模块
```shell
# 删除子模块目录及源码
$ rm -rf submodule_dir_name
#  删除项目目录下.gitmodules文件中子模块相关条目
$ vi .gitmodules
# 删除配置项中子模块相关条目
$ vi .git/config
# 删除模块下的子模块目录，每个子模块对应一个目录，注意只删除对应的子模块目录即可
$ rm .git/module/*

# 如果添加新的module报错，清一下缓存
$ git rm --cached submodule_dir_name

# 完成删除后提交到仓库即可
$ git commit
```

## 拉取远程代码
```shell
# 可以 master 分支在本地库有 2 个分支 master，remotes/origin/master
# remotes/origin/master 是远程分支在本地的映射分支，可以简单理解为是远程仓库在本地的缓存
$ git branch -a
* master
  remotes/origin/HEAD -> origin/master
  remotes/origin/master

# 同步远程库代码到本地 remotes/origin/master
$ git fetch
# 将本地 remotes/origin/master 合并到 master 分支
$ git merge 
# 根据配置不同 git pull = git fetch + git merge 或者 git fetch + git rebase
$ git pull

# 修改 pull 默认配置为 rebase
$ git config --global --add pull.rebase true
# 查看是否修改成功
$ git config --global -l
# 删除配置
$ git config --global --unset pull.rebase
```