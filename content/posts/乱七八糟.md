---
title: "给自己看的乱七八糟有用的东西"
date: 2026-07-20
draft: false
categories: ["技术"]
tags: ["C++", "NOI", "自用"]
mainSections: ["posts"] 
---

## 输出数组最大（小）值
```cpp
int a[5] = {1,2,3,4,5};
cout<<*max(min)_element(begin(a),end(a));
//输出5(1)
```
## 保留x位小数
```cpp
cout<<fixed<<setprecision(x)<<a
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