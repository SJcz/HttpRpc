import request = require('request');

export function promiseRequest(options: any): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            request(options, (err: Error, res: request.Response, body: any) => {
                if (err) {
                    return reject(err.stack);
                }
                if (res.statusCode !== 200) {
                    return reject(body || 'Rpc 服务器没有返回正确的状态码');
                }
                // 能json话的直接json, 不能的话返回原值
                try {
                    typeof body == 'string' && (body = JSON.parse(body));
                } catch(err) {
                    // 
                }
                return resolve(body.data);
            });
        } catch (e) {
            reject(e.stack);
        }
    });
}

