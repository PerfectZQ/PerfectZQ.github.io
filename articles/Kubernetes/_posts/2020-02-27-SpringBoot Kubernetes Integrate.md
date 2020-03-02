---
layout: post
title: SpringBoot Gitlab CI and Kubernetes Integrate
tag:  Kubernetes
---

## .gitlab-ci.yml
[Configure reference](https://docs.gitlab.com/ee/ci/yaml/README.html)

```yaml
image: $IMAGE_REGISTRY/workplatform/mvn

variables:
  DOCKER_DRIVER: overlay
  NAMESPACE: dlink-test
  IMAGE_REGISTRY: registry.example.com
  GIT_SUBMODULE_STRATEGY: recursive
  GIT_STRATEGY: clone
  GIT_CHECKOUT: "true"
  SERVICE_NAME: meta-plat-service
  TEST_IMAGE_NAME: $IMAGE_REGISTRY/plat-bigdata/dlink-metadata-test
  PREFIX_TAG: v1
  TEST_CONTAINER_NAME: dlink-metadata-test

stages:
  - package
  - build
  - deploy
#  - release

maven-package:
  image: $IMAGE_REGISTRY/workplatform/mvn
  stage: package
  only:
    - test # branch name
  tags:
    - k8s
  script:
    - echo "Executing maven package..."
    - echo "JAVA_HOME=$JAVA_HOME"
    - mvn clean package -pl $SERVICE_NAME -am
  artifacts:
    paths:
      - ${SERVICE_NAME}/target/*.jar

docker-build:
  image: docker:latest
  stage: build
  only:
    - test # branch name
  script:
    - echo "Building Dockerfile based application..."
    - export TAG=$PREFIX_TAG-${CI_COMMIT_SHA:0:8}
    - docker build -t $TEST_IMAGE_NAME:$TAG ./$SERVICE_NAME/
    - docker login $IMAGE_REGISTRY -u $RES_USER -p $RES_PASSWD
    - docker push $TEST_IMAGE_NAME:$TAG

k8s-deploy:
  image: $IMAGE_REGISTRY/plat-bigdata/dlink-test-kube:latest
  stage: deploy
  tags:
    - k8s
  only:
    - test # branch name
  dependencies: []
  script:
    - echo "Deploying to kubernetes ..."
    - export TAG=$PREFIX_TAG-${CI_COMMIT_SHA:0:8}
    - kubectl set image deployment/$TEST_CONTAINER_NAME $TEST_CONTAINER_NAME=$TEST_IMAGE_NAME:$TAG -n $NAMESPACE

release:
  stage: release
  script:
    - echo "release to prod env..."
  when: manual
```

## Rancher
* [Rancher 2: Difference between NodePort, HostPort and Cluster IP](https://stackoverflow.com/questions/50709001/rancher-2-difference-between-nodeport-hostport-and-cluster-ip)

Rancher 2 provides 4 options in the "Ports" section when deploying a new workload:

1. NodePort (On every node)
2. HostPort (Nodes running a pod)
3. Cluster IP (Internal only)
4. Layer-4 Load Balancer

What are the differences? Especially between NodePort, HostPort and Cluster IP?

首先`NodePort`和`HostPort`都是需要向 Cluster 外暴露端口的，区别如下
* `NodePort`会在集群的每一个物理节点上暴露一个端口，但是会自动做端口映射，比如你的程序指定了端口`8088`，它默认会将把该端口随机映射到物理机`30,000~33,000`的一个端口`ExposePort`并暴露出来（也可以指定，但必须在范围内），你用任何一台物理机的`NodeIp:ExposePort`都可以正确访问服务(尽管你实际只是指定了1个`pod`，而你的集群物理节点有5台)，因此适合做负载均衡。
* `HostPort`需要你指定一台物理节点，如果你不指定默认就是`0.0.0.0`，然后手动指定一个`ExposePort`，