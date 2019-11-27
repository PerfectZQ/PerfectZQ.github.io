---
layout: post
title: Kerberos Exceptions
tag: Hadoop
---

## 现象
访问 Kerberos 认证的 HDFS 集群一直`org.apache.hadoop.security.AccessControlException: Client cannot authenticate via:[TOKEN, KERBEROS]`，但是 kerberos 认证已经成功了

```console
2019-11-26 22:17:02.724 WARN [main] NativeCodeLoader: Unable to load native-hadoop library for your platform... using builtin-java classes where applicable
# 这里看的出我的 kerberos 认证没有问题，已经成功登陆了
2019-11-26 22:17:03.097 INFO [main] UserGroupInformation: Login successful for user robot_data using keytab file robot_data.hadoop-sz.keytab
2019-11-26 22:17:04.013 INFO [main] Extract2JsonFiles$: ===> hadoop-sz : begin extract
2019-11-26 22:17:04.086 WARN [main] Client: Exception encountered while connecting to the server : org.apache.hadoop.security.AccessControlException: Client cannot authenticate via:[TOKEN, KERBEROS]
2019-11-26 22:17:04.093 WARN [main] Client: Exception encountered while connecting to the server : org.apache.hadoop.security.AccessControlException: Client cannot authenticate via:[TOKEN, KERBEROS]
2019-11-26 22:17:04.094 INFO [main] RetryInvocationHandler: Exception while invoking getFileInfo of class ClientNamenodeProtocolTranslatorPB over master001.hadoop-sz.data.sensetime.com/172.20.22.61:8020 after 1 fail over attempts. Trying to fail over immediately.
# 但下面的异常又拒绝了我的认证，一头雾水。
java.io.IOException: Failed on local exception: java.io.IOException: org.apache.hadoop.security.AccessControlException: Client cannot authenticate via:[TOKEN, KERBEROS]; Host Details : local host is: "adm001.hadoop-sz.data.sensetime.com/172.20.52.58"; destination host is: "master001.hadoop-sz.data.sensetime.com":8020; 
        at org.apache.hadoop.net.NetUtils.wrapException(NetUtils.java:776) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client.call(Client.java:1479) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client.call(Client.java:1412) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.ProtobufRpcEngine$Invoker.invoke(ProtobufRpcEngine.java:229) ~[myutils-1.0-SNAPSHOT.jar:?]
        at com.sun.proxy.$Proxy26.getFileInfo(Unknown Source) ~[?:?]
        at org.apache.hadoop.hdfs.protocolPB.ClientNamenodeProtocolTranslatorPB.getFileInfo(ClientNamenodeProtocolTranslatorPB.java:771) ~[myutils-1.0-SNAPSHOT.jar:?]
        at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method) ~[?:1.8.0_77]
        at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62) ~[?:1.8.0_77]
        at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43) ~[?:1.8.0_77]
        at java.lang.reflect.Method.invoke(Method.java:498) ~[?:1.8.0_77]
        at org.apache.hadoop.io.retry.RetryInvocationHandler.invokeMethod(RetryInvocationHandler.java:191) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.io.retry.RetryInvocationHandler.invoke(RetryInvocationHandler.java:102) [myutils-1.0-SNAPSHOT.jar:?]
        at com.sun.proxy.$Proxy27.getFileInfo(Unknown Source) [?:?]
        at org.apache.hadoop.hdfs.DFSClient.getFileInfo(DFSClient.java:2108) [myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.hdfs.DistributedFileSystem$22.doCall(DistributedFileSystem.java:1305) [myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.hdfs.DistributedFileSystem$22.doCall(DistributedFileSystem.java:1301) [myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.fs.FileSystemLinkResolver.resolve(FileSystemLinkResolver.java:81) [myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.hdfs.DistributedFileSystem.getFileStatus(DistributedFileSystem.java:1317) [myutils-1.0-SNAPSHOT.jar:?]
        at com.zq.hdfs.HDFSCommon$.extractAllDirsMeta(HDFSCommon.scala:191) [myutils-1.0-SNAPSHOT.jar:?]
        at com.zq.app.Extract2JsonFiles$$anonfun$main$1.apply(Extract2JsonFiles.scala:32) [myutils-1.0-SNAPSHOT.jar:?]
        at com.zq.app.Extract2JsonFiles$$anonfun$main$1.apply(Extract2JsonFiles.scala:30) [myutils-1.0-SNAPSHOT.jar:?]
        at com.zq.mysugar.MyExtensions$.tryWithResource(MyExtensions.scala:14) [myutils-1.0-SNAPSHOT.jar:?]
        at com.zq.app.Extract2JsonFiles$.main(Extract2JsonFiles.scala:29) [myutils-1.0-SNAPSHOT.jar:?]
        at com.zq.app.Extract2JsonFiles.main(Extract2JsonFiles.scala) [myutils-1.0-SNAPSHOT.jar:?]
Caused by: java.io.IOException: org.apache.hadoop.security.AccessControlException: Client cannot authenticate via:[TOKEN, KERBEROS]
        at org.apache.hadoop.ipc.Client$Connection$1.run(Client.java:687) ~[myutils-1.0-SNAPSHOT.jar:?]
        at java.security.AccessController.doPrivileged(Native Method) ~[?:1.8.0_77]
        at javax.security.auth.Subject.doAs(Subject.java:422) ~[?:1.8.0_77]
        at org.apache.hadoop.security.UserGroupInformation.doAs(UserGroupInformation.java:1698) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client$Connection.handleSaslConnectionFailure(Client.java:650) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client$Connection.setupIOstreams(Client.java:737) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client$Connection.access$2900(Client.java:375) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client.getConnection(Client.java:1528) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client.call(Client.java:1451) ~[myutils-1.0-SNAPSHOT.jar:?]
        ... 22 more
Caused by: org.apache.hadoop.security.AccessControlException: Client cannot authenticate via:[TOKEN, KERBEROS]
        at org.apache.hadoop.security.SaslRpcClient.selectSaslClient(SaslRpcClient.java:172) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.security.SaslRpcClient.saslConnect(SaslRpcClient.java:396) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client$Connection.setupSaslConnection(Client.java:560) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client$Connection.access$1900(Client.java:375) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client$Connection$2.run(Client.java:729) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client$Connection$2.run(Client.java:725) ~[myutils-1.0-SNAPSHOT.jar:?]
        at java.security.AccessController.doPrivileged(Native Method) ~[?:1.8.0_77]
        at javax.security.auth.Subject.doAs(Subject.java:422) ~[?:1.8.0_77]
        at org.apache.hadoop.security.UserGroupInformation.doAs(UserGroupInformation.java:1698) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client$Connection.setupIOstreams(Client.java:725) ~[myutils-1.0-SNAPSHOT.jar:?]
        at java.security.AccessController.doPrivileged(Native Method) ~[?:1.8.0_77]
        at javax.security.auth.Subject.doAs(Subject.java:422) ~[?:1.8.0_77]
        at org.apache.hadoop.security.UserGroupInformation.doAs(UserGroupInformation.java:1698) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client$Connection.setupIOstreams(Client.java:725) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client$Connection.access$2900(Client.java:375) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client.getConnection(Client.java:1528) ~[myutils-1.0-SNAPSHOT.jar:?]
        at org.apache.hadoop.ipc.Client.call(Client.java:1451) ~[myutils-1.0-SNAPSHOT.jar:?]
```

