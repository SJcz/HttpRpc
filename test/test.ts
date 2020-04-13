import { RpcServer } from '../RpcServer/RpcServer';
import { RpcClient } from '../RpcClient/RpcClient';
import path = require('path');


// 启动RPC服务器
console.log(path.resolve(__dirname, '../remote'));
RpcServer.getInstance().initRpcServer(path.resolve(__dirname, '../remote'));
const rpcClient = RpcClient.getInstance();

// 异步
function startRpc() {
    rpcClient.rpcFunction('Test', 'add', {a: 1, b: 2}).then((result) => {
        console.log('-------------------------------------');
        console.log('async:', result);
    }).catch((e) => {
        console.log('-------------------------------------');
        console.log(e.message);
    });
}

// 同步
async function startRpcSync() {
    const result  = await rpcClient.rpcFunction('Test', 'add', {a: 1, b: 2});
    console.log('sync:', result);
}

function startClient (): void {
    rpcClient.init('http://localhost:10008');
    setTimeout(startRpc, 3000);
    setTimeout(startRpcSync, 3000);
}

setTimeout(startClient, 3000);


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