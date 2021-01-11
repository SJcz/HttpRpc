import { RpcClient } from "./RpcClient";

export class ClientProxy {
    static genProxy(client: RpcClient, mod: string, method: string) {
        client.rpc[mod] = client.rpc[mod] || {};
        client.rpc[mod][method] = client.rpcFunction.bind(client, mod, method);
    }
}