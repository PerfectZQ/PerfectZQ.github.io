---
layout: post
title: Json转Bson
tag: MongoDB
---

　　MongoDB中是以Bson数据格式进行存储的，Json字符串没有办法直接写入MongoDB 可以将Json字符串转换成DBObject或者Document，然后写入MongoDB

## 将Json字符转换成 DBObject（准确的说是BasicDBObject）
　　Scala版本：
{% highlight scala %}
import com.mongodb.DBObject
import com.mongodb.casbah.{MongoClient, MongoCollection}
import com.mongodb.util.JSON

// 构造一个Json字符串
val json = s"""{
           |  "school_code" : "${school_code}",
           |  "school_name" : "${school_name}",
           |  "teacher_idcard" : "${teacher_idcard}",
           |  "teacher_name" : "${teacher_name}"
           |}
           |""".stripMargin

val collection: MongoCollection = MongoClient("10.4.120.83")("dbName")("collectionName")
           
val bson: DBObject = JSON.parse(json).asInstanceOf[DBObject]

// mongodb casbah的写法
collection.insert(bson) 
{% endhighlight %}

　　Java版本：
{% highlight java %}
import com.mongodb.MongoClient;
import com.mongodb.DBObject;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import com.mongodb.util.JSON;


// 构造一个Json字符串
String json = " {" +
                " 'school_code' : '111111', " +
                " 'school_name' : '汉东政法大学', " +
                " 'teacher_idcard' : '0000001', " +
                " 'teacher_name' : '高育良' " +
                " } ";
                
MongoClient mongoClient = new MongoClient("10.4.120.83", 27017);

MongoDatabase database = mongoClient.getDatabase("dbName");

MongoCollection<DBObject> collection = database.getCollection("collectionName", DBObject.class);    
	       
DBObject bson = (DBObject)JSON.parse(json);

collection.insertOne(bson);
{% endhighlight %}
## 将字符串转换成 Document
　　Scala版本：
{% highlight Scala %}
import org.bson.Document
import com.mongodb.casbah.{MongoClient, MongoCollection}
import com.mongodb.util.JSON;

// 构造一个Json字符串
val json = s"""{
           |  "school_code" : "${school_code}",
           |  "school_name" : "${school_name}",
           |  "teacher_idcard" : "${teacher_idcard}",
           |  "teacher_name" : "${teacher_name}"
           |}
           |""".stripMargin


val document:Document = Document.parse(json)

// 注意！com.mongodb.casbah.MongoCollection只支持写DBObject的子类，
// 不支持写入Document类的对象，可以使用com.mongodb.client.MongoCollection
// 写入Document类的对象，这里能写入是因为用了自定义的隐式转换函数，将
// Document转换成了DBObject

// 自定义的隐式转换函数
implicit def document2DBObject(doc: Document): DBObject = JSON.parse(doc.toJson).asInstanceOf[DBObject]

val collection: MongoCollection = MongoClient("10.4.120.83")("dbName")("collectionName")

collection.insert(document)
{% endhighlight %}

　　Java版本：
{% highlight java %}
import org.bson.Document;
import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;

// 构造一个Json字符串
String json = " {" +
                " 'school_code' : '111111', " +
                " 'school_name' : '汉东政法大学', " +
                " 'teacher_idcard' : '0000001', " +
                " 'teacher_name' : '高育良' " +
                " } ";

MongoClient mongoClient = new MongoClient("10.4.120.83", 27017);

MongoDatabase database = mongoClient.getDatabase("dbName");

MongoCollection<Document> collection = database.getCollection("collectionName");  

Document document = Document.parse(json);

collection.insertOne(document );
{% endhighlight %}