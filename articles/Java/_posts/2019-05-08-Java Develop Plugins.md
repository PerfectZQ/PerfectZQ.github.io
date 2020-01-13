---
layout: post
title: Java Develop Plugins
tag: Java
---

## Lombok
* [juejin.im/post/5b00517cf265da0ba0636d4b](juejin.im/post/5b00517cf265da0ba0636d4b)

### 引入依赖
```xml
<dependency>
  <groupId>org.projectlombok</groupId>
  <artifactId>lombok</artifactId>
  <version>1.16.18</version>
  <scope>provided</scope>
</dependency>￿￿￿￿
```

### IDEA 集成
* 安装插件 `Preferences -> Plugins -> Lombok`
* 开启注解 `Preferences -> Build,Execution,Deployment -> Compiler -> Annotation Processors -> Enable Annocation Processors`

### 原理
自从Java 6起，`javac`就支持`JSR 269 Pluggable Annotation Processing API`规范，只要程序实现了该API，就能在`javac`运行的时候得到调用。

Lombok 就是一个实现了`JSR 269 API`的程序。在使用`javac`的过程中，它产生作用的具体流程如下：

* `javac` 将 Lombok 程序编译好，主要是`Annotations`和`Processors`，以 plugin 的方式集成到 IDEA 中
* `javac` 对我们的`.java`源代码进行分析，生成一棵抽象语法树(AST)，并指定`Processor`去处理相应的`Annotation`，修改 AST
* `javac` 对修改后的 AST 进行编译，生成`.class`文件

我们可以用`javac`命令模拟这个过程，代码主要分为两个模块`apt`和`core`
```shell
# apt 模块文件结构
$ ls apt/src/main/java/com/zq/apt/annotations/
ChineseAlias.java
$ ls apt/src/main/java/com/zq/apt/core/
ChineseAliasProcessor.java      ChineseAliasTranslator.java

# core 模块文件结构
$ ls core/src/main/java/com/zq
TestProcessor.java
```

先编译好 Annotations 和 Processors，将编译生成的`.class`放到`-d classes/`下
```shell
# javac 相关的依赖在 tools.jar 中
$ javac -extdirs "${JAVA_HOME}/lib/tools.jar" -source 1.8 -d classes/ apt/src/main/java/com/zq/apt/annotations/* apt/src/main/java/com/zq/apt/core/*
```

在编译过程中，指定`Processor`去处理`TestProcessor.java`中相应的`Annotation`，修改 AST，将生成的`.class`文件放到`-d classes/`下
```shell
$ javac -cp classes -d classes -processor com.zq.apt.core.ChineseAliasProcessor -source 1.8 -encoding UTF8 core/src/main/java/com/zq/TestProcessor.java
```

附上每个文件的源码
```java
package com.zq.apt.annotations;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// Indicate this annotation only for field
@Target(ElementType.FIELD)
// Tell compiler the annotation's life cycle in vm
//@Retention(RetentionPolicy.RUNTIME)
@Retention(RetentionPolicy.SOURCE)
public @interface ChineseAlias {
    String value();

    String[] mappingFields() default {};
}
```

```java
package com.zq.apt.core;

//import com.google.auto.service.AutoService;
import com.sun.tools.javac.api.JavacTrees;
import com.sun.tools.javac.code.Symtab;
import com.sun.tools.javac.processing.JavacProcessingEnvironment;
import com.sun.tools.javac.tree.JCTree;
import com.sun.tools.javac.tree.TreeMaker;
import com.sun.tools.javac.util.Context;
import com.sun.tools.javac.util.Names;
import com.zq.apt.annotations.ChineseAlias;

import javax.annotation.processing.*;
import javax.lang.model.SourceVersion;
import javax.lang.model.element.Element;
import javax.lang.model.element.ElementKind;
import javax.lang.model.element.TypeElement;
import javax.tools.Diagnostic;
import java.util.Set;

/**
 * @author Created by ZhangQiang on 2019/12/02
 */
//@AutoService(Processor.class)
@SupportedSourceVersion(SourceVersion.RELEASE_8)
@SupportedAnnotationTypes({"com.zq.apt.annotations.*"})
public class ChineseAliasProcessor extends AbstractProcessor {

    // Print log at compile time
    private Messager messager;
    // The AST to process
    private JavacTrees jcTrees;
    // Encapsulate functions of create AST node
    private TreeMaker treeMaker;
    // Provide functions to create symbols
    private Names names;

    private Symtab syms;

    @Override
    public synchronized void init(ProcessingEnvironment processingEnv) {
        super.init(processingEnv);
        this.messager = processingEnv.getMessager();
        this.jcTrees = JavacTrees.instance(processingEnv);
        Context context = ((JavacProcessingEnvironment) processingEnv).getContext();
        this.treeMaker = TreeMaker.instance(context);
        this.syms = Symtab.instance(context);
        this.names = Names.instance(context);
    }

    @Override
    public boolean process(Set<? extends TypeElement> annotations, RoundEnvironment roundEnv) {
        messager.printMessage(Diagnostic.Kind.NOTE, "===========================================================================");
        // Filter the elements that annotate by @ChineseAlias
        Set<? extends Element> annotationElements = roundEnv.getElementsAnnotatedWith(ChineseAlias.class);
        if (annotationElements.size() > 0) {
            messager.printMessage(Diagnostic.Kind.NOTE, "====> annotation elements size: " + annotationElements.size());
            Set<? extends Element> rootElements = roundEnv.getRootElements();
            for (Element rootElement : rootElements) {
                if (ElementKind.CLASS == rootElement.getKind()) {
                    messager.printMessage(Diagnostic.Kind.NOTE,
                            String.format("====> root element %s %s: ", rootElement.getKind(), rootElement.getSimpleName()));
                    JCTree jcClassTree = jcTrees.getTree(rootElement);
                    // Accept a TreeTranslator
                    jcClassTree.accept(new ChineseAliasTranslator(syms, treeMaker, names, messager));
                }
            }
        }
        return true;
    }

}
```

