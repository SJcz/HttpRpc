"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
function sleep(time) {
    var promise = new Promise(function (resolve, reject) {
        setTimeout(function () {
            resolve(undefined);
        }, time);
    });
    return promise;
}
exports.sleep = sleep;
function promiseRequest(options) {
    var promiseReturn = { statusCode: -1 };
    return new Promise(function (resolve, reject) {
        try {
            request(options, function (err, res, body) {
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
        }
        catch (e) {
            promiseReturn.msg = e.message;
            resolve(promiseReturn);
        }
    });
}
exports.promiseRequest = promiseRequest;
