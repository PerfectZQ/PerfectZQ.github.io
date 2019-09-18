---
layout: post
title: Ranking Theory
tag: ElasticSearch
---
## 检索模型
搜索结果的排序是搜索引擎最核心的部分，这就牵扯到用户查询条件和文档内容相关性的分析，对许相关性的分析，依赖于搜索引擎才用的检索模型。最重要的检索模型有，`布尔模型`，`向量空间模型`，`概率模型`，`语言模型`，`机器学习排序算法`。

[Lucene 相似度计算](http://lucene.apache.org/core/4_6_0/core/org/apache/lucene/search/similarities/TFIDFSimilarity.html)