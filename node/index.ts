import { Apps } from '@vtex/api'

import { GraphQLClient } from 'graphql-request'
import { errorResponse } from './utils/error'
import { notFound } from './utils/status'
import VBaseClient from './vbase'
import { validate } from 'gtin'





const setDefaultHeaders = (res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization")
  res.set('Cache-Control', 'no-cache')
}

const pvtHandler = () => {
  return "jaja";
}

const fileName = `wimLengowFeed.txt`
//  const client = new ApolloClient();

const createSafePost = (callback: Function) => {
  return async (ctx) => {
    const { request: req, response: res, vtex: ioContext } = ctx

    try {
      const { status, data, extract, contentType } = await callback(req, res, ioContext)
      res.status = status
      res.set('Cache-Control', 'no-cache')
      res.body = extract ? data : { data }
      res.set('Content-Type', contentType ? contentType : 'application/json')
    } catch (err) {
      const errorMessage = `Error processing ${callback.name}`
      const errorRes = errorResponse(err)

      res.set('Cache-Control', 'no-cache')
      res.set('Content-Type', 'application/json')
      res.status = err.response ? err.response.status : 500
      res.body = { error: errorRes }

      console.error(errorMessage, errorRes)

    }
  }
}


const lengowQuery = `query{
    wimLengowConfig{
      vtex_account,
      account,
      apiKey,
      boolSandbox,
      salesChannel,
      flagExportDisableSKU,
      flagExportDisableSKU,
      flagCheckValidGTIN,
      listExludedSkus,
      mappingOrderStatus,
      feedFormat,
      lastDateGenerated,
    }
  }
`

const convertToXML = (object) => {
  var convert = require('xml-js');
  var options = { compact: true, ignoreComment: true, spaces: 4 };
  let result = convert.json2xml({ catalogue: object }, options);

  result = `<?xml version="1.0" encoding="utf-8"?>` + result

  return result;


}


const checkValidEan = (ean) => {
  let isValidGTIN = false;
  try {
    isValidGTIN = validate(ean);
  } catch (e) { }
  return isValidGTIN;
}



export default {
  routes: {
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

      let dataLengowConfig = await graphQLClient.request(lengowQuery)

      let from = 0;
      let to = 49;
      let products = [];

      const increment = 50;

      let numSKUSParent = 0;
      let numSKUSItems = 0;
      let validGTIN = 0;
      let numSKUFeed = 0;


      let queryLength = 0;
      do {
        let query = `
          query{
            products(salesChannel: "${dataLengowConfig.wimLengowConfig.salesChannel}", from:${from}, to: ${to}){
              productId,
              productName,
              brand,
              link,
              productId,
              description,
              metaTagDescription,
              categories,
              
              items {
                itemId
                name
                nameComplete
                complementName
                ean
                measurementUnit
                images {
                  imageUrl
                },
                sellers{
                  commertialOffer{
                    Price,
                    ListPrice,
                    AvailableQuantity
                  }
                }
                variations {
                  name,
                  values
                },
              }
            }
          } 
          `

        let array = ['Hola', 'Amigo', 'Dani'];

        let query_data = await graphQLClient.request(query)


        query_data.products.map((product) => {
          let parentProductIsPrinted = false;
          product.items.map((item, key) => {

            let uniqueItem = false
            if (key == 0 && product.items.length == 1) {
              uniqueItem = true
            }

            numSKUSItems += 1;
            let isValidGTIN = true;

            isValidGTIN = checkValidEan(item.ean);
            if (isValidGTIN) {
              validGTIN += 1;
            }

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
              numSKUFeed++;
              products.push(productAux)
            }
          })
        })
        //console.log(products);

        queryLength = query_data.products.length
        from += increment;
        to += increment;


      } while (queryLength > 0);




      let result;
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

      let dataLengowConfig = await graphQLClient.request(lengowQuery)





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


