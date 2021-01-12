import { RpcServer } from '../RpcServer/RpcServer';
import { RpcClient } from '../RpcClient/RpcClient';
import path = require('path');


// 启动RPC服务器
RpcServer.getInstance().initRpcServer(path.resolve(__dirname, '../remote'));
const rpcClient = RpcClient.getInstance();
async function startClient () {
    await rpcClient.initClient('http://localhost:10008');
    await startRpcSync();
    startRpc()
}
startClient();

// 异步
function startRpc() {
    rpcClient.rpc.Test.add(1, 2).then((result) => {
        console.log('-------------------------------------');
        console.log('async:', result);
    }).catch((e) => {
        console.log('-------------------------------------');
        console.log(e.message);
    });
}

// 同步
async function startRpcSync() {
    const result  = await rpcClient.rpc.Test.add!(1, 2);
    console.log('sync:', result);
}


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