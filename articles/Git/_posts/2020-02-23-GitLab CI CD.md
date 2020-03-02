---
layout: post
title: GitLab CI/CD
tag: Git
---

## Reference
* [用GitLab-Runner打造锋利的CI/CD](https://juejin.im/post/5cb5309cf265da034c701d74)

## CI CD
* 持续集成（Continuous Integration）指开发人员在特性分支（频繁）提交代码，立即执行构建和单元测试，代码通过测试标准后集成到主干的过程。强调的是分支代码的提交、构建与单元测试，这个过程的产出是单元测试报告。
* 持续交互（Continuous Delivery）是在持续集成的基础上，将构建的代码部署到「类生产环境」，完成QA测试之后手动部署到生成环境的过程。强调代码部署，这个过程产出测试报告。
* 持续部署（Continuous Deployment）是持续交互的下一步，强调部署生产环境代码的过程自动化，同时可以处理上线通知等操作。

## Gitlab-runner Install
* [Install GitLab Runner manually on GNU/Linux](https://docs.gitlab.com/runner/install/linux-manually.html)
* [GitLab Runner download](https://gitlab-runner-downloads.s3.amazonaws.com/latest/index.html)