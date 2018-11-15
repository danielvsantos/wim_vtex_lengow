import { Apps } from '@vtex/api'
import * as parse from 'co-body'
import VBaseClient from './vbase'
import * as orderUtils from './utils/ordersutils'
import { notFound } from './utils/status'
import moment from 'moment'

const querystring = require('querystring');

export const changeOrderStatus = async(ctx,status) => {
    const {request: req, response: res,vtex: ioContext} = ctx
    const {account, authToken} = ioContext

    let orderString = ''
    let lengowStatus = 'cancel';
    switch(status){
        case 'cancel': orderString = req.url.replace(/integration\/lengow\/pvt\/orders\/|\/cancel/g,'').replace('/','')
        break;
        case 'invoice':  orderString = req.url.replace(/integration\/lengow\/pub\/orders\/|\/invoice/g,'').replace('/','')
        lengowStatus = 'ship'
        break;
    }

    let orderMatch = orderString.match(/(.*)(-MKP-)(.*)/);

    let idOrder = orderMatch[1]
    let marketplace = orderMatch[3]
    let shippingInfo = {
        tracking_number : null,
        tracking_url: null,
        carrier: null
    }
    if(status == 'invoice'){
        try{
            //https://www.npmjs.com/package/co-body
            let postData = await parse.json(req)
            if(typeof postData.trackingNumber != "undefined"){
                shippingInfo.tracking_number = postData.trackingNumber
            }
            if(typeof postData.trackingUrl != "undefined"){
                shippingInfo.tracking_url = postData.trackingUrl
            }
            if(typeof postData.courier != "undefined"){
                shippingInfo.carrier = postData.courier
            }
            console.log('EL POST DATA ES',postData)
        }catch(err){
            console.log('EL ERROR DEL PARSE ES',err)
        }
    }

    let dataLengowConfig = await orderUtils.getAddonConfig(ctx)
    /*lengowOrder.results[0].marketplace*/
    let lengowToken = await orderUtils.getLengowToken(ctx,dataLengowConfig)
    if(lengowToken.data && lengowToken.data.token){
        lengowToken = lengowToken.data;
        let lengowOrder = await orderUtils.getLengowOrders(lengowToken,authToken,dataLengowConfig,idOrder)
        if(typeof lengowOrder.results != "undefined" && lengowOrder.results.length > 0){
            let changeStatus = await orderUtils.changeLengowOrderStatus(idOrder,marketplace,lengowStatus,lengowToken,authToken,dataLengowConfig,shippingInfo.tracking_number,shippingInfo.tracking_url,shippingInfo.carrier)
            console.log('CHANGE STATUS RESPONSE',changeStatus)
        }
    }
} 

