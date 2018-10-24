import VBaseClient from '../vbase'
import { notFound } from '../utils/status'
import { withAuthToken, withMDPagination, headers } from '../headers'
import axios from 'axios'

const getAjaxDataByGET = async (options) => {
    const response = await axios.get(options.url,{headers:options.headers})
    .catch(function(error){
        return {error}
    });
    if(response && response.data){
        return response.data
    }else{
        return false;
    }
}

const fileName = `wimVtexLengow.txt`


  export const resolvers = {
    Mutation: {
        saveLengowConfig: async (_, {config},ctx) =>{
            console.log('[myProduct] Received arguments:', config)

            const {vtex: ioContext} = ctx
            
            const vbase = VBaseClient(ioContext,fileName)
            await vbase.saveFile(config)
            
            return config
        }
    },
    Query: {
        wimLengowConfig: async (_, args, ctx) => {
            console.log('[myProduct] Received vtex context:', ctx.vtex)
            
            
            const {vtex: ioContext} = ctx
            const vBase = VBaseClient(ioContext,fileName)

            const response = await vBase.getFile().catch(notFound())

            if(response.data){
                return JSON.parse(response.data.toString())
            }
          },
        salesChannel: async (_,args,ctx) => {
            const {vtex: ioContext, request: { headers: { cookie } }} = ctx
            const {account, authToken} = ioContext
            
            const idToken = ctx.cookies.get('VtexIdclientAutCookie')

            var optionsClientInfo = {
                //url: `http://api.vtex.com/${account}/dataentities/CL/documents/${idClient}?_fields=document`,
                url: `http://${account}.vtexcommercestable.com.br/api/catalog_system/pvt/saleschannel/list`,
                //url: `http://api.vtex.com/${account}/catalog_system/pvt/saleschannel/list`,
                //url: `https://google.es`,
                headers: {
                    'VtexIdclientAutCookie': authToken,
                    'Proxy-Authorization': authToken,
                    'X-Vtex-Proxy-To': `https://${account}.vtexcommercestable.com.br`,
                }
            }

            /*
            console.log('[myProduct] Received vtex cookie:', cookie)
            console.log(ioContext)
           
            console.log(ctx.headers);
            */

            
            let response = await axios.get(optionsClientInfo.url, {headers: optionsClientInfo.headers}).catch(function(error){
                //console.log("ERROR?: ", error);
            });

            //console.log("RESPONSE?: ", response);

            //console.log("URL:", optionsClientInfo.url);
            //console.log(object)
            return response.data
        }
    }
  }