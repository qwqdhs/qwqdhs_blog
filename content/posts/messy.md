---
title: "一些STL的教程（施工中）"
date: 2026-07-20
draft: false
categories: ["教程"]
tags: ["C++", "NOI", "自用", "教程"]
mainSections: ["posts"] 
cover: "/images/777.jpeg"
---

## 输出数组最大/最小值
### max_element和min_element
- **介绍** ：min_element/max_element函数是C++标准模板库（STL）中的一个函数，用于查找指定范围内的最小元素。它返回一个指向范围内最小元素的迭代器
- **作用**：作用：返回容器中最小值和最大值
- **头文件**：在**lgorithm**中
- **例**：
    ```cpp
    int a[5] = {1,2,3,4,5};
    cout<<*max_element(begin(a),end(a));
    //输出5
    cout<<*min_element(begin(a),end(a));
    //输出1
    ```
- **备注**：从C++11标准起，begin(a)和 end(a)，也可以写成a和a+5

## 保留x位小数
### 需要iomanip头文件
### fixed和setprecision()
#### setprecision()
- **作用**：控制浮点数输出格式，设置精度，当**与fixed一起使用**时，表示小数点后保留n位，如果**不搭配fixed使用**，则表示有效数字为n位
#### fixed
- **作用**：强制以固定小数点表示法显示浮点数，**不使用**科学计数法表示，比如1234.5678就会显示为1234.5678，而不是1.2345678e+03
- #### setprecision和fixed连用：
    ```cpp
    cout<<fixed<<setprecision(x)<<a
    //x表示保留几位
    ```

## 最大公约数
```cpp
//需要C++17标准
gcd(a,b)
```

## 三个数比大小
```cpp
//直接用std max和min就行
//C++11标准
max({a,b,c});
min({a,b,c});
```

## vector去重
```cpp
//需要事先排序
a.erase(unique(a.begin(),a.end()), a.end());
```
### 工作原理
unique:将相邻的重复元素移动到容器末尾，并返回去重后第一个无效元素的迭代器。

erase:删除从 unique 返回的迭代器到容器末尾的所有无效元素。

## string和int互转
```cpp
//C++11标准
to_string(num);
```


## 参考资料/内容（侵删）
1. [fixed和setprecision](https://juejin.cn/post/7434196191209357363)
2. 

#### 注：以上内容均之前在洛谷发布的文章，所以一口气全写这了，其他的STL教程将会单独发文章