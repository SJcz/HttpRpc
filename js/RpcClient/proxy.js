"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ClientProxy {
    static genProxy(client, mod, method) {
        client.rpc[mod] = client.rpc[mod] || {};
        client.rpc[mod][method] = client.rpcFunction.bind(client, mod, method);
    }
}
exports.ClientProxy = ClientProxy;
//# sourceMappingURL=proxy.js.map