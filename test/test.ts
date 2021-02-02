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
                httpRpcServer = new RpcServer().initRpcServer(path.resolve(__dirname, '../remote'))
            }, Error);
        });
        it('create web socket rpc server no error', () => {
            assert.doesNotThrow(() => {
                wsRpcServer = (<RpcServer>new RpcServer().serverType(2)).initRpcServer(path.resolve(__dirname, '../remote'))
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