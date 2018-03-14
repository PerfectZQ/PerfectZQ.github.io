---
layout: post
title: Pregel API
tag: Spark GraphX
---
## Pregel 介绍
　　谷歌公司在2003年到2004年公布了GFS、MapReduce和BigTable，成为后来云计算和Hadoop项目的重要基石。谷歌在后Hadoop时代的新"三驾马车"——Caffeine(大规模网页索引构建，即爬虫)、Dremel(实时交互式查询，PB级数据2-3秒即可给出查询结果)和Pregel，再一次影响着圈子与大数据技术的发展潮流。

　　Pregel是一种基于BSP模型实现的并行图处理系统。为了解决大型图的分布式计算问题，Pregel搭建了一套可扩展的、有容错机制的平台，该平台提供了一套非常灵活的API，可以描述各种各样的图计算Pregel作为分布式图计算的计算框架，主要用于图遍历、最短路径、PageRank计算等等。

　　本文主要讲解 Spark GraphX 对于 Pregel API 的实现。

## Pregel API
　　下面讲解 Spark GraphX 对 Pregel API 实现的源码
```scala
/**
   * 本方法是执行类似 Pregel 并行迭代顶点的抽象
   *
   * `vprog`: 在每个顶点上并行执行，接收任何入站消息并计算顶点的新值。
   * `sendMsg`: 在当前迭代中接收到消息的顶点的 out-edges 上被调用，并用于计算到目标顶点的可选消息。
   * `mergeMsg`: 一个交换关联函数，用于合并注定到同一个顶点的消息。
   *
   * 本方法会一直迭代运行，直到没有剩余的消息或者迭代了`maxIterations`次。
   * 
   * 在第一次迭代中，所有顶点都会接收到`initialMsg`，并且在后续迭代中，如果
   * 一个顶点没有收到消息，则不会再对该顶点调用`vprog`。
   *
   * 一次迭代过程：向接收到消息的节点的出度发送消息，目的节点接收消息。 
   * 
   * 在当前迭代中接收到消息的顶点会立即调用`vprog`方法处理消息，然后进行下一次迭代，对接收到
   * 消息的顶点的出度调用`sendMsg`方法，将消息发送给目标顶点。
   * 
   * @tparam A the Pregel message type
   *
   * @param initialMsg the message each vertex will receive at the on
   * the first iteration
   *
   * @param maxIterations the maximum number of iterations to run for
   *
   * @param activeDirection 控制`sendMessage`方法作用于哪些方向的边。如果
   * `activeDirection`为`EdgeDirection.Out`，则只有在前一轮收到消息的顶点
   * 的 out-edges(出度) 才会运行`sendMsg`方法。
   *
   * @param vprog the user-defined vertex program which runs on each
   * vertex and receives the inbound message and computes a new vertex
   * value.  On the first iteration the vertex program is invoked on
   * all vertices and is passed the default message.  On subsequent
   * iterations the vertex program is only invoked on those vertices
   * that receive messages.
   *
   * @param sendMsg a user supplied function that is applied to out
   * edges of vertices that received messages in the current
   * iteration
   *
   * @param mergeMsg a user supplied function that takes two incoming
   * messages of type A and merges them into a single message of type
   * A.  ''This function must be commutative and associative and
   * ideally the size of A should not increase.''
   *
   * @return the resulting graph at the end of the computation
   *
   */
def pregel[A: ClassTag](
      initialMsg: A,
      maxIterations: Int = Int.MaxValue,
      activeDirection: EdgeDirection = EdgeDirection.Either)(
      // (接收到消息的顶点id, 顶点属性值, 接收到的消息) => 新的顶点值
      vprog: (VertexId, VD, A) => VD,
      // 接收到消息的顶点的出度 => (要接收的消息的目标顶点ID, 消息)
      sendMsg: EdgeTriplet[VD, ED] => Iterator[(VertexId, A)],
      mergeMsg: (A, A) => A)
    : Graph[VD, ED] = {
    Pregel(graph, initialMsg, maxIterations, activeDirection)(vprog, sendMsg, mergeMsg)
}
```
## 单源最短路径问题
　　给定一个带权有向图`G=(V,E)`，其中每条边的权是一个实数。另外，还给定V中的一个顶点，称为源。计算从源到其他所有顶点的最短路径长度。长度就是路径上各边权的和。这个问题就是单源最短路径问题。

　　下面通过 Spark GraphX 的 Pregel API 解决这个问题
```scala
object PregelAPI {

  // 使用 pregel API 计算单源最短路径
  def main(args: Array[String]): Unit = {

    val sparkSession = SparkSession.builder().master("local").getOrCreate()
    val sparkContext = sparkSession.sparkContext
    // vertexData:Long, edgeData:Double
    val graph: Graph[Long, Double] = GraphGenerators.logNormalGraph(sparkContext, numVertices = 10).mapEdges(_.attr.toDouble)
    val sourceId: VertexId = 3

    // Initialize the graph such that all vertices except the root have distance infinity.
    val initalGraph = graph.mapVertices {
      (vertexId, vertexData) =>
        if (vertexId == sourceId) 0.0 else Double.PositiveInfinity // opposite to NegativeInfinity
    }

    println("initalGraph...")

    initalGraph.vertices.foreach(println)
    initalGraph.edges.foreach(e => println(e.attr))

    println("pregel execute...")

    val sssp = initalGraph.pregel(Double.PositiveInfinity)(
      /**
        * id :        接收消息的顶点id
        * dist :      顶点属性值
        * newDist :   顶点接收到的消息 Message
        * return :    新的顶点值
        */
      (id, dist, newDist) => { // Vertex Program
        println(s"$id dist = $dist, new Dist = $newDist")
        math.min(dist, newDist)
      }, 
      triplet => { // Send Message
        if (triplet.srcAttr + triplet.attr < triplet.dstAttr) {
          Iterator((triplet.dstId, triplet.srcAttr + triplet.attr))
        } else {
          Iterator.empty
        }
      },
      (a, b) => math.min(a, b) // Merge Message，只保留最短路径
    )
    println(sssp.vertices.collect.mkString("\n"))
  }
}
```