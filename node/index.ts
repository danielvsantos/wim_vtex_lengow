import { Apps } from '@vtex/api'

import { GraphQLClient } from 'graphql-request'
import { errorResponse } from './utils/error'

import ApolloClient from 'apollo-boost';
import fetch from 'node-fetch';
import { createHttpLink } from 'apollo-link-http';

  

const setDefaultHeaders = (res) => {
    res.set('Access-Control-Allow-Origin', '*')
    res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    res.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization")
    res.set('Cache-Control', 'no-cache')
  }

const pvtHandler = () => {
    return "jaja";
  }
//  const client = new ApolloClient();

const createSafePost = (callback: Function) => {
    return async (ctx) => {
      const {request: req, response: res, vtex: ioContext} = ctx
      
      try {
        const {status, data, extract, contentType } = await callback(req, res, ioContext)
        res.status = status
        res.set('Cache-Control', 'no-cache')
        res.body = extract ? data : {data}
        res.set('Content-Type', contentType ? contentType : 'application/json')
      } catch (err) {
        const errorMessage = `Error processing ${callback.name}`
        const errorRes = errorResponse(err)
  
        res.set('Cache-Control', 'no-cache')
        res.set('Content-Type', 'application/json')
        res.status = err.response ? err.response.status : 500
        res.body = {error: errorRes}
  
        console.error(errorMessage, errorRes)
        
      }
    }
  }

export default {
  routes: {
    lengowHandler  : async (ctx) {
        const {response: res,vtex: ioContext} = ctx
        
        
        console.log(JSON.stringify(ctx.vtex))
        


    

        /*

        const endpoint = 'http://wimvtexlengow.webimpacto.aws-us-east-1.vtex.io/webimpacto/pmartin/_v/graphql'

        const graphQLClient = new GraphQLClient(endpoint, {
            headers: {
                'Authorization': authToken
//                'X-Vtex-Proxy-To': `http://wimvtexlengow.webimpacto.aws-us-east-1.vtex.io`
                //'cookie': ctx.vtex.cookie
            }
        })


        const query = `
        {
            wimLengowConfigs{
                id,
                vtex_account,
                account,
                apiKey,
                boolSandbox
                }
        }
        `
       
          

        const query_data = await graphQLClient.request(query)
        console.log(JSON.stringify(query_data, undefined, 2))

        ctx.response.body = authToken;*/



    }
  }
}