export const importOrders = async (ctx) => {
    //var jwtDecode  = require('jwt-decode')
    const {request: req, response: res,vtex: ioContext} = ctx
    const {account, authToken} = ioContext

    /* FOR SAVE LOGS */
    const vbaseLogsLengow = VBaseClient(ioContext, `logsLengow.txt`)
    const responseLogsLengow = await vbaseLogsLengow.getFile().catch(notFound())

    var logsLengowData = []
    if(responseLogsLengow.data){
        logsLengowData = JSON.parse(responseLogsLengow.data.toString());
    }
    /* END FOR SAVE LOGS */

    orderUtils.setDefaultHeaders(res)

    let dataLengowConfig = await orderUtils.getAddonConfig(ctx)
        
    let lengowToken = await orderUtils.getLengowToken(ctx,dataLengowConfig)
    if(lengowToken.data && lengowToken.data.token){
        lengowToken = lengowToken.data;

        let optionsSimulateCart = orderUtils.getOptionsSimulateCart(account,authToken,dataLengowConfig)        
        let optionsInsertOrder = orderUtils.getOptionsInsertOrder(account,authToken,dataLengowConfig)
        let paymentData = await orderUtils.getPaymentData(account,dataLengowConfig,authToken);
        let lengowOrders = await orderUtils.getLengowOrders(lengowToken,authToken,dataLengowConfig,null,1,orderUtils.LENGOW_ORDERS_PER_PAGE)
        
        
        if(typeof lengowOrders.results != "undefined"){
            lengowOrders.results.forEach(async order =>  {
                let totalOrder = 0;
                let simulationParams = {
                    'postalCode': order.packages[0].delivery.zipcode,
                    'country': orderUtils.convertCountryAlpha2ToAlpha3(order.packages[0].delivery.common_country_iso_a2),
                    'items': []
                }
                order.packages[0].cart.forEach(order_line => {
                    simulationParams.items.push({
                        'id' : ((order_line.merchant_product_id.id.indexOf('-')>0)?order_line.merchant_product_id.id.split('-')[1]:order_line.merchant_product_id.id),
                        'quantity': order_line.quantity,
                        'seller': 1 // usar siempre 1 http://vtex.github.io/docs/integration/marketplace/marketplace-non-vtex/index.html#search-of-commercial-conditions
                    });
                });


                optionsSimulateCart.data = simulationParams;
                let simulationCall = await orderUtils.getAjaxData(optionsSimulateCart)
                
                
                if(typeof simulationCall.data.messages != "undefined" 
                    && simulationCall.data.messages.length > 0){
                    simulationCall.data.messages.forEach(message => {
                        if(message.status == 'error'){
                            //TODO LOG ERROR ON THIS ORDER SIMULATION
                            //message.text message.code
                        }
                    });
                }
                
                let haveSLA = true;
                simulationCall.data.logisticsInfo.forEach(logisticData => {
                    if(!logisticData){
                        //TODO LOG ERROR BECAUSE WE CANT DISPATCH THIS ORDER WITH VTEX LOGISTIC DATA
                        haveSLA = false;
                    }else if(!logisticData.slas[0]){
                        //TODO LOG ERROR BECAUSE WE CANT DISPATCH THIS ORDER WITH VTEX LOGISTIC DATA
                        haveSLA = false;
                    }else{
                        totalOrder += logisticData.slas[0].price
                    }
                });

                if(haveSLA){
                    simulationCall.data.items.forEach(item => {
                        totalOrder += item.price * item.quantity

                        order.packages[0].cart.forEach(order_line => {
                            if(order_line.merchant_product_id.id == item.id){
                                item.price = ""+parseInt(""+(parseFloat(order_line.amount) * 100));
                                item.quantity = order_line.quantity;
                            }
                        });
                    });

                    optionsInsertOrder.data = orderUtils.formatSimulationToOrderVTEX(order.total_order,account,simulationCall.data,paymentData,order,dataLengowConfig);

                    let orderVtexInserted = await orderUtils.getAjaxData(optionsInsertOrder);

                    if(typeof orderVtexInserted.data != "undefined" && orderVtexInserted.data.length > 0){
                        //Insertado, podemos añadir el pedido a VBASE para STATS
                        const vbaseOrders = VBaseClient(ioContext, `ordersImported.txt`)
                        const responseOrders = await vbaseOrders.getFile().catch(notFound())

                        let ordersStatsData = []
                        if(responseOrders.data){
                            ordersStatsData = JSON.parse(responseOrders.data.toString());
                        }
                        
                        ordersStatsData.push({orderID: orderVtexInserted.data[0].orderId, date: moment(), marketPlace: order.marketplace, total: totalOrder })
                        await vbaseOrders.saveFile(ordersStatsData);
                        
                        
                        //DISPATCH 
                        if(orderUtils.LENGOW_FULLFILLED_STATUS_ORDERS.indexOf(order.lengow_status)){
                            let dispatchResult = await orderUtils.getAjaxData(orderUtils.getOptionsDispatchOrder(orderVtexInserted.data[0].orderId,account,authToken,dataLengowConfig))
                            //TODO LOG OK OR KO AND NOT console.log
                            if(typeof dispatchResult.error != "undefined"){
                                logsLengowData.push({
                                    orderID: order.marketplace_order_id, 
                                    type: 'error', 
                                    msg: `Dispatch VTEX Order: ${dispatchResult.error}`, 
                                    date: moment() 
                                })
                                console.log('ERROR on Dispatch VTEX Order',dispatchResult.error)
                            }else if(typeof dispatchResult.status != "undefined" && typeof dispatchResult.statusText != "undefined"
                            && dispatchResult.status == 200 && dispatchResult.statusText =='OK'){
                                logsLengowData.push({
                                    orderID: order.marketplace_order_id,
                                    type: 'success', 
                                    msg: `SUCESSFULL Dispatch VTEX Order: marketplace_order_id: ${order.marketplace_order_id}, merchant_order_id: ${orderVtexInserted.data[0].orderId} `, 
                                    date: moment() 
                                })
                                console.log('SUCESSFULL Dispatch VTEX Order ', { marketplace_order_id: order.marketplace_order_id, merchant_order_id: orderVtexInserted.data[0].orderId})
                            }else{
                                logsLengowData.push({
                                    orderID: order.marketplace_order_id,
                                    type: 'warning', 
                                    msg: `UNKNOWED status on Dispatch VTEX Order: ${JSON.stringify(dispatchResult)}`, 
                                    date: moment() 
                                })
                                console.log('UNKNOWED status on Dispatch VTEX Order',dispatchResult)
                            }
                        }
                
                        //SET VTEX ORDER ID ON LENGOW
                        let changedLengowOrder = await orderUtils.changeLengowMerchantOrderID(order.marketplace_order_id,orderVtexInserted.data[0].orderId,order.marketplace,lengowToken,authToken,dataLengowConfig)
                        
                        //TODO LOG OK OR KO AND NOT console.log
                        if(typeof changedLengowOrder.error != "undefined"){
                            logsLengowData.push({
                                orderID: order.marketplace_order_id,
                                type: 'error', 
                                msg: `ERROR on Change MOI to Lengow for Lengow Order: ${order.marketplace_order_id}, ${changedLengowOrder.error}`, 
                                date: moment() 
                            })
                            console.log(`ERROR on Change MOI to Lengow for Lengow Order ${order.marketplace_order_id}`,changedLengowOrder.error)
                        }else if(typeof changedLengowOrder.status != "undefined" && typeof changedLengowOrder.statusText != "undefined"
                        && changedLengowOrder.status == 200 && changedLengowOrder.statusText =='OK'){
                            logsLengowData.push({
                                orderID: order.marketplace_order_id,
                                type: 'success', 
                                msg: `SUCESSFULL Change MOI to Lengow: marketplace_order_id: ${order.marketplace_order_id}, merchant_order_id: ${orderVtexInserted.data[0].orderId}`, 
                                date: moment() 
                            })
                            console.log('SUCESSFULL Change MOI to Lengow ', { marketplace_order_id: order.marketplace_order_id, merchant_order_id: orderVtexInserted.data[0].orderId})
                        }else{
                            logsLengowData.push({
                                orderID: order.marketplace_order_id,
                                type: 'warning', 
                                msg: `UNKNOWED status on Change MOI to Lengow for Lengow Order: ${order.marketplace_order_id}`, 
                                date: moment() 
                            })
                            console.log(`UNKNOWED status on Change MOI to Lengow for Lengow Order ${order.marketplace_order_id}`,changedLengowOrder)
                        }

                    }else if(typeof orderVtexInserted.error != "undefined"){
                        logsLengowData.push({
                            orderID: order.marketplace_order_id,
                            type: 'error', 
                            msg: `ERROR on insert VTEX order for Lengow Order: ${order.marketplace_order_id} - ${JSON.stringify(orderVtexInserted.error)}`, 
                            date: moment() 
                        })
                        console.log(`ERROR on insert VTEX order for Lengow Order ${order.marketplace_order_id}`, orderVtexInserted.error)
                    }
                }else{
                    logsLengowData.push({
                        orderID: order.marketplace_order_id,
                        type: 'error', 
                        msg: `ERROR on simulation not have SLAs availables for Lengow Order: ${order.marketplace_order_id} - ${JSON.stringify(simulationCall.data,null,2)}`, 
                        date: moment() 
                    })
                    console.log(`ERROR on simulation not have SLAs availables for Lengow Order ${order.marketplace_order_id}`, JSON.stringify(simulationCall.data,null,2))
                }

                vbaseLogsLengow.saveFile(logsLengowData);
            });
        }else{
            logsLengowData.push({
                orderID: null,
                type: 'error', 
                msg: `ERROR Lengow orders cannot be recovered. Token used: ${lengowToken.token}`, 
                date: moment() 
            })
            vbaseLogsLengow.saveFile(logsLengowData);
            console.log("ERROR Lengow orders cannot be recovered. Token used: "+lengowToken.token)
        }

        
    }

    return lengowToken;
    
}