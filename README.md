# RpcDemo
一个基于HTTP实现的简单rpc demo, 包含客户端和服务端
### 原理
#### 服务端  
服务端扫描指定路径文件夹里面的文件  比如: remote文件夹下面的 Remotexxx 文件  
根据扫描得到的文件名和文件内容, 得到rpc的模块-方法映射  
根据rpc的模块-方法映射 生成express 路由  
启动express服务器  

#### 客户端
调用rpc服务端的固定接口, 获取服务端的模块-方法映射, 也就是所有的路由  
通过http请求对应路由     
得到结果  

#### 自定义
修改服务端启动端口: ChildExpress中的EXPRESS_PORT  
修改扫描文件前缀: RpcServer中的fileNamePrefix

#### 支持
基于http, 支持同步和异步rpc调用

#### 未实现
根据模块-方法映射 自动生成TS结构定义文件, 实现 rpcClient.rpc.模块.方法() rpc调用

#### 使用
* 代码编译在js文件夹中 
* 进入js/test文件夹
* 执行 node test

#### 示例
````
// 启动RPC服务器
RpcServer.getInstance().initRpcServer(path.resolve(__dirname, '../remote'));

// 初始化RPC客户端
RpcClient.getInstance().init('http://localhost:10008');

// 同步方法
await rpcClient.rpcFunction('Test', 'add', {a: 1, b: 2});

// 异步方法
rpcClient.rpcFunction('Test', 'add', {a: 1, b: 2}).then().catch();

具体参考test
````