```java
package com.zq.apt.core;

import com.sun.tools.javac.code.Flags;
import com.sun.tools.javac.code.Symtab;
import com.sun.tools.javac.tree.JCTree;
import com.sun.tools.javac.tree.JCTree.*;
import com.sun.tools.javac.tree.TreeMaker;
import com.sun.tools.javac.tree.TreeTranslator;
import com.sun.tools.javac.util.List;
import com.sun.tools.javac.util.ListBuffer;
import com.sun.tools.javac.util.Name;
import com.sun.tools.javac.util.Names;
import com.zq.apt.annotations.ChineseAlias;

import javax.annotation.processing.Messager;
import javax.tools.Diagnostic;
import java.text.SimpleDateFormat;
import java.util.Date;

import static com.sun.source.tree.Tree.Kind.*;

public class ChineseAliasTranslator extends TreeTranslator {

    private Symtab syms;
    private TreeMaker treeMaker;
    private Names names;
    private Messager messager;

    private ListBuffer<JCTree> methodBuffer = new ListBuffer<>();
    private JCVariableDecl currentJcVariableDecl;


    public ChineseAliasTranslator(Symtab syms, TreeMaker treeMaker, Names names, Messager messager) {
        this.syms = syms;
        this.treeMaker = treeMaker;
        this.names = names;
        this.messager = messager;
    }

    private void note(String message) {
        this.messager.printMessage(Diagnostic.Kind.NOTE, String.format("====> %s: %s",
                new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS").format(new Date()), message));
    }

    /**
     * Override the visitClassDef() to get `JcClassDef`, the definition of class `JcClassDef` in AST
     */
    @Override
    public void visitClassDef(JCClassDecl jcClassDecl) {
        note("Invoke `visitClassDef()` " + jcClassDecl.name.toString());
        note("=== jcClassDecl.def size: " + jcClassDecl.defs.size());
        // super.visitClassDef() will invoke visitVarDef()
        super.visitClassDef(jcClassDecl);
        jcClassDecl.defs = jcClassDecl.defs.prependList(methodBuffer.toList());
        // set result
        this.result = jcClassDecl;
        note("=== jcClassDecl.def size: " + jcClassDecl.defs.size());
        note("Finished invoking `super.visitClassDef()` " + jcClassDecl.name.toString());
    }

    @Override
    public void visitVarDef(JCVariableDecl jcVariableDecl) {
        note("Invoke `visitVarDef()` " + jcVariableDecl.name.toString());
        note("VariableKind: " + jcVariableDecl.getKind() +
                ", VariableType: " + jcVariableDecl.getType() +
                ", VariableType.class" + (jcVariableDecl.getType() == null ? null : jcVariableDecl.getType().getClass()));
        this.currentJcVariableDecl = jcVariableDecl;
        // super.visitVarDef() will invoke visitAnnotation()
        super.visitVarDef(jcVariableDecl);
        note("Finished invoking `super.visitVarDef()` " + jcVariableDecl.name.toString());
    }

    @Override
    public void visitAnnotation(JCAnnotation jcAnnotation) {
        note("Invoke `visitAnnotation()` " + jcAnnotation.getAnnotationType().toString());
        if (ChineseAlias.class.getSimpleName().equals(jcAnnotation.getAnnotationType().toString())) {
            // Generate the method `getXXXChineseAlias()`
            List<JCTree> jcMethodDecls = makeMethodDecls(jcAnnotation);
            methodBuffer.appendList(jcMethodDecls);
            // note(String.format("Add new method `%s()` to `this.methodBuffer`", jcMethodDecl.getName()));
        }
        super.visitAnnotation(jcAnnotation);
        note("Finished invoking `super.visitAnnotation()` " + jcAnnotation.getAnnotationType().toString());
    }


    private List<JCTree> makeMethodDecls(JCAnnotation jcAnnotation) {
        List<JCExpression> arguments = jcAnnotation.getArguments();
        List<JCTree> results = List.nil();
        for (JCExpression argument : arguments) {
            if (argument.getKind().equals(ASSIGNMENT)) {
                JCAssign assignment = (JCAssign) argument;
                JCExpression lhs = assignment.lhs;
                JCExpression rhs = assignment.rhs;
                note(String.format("lhs.toString(): %s, rhs.getKind(): %s", lhs.toString(), rhs.getKind()));
                if ("value".equalsIgnoreCase(lhs.toString()) && rhs.getKind() == STRING_LITERAL) {
                    JCLiteral jcLiteral = (JCLiteral) rhs;
                    note("string value: " + jcLiteral.getValue().toString());
                    JCReturn jcReturn = treeMaker.Return(jcLiteral);
                    // treeMaker.Type(new Type.JCVoidType())
                    JCTree.JCExpression returnMethodType = treeMaker.Type(syms.stringType);
                    ListBuffer<JCStatement> statements = new ListBuffer<>();
                    statements.append(jcReturn);
                    JCBlock methodBody = treeMaker.Block(0, statements.toList());
                    Name methodName = newGetAliasMethodName(this.currentJcVariableDecl.getName());
                    note(String.format("Create new method `%s()` for variable `%s`.", methodName, this.currentJcVariableDecl.getName()));
                    JCMethodDecl method = treeMaker.MethodDef(
                            // public
                            treeMaker.Modifiers(Flags.PUBLIC),
                            // methodName
                            methodName,
                            // return type
                            returnMethodType,
                            // generic type
                            List.nil(),
                            // method args
                            List.nil(),
                            // throw expression
                            List.nil(),
                            // method body
                            methodBody,
                            // default
                            null);
                    results = results.append(method);
                } else if ("mappingFields".equalsIgnoreCase(lhs.toString()) && rhs.getKind() == NEW_ARRAY) {
                    JCNewArray jcNewArray = (JCNewArray) rhs;
                    jcNewArray.elems.forEach(elem -> note("array elem: " + elem.toString()));
                    JCReturn jcReturn = treeMaker.Return(jcNewArray);
                    JCTree.JCExpression returnMethodType = treeMaker.Type(rhs.type);
                    ListBuffer<JCStatement> statements = new ListBuffer<>();
                    statements.append(jcReturn);
                    JCBlock methodBody = treeMaker.Block(0, statements.toList());
                    Name methodName = newGetMappingFieldsMethodName(this.currentJcVariableDecl.getName());
                    note(String.format("Create new method `%s()` for variable `%s`.", methodName, this.currentJcVariableDecl.getName()));
                    JCMethodDecl method = treeMaker.MethodDef(treeMaker.Modifiers(Flags.PUBLIC), methodName,
                            returnMethodType, List.nil(), List.nil(), List.nil(), methodBody, null);
                    results = results.append(method);
                }
            }
        }
        return results;
    }


    /**
     * Create getMethod
     *
     * @param name
     * @return
     */
    private Name newGetAliasMethodName(Name name) {
        String str = name.toString();
        // Camel name
        return names.fromString("get" + str.substring(0, 1).toUpperCase() + str.substring(1) + "ChineseAlias");
    }

    private Name newGetMappingFieldsMethodName(Name name) {
        String str = name.toString();
        // Camel name
        return names.fromString("get" + str.substring(0, 1).toUpperCase() + str.substring(1) + "MappingFields");
    }
}
```