至此已经揪掉了1000根头发，把日志等级调成`DEBUG`

```console
2019-11-27 18:19:35.886 DEBUG [main] UserGroupInformation: PrivilegedAction as:robot_data@HADOOP-SZ.DATA.SENSETIME.COM (auth:KERBEROS) from:com.zq.app.Extract2JsonFiles$.main(Extract2JsonFiles.scala:47)
2019-11-27 18:19:35.991 DEBUG [main] BlockReaderLocal: dfs.client.use.legacy.blockreader.local = false
2019-11-27 18:19:35.991 DEBUG [main] BlockReaderLocal: dfs.client.read.shortcircuit = false
2019-11-27 18:19:35.992 DEBUG [main] BlockReaderLocal: dfs.client.domain.socket.data.traffic = false
2019-11-27 18:19:35.992 DEBUG [main] BlockReaderLocal: dfs.domain.socket.path = 
2019-11-27 18:19:36.131 DEBUG [main] HAUtil: No HA service delegation token found for logical URI hdfs://sensetime-data-hadoop-sz
2019-11-27 18:19:36.132 DEBUG [main] BlockReaderLocal: dfs.client.use.legacy.blockreader.local = false
2019-11-27 18:19:36.132 DEBUG [main] BlockReaderLocal: dfs.client.read.shortcircuit = false
2019-11-27 18:19:36.132 DEBUG [main] BlockReaderLocal: dfs.client.domain.socket.data.traffic = false
2019-11-27 18:19:36.132 DEBUG [main] BlockReaderLocal: dfs.domain.socket.path = 
2019-11-27 18:19:36.139 DEBUG [main] RetryUtils: multipleLinearRandomRetry = null
2019-11-27 18:19:36.157 DEBUG [main] Server: rpcKind=RPC_PROTOCOL_BUFFER, rpcRequestWrapperClass=class org.apache.hadoop.ipc.ProtobufRpcEngine$RpcRequestWrapper, rpcInvoker=org.apache.hadoop.ipc.ProtobufRpcEngine$Server$ProtoBufRpcInvoker@16fdec90
2019-11-27 18:19:36.163 DEBUG [main] Client: getting client out of cache: org.apache.hadoop.ipc.Client@403f0a22
2019-11-27 18:19:36.614 DEBUG [main] PerformanceAdvisory: Both short-circuit local reads and UNIX domain socket are disabled.
2019-11-27 18:19:36.622 DEBUG [main] DataTransferSaslUtil: DataTransferProtocol using SaslPropertiesResolver, configured QOP dfs.data.transfer.protection = authentication, configured class dfs.data.transfer.saslproperties.resolver.class = class org.apache.hadoop.security.SaslPropertiesResolver
2019-11-27 18:19:36.622 INFO [main] Extract2JsonFiles$: ===> hadoop-sz : begin extract
2019-11-27 18:19:36.640 DEBUG [main] Client: The ping interval is 60000 ms.
2019-11-27 18:19:36.641 DEBUG [main] Client: Connecting to master002.hadoop-sz.data.sensetime.com/172.20.22.62:8020
2019-11-27 18:19:36.653 DEBUG [main] UserGroupInformation: PrivilegedAction as:robot_data@HADOOP-SZ.DATA.SENSETIME.COM (auth:KERBEROS) from:org.apache.hadoop.ipc.Client$Connection.setupIOstreams(Client.java:720)
2019-11-27 18:19:36.707 DEBUG [main] SaslRpcClient: Sending sasl message state: NEGOTIATE

2019-11-27 18:19:36.714 DEBUG [main] SaslRpcClient: Received SASL message state: NEGOTIATE
auths {
  method: "TOKEN"
  mechanism: "DIGEST-MD5"
  protocol: ""
  serverId: "default"
  challenge: "realm=\"default\",nonce=\"OX629tYDVp4kphEiDFDVmuW5D9H/3GSUIH7fsiue\",qop=\"auth\",charset=utf-8,algorithm=md5-sess"
}
auths {
  method: "KERBEROS"
  mechanism: "GSSAPI"
  protocol: "nn"
  serverId: "master002.hadoop-sz.data.sensetime.com"
}

# 下面这两行，非常奇怪，返回了两个 null，接着下面就出上面显示的异常了
2019-11-27 18:19:36.715 DEBUG [main] SaslRpcClient: Get token info proto:interface org.apache.hadoop.hdfs.protocolPB.ClientNamenodeProtocolPB info:null
2019-11-27 18:19:36.715 DEBUG [main] SaslRpcClient: Get kerberos info proto:interface org.apache.hadoop.hdfs.protocolPB.ClientNamenodeProtocolPB info:null
2019-11-27 18:19:36.716 DEBUG [main] UserGroupInformation: PrivilegedActionException as:robot_data@HADOOP-SZ.DATA.SENSETIME.COM (auth:KERBEROS) cause:org.apache.hadoop.security.AccessControlException: Client cannot authenticate via:[TOKEN, KERBEROS]
2019-11-27 18:19:36.716 DEBUG [main] UserGroupInformation: PrivilegedAction as:robot_data@HADOOP-SZ.DATA.SENSETIME.COM (auth:KERBEROS) from:org.apache.hadoop.ipc.Client$Connection.handleSaslConnectionFailure(Client.java:645)
2019-11-27 18:19:36.717 WARN [main] Client: Exception encountered while connecting to the server : org.apache.hadoop.security.AccessControlException: Client cannot authenticate via:[TOKEN, KERBEROS]
2019-11-27 18:19:36.717 DEBUG [main] UserGroupInformation: PrivilegedActionException as:robot_data@HADOOP-SZ.DATA.SENSETIME.COM (auth:KERBEROS) cause:java.io.IOException: org.apache.hadoop.security.AccessControlException: Client cannot authenticate via:[TOKEN, KERBEROS]
2019-11-27 18:19:36.718 DEBUG [main] Client: closing ipc connection to master002.hadoop-sz.data.sensetime.com/172.20.22.62:8020: org.apache.hadoop.security.AccessControlException: Client cannot authenticate via:[TOKEN, KERBEROS]
java.io.IOException: org.apache.hadoop.security.AccessControlException: Client cannot authenticate via:[TOKEN, KERBEROS]
        at org.apache.hadoop.ipc.Client$Connection$1.run(Client.java:682) ~[myutils-1.0-SNAPSHOT.jar:?]
        at java.security.AccessController.doPrivileged(Native Method) ~[?:1.8.0_77]
        at javax.security.auth.Subject.doAs(Subject.java:422) ~[?:1.8.0_77]
        at org.apache.hadoop.security.UserGroupInformation.doAs(UserGroupInformation.java:1657) ~[myutils-1.0-SNAPSHOT.jar:?]

```

