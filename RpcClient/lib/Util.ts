import request = require('request');
import { IPromiseReturn } from './Define';

// 一个辅助函数, 解决模块内部无法使用import的问题
export function requireModule(modulePath: string): any {
    // requireMap[modulePath] = require(modulePath);
    return require(modulePath);
}

export function sleep(time: number) {
    let promise = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
    return promise;
}

export function promiseRequest(options: any): Promise<IPromiseReturn> {
    const promiseReturn: IPromiseReturn = { statusCode: -1 };
    return new Promise((resolve, reject) => {
        try {
            console.log(options);
            request(options, (err: Error, res: request.Response, body: any) => {
                if (err) {
                    promiseReturn.msg = err.message;
                    return resolve(promiseReturn);
                }
                if (res.statusCode !== 200) {
                    promiseReturn.msg = 'Rpc 服务器没有返回正确的状态码';
                    return resolve(promiseReturn);
                }
                promiseReturn.statusCode = 1;
                promiseReturn.data = JSON.parse(body);
                return resolve(promiseReturn);
            });
        } catch (e) {
            promiseReturn.msg = e.message;
            resolve(promiseReturn);
        }
    });
}

