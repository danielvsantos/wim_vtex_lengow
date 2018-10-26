import { Apps } from '@vtex/api'

import { GraphQLClient } from 'graphql-request'
import { errorResponse } from './utils/error'
import { notFound } from './utils/status'
import VBaseClient from './vbase'
import * as orderUtils from './utils/ordersutils'

const LENGOW_API_URL = 'api.lengow.io';
const LENGOW_API_SANDBOX_URL = 'api.lengow.net';

const querystring = require('querystring');

export const importOrders = async (ctx) => {
    //var jwtDecode  = require('jwt-decode')
    const {request: req, response: res,vtex: ioContext} = ctx
    const {account, authToken} = ioContext
    const apps = new Apps(ctx.vtex)
    const app = process.env.VTEX_APP_ID
    const settings = await apps.getAppSettings(app)

    let lengowURL = LENGOW_API_SANDBOX_URL;


    orderUtils.setDefaultHeaders(res)


    const endpoint = `http://${account}.myvtex.com/_v/graphql/public/v1?workspace=${ioContext.workspace}&cache=${new Date().getMilliseconds()}`

    const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
            'Authorization': authToken,
        }
    })

    let dataLengowConfig = await graphQLClient.request(orderUtils.lengowConfig)

    if(!dataLengowConfig.wimLengowConfig.boolSandbox){
        lengowURL = LENGOW_API_URL
    }

    let optionsGetLengowToken = {
        url: `http://${lengowURL}/access/get_token`,
        headers: {
            //'Authorization': authToken
            //'VtexIdclientAutCookie': authToken,
            'Proxy-Authorization': authToken,
            //'X-Vtex-Proxy-To': `https://${lengowURL}`
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: querystring.stringify({
            access_token:dataLengowConfig.wimLengowConfig.apiKey,
            secret:dataLengowConfig.wimLengowConfig.apiSecret
        }),
        //data : `access_token=${dataLengowConfig.wimLengowConfig.apiKey}&secret=${dataLengowConfig.wimLengowConfig.apiSecret}`,
        operation: "post"
    }

    
    
    
    let lengowToken = await orderUtils.getAjaxData(optionsGetLengowToken);
    if(lengowToken.data && lengowToken.data.token){
        lengowToken = lengowToken.data;

        let dateFilter = new Date();
        dateFilter.setDate(dateFilter.getDate()-30);
        console.log('eee',dateFilter.toISOString().replace(/\..+/, '+00:00'))
        let lengowFilterOrders = {
            account_id : lengowToken.account_id,
            updated_from: dateFilter.toISOString().replace(/\..+/, '+00:00'),
            merchant_order_id:'', //Si no está importado, no tiene merchant_order_id
            page:1,
            page_size:1,
            ordering: '-marketplace_order_date'
        }
        let optionsGetLengowOrders = {
            url: `http://${lengowURL}/v3.0/orders/?${querystring.stringify(lengowFilterOrders)}`,
            headers: {
                'Authorization': lengowToken.token,
                'Proxy-Authorization': authToken
            }
        }

        let lengowOrders = await orderUtils.getAjaxDataByGET(optionsGetLengowOrders);

        /*

        "count": 45,
"next": "http://api.lengow.net/v3.0/orders/?account_id=440&marketplace_order_date_from=2018-10-01&ordering=-marketplace_order_date&page=2&page_size=25",
"previous": null,
"results": [
  {*/

        let optionsSimulateCart = {
            url: `http://${account}.myvtex.com/api/fulfillment/pvt/orderForms/simulation?sc=${dataLengowConfig.wimLengowConfig.salesChannel}&affiliateId=${dataLengowConfig.wimLengowConfig.prefixAffiliateID}`,
            headers: {
                'VtexIdclientAutCookie': authToken,
                'Proxy-Authorization': authToken,
                'X-Vtex-Proxy-To': `https://${account}.myvtex.com`
            },
            operation: 'post',
            data: {}
        }

        console.log(`http://${account}.myvtex.com/api/fulfillment/pvt/orderForms/simulation?sc=${dataLengowConfig.wimLengowConfig.salesChannel}&affiliateId=${dataLengowConfig.wimLengowConfig.prefixAffiliateID}`)
        let optionsInsertOrder = {
            url: `http://${account}.myvtex.com/api/fulfillment/pvt/orders?sc=${dataLengowConfig.wimLengowConfig.salesChannel}&affiliateId=${dataLengowConfig.wimLengowConfig.prefixAffiliateID}`,
            headers: {
                'VtexIdclientAutCookie': authToken,
                'Proxy-Authorization': authToken,
                'X-Vtex-Proxy-To': `https://${account}.myvtex.com`
            },
            operation: 'post',
            data: {}
        }


        let paymentData = await orderUtils.getPaymentData(account,dataLengowConfig,authToken);

        lengowOrders.results.forEach(async order =>  {
            let simulationParams = {
                'postalCode': order.packages[0].delivery.zipcode,
                'country': orderUtils.convertCountryAlpha2ToAlpha3(order.packages[0].delivery.common_country_iso_a2),
                'items': []
            }
            order.packages[0].cart.forEach(order_line => {
                simulationParams.items.push({
                    'id' : order_line.merchant_product_id.id.split('-')[1],
                    'quantity': order_line.quantity,
                    'seller': 1 // usar siempre 1 http://vtex.github.io/docs/integration/marketplace/marketplace-non-vtex/index.html#search-of-commercial-conditions
                });
            });

            optionsSimulateCart.data = simulationParams;
            let simulationCall = await orderUtils.getAjaxData(optionsSimulateCart)

            
            if(simulationCall.data.messages.length > 0){
                simulationCall.data.messages.forEach(message => {
                    if(message.status == 'error'){
                        //TODO LOG ERROR ON THIS ORDER SIMULATION
                        //message.text message.code
                    }
                });
            }
            simulationCall.data.logisticsInfo.forEach(sla => {
                if(!sla){
                    //TODO LOG ERROR BECAUSE WE CANT DISPATCH THIS ORDER WITH VTEX LOGISTIC DATA
                }
            });
            

            simulationCall.data.items.forEach(item => {
                order.packages[0].cart.forEach(order_line => {
                    if(order_line.merchant_product_id.id == item.id){
                        item.price = ""+parseInt(""+(parseFloat(order_line.amount) * 100));
                        item.quantity = order_line.quantity;
                    }
                });
            });
            console.log('La Simulacion tiene',JSON.stringify(simulationCall.data,null,2));
            optionsInsertOrder.data = orderUtils.formatSimulationToOrderVTEX(account,simulationCall.data,paymentData,order);
            console.log('UUUUUU',JSON.stringify(optionsInsertOrder.data,null,2))
            let orderVtexInserted = await orderUtils.getAjaxData(optionsInsertOrder);
            console.log('YIEEEJAAAAA',orderVtexInserted)
            //console.log('Lo que se le pasa a la simulacion es ',JSON.stringify(simulationParams,null,2));
            //console.log('La Simulacion tiene',JSON.stringify(simulationCall.data,null,2));
            
        });
        
        //console.log('que tienes tu', lengowOrders)

    }
    console.log('aaaa',lengowToken);
    return lengowToken;
    
}