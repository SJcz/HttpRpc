# RpcDemo
一个基于 HTTP/webSocket 实现的简单rpc 框架, 包含客户端和服务端
### 服务端
#### 原理     
服务端扫描指定路径文件夹里面的文件  比如: remote文件夹下面的 Remotexxx 文件  
根据扫描得到的文件名和文件内容, 得到rpc的模块-方法映射, 模块名就是 RemoteXXX 后面的 XXX.  
根据rpc的模块-方法映射, 启动对应的服务器
1. 对于 http 服务器, 使用express生成对应http路由, 启动express
2. 对于 websocket 服务器, 使用ws模块实现

#### 用法
```
const rpcServer = RpcServer.getInstance(); // 获取单例rpc服务器

const rpcServer = new RpcServer(); // 新建一个rpc服务器

rpcServer.prefix(); // 获取要扫描的RPC文件前缀  默认  Remote
rpcServer.prefix('ABC'); // 修改要扫描的RPC文件前缀为 ABC

rpcServer.serverType()  // 获取 rpc 服务器的底层协议类型. 1 = http, websocket = 2. 默认 1
rpcServer.serverType(2) //  设置rpc服务器的底层协议类型 

rpcServer.port(); // 获取 rpc 服务器的端口. 默认 http = 10008, websocket = 10009
rpcServer.port(10010) // 设置rpc服务器端口. 

rpcServer.rpcMethodRoute() // 获取供RPC客户端调用的 ·服务端所有rpc方法· 的路由 默认是 RpcServer/GetAllRpcMethod
rpcServer.rpcMethodRoute('RpcServer/getAll') // 设置该路由. 

rpcServer.times(); // 获取 提供rpc服务的子进程最大尝试重启次数 默认 3 
rpcServer.times(5); // 设置 提供rpc服务的子进程最大尝试重启次数

// 初始化和启动rpc服务器, 传入一个要扫描的绝对路径文件夹, 可以使用path转为绝对路径
// 服务器会自动扫描改文件夹下所有js文件, 然后自动生成rpc路由.
// -- 如下是扫描remote文件夹, 并且仅扫描 'Remote'(默认, 通过 prefix 函数修改) 开头的文件 -- 
// 返回该rpc服务器对象
rpcServer.initRpcServer(path.resolve(__dirname, '../remote')) 

```


### 客户端
#### 原理
首先调用rpc服务端的固定接口, 获取服务端的模块-方法映射, 也就是所有的路由. 然后根据路由生成对应的proxy
```
// 将路由对应 模块-方法 绑定到 rpcFunction 形成 proxy
static genProxy(client: RpcClient, mod: string, method: string) {
    client.rpc[mod] = client.rpc[mod] || {};
    client.rpc[mod][method] = client.rpcFunction.bind(client, mod, method); 
}

// rpcFunction 方法的实质就是发送请求发服务器
rpcFunction (moduleName: string, method: string, ...params: any): Promise<any> {
        if(!this.connected) {
            return Promise.reject(new Error('RpcClient: RpcClient is not connected.'));
        }
        if (!this.rpcModuleMap[moduleName]) {
            return Promise.reject(new Error(`RpcClient: RpcServer not provide module: ${moduleName}, please comfrim RpcClient initialize success or RpcServer own this module`));
        }
        if (Object.prototype.toString.call(this.rpcModuleMap[moduleName].methodList) !== '[object Array]') {
            return Promise.reject(new Error(`RpcClient: methodList of module ${moduleName} by RpcServer is not an array!!!`));
        }
        if (this.rpcModuleMap[moduleName].methodList.indexOf(method) === -1) {
            return Promise.reject(new Error(`RpcClient: module ${moduleName} no such function: ${method}`));
        }
        if (this._protocol === ProtocolTypes.webSocket && !this._socket) {
            return Promise.reject(new Error(`RpcClient: client socket is not initialized.`))
        }
        return this.sendRequest(`${moduleName}/${method}`, params);
}

// 根据服务器类型不同, 选择不同的请求方式, 统一包装成 promise 返回
// 对于socket请求, 通过记录每个请求的请求id, 通过比对reqId, 确认每一组请求和返回, 进而调用resolve, reject.
private sendRequest(route: string, params: any): Promise<any> {
        if (this._protocol === ProtocolTypes.http) {
            return promiseRequest({
                url: `${this.rpcServerUrl}/${route}`,
                method: 'POST',
                json: true,
                headers: {
                    'content-type': 'application/json',
                },
                body: params
            });
        } else {
           
            return new Promise((resolve, reject) => {
                const index = this._reqIdIndex++;
                const reqMsg = {
                    reqId: index,
                    body: params,
                    route: route
                }
                this._socket.send(JSON.stringify(reqMsg));
                this._wsRequest[index] = {...reqMsg, onSuccess: resolve, onFail: reject};
            });
        }
    }
```
#### 用法

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


