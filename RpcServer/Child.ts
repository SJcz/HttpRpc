
import _ = require('underscore');
import { IProcessMsg, IProcessStartMsg, ProtocolTypes } from './lib/Define';
import { HttpServer } from './httpServer';
import { WSServer } from './wsServer';

class Child {
    private httpServer: HttpServer;
    private wsServer: WSServer;

    run (): void {
        this.initProcess();
    }

    initProcess (): void {
        console.log('RpcServer: intialize child process message | uncaughtException | exit events');
        process.on('message', this.onMessage.bind(this));
        process.on('uncaughtException', (err: Error) => {
            console.log('子进程捕获到为处理异常', err);
            this.httpServer && this.httpServer.close();
            this.wsServer && this.wsServer.close();
            process.exit(1);
        })
    }

    onMessage (msgObj: IProcessMsg<IProcessStartMsg>): void {
        console.log('收到父进程消息', JSON.stringify(msgObj))
        if (msgObj.type === 'start') {
            if (msgObj.data.protocol === ProtocolTypes.http) {
                if (this.httpServer) {
                    this.httpServer.close();
                }
                this.httpServer = new HttpServer();
                this.httpServer.initParam(msgObj.data).initExpress();                                
            }
            if (msgObj.data.protocol === ProtocolTypes.webSocket) {
                if (this.wsServer) {
                    this.wsServer.close();
                }
                this.wsServer = new WSServer();
                this.wsServer.initParam(msgObj.data).initWS();                                        
            }
        }
    }
}


new Child().run();

