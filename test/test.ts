import { RpcServer } from '../RpcServer/RpcServer';
import { RpcClient } from '../RpcClient/RpcClient';
import assert = require('assert');
import path = require('path');


// 测试hello模块中的sum函数
describe('#RpcServer.js', () => {
    let httpRpcServer;
    let httpRpcclient: RpcClient;

    let wsRpcServer;
    let wsRpcclient: RpcClient;
    describe('#httpServer', () => {
        it('create http rpc server no error', () => {
            assert.doesNotThrow(() => {
                httpRpcServer = (<RpcServer>new RpcServer().prefix('AB')).initRpcServer(path.resolve(__dirname, '../remote'), () => {
                    console.warn(`ssssssssssssssssssssssssssssssssssssssssssss`);
                })
            }, Error);
        });
        it('create web socket rpc server no error', () => {
            assert.doesNotThrow(() => {
                wsRpcServer = (<RpcServer>new RpcServer().serverType(2)).initRpcServer(path.resolve(__dirname, '../remote'), () => {
                    console.warn(`rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr`);
                })
            }, Error);
        });
    });

    describe('#httpclient', () => {
        it('create http rpc client no error', async () => {
            httpRpcclient = await new RpcClient().initClient('http://localhost:10008');
            assert.ok(httpRpcclient);
        });

        it('should return 3', async () => {
            const result = await httpRpcclient.rpc.Test.addNumber(1, 2)
            assert.deepStrictEqual(result, 3);
        });

        it('should return `123`', async () => {
            const result = await httpRpcclient.rpc.Test.addString('12', '3')
            assert.deepStrictEqual(result, '123');
        });

        it('should return `{1: 2}`', async () => {
            const json = {1: 2}
            const result = await httpRpcclient.rpc.Test.addJson(json)
            assert.deepStrictEqual(result, json);
        });
    });

    describe('#wsclient', () => {
        it('create ws rpc client no error', async () => {
            wsRpcclient = await (<RpcClient>new RpcClient().serverType(2)).initClient('ws://localhost:10009');
            assert.ok(wsRpcclient);
        });

        it('should return 3', async () => {
            const result = await wsRpcclient.rpc.Test.addNumber(1, 2)
            assert.deepStrictEqual(result, 3);
        });

        it('should return `123`', async () => {
            const result = await wsRpcclient.rpc.Test.addString('12', '3')
            assert.deepStrictEqual(result, '123');
        });

        it('should return `{1: 2}`', async () => {
            const json = {1: 2}
            const result = await wsRpcclient.rpc.Test.addJson(json)
            assert.deepStrictEqual(result, json);
        });
    });

    describe('#close', () => {
        it('print info', async () => {
            httpRpcServer.close();
        });
    });
});

// const rpcServer = new RpcServer();
// rpcServer.prefix();
// rpcServer.prefix('ABC');

// rpcServer.serverType()  // 获取 rpc 服务器类型
// rpcServer.serverType(2) //  设置rpc服务器类型 1 = http, websocket = 2. 默认 1

// rpcServer.port(); // 获取 rpc 服务器的端口
// rpcServer.port(10010) // 设置rpc服务器端口. 默认 http = 10008, websocket = 10009

// rpcServer.rpcMethodRoute() // 获取供RPC客户端调用的 ·服务端所有rpc方法· 的路由
// rpcServer.rpcMethodRoute('RpcServer/getAll') // 设置该路由. 默认是 RpcServer/GetAllRpcMethod

// rpcServer.times(); // 获取 提供rpc服务的子进程最大尝试重启次数 默认 3 
// rpcServer.times(5); // 设置 提供rpc服务的子进程最大尝试重启次数

// rpcServer.initRpcServer(path.resolve(__dirname, '../remote')) // 初始化和启动rpc服务器, 传入一个要扫描的绝对路径文件夹

// const rpcClient = new RpcClient() // 新建一个rpc客户端
// rpcClient.serverType();

// 启动RPC服务器

// const rpcClient = new RpcClient().initClient('http://localhost:10008');
// async function startClient () {
//     await rpcClient.initClient('http://localhost:10008');
//     await startRpcSync();
//     startRpc()
// }
// startClient();

// // 异步
// function startRpc() {
//     rpcClient.rpc.Test.add(1, 2).then((result) => {
//         console.log('-------------------------------------');
//         console.log('async:', result);
//     }).catch((e) => {
//         console.log('-------------------------------------');
//         console.log(e.message);
//     });
// }

// // 同步
// async function startRpcSync() {
//     const result  = await rpcClient.rpc.Test.add(1, 2);
//     console.log('sync:', result);
// }


/*

function sleep(time) {
    let promise = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
    return promise;
}

async function asyncTest() {
    let i = 0;
    while (i < 10) {
        let date = new Date();
        console.log(`time: ${date} i=${i}`);
        i++;
        await sleep(1000); //暂停1秒
    }
}

console.log('==开始执行异步函数==');
asyncTest();
console.log('==我是异步函数后面的内容==');

*/