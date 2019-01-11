import { validate } from 'gtin'
import axios from 'axios'

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
      return false;
    });

  if (!response || !response.data) {
    return false;
  }

  return JSON.parse(convertToJson(response.data)).products.product;
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
              numSKUSSimple++;
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

                

                let foundIndex = products.findIndex((productFind) => {
                  return productFind.product_id == product.productId
                })

              
                  
                

                if (foundIndex<0) {
                  let productParentAux = {
                    product_id: product.productId,
                    title: item.nameComplete,
                    brand: product.brand,
                    link: product.link.replace(`${account}.vtexcommercestable.com.br`, dataLengowConfig.wimLengowConfig.domainShop),
                    description: product.description,
                    category: product.categories[0].replace(/^\/+|\/+$/g, '').replace('/', ' > '),
                    image_URL: item.images[0].imageUrl,
                    [`sale_price_${marketplace}`]: item.sellers[0].commertialOffer.Price,
                    [`barred_price_${marketplace}`]: item.sellers[0].commertialOffer.ListPrice,
                    [`price_including_tax_${marketplace}`]: item.sellers[0].commertialOffer.Price,
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
                } else {
                  products[foundIndex][`sale_price_${marketplace}`] = item.sellers[0].commertialOffer.Price
                  products[foundIndex][`barred_price_${marketplace}`] = item.sellers[0].commertialOffer.ListPrice
                  products[foundIndex][`price_including_tax_${marketplace}`] = item.sellers[0].commertialOffer.Price
                }
              }
            }

            let foundIndex2 = products.findIndex((productFind) => {
              return productFind.product_id == `${product.productId}-${item.itemId}`
            })

            if (foundIndex2<0) {
              let productAux = {
                product_id: `${product.productId}-${item.itemId}`,
                title: item.nameComplete,
                brand: product.brand,
                link: product.link.replace(`${account}.vtexcommercestable.com.br`, dataLengowConfig.wimLengowConfig.domainShop),
                description: product.description,
                ean: item.ean,
                category: product.categories[0].replace(/^\/+|\/+$/g, '').replace('/', ' > '),
                image_URL: item.images[0].imageUrl,
                [`sale_price_${marketplace}`]: item.sellers[0].commertialOffer.Price,
                [`barred_price_${marketplace}`]: item.sellers[0].commertialOffer.ListPrice,
                [`price_including_tax_${marketplace}`]: item.sellers[0].commertialOffer.Price,
                quantity_in_stock: item.sellers[0].commertialOffer.AvailableQuantity,
                bullet_points: product.metaTagDescription,
                keywords: `${product.metaTagDescription}`,
                product_type
                //attributes: {attribute: item.variations}
              }

              if (product_type == 'child') {
                numSKUSChild++;
                productAux['parent_id'] = product.productId
              }

              categories.map((item, key) => {
                productAux['sub_category' + (key + 1)] = item;
              })

              item.variations && item.variations.map((item, key) => {
                productAux[item.name] = item.values;
              })

              products.push(productAux)

              numSKUSItems += 1;
              if (isValidGTIN) {
                validGTIN += 1;
              }
              numSKUFeed++;
            } else {
              products[foundIndex2][`sale_price_${marketplace}`] = item.sellers[0].commertialOffer.Price
              products[foundIndex2][`barred_price_${marketplace}`] = item.sellers[0].commertialOffer.ListPrice
              products[foundIndex2][`price_including_tax_${marketplace}`] = item.sellers[0].commertialOffer.Price
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