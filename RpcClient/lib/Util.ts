import request = require('request');
import { IPromiseReturn } from './Define';

export function sleep(time: number) {
    let promise = new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(undefined);
        }, time);
    });
    return promise;
}

export function promiseRequest(options: any): Promise<IPromiseReturn> {
    const promiseReturn: IPromiseReturn = { statusCode: -1 };
    return new Promise((resolve, reject) => {
        try {
            request(options, (err: Error, res: request.Response, body: any) => {
                if (err) {
                    promiseReturn.msg = err.message;
                    return resolve(promiseReturn);
                }
                if (res.statusCode !== 200) {
                    promiseReturn.msg = 'Rpc 服务器没有返回正确的状态码';
                    return resolve(promiseReturn);
                }
                promiseReturn.statusCode = 200;
                promiseReturn.data = JSON.parse(body);
                return resolve(promiseReturn);
            });
        } catch (e) {
            promiseReturn.msg = e.message;
            resolve(promiseReturn);
        }
    });
}

