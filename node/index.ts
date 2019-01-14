//External imports
const moment = require('moment')
import axios from 'axios'
import { GraphQLClient } from 'graphql-request'

//Internal imports
import { notFound } from './utils/status'
import VBaseClient from './vbase'
import * as orderUtils from './utils/ordersutils'
import { importOrders, changeOrderStatus } from './importorders'
import { formatProductFeed, convertToXML, getProductsXML } from './utils/feedutils'

import delay from 'delay';

const setDefaultHeaders = (res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization")
  res.set('Cache-Control', 'no-cache')
}

const fileName = `wimLengowFeed.txt`

export default {
  routes: {
    cancelOrderEndpoint: async (ctx) => {
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
      let responseLogsLengow = <any>{};
      responseLogsLengow = await vbaseLogsLengow.getFile().catch(notFound())

      var logsLengowData = []
      if (responseLogsLengow.data) {
        logsLengowData = JSON.parse(responseLogsLengow.data.toString());
      }


      const endpoint = `http://${account}.myvtex.com/_v/graphql/public/v1?workspace=${ioContext.workspace}&cache=${new Date().getMilliseconds()}`

      const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
          'Authorization': authToken,
        }
      })

      let dataLengowConfig = <any>{};
      dataLengowConfig = await graphQLClient.request(orderUtils.lengowConfig)
      let mapSalesChannels = JSON.parse(dataLengowConfig.wimLengowConfig.salesChannel)

      const vbase = VBaseClient(ioContext, fileName)
      const vBaseLengowConfig = VBaseClient(ioContext, 'wimVtexLengow.txt');
      let products = [];
      let xmlProducts = []
      if(dataLengowConfig.wimLengowConfig.xmlProductIds){
        //console.log('Entro en generar siguiente')
        xmlProducts = JSON.parse(dataLengowConfig.wimLengowConfig.xmlProductIds)
        let response = <any>{};
        response = await vbase.getFile().catch(notFound())
        products = JSON.parse(response.data.toString()).product
        //console.log('Lectura de IDs de producto desde guardado parcial finalizado')
      }else{
        //console.log('Entro en generar de nuevo')
        xmlProducts = await getProductsXML(account, authToken)
        //console.log('Lectura de IDs de producto de Feed original XML finalizada')
        await vbase.saveFile({ product: products });
      }
      
      if (!xmlProducts) {
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

      let numSKUSParent = 0;
      let numSKUSItems = 0;
      let validGTIN = 0;
      let numSKUFeed = 0;
      let numSKUSSimple = 0;
      let numSKUSChild = 0;

      let count = 0;
      let query = '';
      let totalCount = 0;

      let xmlProductsAux = [...xmlProducts];
      for (let x = 0; x < xmlProducts.length; x++) {

        query += 'fq=productId:' + xmlProducts[x] + '&'
        count++;
        if (count == 50 || x == xmlProducts.length - 1) {
          const productSeachEndPoinut = `http://${account}.vtexcommercestable.com.br/api/catalog_system/pub/products/search/?`
          const headers = {
            'VtexIdclientAutCookie': authToken,
            'Proxy-Authorization': authToken,
            'X-Vtex-Proxy-To': `https://${account}.vtexcommercestable.com.br`,
          }

          let productsPerMkSC = <any>[];
          for(let i=0;i<mapSalesChannels.length;i++){
            let result = <any>{};
            let saleChannelObject = mapSalesChannels[i]
            result = await axios.get(productSeachEndPoinut + query + `sc=${saleChannelObject.id}`, { headers })
            .catch(function (error) {
              //console.log(error)
            });
 
            if(typeof result !== "undefined" && typeof result.data !== "undefined" && result.data){
              productsPerMkSC.push({ marketplace: saleChannelObject.name, products:result.data})
            }
          }
          
          let formatedProducts = formatProductFeed(productsPerMkSC, dataLengowConfig, account)

          try{
            products = [...products, ...formatedProducts.products]
          }catch(e){
            console.log('Error',typeof products);
          }
          numSKUSParent += formatedProducts.numSKUSParent
          numSKUSItems += formatedProducts.numSKUSItems
          validGTIN += formatedProducts.validGTIN
          numSKUFeed += formatedProducts.numSKUFeed
          numSKUSSimple += formatedProducts.numSKUSSimple
          numSKUSChild += formatedProducts.numSKUSChild

          totalCount+=count;
          query = '';
          count = 0;
          xmlProductsAux.splice(0,50);
          //console.log('GUARDO BATCH #',totalCount);
          await vbase.saveFile({ product: products });
          if(xmlProductsAux.length){
            dataLengowConfig.wimLengowConfig.xmlProductIds = JSON.stringify(xmlProductsAux)
          }else{
            dataLengowConfig.wimLengowConfig.xmlProductIds = ''
          }
          await vBaseLengowConfig.saveFile(dataLengowConfig.wimLengowConfig)
          
        }


      }

      let date = new Date().toISOString().
        replace(/T/, ' ').      // replace T with a space
        replace(/\..+/, '')     // delete the dot and everything after

      dataLengowConfig.wimLengowConfig.lastDateGenerated = date;
      await vBaseLengowConfig.saveFile(dataLengowConfig.wimLengowConfig)

      numSKUSParent = products.filter(item => item.product_type == 'parent').length
      numSKUSSimple = products.filter(item => item.product_type == 'simple').length
      numSKUSItems =  numSKUSParent + numSKUSSimple//CUENTA DE LOS SKUS parent + simple
      numSKUSChild = products.filter(item => item.product_type == 'child').length
      numSKUFeed = products.length //CUENTA DE TODOS LOS SKUS (parent, simple, children) en el FEED
      let result = {
        numSKUSItems,
        numSKUSSimple,
        numSKUSParent,
        numSKUSChild,
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

      let dataLengowConfig = <any>{};
      dataLengowConfig = await graphQLClient.request(orderUtils.lengowConfig)

      const vbaseProducts = VBaseClient(ioContext, fileName)
      let response = <any>{};
      response = await vbaseProducts.getFile().catch(notFound())

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