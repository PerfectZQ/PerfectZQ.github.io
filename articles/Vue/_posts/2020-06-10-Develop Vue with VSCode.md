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
```

## Init vue project
```shell
# Ctrl + ` 打开 VS Code 命令终端，安装 vue-cli
$ yarn add vue-cli@latest
# Or
$ npm install -g vue-cli@latest

# 构建一个新的项目
$ vue init webpack ${projectName}

? Project name y
? Project description
? Author zhangqiang <zhangqiang@sensetime.com>
? Vue build standalone
? Install vue-router? Yes
? Use ESLint to lint your code? Yes
? Pick an ESLint preset Standard
? Set up unit tests Yes
? Pick a test runner jest
? Setup e2e tests with Nightwatch? Yes
? Should we run `npm install` for you after the project has been created? (recommended) npm

   vue-cli · Generated "vuelearn".


# Installing project dependencies ...
# ========================

```