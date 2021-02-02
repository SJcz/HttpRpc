# RpcDemo
一个基于HTTP实现的简单rpc demo, 包含客户端和服务端
### 原理
#### 服务端  
服务端扫描指定路径文件夹里面的文件  比如: remote文件夹下面的 Remotexxx 文件  
根据扫描得到的文件名和文件内容, 得到rpc的模块-方法映射, 模块名就是 RemoteXXX 后面的 XXX.  
根据rpc的模块-方法映射 生成express 路由  
启动express服务器  
Note: 目前支持 http 实现 RPC, 有时间增加 websocket 实现

#### 客户端
调用rpc服务端的固定接口, 获取服务端的模块-方法映射, 也就是所有的路由  
通过http请求对应路由     
得到结果  

#### Remote文件
通过 RpcServer.getInstance().prefix 可以自定义要扫描的 Rpc文件前缀  
比如设置文件前缀为 RM,  RpcServer.getInstance().prefix('RM'), 那么只会扫描所有的 RMxxx.js 文件.  
Remote 文件支持 export = xxx, 或者 module.exports = xxx.   
获取 xxx 身上所有方法来生成对应路由.   

#### 自定义
使用 RpcServer.getInstance().prefix 查看和设置扫描的rpc文件前缀  
使用 RpcServer.getInstance().httpPort 查看和设置启动的http端口  
使用 RpcServer.getInstance().rpcMethodRoute 查看和设置服务器提供所有rpc方法的路由  

#### 支持
基于http, 支持同步和异步rpc调用

#### 实现 rpcClient.rpc.模块.方法() 调用形式
设置了 TypeScript 远程调用接口, 支持 rpcClient.rpc.模块.方法() rpc调用

#### 使用
* 代码编译在js文件夹中 
* 执行 npm test

#### 示例
````
// RemoteTest.ts
declare global {
    interface RpcModule {
        Test?: RemoterClass<Test>;
    }
}

class Test {
    add (a: number, b: number): number {
        return a + b;
    }
}

export = new Test();

// test.ts
// 启动RPC服务器
RpcServer.getInstance().initRpcServer(path.resolve(__dirname, '../remote'));

// 初始化RPC客户端
RpcClient.getInstance().initClient('http://localhost:10008');

// 同步使用
await rpcClient.rpc.Test.add(1, 2);

// 异步方法
rpcClient.rpc.Test.add(1, 2).then().catch();

具体参考test
````


