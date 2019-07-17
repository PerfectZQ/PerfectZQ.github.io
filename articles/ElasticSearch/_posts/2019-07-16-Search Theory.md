---
layout: post
title: Search Theory
tag: ElasticSearch
---

## 索引和搜索过程

### 索引过程
1. 有一系列需要被索引的数据文件
2. 被索引的数据文件经过**语法分析**和**语言处理**形成一系列词(Term)。
3. 经过索引创建形成**词典**和**倒排索引表**。
4. 通过索引存储将索引写入硬盘。

### 搜索过程
1. 用户输入查询语句。
2. 对查询语句经过语法分析和语言分析得到一系列词(Term)。
3. 通过语法分析得到一个查询树。
4. 通过索引存储将索引读入到内存。
5. 利用查询树搜索索引，从而得到每个词(Term)的文档链表，对文档链表进行交，差，并得 到结果文档。
6. 将搜索到的结果文档对查询的相关性进行排序。
7. 返回查询结果给用户。

## Lucene 的索引文件格式
* Lucene 的索引过程，就是按照全文检索的基本过程，将倒排表写成此文件格式的过程。
* Lucene 的搜索过程，就是按照此文件格式将索引进去的信息读出来，然后计算每篇文档打分(score)的过程。

Lucene 的索引结构是有层次结构的，主要分成以下层次

### 索引(Index)
* 在 Lucene 中一个索引是放在一个文件夹中的。
* 同一文件夹中的所有的文件(不同类型的文件)构成一个 Lucene 索引。

### 段(Segment)
* 一个 Index 可以包􏰅多个 Segment，Segment 与 Segment 之间是独立的，添加新文档可以生成新的 Segment，不同的 Segment 可以合并。
* 如上图，具有相同前缀文件的属同一个 Segment，图中共两个段`_0`和`_1`。
* `segments.gen`和`segments_5`是段的元数据文件，也即它们保存了段的属性信息。

### 文档(Document)
* Document 是我们建 Index 的基本单位，不同的 Document 是保存在不同的 Segment 中的，一个 Segment 可以包含多篇 Document。
* 新添加的 Document 是单独保存在一个新生成的 Segment 中，随着 Segment 的合并，不同的 Document 会合并到同一个 Segment 中。

### 域(Field)
* 一篇 Document 包􏰅不同类型的信息，可以分开索引，比如标题，时间，正文，作者等， 都可以保存在不同的 Field 里。
* 不同 Field 的索引方式可以不同，在真正解析域的存储的时候，我们会详细解读。

### 词(Term)
* Term 是索引的最小单位，是经过词法分析和语言处理后的字符串。

Lucene 的索引结构中，即保存了正向信息，也保存了反向信息。

正向信息按层次保存了从索引，一直到词的包􏰅关系: Index –> Segment(segments.gen, segments_N) -> Document -> Field(fnm, fdx, fd) -> Term(tvx, tvd, tvf)，即此索引包􏰅了那些段，每个段包􏰅了那些文档，每个文档包􏰅了那些域，每个域包了那些词。
包含正向信息的文件有:
* `segments_N` 保存了此索引包含多少个 Segment，每个 Segment 包􏰅多少篇 Document。
* `*.fnm` 保存了此段包含了多少个 Field，每个 Field 的名称及索引方式。
􏰂* `*.fdx，*.fdt` 保存了此 Segment 包含􏰅的所有 Document ，每篇 Document 包含了多少 Field，每个 Field 保存了哪些信息。
* `*.tvx，*.tvd，*.tvf` 保存了此 Segment 包含􏰅多少 Document，每篇 Document 包含了多少 Field，每个 Field 包含了多少 Term，每个 Term 的字符串，位置等信息。

反向信息保存了词典到倒排表的映射: 词(Term)–>文档(Document)

包含反向信息的文件有:
* `*.tis，*.tii`保存了词典(Term Dictionary)，也即此段包􏰅的所有的词按字典顺序的排序。
* `*.frq`保存了倒排表，也即包含每个 Term 的 DocumentID 列表。
* `*.prx`保存了倒排表中每个 Term 在包含此 Term 的 Document 中的位置。