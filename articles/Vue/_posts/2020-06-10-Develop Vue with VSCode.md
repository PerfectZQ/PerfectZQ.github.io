---
layout: post
title: Develop Vue with VSCode
tag:  Vue
---

## Install NodeJS
* [Node.js](https://nodejs.org/en/download/)

NodeJs 会自动安装 js 包管理工具`npm`，安装的时候注意选择把命令添加到 path 就好了

```shell
# Usages
$ npm -l
```

## Install js package manage tool yarn
* [yarn](https://classic.yarnpkg.com/lang/en/)
* [yarn cli docs](https://yarnpkg.com/en/docs/cli/)

yarn 解决了 npm 存在的一些缺陷，编译起来会更快

```shell
# Usages
$ yarn help
$ yarn help COMMAND

# Add path
$ export PATH="$PATH:`yarn global bin`:$HOME/.config/yarn/global/node_modules/.bin"

# Config registry
$ yarn config set registry 'https://registry.npm.taobao.org'
```

## Init vue project
* [Vue CLI](https://cli.vuejs.org/)

```shell
# ========= Vue CLI 2 ==========

# Install Vue CLI 2
$ yarn global add vue-cli@latest
# Or
$ npm install -g vue-cli@latest

# Init project
$ vue init webpack vuelearn

# ========= Vue CLI 3/4 ==========

# Uninstall Vue CLI 2
$ yarn global remove vue-cli
# Or
$ npm uninstall -g vue-cli

# Install Vue CLI 3
$ yarn global add @vue/cli
# Or
$ npm install -g @vue/cli

# Create a project
$ vue create ${projectName}
# OR
$ vue ui
```