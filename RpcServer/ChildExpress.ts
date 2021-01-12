/* eslint-disable no-undef */
import express = require('express');
import bodyParser = require('body-parser');
import _ = require('underscore');
import { IModuleIntroduce, IProcessMsg, IProcessStartMsg } from './lib/Define';

/**子进程返回给主进程启动成功 */
const SERVER_SUCCESS = '服务器 rpc 路由添加完成';

class ChildExpress {
    private app: express.Application = {} as express.Application;
    private ws: WebSocket;
    private rpcModuleMap: { [moduleName: string]: IModuleIntroduce } = {};
    /**http服务器 端口, 主线程传递 */
    private port;
    /**RPC客户端调用服务端所有rpc模块和方法的路由 主线程传递*/
    private getAllRpcMethodRoute;
    constructor () {
        this.app = express();
        this.app.use(bodyParser.json());
        this.rpcModuleMap = {};
    }

    run (): void {
        this.initProcess();
    }

    initProcess (): void {
        console.log('RpcServer: intialize child process message | uncaughtException | exit events');
        process.on('message', this.onMessage.bind(this));
        process.on('exit', this.onExit.bind(this));
        process.on('uncaughtException', (err: Error) => {
            console.log(err);
            process.exit(1);
        })
    }

    /**启动express */
    initExpress (): void {
        console.log('RpcServer: start initialzing express');
        if (!this.app) {
            console.warn('RpcServer: app is not initialized, this is nor normal!!!');
            this.app = express();
            this.app.use(bodyParser.json());
        }
        this.app.use((req, res, next) =>{
            console.log(`RpcServer: Get a rpc request from IP:${req.ip}, url=${req.url}, params=${JSON.stringify(req.body)}`);
            next();
        });
        this.app.post(this.getAllRpcMethodRoute, (req, res) =>{
            res.json(this.rpcModuleMap);
        });
        for (let moduleName in this.rpcModuleMap) {
            this.addRoute(moduleName, this.rpcModuleMap[moduleName]);
        }
        this.app.listen(this.port, () => {
            console.log(`RpcServer: server is running in localhost:${this.port}`);
            if (process.send) {
                process.send({type: 'start', data: SERVER_SUCCESS});
            }
        });
    }

    initWS(): void {
        console.log('RpcServer: start initialzing ws');
        // TODO
    }

    addRoute (moduleName: string, moduleIntroduce: IModuleIntroduce): void {
        if (!this.app) {
            throw new Error('RpcServer: when adding route , find app is not initialized');
        }
        if (Object.prototype.toString.call(moduleIntroduce.methodList) !== '[object Array]') {
            console.warn(`RpcServer: methodList of module ${moduleName} is not a array. please provide a valid array!`);
            return;
        }
        // 由于这里无法使用import(namespace和module内部无法使用import), 所以在外面使用import之后再返回回来
        const modObj = require(moduleIntroduce.filePath);
        if (!modObj) {
            console.warn(`RpcServer: require ${moduleIntroduce.filePath}, but can not find ${moduleIntroduce.filePath} when require. `);
            return;
        }
        for (let method of moduleIntroduce.methodList) {
            console.log(`RpcServer: add route | ${moduleName}/${method} | success`);
            this.app.post(`/${moduleName}/${method}`, async (req, res) => {
                // 这里需要将body里面参数提取出来，然后依次作为需要运行的方法的参数, 使用拓展运算符
                const arguement = _.values(req.body);
                const result = await modObj[method].call(null, ...arguement);
                // console.log(`server: ${moduleName}/${method} return value=${JSON.stringify(result)}`);
                res.json(result);
            });
        }

    }

    onMessage (msgObj: IProcessMsg<IProcessStartMsg>): void {
        console.log('收到父进程消息', JSON.stringify(msgObj))
        if (msgObj.type === 'start') {
            this.rpcModuleMap = msgObj.data.rpcModuleMap;
            this.port = msgObj.data.port;
            this.getAllRpcMethodRoute = msgObj.data.route;
            if (msgObj.cmd === 'express') {
                this.initExpress();                                      
            }
            if (msgObj.cmd === 'ws') {
                this.initWS();                                      
            }
        }
    }

    onExit (): void {
        console.log(`process ${process.pid} exit.`);
    }
}


new ChildExpress().run();

