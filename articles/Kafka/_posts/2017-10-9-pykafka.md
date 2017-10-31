---
layout: post
title: pykafka
tag: Kafka
---

## pykafka
　　[pykafka](https://github.com/Parsely/pykafka)是python(python 2.7+ 、python3.4+ 和PyPy)连接kafka(>=0.8.2)的client。常用的还有[kafka-python](https://github.com/dpkp/kafka-python)。pykafka相较于kafka-python生产者的效率会更好一些(网上有的帖子看到的，并没有亲自验证过)，因为只是用将爬虫爬取的数据作为生产者写入kafka，后续是Spark Streaming作为消费者，所以选择研究pykafka。

　　官方文档地址:[http://pykafka.readthedocs.io/en/latest/](http://pykafka.readthedocs.io/en/latest/)。个人认为写得有点糙，但是聊胜于无。。。

### install
1. PyPI：`$ pip install pykafka` 
2. local：`$ python setup.py develop`

### producer
```python
from pykafka import KafkaClient

# 连接kafka
client = KafkaClient(hosts="10.4.121.218:9092,10.4.121.218:9093,10.4.121.218:9094")
topic = client.topics['my.test']

# 同步的发送数据，直到确认消息已经发送到集群，该方法才会返回。
with topic.get_sync_producer() as producer:
    for i in range(4):
        producer.produce('test message ' + str(i ** 2))

# 为了提高吞吐量，推荐使用异步方法，发送完消息立即返回，不需要等待确认。
# delivery_reports=True 可以获得消息传递确认信息。
with topic.get_producer(delivery_reports=True) as producer:
count = 0
    while True:
        count += 1
        producer.produce('test msg', partition_key='{}'.format(count))
        # **是幂运算符，具有最高运算优先级
        # adjust this or bring lots of RAM ;)
        if count % 10 ** 5 == 0: 
            while True:
                try:
                    msg, exc = producer.get_delivery_report(block=False)
                    if exc is not None:
                        print 'Failed to deliver msg {}: {}'.format(
                            msg.partition_key, repr(exc))
                    else:
                        print 'Successfully delivered msg {}'.format(
                        msg.partition_key)
                except Queue.Empty:
                    break
```
　　