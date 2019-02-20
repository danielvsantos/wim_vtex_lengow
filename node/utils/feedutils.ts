import { validate } from 'gtin'
import axios from 'axios'
const moment = require('moment')
import { GraphQLClient } from 'graphql-request'

import { notFound } from '../utils/status'
import VBaseClient from '../vbase'
import * as orderUtils from '../utils/ordersutils'

export const convertToXML = (object) => {
  var convert = require('xml-js');
  var options = { compact: true, ignoreComment: true, spaces: 4 };
  let result = convert.json2xml({ catalogue: object }, options);

  result = `<?xml version="1.0" encoding="utf-8"?>` + result

  return result;
}

export const convertToJson = (xml) => {
  var convert = require('xml-js');
  var options = { ignoreComment: true, alwaysChildren: true, compact: true };
  var result = convert.xml2json(xml, options);

  return result;
}

export const checkValidEan = (ean) => {
  let isValidGTIN = false;
  try {
    isValidGTIN = validate(ean);
  } catch (e) { }
  return isValidGTIN;
}

export const getProductsXML = async (account, authToken) => {

  var xmlRequestInfo = {
    url: `http://${account}.vtexcommercestable.com.br/XMLData/lengow.xml?t=${new Date().getTime()}`,
    headers: {
      'VtexIdclientAutCookie': authToken,
      'Proxy-Authorization': authToken,
      'X-Vtex-Proxy-To': `https://${account}.vtexcommercestable.com.br`,
    }
  }

  let response = <any>{};
  response = await axios.get(xmlRequestInfo.url, { headers: xmlRequestInfo.headers })
    .catch(function (error) {
      console.log('ERROR ON Fetch XML ',error.data)
      return false;
    });

  if (!response || !response.data) {
    return false;
  }

  let idProducts = JSON.parse(convertToJson(response.data)).products.product;
  return idProducts.map(item => item.id_product._cdata);
}

const generateChildren = (string, counter) => {
  let childrenQuery = `
    children{
        id,
        name,`


  if (counter > 0) {

    string += generateChildren(childrenQuery, counter - 1);
    string += `}`
  }

  return string
}


export const getCategoryQuery = (childrenLevel) => {
  let categoryQuery = `
        query{
            categories(treeLevel:15) {
                id,
                name,
                ${generateChildren('', childrenLevel)}
            }
        } `

  return categoryQuery
}

export const followUpCategory = (category, parent = '', arrayCategories = []) => {
  let categoryParentString = (parent) ? parent + "/" + category.id : category.id

  arrayCategories.push(categoryParentString)

  if (category.children && category.children.length > 0) {
    category.children.map((children) => {
      arrayCategories = followUpCategory(children, categoryParentString, arrayCategories)
    })

  }

  return arrayCategories
}

