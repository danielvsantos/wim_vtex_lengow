import VBaseClient from '../vbase'
import { notFound } from '../utils/status'
import axios from 'axios'

const getAjaxDataByGET = async (options) => {
    let response = <any>{};
    
    response = await axios.get(options.url,{headers:options.headers})
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
            //console.log('[myProduct] Received arguments:', config)

            const {vtex: ioContext} = ctx
            
            const vbase = VBaseClient(ioContext,fileName)
            await vbase.saveFile(config)
            
            return config
        }
    },
    Query: {
        wimLengowConfig: async (_, args, ctx) => {
            //console.log('[myProduct] Received vtex context:', ctx.vtex)
            
            
            const {vtex: ioContext} = ctx
            const vBase = VBaseClient(ioContext,fileName)

            let response = <any>{};
            response = await vBase.getFile().catch(notFound())

            if(response.data){
                return JSON.parse(response.data.toString())
            }
          },
        salesChannel: async (_,args,ctx) => {
            const {vtex: ioContext, request: { headers: { cookie } }} = ctx
            const {account, authToken} = ioContext
            
            const idToken = ctx.cookies.get('VtexIdclientAutCookie')

            var optionsClientInfo = {
                url: `http://${account}.vtexcommercestable.com.br/api/catalog_system/pvt/saleschannel/list`,
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

            
            let response = <any>{};
            response = await axios.get(optionsClientInfo.url, {headers: optionsClientInfo.headers}).catch(function(error){
                //console.log("ERROR?: ", error);
            });

            //console.log("RESPONSE?: ", response);

            //console.log("URL:", optionsClientInfo.url);
            //console.log(object)
            return response.data
        },
        accountDomainHosts: async (_,args, ctx) => {
            const {vtex: ioContext, request: { headers: { cookie } }} = ctx
            const {account, authToken} = ioContext
            
            const idToken = ctx.cookies.get('VtexIdclientAutCookie')

            var optionsClientInfo = {
                url: `http://${account}.vtexcommercestable.com.br/api/vlm/account/stores`,
                headers: {
                    'Content-Type': 'application/json', 
                    'VtexIdclientAutCookie': authToken,
                    'Proxy-Authorization': authToken,
                    'X-Vtex-Proxy-To': `https://${account}.vtexcommercestable.com.br`,
                }
            }

            let response = <any>{};
            
            response = await axios.get(optionsClientInfo.url, {headers: optionsClientInfo.headers}).catch(function(error){
              
            });
            let returnData = [ `${account}.myvtex.com` ]

            if(response.data && response.data.length){
                response.data.forEach(accountData => {
                    if(accountData.name == account){
                        returnData = [...returnData, ...accountData.hosts]
                    }
                });

                
            }
            
            return returnData;
        },
        ordersLengow: async (_,args,ctx) => {
            const {vtex: ioContext} = ctx
            const vBase = VBaseClient(ioContext,`ordersImported.txt`)

            let response = <any>{};
            
            response = await vBase.getFile().catch(notFound())

            if(response.data){
                return JSON.parse(response.data.toString())
            }
        },
        logsLengow: async (_,args,ctx) => {
            const {vtex: ioContext} = ctx
            const vBase = VBaseClient(ioContext,`logsLengow.txt`)
            let response = <any>{};
            response = await vBase.getFile().catch(notFound())
            if(response.data){
                try{
                    return JSON.parse(response.data.toString())
                }
                catch(e){
                    return []
                }
            }
        }
    }
  }
