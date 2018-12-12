//External imports
import moment from 'moment'
import axios from 'axios'
import { GraphQLClient } from 'graphql-request'

//Internal imports
import { notFound } from './utils/status'
import VBaseClient from './vbase'
import * as orderUtils from './utils/ordersutils'
import { importOrders, changeOrderStatus } from './importorders'
import {formatProductFeed, convertToXML, getProductsXML} from './utils/feedutils'

const setDefaultHeaders = (res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization")
  res.set('Cache-Control', 'no-cache')
}

const fileName = `wimLengowFeed.txt`

export default {
  routes: {
    cancelOrderEndpoint: async(ctx) => {
      let result = changeOrderStatus(ctx, 'cancel')
      setDefaultHeaders(ctx.response);
      ctx.response.body = result;
    },
    invoiceOrderEndpoint: async (ctx) => {
      let result = changeOrderStatus(ctx, 'invoice')
      setDefaultHeaders(ctx.response);
      ctx.response.body = result;
    },
    importorders: async (ctx) => {
        let result = importOrders(ctx);
        setDefaultHeaders(ctx.response);
        ctx.response.body = result;
    },
    createFeed: async (ctx) => {
      const { response: res, vtex: ioContext } = ctx
      const { account, authToken } = ioContext
      setDefaultHeaders(res);

      const vbaseLogsLengow = VBaseClient(ioContext, `logsLengow.txt`)
      const responseLogsLengow = await vbaseLogsLengow.getFile().catch(notFound())

      var logsLengowData = []
      if(responseLogsLengow.data){
          logsLengowData = JSON.parse(responseLogsLengow.data.toString());
      }
      

      const endpoint = `http://${account}.myvtex.com/_v/graphql/public/v1?workspace=${ioContext.workspace}&cache=${new Date().getMilliseconds()}`

      const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
          'Authorization': authToken,
        }
      })

      let dataLengowConfig = await graphQLClient.request(orderUtils.lengowConfig)

      let xmlProducts = await getProductsXML(account, authToken)
      if(!xmlProducts){
        logsLengowData.push({
            orderID: 'XML-GENERATION', 
            type: 'error', 
            msg: `There's no product on Feed`, 
            date: moment() 
        })
        vbaseLogsLengow.saveFile(logsLengowData);
        ctx.response.body = {
            result: "There's no product on Feed"
        }
        return false;
      }
      
      let products = [];

      let numSKUSParent = 0;
      let numSKUSItems = 0;
      let validGTIN = 0;
      let numSKUFeed = 0;
      let numSKUSSimple = 0;
      let numSKUSChild = 0;

      let count = 0;
      let query = '';

      for(let x=0; x < xmlProducts.length; x++ ){
        
        query+= 'fq=productId:'+xmlProducts[x].id_product._cdata+'&'
        count++;

        if(count==50 || x == xmlProducts.length-1 ){
          const productSeachEndPoinut = `http://${account}.vtexcommercestable.com.br/api/catalog_system/pub/products/search/?`
          const headers = {
            'VtexIdclientAutCookie': authToken,
            'Proxy-Authorization': authToken,
            'X-Vtex-Proxy-To': `https://${account}.vtexcommercestable.com.br`,
         }
         let result = await axios.get(productSeachEndPoinut+query+`isAvailablePerSalesChannel_${dataLengowConfig.wimLengowConfig.salesChannel}:1`, {headers});
         
         let formatedProducts =  formatProductFeed(result.data,dataLengowConfig, account)

         products = [...products, ...formatedProducts.products]
         numSKUSParent += formatedProducts.numSKUSParent
         numSKUSItems += formatedProducts.numSKUSItems
         validGTIN += formatedProducts.validGTIN
         numSKUFeed += formatedProducts.numSKUFeed
         numSKUSSimple += formatedProducts.numSKUSSimple
         numSKUSChild += formatedProducts.numSKUSChild

          query='';
          count = 0;
        }
      }

      

      const vbase = VBaseClient(ioContext, fileName)
      await vbase.saveFile({ product: products });

      const vBaseLengowConfig = VBaseClient(ioContext, 'wimVtexLengow.txt');

      let date = new Date().toISOString().
        replace(/T/, ' ').      // replace T with a space
        replace(/\..+/, '')     // delete the dot and everything after

      dataLengowConfig.wimLengowConfig.lastDateGenerated = date;
      await vBaseLengowConfig.saveFile(dataLengowConfig.wimLengowConfig)

      let result = {
        numSKUSItems,
        numSKUSSimple,
        numSKUSParent,
        numSKUSChild,
        validGTIN,
        numSKUFeed
      }

      logsLengowData.push({
        orderID: 'XML-GENERATION', 
        type: 'success', 
        msg: JSON.stringify(result), 
        date: moment() 
      })
      vbaseLogsLengow.saveFile(logsLengowData);
      
      ctx.response.body = result
    },

    feed: async (ctx) => {
      const { response: res, vtex: ioContext } = ctx
      const { account, authToken } = ioContext

      setDefaultHeaders(res);

      const endpoint = `http://${account}.myvtex.com/_v/graphql/public/v1?workspace=${ioContext.workspace}`

      const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
          'Authorization': authToken,
        }
      })

      let dataLengowConfig = await graphQLClient.request(orderUtils.lengowConfig)

      const vbaseProducts = VBaseClient(ioContext, fileName)
      const response = await vbaseProducts.getFile().catch(notFound())

      if (dataLengowConfig.wimLengowConfig.feedFormat == 'xml') {
        res.set('Content-Type', 'text/xml')
        ctx.response.body = convertToXML(JSON.parse(response.data.toString()));

      }
      else {
        ctx.response.body = JSON.parse(response.data.toString())
      }

    }
  }
}