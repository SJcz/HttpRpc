"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ClientProxy = /** @class */ (function () {
    function ClientProxy() {
    }
    ClientProxy.genProxy = function (client, mod, method) {
        client.rpc[mod] = client.rpc[mod] || {};
        client.rpc[mod][method] = client.rpcFunction.bind(client, mod, method);
    };
    return ClientProxy;
}());
exports.ClientProxy = ClientProxy;
