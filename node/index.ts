import { Apps } from '@vtex/api'

import { GraphQLClient } from 'graphql-request'
import { notFound } from './utils/status'
import VBaseClient from './vbase'
import { importOrders, changeOrderStatus } from './importorders'
import * as orderUtils from './utils/ordersutils'
import moment from 'moment'
import {createFeed, formatProductFeed,  getCategoryQuery, followUpCategory, queryProduct, convertToXML, getProductsXML, checkValidEan} from './utils/feedutils'
import axios from 'axios'


const setDefaultHeaders = (res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization")
  res.set('Cache-Control', 'no-cache')
}

const fileName = `wimLengowFeed.txt`
//  const client = new ApolloClient();










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
      

      const endpoint = `http://${account}.myvtex.com/_v/graphql/public/v1?workspace=${ioContext.workspace}&cache=${new Date().getMilliseconds()}`

      const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
          'Authorization': authToken,
        }
      })

      let dataLengowConfig = await graphQLClient.request(orderUtils.lengowConfig)

      let xmlProducts = await getProductsXML(account, authToken)
      
      let products = [];

      let numSKUSParent = 0;
      let numSKUSItems = 0;
      let validGTIN = 0;
      let numSKUFeed = 0;

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
         
         products = [...products, ...formatProductFeed(result.data,dataLengowConfig).products]
         numSKUSParent = formatProductFeed(result.data,dataLengowConfig).numSKUSParent
         numSKUSItems = formatProductFeed(result.data,dataLengowConfig).numSKUSItems
         validGTIN = formatProductFeed(result.data,dataLengowConfig).validGTIN
         numSKUFeed = formatProductFeed(result.data,dataLengowConfig).numSKUFeed

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
      
      /*if(dataLengowConfig.wimLengowConfig.feedFormat=='xml'){
        result = convertToXML({product: products});
        res.set('Content-Type', 'text/xml')
      }
      else{
        res.set('Content-Type', 'application/json')
        result = products;
      }*/

      //ctx.response.body = result;
      ctx.response.body = {
        numSKUSItems,
        numSKUSParent,
        validGTIN,
        numSKUFeed
      }

      /*  
      let categoryQuery = getCategoryQuery(15);

      let category_data = await graphQLClient.request(categoryQuery)

      let arrayCategories = [];
      category_data.categories.map((category) => {
        arrayCategories = followUpCategory(category,'',arrayCategories)
      })
      
      
      


        for(let x = 0; x<arrayCategories.length; x++){
          

           let queryLength = 0;
           let from = 0;
            let to = 49;
            
           
            do {
              let query = queryProduct(dataLengowConfig.wimLengowConfig.salesChannel, from, to, arrayCategories[x])
              

              let query_data = await graphQLClient.request(query)

            

              query_data.products.map((product) => {
                let parentProductIsPrinted = false;
                product.items.map((item, key) => {



                  let uniqueItem = false
                  if (key == 0 && product.items.length == 1) {
                    uniqueItem = true
                  }

                 
                  let isValidGTIN = true;

                  isValidGTIN = checkValidEan(item.ean);
                  

                  if (!dataLengowConfig.wimLengowConfig.flagCheckValidGTIN || isValidGTIN) {
                    let categories = product.categories[0].replace(/^\/+|\/+$/g, '').split('/')
                    let product_type = '';

                    if (uniqueItem) {
                      product_type = 'simple'
                    }
                    else {
                      product_type = 'child'



                      if (!parentProductIsPrinted) {
                        let itemQuantityArray = product.items.map((item) => {
                            return checkValidEan(item.ean) ? item.sellers[0].commertialOffer.AvailableQuantity : 0;
                        })

                        let sumQuantity = itemQuantityArray.reduce(
                          (itemAnterior, itemActual) => itemAnterior + itemActual
                        );

                        let productParentAux = {
                          product_id: product.productId,
                          title: item.nameComplete,
                          brand: product.brand,
                          link: product.link,
                          description: product.description,
                          category: product.categories[0].replace(/^\/+|\/+$/g, '').replace('/', ' > '),
                          image_URL: item.images[0].imageUrl,
                          sale_price: item.sellers[0].commertialOffer.Price,
                          barred_price: item.sellers[0].commertialOffer.ListPrice,
                          price_including_tax: item.sellers[0].commertialOffer.Price,
                          quantity_in_stock: sumQuantity,
                          //item.sellers[0].commertialOffer.AvailableQuantity,
                          bullet_points: product.metaTagDescription,
                          keywords: `${product.metaTagDescription}`,
                          product_type: 'parent'
                        }

                        categories.map((item, key) => {
                          productParentAux['sub_category' + (key + 1)] = item;
                        })

                        numSKUSParent += 1;
                        products.push(productParentAux)

                        parentProductIsPrinted = true;
                      }
                    }

                    let productAux = {
                      product_id: `${product.productId}-${item.itemId}`,
                      title: item.nameComplete,
                      brand: product.brand,
                      link: product.link,
                      description: product.description,
                      ean: item.ean,
                      category: product.categories[0].replace(/^\/+|\/+$/g, '').replace('/', ' > '),
                      image_URL: item.images[0].imageUrl,
                      sale_price: item.sellers[0].commertialOffer.Price,
                      barred_price: item.sellers[0].commertialOffer.ListPrice,
                      price_including_tax: item.sellers[0].commertialOffer.Price,
                      quantity_in_stock: item.sellers[0].commertialOffer.AvailableQuantity,
                      bullet_points: product.metaTagDescription,
                      keywords: `${product.metaTagDescription}`,
                      product_type
                      //attributes: {attribute: item.variations}
                    }

                    if (product_type == 'child') {
                      productAux['parent_id'] = product.productId
                    }

                    categories.map((item, key) => {
                      productAux['sub_category' + (key + 1)] = item;
                    })

                    item.variations.map((item, key) => {
                      productAux[item.name] = item.values;
                    })
                    

                    var found = products.find(function(product) {
                      return product.product_id == productAux.product_id
                    });

                    if(!found){
                      products.push(productAux)
                      
                      numSKUSItems += 1;
                      if (isValidGTIN) {
                        validGTIN += 1;
                      }
                      numSKUFeed++;
                    }

                    
                      
                  }
                })
              })
              //console.log(products);

              queryLength = query_data.products.length
              from += increment;
              to += increment;


            } while (queryLength > 0 && from<2550); //FROM 2550 porque VTEX tiene limitacion de 2500 resultados
       /*
        }
      */



      /*
      
      let result;
      const vbase = VBaseClient(ioContext, fileName)
      await vbase.saveFile({ product: products });

      const vBaseLengowConfig = VBaseClient(ioContext, 'wimVtexLengow.txt');

      let date = new Date().toISOString().
        replace(/T/, ' ').      // replace T with a space
        replace(/\..+/, '')     // delete the dot and everything after

      dataLengowConfig.wimLengowConfig.lastDateGenerated = date;
      await vBaseLengowConfig.saveFile(dataLengowConfig.wimLengowConfig)

      */

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