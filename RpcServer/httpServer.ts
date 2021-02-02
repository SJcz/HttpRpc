/* eslint-disable no-undef */
import express = require('express');
import bodyParser = require('body-parser');
import _ = require('underscore');
import { IModuleIntroduce, IProcessStartMsg } from './lib/Define';
import http = require('http');


export class HttpServer {
    private app: express.Application;
    private _server: http.Server;
    /**rpc模块 */
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

    initParam(data: IProcessStartMsg): HttpServer {
        this.rpcModuleMap = data.rpcModuleMap;
        this.port = data.port;
        this.getAllRpcMethodRoute = data.route;
        return this;
    }

    /**启动express */
    initExpress (): void {
        console.log('RpcServer-HttpServer: start initialzing http server (express)');
        if (!this.app) {
            console.warn('RpcServer-HttpServer: app is not initialized, this is nor normal!!!');
            this.app = express();
            this.app.use(bodyParser.json());
        }
        this.app.use((req, res, next) =>{
            console.log(`RpcServer-HttpServer: http server get a rpc request from IP:${req.ip}, url=${req.url}, params=${JSON.stringify(req.body)}`);
            next();
        });
        this.app.post(`/${this.getAllRpcMethodRoute}`, (req, res) =>{
            res.json({data: this.rpcModuleMap});
        });
        console.log(`RpcServer-HttpServer: add route | ${this.getAllRpcMethodRoute} | success`);
        for (let moduleName in this.rpcModuleMap) {
            this.addRoute(moduleName, this.rpcModuleMap[moduleName]);
        }
        this._server = this.app.listen(this.port, () => {
            console.log(`RpcServer-HttpServer: http server is running in localhost:${this.port}`);
            if (process.send) {
                process.send({type: 'start', data: ''});
            }
        });
    }

    addRoute (moduleName: string, moduleIntroduce: IModuleIntroduce): void {
        if (!this.app) {
            throw new Error('RpcServer-HttpServer: when adding route , find app is not initialized');
        }
        if (Object.prototype.toString.call(moduleIntroduce.methodList) !== '[object Array]') {
            console.warn(`RpcServer-HttpServer: methodList of module ${moduleName} is not a array. please provide a valid array!`);
            return;
        }
        const modObj = require(moduleIntroduce.filePath);
        if (!modObj) {
            console.warn(`RpcServer-HttpServer: require ${moduleIntroduce.filePath}, but can not find ${moduleIntroduce.filePath} when require. `);
            return;
        }
        for (let method of moduleIntroduce.methodList) {
            console.log(`RpcServer-HttpServer: add route | ${moduleName}/${method} | success`);
            this.app.post(`/${moduleName}/${method}`, async (req, res) => {
                // 这里需要将body里面参数提取出来，然后依次作为需要运行的方法的参数, 使用拓展运算符
                try {
                    const arguement = req.body;
                    const result = await modObj[method].call(modObj, ...arguement);
                    res.json({data: result});
                } catch(err) {
                    console.log(`RpcServer-HttpServer: rpc服务器错误 ${moduleName}/${method} failed, argument=${JSON.stringify(req.body)}, err: ${err.stack}`);
                    res.status(500).end('rpd服务器错误');
                }
            });
        }
    }

    close() {
        this._server && this._server.close();
        console.log(`RpcServer-HttpServer: 关闭rpc http 服务器`);
    }
}

