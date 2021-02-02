"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const bodyParser = require("body-parser");
class HttpServer {
    constructor() {
        this.rpcModuleMap = {};
        this.app = express();
        this.app.use(bodyParser.json());
        this.rpcModuleMap = {};
    }
    initParam(data) {
        this.rpcModuleMap = data.rpcModuleMap;
        this.port = data.port;
        this.getAllRpcMethodRoute = data.route;
        return this;
    }
    initExpress() {
        console.log('RpcServer-HttpServer: start initialzing http server (express)');
        if (!this.app) {
            console.warn('RpcServer-HttpServer: app is not initialized, this is nor normal!!!');
            this.app = express();
            this.app.use(bodyParser.json());
        }
        this.app.use((req, res, next) => {
            console.log(`RpcServer-HttpServer: http server get a rpc request from IP:${req.ip}, url=${req.url}, params=${JSON.stringify(req.body)}`);
            next();
        });
        this.app.post(`/${this.getAllRpcMethodRoute}`, (req, res) => {
            res.json({ data: this.rpcModuleMap });
        });
        console.log(`RpcServer-HttpServer: add route | ${this.getAllRpcMethodRoute} | success`);
        for (let moduleName in this.rpcModuleMap) {
            this.addRoute(moduleName, this.rpcModuleMap[moduleName]);
        }
        this._server = this.app.listen(this.port, () => {
            console.log(`RpcServer-HttpServer: http server is running in localhost:${this.port}`);
            if (process.send) {
                process.send({ type: 'start', data: '' });
            }
        });
    }
    addRoute(moduleName, moduleIntroduce) {
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
            this.app.post(`/${moduleName}/${method}`, (req, res) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const arguement = req.body;
                    const result = yield modObj[method].call(modObj, ...arguement);
                    res.json({ data: result });
                }
                catch (err) {
                    console.log(`RpcServer-HttpServer: rpc服务器错误 ${moduleName}/${method} failed, argument=${JSON.stringify(req.body)}, err: ${err.stack}`);
                    res.status(500).end('rpd服务器错误');
                }
            }));
        }
    }
    close() {
        this._server && this._server.close();
        console.log(`RpcServer-HttpServer: 关闭rpc http 服务器`);
    }
}
exports.HttpServer = HttpServer;
//# sourceMappingURL=httpServer.js.map