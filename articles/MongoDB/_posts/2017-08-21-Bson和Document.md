---
layout: post
title: MongoDB 文档类解析
tag: MongoDB
---

## MongoDB 文档
　　Java Driver 中有这么几个类和接口来表示Bson文档
### BsonDocument
　　虽然对于用户来说，一般使用驱动的高阶API，不使用这个类，但是BsonDocument类对于驱动程序在内部管理文档至关重要。BsonDocument类可以表示任何具有安全类型的复杂的动态结构化文档。

例1：
```javascript
{ 
  "a" : "MongoDB", 
  "b" : [ 1, 2 ] 
}
```
　　可以用BsonDocument表示为：

```java
new BsonDocument().append("a", new BsonString("MongoDB"))
                  .append("b", new BsonArray(Arrays.asList(new BsonInt32(1), new BsonInt32(2))));
```
　　BsonDocument实现了类型安全的Map<String,BsonValue>接口，所以即便是`int`，`String`，`List`这种内置类型，仍然需要被包裹在BsonValue的子类中。要看BsonValue的子类详情，可以参阅 [BsonValue](http://mongodb.github.io/mongo-java-driver/3.5/javadoc/?org/bson/BsonValue.html) API 文档

### Document
　　大多数的应用程序会用Document类来替代BsonDocument类，Document类和BsonDocument类相似，也可以表示任何复杂的动态结构化文档，但是对于类型要求不像BsonDocument那么严格。Document实现的是Map<String,Object>接口，所以的对类型的要求更宽泛。

例1可以表示为：
```java
new Document().append("a", "MongoDB")
              .append("b", Arrays.asList(1, 2));
```
　　这样的写法代码写的更少，但是如果你不经意间使用了不支持的值类型时，可能会出现运行时错误。常用的值类型如下：

| BSON type | Java type |
| :-------- | :-------- |
| Document | org.bson.Document |
| Array | java.util.List |
| Date | java.util.Date |
| Boolean | java.lang.Boolean |
| Double | java.lang.Double |
| Int32 | java.lang.Integer |
| Int64 | java.lang.Long |
| String | java.lang.String |
| Binary | org.bson.types.Binary |
| ObjectId | org.bson.types.ObjectId |
| Null | null |

　　实际上是可以改变这些映射关系的，这么做的机制在[这里](http://mongodb.github.io/mongo-java-driver/3.5/bson/codecs/)

### DBObject
　　尽管不建议新的应用程序再使用它，但是从的2.X系列的驱动升级的应用程序可能继续使用DBObject接口来代表BSON文档，DBObject接口类似Document，因为他也将BSON的值表示为Object，但是它有一些不可能克服的缺点：
* 它是一个接口而不是一个类，所以它的API不能在不破坏二进制兼容性的情况下被扩展。
* 它并没有真正实现Map<Object,String>接口
* 它是一个接口，所以必须需要一个单独的具体类 BasicDBObject 去实现它。

### Bson
　　为了将上面这些全部结合在一起，驱动中有一个小而强大的接口Bson。任何代表BSON文档的类，不管是driver中包含的（例如上面的所说的Document等三种），还是第三方的包，都要实现Bson这个接口，这样就可以在高阶API中任何需要 BSON Document 的地方使用，因此可以根据给定的需要互换使用。

例如：
```java
// 下面代表的是一个意思
collection.find(new BsonDocument("x", new BsonInt32(1)));
collection.find(new Document("x", 1));
collection.find(new BasicDBObject("x", 1));
```

## 总结
* BsonDocument 和 Document 是类
* BsonDocument 更适用于底层（内部）的 API，并且对于值类型的划分更细更严格
* Document 对值类型的划分更宽泛，更适合高阶的 API
* DBObject 是接口，需要一个具体的类 BasicDBObject 去实现它