export const queryProduct = (salesChannel, from, to, category) => {
  return `
        query{
              products(salesChannel: "${salesChannel}", from:${from}, to: ${to}, category: "${category}"){
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
}

export const formatProductFeed = (productsPerMkSC, dataLengowConfig, account) => {
  let numSKUSParent = 0;
  let numSKUSSimple = 0;
  let numSKUSChild = 0;
  let validGTIN = 0;
  let numSKUSItems = 0;
  let numSKUFeed = 0;
  let products = [];

  let excludeOutStock = dataLengowConfig.wimLengowConfig.flagExportOutOfStockSKU;

  productsPerMkSC.map((marketplaceProducts) => {

    let marketplace = marketplaceProducts.marketplace
    let APIProductArray = marketplaceProducts.products
    if (APIProductArray.length) {

      APIProductArray.map((product) => {
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
                  return (checkValidEan(item.ean) || !dataLengowConfig.wimLengowConfig.flagCheckValidGTIN) ? item.sellers[0].commertialOffer.AvailableQuantity : 0;
                })

                let sumQuantity = itemQuantityArray.reduce(
                  (itemAnterior, itemActual) => itemAnterior + itemActual
                );

                

                let foundIndex = products.findIndex((productFind) => {
                  return productFind.product_id == product.productId
                })

                if (foundIndex<0) {
                  let imageSkuURL = {}
                  if(typeof item.images !== "undefined" && item.images && item.images.length > 0){
                    for(let i=0;i<item.images.length;i++){
                      imageSkuURL[`image_url_${i+1}`] = item.images[i].imageUrl
                    }
                  }
                  let productParentAux = {
                    product_id: product.productId,
                    reference: product.productReference,
                    title: item.nameComplete,
                    brand: product.brand,
                    link: product.link.replace(`${account}.vtexcommercestable.com.br`, dataLengowConfig.wimLengowConfig.domainShop),
                    description: product.description,
                    category: product.categories[0].replace(/^\/+|\/+$/g, '').replace('/', ' > '),
                    [`sale_price_${marketplace}`]: item.sellers[0].commertialOffer.Price,
                    [`barred_price_${marketplace}`]: item.sellers[0].commertialOffer.ListPrice,
                    [`price_including_tax_${marketplace}`]: item.sellers[0].commertialOffer.Price,
                    [`quantity_in_stock_${marketplace}`]: sumQuantity,
                    //quantity_in_stock: sumQuantity,
                    //item.sellers[0].commertialOffer.AvailableQuantity,
                    bullet_points: product.metaTagDescription,
                    keywords: `${product.metaTagDescription}`,
                    product_type: 'parent'
                  }
                  productParentAux = {...productParentAux,...imageSkuURL}

                  categories.map((item, key) => {
                    productParentAux['sub_category' + (key + 1)] = item;
                  })

                  product.allSpecifications && product.allSpecifications.map((specification_name, key) => {
                    productParentAux[specification_name] = product[specification_name][0];
                  })

                  if((excludeOutStock && sumQuantity > 0) || !excludeOutStock){
                    numSKUSParent += 1;
                    products.push(productParentAux)
                    parentProductIsPrinted = true;
                  }
                } else {
                  products[foundIndex][`sale_price_${marketplace}`] = item.sellers[0].commertialOffer.Price
                  products[foundIndex][`barred_price_${marketplace}`] = item.sellers[0].commertialOffer.ListPrice
                  products[foundIndex][`price_including_tax_${marketplace}`] = item.sellers[0].commertialOffer.Price
                  products[foundIndex][`quantity_in_stock_${marketplace}`]= sumQuantity
                }
              }
            }

            let foundIndex2 = products.findIndex((productFind) => {
              return productFind.product_id == `${product.productId}-${item.itemId}`
            })

            if (foundIndex2<0) {

              let refId = '';
              if(item.referenceId){
                  let refArray = item.referenceId.filter(ele => ele.Key == 'RefId')
                  if(refArray.length){
                    refId = refArray[0].Value
                  }
              }

              let imageSkuURL = {}
              if(typeof item.images !== "undefined" && item.images && item.images.length > 0){
                for(let i=0;i<item.images.length;i++){
                  imageSkuURL[`image_url_${i+1}`] = item.images[i].imageUrl
                }
              }
              let productAux = {
                product_id: `${product.productId}-${item.itemId}`,
                reference: refId,
                title: item.nameComplete,
                brand: product.brand,
                link: product.link.replace(`${account}.vtexcommercestable.com.br`, dataLengowConfig.wimLengowConfig.domainShop),
                description: product.description,
                ean: item.ean,
                category: product.categories[0].replace(/^\/+|\/+$/g, '').replace('/', ' > '),
                [`sale_price_${marketplace}`]: item.sellers[0].commertialOffer.Price,
                [`barred_price_${marketplace}`]: item.sellers[0].commertialOffer.ListPrice,
                [`price_including_tax_${marketplace}`]: item.sellers[0].commertialOffer.Price,
                [`quantity_in_stock_${marketplace}`]: item.sellers[0].commertialOffer.AvailableQuantity,
                //quantity_in_stock: item.sellers[0].commertialOffer.AvailableQuantity,
                bullet_points: product.metaTagDescription,
                keywords: `${product.metaTagDescription}`,
                product_type
                //attributes: {attribute: item.variations}
              }
              productAux = {...productAux,...imageSkuURL}
              if (product_type == 'simple') {
                numSKUSSimple++;
              }
              if (product_type == 'child') {
                numSKUSChild++;
                productAux['parent_id'] = product.productId
              }

              categories.map((item, key) => {
                productAux['sub_category' + (key + 1)] = item;
              })

              product.allSpecifications && product.allSpecifications.map((specification_name, key) => {
                productAux[specification_name] = product[specification_name][0];
              })

              item.variations && item.variations.map((variation_name, key) => {
                productAux[variation_name] = item[variation_name][0];
              })

              

              if((excludeOutStock && item.sellers[0].commertialOffer.AvailableQuantity > 0) || !excludeOutStock){
                products.push(productAux)
                numSKUSItems += 1;
                if (isValidGTIN) {
                  validGTIN += 1;
                }
                numSKUFeed++;
              }
            } else {
              products[foundIndex2][`sale_price_${marketplace}`] = item.sellers[0].commertialOffer.Price
              products[foundIndex2][`barred_price_${marketplace}`] = item.sellers[0].commertialOffer.ListPrice
              products[foundIndex2][`price_including_tax_${marketplace}`] = item.sellers[0].commertialOffer.Price
              products[foundIndex2][`quantity_in_stock_${marketplace}`] = item.sellers[0].commertialOffer.AvailableQuantity
            }
          }
        })
      })
    }

  });

  return {
    products,
    numSKUSParent,
    numSKUSChild,
    numSKUSSimple,
    validGTIN,
    numSKUSItems,
    numSKUFeed

  }
}

export const createFeed = async(ctx) => {
  const { response: res, vtex: ioContext } = ctx
      const { account, authToken } = ioContext

      const vbaseLogsLengow = VBaseClient(ioContext, `logsLengow.txt`)
      const fileName = `wimLengowFeed.txt`
      let responseLogsLengow = <any>{};
      responseLogsLengow = await vbaseLogsLengow.getFile().catch(notFound())

      var logsLengowData = []
      if (responseLogsLengow.data) {
        logsLengowData = JSON.parse(responseLogsLengow.data.toString());
      }

      logsLengowData.push({
        orderID: 'XML-GENERATION',
        type: 'start',
        msg: 'Call to XML Generation started',
        date: moment()
      })
      vbaseLogsLengow.saveFile(logsLengowData);


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
        console.log('Entro en generar siguiente')
        xmlProducts = JSON.parse(dataLengowConfig.wimLengowConfig.xmlProductIds)
        let response = <any>{};
        response = await vbase.getFile().catch(notFound())
        products = JSON.parse(response.data.toString()).product
        console.log('Lectura de IDs de producto desde guardado parcial finalizado')
      }else{
        console.log('Entro en generar de nuevo')
        xmlProducts = await getProductsXML(account, authToken)
        console.log('Lectura de IDs de producto de Feed original XML finalizada')
        if(xmlProducts){
          await vbase.saveFile({ product: products });
        }
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
            result = await axios.get(productSeachEndPoinut + query + `sc=${saleChannelObject.id}&v=${new Date().getTime()}`, { headers })
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
}