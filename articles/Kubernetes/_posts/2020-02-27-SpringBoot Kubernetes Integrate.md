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