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
const RpcServer_1 = require("../RpcServer/RpcServer");
const RpcClient_1 = require("../RpcClient/RpcClient");
const assert = require("assert");
const path = require("path");
describe('#RpcServer.js', () => {
    let httpRpcServer;
    let httpRpcclient;
    let wsRpcServer;
    let wsRpcclient;
    describe('#httpServer', () => {
        it('create http rpc server no error', () => {
            assert.doesNotThrow(() => {
                httpRpcServer = new RpcServer_1.RpcServer().prefix('AB').initRpcServer(path.resolve(__dirname, '../remote'), () => {
                    console.warn(`ssssssssssssssssssssssssssssssssssssssssssss`);
                });
            }, Error);
        });
        it('create web socket rpc server no error', () => {
            assert.doesNotThrow(() => {
                wsRpcServer = new RpcServer_1.RpcServer().serverType(2).initRpcServer(path.resolve(__dirname, '../remote'), () => {
                    console.warn(`rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr`);
                });
            }, Error);
        });
    });
    describe('#httpclient', () => {
        it('create http rpc client no error', () => __awaiter(void 0, void 0, void 0, function* () {
            httpRpcclient = yield new RpcClient_1.RpcClient().initClient('http://localhost:10008');
            assert.ok(httpRpcclient);
        }));
        it('should return 3', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield httpRpcclient.rpc.Test.addNumber(1, 2);
            assert.deepStrictEqual(result, 3);
        }));
        it('should return `123`', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield httpRpcclient.rpc.Test.addString('12', '3');
            assert.deepStrictEqual(result, '123');
        }));
        it('should return `{1: 2}`', () => __awaiter(void 0, void 0, void 0, function* () {
            const json = { 1: 2 };
            const result = yield httpRpcclient.rpc.Test.addJson(json);
            assert.deepStrictEqual(result, json);
        }));
    });
    describe('#wsclient', () => {
        it('create ws rpc client no error', () => __awaiter(void 0, void 0, void 0, function* () {
            wsRpcclient = yield new RpcClient_1.RpcClient().serverType(2).initClient('ws://localhost:10009');
            assert.ok(wsRpcclient);
        }));
        it('should return 3', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield wsRpcclient.rpc.Test.addNumber(1, 2);
            assert.deepStrictEqual(result, 3);
        }));
        it('should return `123`', () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield wsRpcclient.rpc.Test.addString('12', '3');
            assert.deepStrictEqual(result, '123');
        }));
        it('should return `{1: 2}`', () => __awaiter(void 0, void 0, void 0, function* () {
            const json = { 1: 2 };
            const result = yield wsRpcclient.rpc.Test.addJson(json);
            assert.deepStrictEqual(result, json);
        }));
    });
    describe('#close', () => {
        it('print info', () => __awaiter(void 0, void 0, void 0, function* () {
            httpRpcServer.close();
        }));
    });
});
//# sourceMappingURL=test.js.map