```java
package com.zq;

import com.zq.apt.annotations.ChineseAlias;

import java.util.HashMap;
import java.util.Map;

public class TestProcessor {

    @ChineseAlias(value = "asd", mappingFields = {"a", "b"})
    private String text;

    private Map<String, String> map = new HashMap<>();

    public TestProcessor(String text) {
        this.text = text;
    }

    public static void main(String[] args) {
        TestProcessor t = new TestProcessor("qwe");
        //System.out.println(t.getTextChineseAlias());
    }
}
```

查看生成的代码
```shell
$ javap -p -cp classes com/zq/TestProcessor.class
```

结果如下
```java
package com.zq;

import java.util.HashMap;
import java.util.Map;

public class TestProcessor {
    private String text;
    private Map<String, String> map = new HashMap();

    public String getTextChineseAlias() {
        return "asd";
    }

    public String[] getTextMappingFields() {
        return new String[]{"a", "b"};
    }

    public TestProcessor(String var1) {
        this.text = var1;
    }

    public static void main(String[] var0) {
        new TestProcessor("qwe");
    }
}
```

## 实用分享
* [IntelliJ IDEA 超实用使用技巧分享](https://mp.weixin.qq.com/s/X_DKo4pAIa7TootqkJNXhA)
* [IDEA高级用法：集成JIRA、UML类图插件、SSH、FTP...](https://mp.weixin.qq.com/s/K-nhlK5aRBKTE-N_Nk9N4A)
* [IDEA Features](http://www.jetbrains.com/idea/features/)