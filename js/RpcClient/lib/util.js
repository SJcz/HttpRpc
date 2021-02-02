"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
function promiseRequest(options) {
    return new Promise((resolve, reject) => {
        try {
            request(options, (err, res, body) => {
                if (err) {
                    return reject(err.stack);
                }
                if (res.statusCode !== 200) {
                    return reject(body || 'Rpc 服务器没有返回正确的状态码');
                }
                try {
                    typeof body == 'string' && (body = JSON.parse(body));
                }
                catch (err) {
                }
                return resolve(body.data);
            });
        }
        catch (e) {
            reject(e.stack);
        }
    });
}
exports.promiseRequest = promiseRequest;
//# sourceMappingURL=Util.js.map