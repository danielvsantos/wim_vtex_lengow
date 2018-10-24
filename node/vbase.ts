import { VBase } from '@vtex/api'

const service: string = "wimvtexlengow"
const userAgent: string = "VTEX wimvtexlengow " + process.env.VTEX_APP_VERSION

export default function VBaseClient({ account, workspace, region, authToken }: ReqContext, fileName) {

    const client = new VBase({ account, workspace, region, authToken, userAgent })  

    return {
        saveFile: (data) => {
            var Readable = require('stream').Readable;
            var s = new Readable();
            s._read = function noop() { };
            s.push(JSON.stringify(data));
            s.push(null);

            return client.saveFile(service, fileName, s, false)
        },
        getFile: () => {
            return client.getFile(service, fileName)
        },
    }
}