去看下源码，到底是特么什么魑魅魍魉在此作祟

```java
package org.apache.hadoop.security;

/**
 * A utility class that encapsulates SASL logic for RPC client
 */
@InterfaceAudience.LimitedPrivate({"HDFS", "MapReduce"})
@InterfaceStability.Evolving
public class SaslRpcClient {
    ....
  /**
   * Try to locate the required token for the server.
   * 
   * @param authType of the SASL client
   * @return Token<?> for server, or null if no token available
   * @throws IOException - token selector cannot be instantiated
   */
  private Token<?> getServerToken(SaslAuth authType) throws IOException {
    // 就这行，返回了个 null
    TokenInfo tokenInfo = SecurityUtil.getTokenInfo(protocol, conf);
    LOG.debug("Get token info proto:"+protocol+" info:"+tokenInfo);
    if (tokenInfo == null) { // protocol has no support for tokens
      return null;
    }
    ...
  }
  ...
  /**
   * Get the remote server's principal.  The value will be obtained from
   * the config and cross-checked against the server's advertised principal.
   * 
   * @param authType of the SASL client
   * @return String of the server's principal
   * @throws IOException - error determining configured principal
   */
  @VisibleForTesting
  String getServerPrincipal(SaslAuth authType) throws IOException {
    // 还有这行，看来是 SecurityUtil 里面什么信息没查到，进去看看
    KerberosInfo krbInfo = SecurityUtil.getKerberosInfo(protocol, conf);
    LOG.debug("Get kerberos info proto:"+protocol+" info:"+krbInfo);
    ...
  }
  ...
}

package org.apache.hadoop.security;

@InterfaceAudience.LimitedPrivate({"HDFS", "MapReduce"})
@InterfaceStability.Evolving
public class SecurityUtil {
  ...
  private static ServiceLoader<SecurityInfo> securityInfoProviders = 
    ServiceLoader.load(SecurityInfo.class);
  private static SecurityInfo[] testProviders = new SecurityInfo[0];
  ...
  /**
    * Look up the TokenInfo for a given protocol. It searches all known
    * SecurityInfo providers.
    * @param protocol The protocol class to get the information for.
    * @param conf Configuration object
    * @return the TokenInfo or null if it has no KerberosInfo defined
    */
  public static TokenInfo getTokenInfo(Class<?> protocol, Configuration conf) {
    for(SecurityInfo provider: testProviders) {
      TokenInfo result = provider.getTokenInfo(protocol, conf);
      if (result != null) {
        return result;
      }      
    }
    
    synchronized (securityInfoProviders) {
      // 看起来 provider 啥也没有，才会在最后返回 null，securityInfoProviders 哪来的？
      // 从上面可以看出是 ServiceLoader 加载这个 SecurityInfo.class 出来的，这就有意思了
      for(SecurityInfo provider: securityInfoProviders) {
        TokenInfo result = provider.getTokenInfo(protocol, conf);
        if (result != null) {
          return result;
        }
      } 
    }
    
    return null;
  }

}


package java.util;

/**
 * A simple service-provider loading facility.
 *
 * <p> A <i>service</i> is a well-known set of interfaces and (usually
 * abstract) classes.  A <i>service provider</i> is a specific implementation
 * of a service.  The classes in a provider typically implement the interfaces
 * and subclass the classes defined in the service itself.  Service providers
 * can be installed in an implementation of the Java platform in the form of
 * extensions, that is, jar files placed into any of the usual extension
 * directories.  Providers can also be made available by adding them to the
 * application's class path or by some other platform-specific means.
 *
 * <p> For the purpose of loading, a service is represented by a single type,
 * that is, a single interface or abstract class.  (A concrete class can be
 * used, but this is not recommended.)  A provider of a given service contains
 * one or more concrete classes that extend this <i>service type</i> with data
 * and code specific to the provider.  The <i>provider class</i> is typically
 * not the entire provider itself but rather a proxy which contains enough
 * information to decide whether the provider is able to satisfy a particular
 * request together with code that can create the actual provider on demand.
 * The details of provider classes tend to be highly service-specific; no
 * single class or interface could possibly unify them, so no such type is
 * defined here.  The only requirement enforced by this facility is that
 * provider classes must have a zero-argument constructor so that they can be
 * instantiated during loading.
 *
 * <p><a name="format"> A service provider is identified by placing a
 * <i>provider-configuration file</i> in the resource directory
 * <tt>META-INF/services</tt>.</a>  The file's name is the fully-qualified <a
 * href="../lang/ClassLoader.html#name">binary name</a> of the service's type.
 * The file contains a list of fully-qualified binary names of concrete
 * provider classes, one per line.  Space and tab characters surrounding each
 * name, as well as blank lines, are ignored.  The comment character is
 * <tt>'#'</tt> (<tt>'&#92;u0023'</tt>,
 * <font style="font-size:smaller;">NUMBER SIGN</font>); on
 * each line all characters following the first comment character are ignored.
 * The file must be encoded in UTF-8.
 *
 * <p> If a particular concrete provider class is named in more than one
 * configuration file, or is named in the same configuration file more than
 * once, then the duplicates are ignored.  The configuration file naming a
 * particular provider need not be in the same jar file or other distribution
 * unit as the provider itself.  The provider must be accessible from the same
 * class loader that was initially queried to locate the configuration file;
 * note that this is not necessarily the class loader from which the file was
 * actually loaded.
 *
 * <p> Providers are located and instantiated lazily, that is, on demand.  A
 * service loader maintains a cache of the providers that have been loaded so
 * far.  Each invocation of the {@link #iterator iterator} method returns an
 * iterator that first yields all of the elements of the cache, in
 * instantiation order, and then lazily locates and instantiates any remaining
 * providers, adding each one to the cache in turn.  The cache can be cleared
 * via the {@link #reload reload} method.
 *
 * <p> Service loaders always execute in the security context of the caller.
 * Trusted system code should typically invoke the methods in this class, and
 * the methods of the iterators which they return, from within a privileged
 * security context.
 *
 * <p> Instances of this class are not safe for use by multiple concurrent
 * threads.
 *
 * <p> Unless otherwise specified, passing a <tt>null</tt> argument to any
 * method in this class will cause a {@link NullPointerException} to be thrown.
 *
 *
 * <p><span style="font-weight: bold; padding-right: 1em">Example</span>
 * Suppose we have a service type <tt>com.example.CodecSet</tt> which is
 * intended to represent sets of encoder/decoder pairs for some protocol.  In
 * this case it is an abstract class with two abstract methods:
 *
 * <blockquote><pre>
 * public abstract Encoder getEncoder(String encodingName);
 * public abstract Decoder getDecoder(String encodingName);</pre></blockquote>
 *
 * Each method returns an appropriate object or <tt>null</tt> if the provider
 * does not support the given encoding.  Typical providers support more than
 * one encoding.
 *
 * <p> If <tt>com.example.impl.StandardCodecs</tt> is an implementation of the
 * <tt>CodecSet</tt> service then its jar file also contains a file named
 *
 * <blockquote><pre>
 * META-INF/services/com.example.CodecSet</pre></blockquote>
 *
 * <p> This file contains the single line:
 *
 * <blockquote><pre>
 * com.example.impl.StandardCodecs    # Standard codecs</pre></blockquote>
 *
 * <p> The <tt>CodecSet</tt> class creates and saves a single service instance
 * at initialization:
 *
 * <blockquote><pre>
 * private static ServiceLoader&lt;CodecSet&gt; codecSetLoader
 *     = ServiceLoader.load(CodecSet.class);</pre></blockquote>
 *
 * <p> To locate an encoder for a given encoding name it defines a static
 * factory method which iterates through the known and available providers,
 * returning only when it has located a suitable encoder or has run out of
 * providers.
 *
 * <blockquote><pre>
 * public static Encoder getEncoder(String encodingName) {
 *     for (CodecSet cp : codecSetLoader) {
 *         Encoder enc = cp.getEncoder(encodingName);
 *         if (enc != null)
 *             return enc;
 *     }
 *     return null;
 * }</pre></blockquote>
 *
 * <p> A <tt>getDecoder</tt> method is defined similarly.
 *
 *
 * <p><span style="font-weight: bold; padding-right: 1em">Usage Note</span> If
 * the class path of a class loader that is used for provider loading includes
 * remote network URLs then those URLs will be dereferenced in the process of
 * searching for provider-configuration files.
 *
 * <p> This activity is normal, although it may cause puzzling entries to be
 * created in web-server logs.  If a web server is not configured correctly,
 * however, then this activity may cause the provider-loading algorithm to fail
 * spuriously.
 *
 * <p> A web server should return an HTTP 404 (Not Found) response when a
 * requested resource does not exist.  Sometimes, however, web servers are
 * erroneously configured to return an HTTP 200 (OK) response along with a
 * helpful HTML error page in such cases.  This will cause a {@link
 * ServiceConfigurationError} to be thrown when this class attempts to parse
 * the HTML page as a provider-configuration file.  The best solution to this
 * problem is to fix the misconfigured web server to return the correct
 * response code (HTTP 404) along with the HTML error page.
 *
 * @param  <S>
 *         The type of the service to be loaded by this loader
 *
 * @author Mark Reinhold
 * @since 1.6
 */
public final class ServiceLoader<S>
    implements Iterable<S>
{
    // 看到这恍然大悟，ServiceLoader 是扫 "META-INF/services/" 下的文件没扫到，
    // 看起来是打包的时候，丢失了一些信息，因为我是用 Maven-shade-plugin 打的宽包(fat-jar)
    private static final String PREFIX = "META-INF/services/";

    // The class or interface representing the service being loaded
    private final Class<S> service;

    // The class loader used to locate, load, and instantiate providers
    private final ClassLoader loader;

    // The access control context taken when the ServiceLoader is created
    private final AccessControlContext acc;

    // Cached providers, in instantiation order
    private LinkedHashMap<String,S> providers = new LinkedHashMap<>();

    // The current lazy-lookup iterator
    private LazyIterator lookupIterator;

    /**
     * Creates a new service loader for the given service type, using the
     * current thread's {@linkplain java.lang.Thread#getContextClassLoader
     * context class loader}.
     *
     * <p> An invocation of this convenience method of the form
     *
     * <blockquote><pre>
     * ServiceLoader.load(<i>service</i>)</pre></blockquote>
     *
     * is equivalent to
     *
     * <blockquote><pre>
     * ServiceLoader.load(<i>service</i>,
     *                    Thread.currentThread().getContextClassLoader())</pre></blockquote>
     *
     * @param  <S> the class of the service type
     *
     * @param  service
     *         The interface or abstract class representing the service
     *
     * @return A new service loader
     */
    public static <S> ServiceLoader<S> load(Class<S> service) {
        ClassLoader cl = Thread.currentThread().getContextClassLoader();
        return ServiceLoader.load(service, cl);
    }

    /**
     * Creates a new service loader for the given service type and class
     * loader.
     *
     * @param  <S> the class of the service type
     *
     * @param  service
     *         The interface or abstract class representing the service
     *
     * @param  loader
     *         The class loader to be used to load provider-configuration files
     *         and provider classes, or <tt>null</tt> if the system class
     *         loader (or, failing that, the bootstrap class loader) is to be
     *         used
     *
     * @return A new service loader
     */
    public static <S> ServiceLoader<S> load(Class<S> service,
                                            ClassLoader loader)
    {
        return new ServiceLoader<>(service, loader);
    }
}

```

