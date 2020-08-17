---
layout: post
title: Kafka Connect
tag: Kafka
---

## Official Refernces
* [Kafka Connect](https://kafka.apache.org/documentation/?spm=a2c63.p38356.879954.12.48b01843VCGKnP#connect)


## 通过 kafka connect 导入/导出数据
当需要从其他数据源导入kafka或者将kafka中的数据导入其他数据源，除了通过代码实现，还可以使用kafka connect来导入导出数据，它是一个可扩展的工具，通过运行connector，实现与外部系统交互的自定义逻辑。

```shell
# 造数据
$ echo -e "foo\nbar" > test.txt

# 在standalone模式下，启动两个connectors，需要配置三个配置文件。
# connect-standalone.properties配置kafka connect process，例如要连接到哪个broker，数据的序列化格式等。
# 其他的每个配置文件，都代表了要创建的每个connector，例如指定每个connector唯一的name，要实例化哪个connector class，和一些connector需要的其他的配置项。

# 修改 connect-standalone.properties
$ vim config/connect-standalone.properties
# These are defaults. This file just demonstrates how to override some settings.
bootstrap.servers=ambari0:9093

# The converters specify the format of data in Kafka and how to translate it into Connect data. Every Connect user will
# need to configure these based on the format they want their data in when loaded from or stored into Kafka
# org.apache.kafka.connect.converters.ByteArrayConverter
# org.apache.kafka.connect.converters.DoubleConverter
# org.apache.kafka.connect.converters.FloatConverter
# org.apache.kafka.connect.converters.IntegerConverter
# org.apache.kafka.connect.converters.LongConverter
# org.apache.kafka.connect.converters.ShortConverter
# org.apache.kafka.connect.json.JsonConverter
# org.apache.kafka.connect.storage.StringConverter
key.converter=org.apache.kafka.connect.storage.StringConverter
value.converter=org.apache.kafka.connect.storage.StringConverter

# Converter-specific settings can be passed in by prefixing the Converter's setting with the converter we want to apply
# it to
key.converter.schemas.enable=true
value.converter.schemas.enable=true

offset.storage.file.filename=/tmp/connect.offsets
# Flush much faster than normal, which is useful for testing/debugging
offset.flush.interval.ms=10000

# 导出 kafka 数据到 file
$ vim config/connect-file-sink.properties
name=kafka_to_file
connector.class=FileStreamSink
tasks.max=5
file=invert_index.txt
topics=invert_index
$ bin/connect-standalone.sh config/connect-standalone.properties config/connect-file-sink.properties

# 导入 file 数据到 kafka
$ vim config/connect-file-source.properties
name=file_to_kafka
connector.class=FileStreamSource
tasks.max=5
file=invert_index.txt
topics=invert_index

$ bin/connect-standalone.sh config/connect-standalone.properties config/connect-file-source.properties
```
