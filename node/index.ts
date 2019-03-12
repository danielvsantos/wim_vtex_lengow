//External imports
const moment = require('moment')
import axios from 'axios'
import { GraphQLClient } from 'graphql-request'
import {resolvers} from './graphql/index'

//Internal imports
import { notFound } from './utils/status'
import VBaseClient from './vbase'
import * as orderUtils from './utils/ordersutils'
import { importOrders, changeOrderStatus } from './importorders'
import { formatProductFeed, convertToXML, getProductsXML, createFeed } from './utils/feedutils'

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
      ctx.response.body = 'Creating Feed initiated'
      createFeed(ctx);
      return;
    },

    feed: async (ctx) => {
      const { response: res, vtex: ioContext } = ctx
      const { account, authToken } = ioContext

      setDefaultHeaders(res);
      /* YA NO PODEMOS SACAR NADA DE GRAPHQL
      const endpoint = `http://${account}.myvtex.com/_v/graphql/public/v1?workspace=${ioContext.workspace}`

      const graphQLClient = new GraphQLClient(endpoint, {
        headers: {
          'Authorization': authToken,
        }
      })
      */

      let dataLengowConfig = <any>{};
      //dataLengowConfig = await graphQLClient.request(orderUtils.lengowConfig)
      dataLengowConfig =
        {
          wimLengowConfig: await resolvers.Query.wimLengowConfig('', '', ctx)
        }

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