然后搜了下`META-INF/services/`干啥的，后来发现了这个，[Concatenating Service Entries with the ServicesResourceTransformer](https://maven.apache.org/plugins/maven-shade-plugin/examples/resource-transformers.html#ServicesResourceTransformer)

试一下
```xml
            <!--
            Shade Package
            Reference: http://maven.apache.org/plugins/maven-shade-plugin/shade-mojo.html
            -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>3.2.1</version>
                <configuration>
                    <!--
                    用来标识是否为当前 artifacts 创建缩减的 pom，为true时，它会把你的 pom 中的 dependency 干掉，并且
                    将它们放在一个名为 dependency-reduced-pom.xml 的临时文件中。默认为 true。
                    -->
                    <createDependencyReducedPom>true</createDependencyReducedPom>
                    <!-- 创建 source jar -->
                    <createSourcesJar>false</createSourcesJar>
                    <!--
                    通过 <include> <exclude> 添加或者剔除指定内容到 jar 到
                    -->
                    <filters>
                        <filter>
                            <artifact>*:*</artifact>
                            <excludes>
                                <exclude>META-INF/*.SF</exclude>
                                <exclude>META-INF/*.DSA</exclude>
                                <exclude>META-INF/*.RSA</exclude>
                            </excludes>
                        </filter>
                    </filters>
                    <!--
                    When true, dependencies will be stripped down on the class level to only the transitive
                    hull required for the artifact. Note: Usage of this feature requires Java 1.5 or higher.
                    -->
                    <minimizeJar>false</minimizeJar>
                </configuration>
                <executions>
                    <!-- Run shade goal on package phase -->
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                        <configuration>
                            <transformers>
                                <!-- https://maven.apache.org/plugins/maven-shade-plugin/examples/resource-transformers.html#ServicesResourceTransformer -->
                                <transformer
                                        implementation="org.apache.maven.plugins.shade.resource.ServicesResourceTransformer"/>
                                <!--在 META-INF/MANIFEST.MF 文件中添加 key: value 可以设置 Main 方法-->
                                <transformer
                                        implementation="org.apache.maven.plugins.shade.resource.ManifestResourceTransformer">
                                    <manifestEntries>
                                        <main-Class>com.zq.app.Extract2JsonFiles</main-Class>
                                        <Build-Number>1</Build-Number>
                                        <Built-By>ZhangQiang</Built-By>
                                        <X-Compile-Source-JDK>${maven.compiler.source}</X-Compile-Source-JDK>
                                        <X-Compile-Target-JDK>${maven.compiler.target}</X-Compile-Target-JDK>
                                    </manifestEntries>
                                </transformer>
                            </transformers>
                        </configuration>
                    </execution>
                </executions>
            </plugin>

```

再重新打包执行，成了。。

## Reference
* [java – 如何通过OSGI包中的kerberos与hdfs连接](https://codeday.me/bug/20190711/1430750.html)