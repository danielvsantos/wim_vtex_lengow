import { errorResponse } from './error'
import { validate } from 'gtin'

const axios = require("axios");

export const setDefaultHeaders = (res) => {
    res.set('Access-Control-Allow-Methods', 'POST, GET')
    res.set('Access-Control-Allow-Credentials', true);
    res.set("Access-Control-Allow-Headers", "Content-Type,*")
    res.set('Cache-Control', 'no-cache')
}

export const getAjaxDataByGET = async (options) => {
    const response = await axios.get(options.url,{headers:options.headers})
    .catch(function(error){
        return {error}
    });
    if(response && response.data){
        return response.data
    }else if(response && response.error){
        return {error : response.error.response}
    }else{
        return false;
    }
}

export const getAjaxData = async (options) => {
    const response = await axios[options.operation](options.url,options.data,{headers:options.headers})
    .catch(function(error){
        return {error}
    });
    if(response && (response.data || response.headers)){
        return response;
    }else if(response && response.error){
        return {error : response.error.response.data}
    }else{
        return false;
    }
}

export const convertCountryAlpha2ToAlpha3 = (iso_alpha2) => {
    let iso_list = { 'AF': 'AFG', 'AX': 'ALA', 'AL': 'ALB', 'DZ': 'DZA', 'AS': 'ASM', 'AD': 'AND', 'AO': 'AGO', 'AI': 'AIA', 'AQ': 'ATA', 'AG': 'ATG', 'AR': 'ARG', 'AM': 'ARM', 'AW': 'ABW', 'AU': 'AUS', 'AT': 'AUT', 'AZ': 'AZE', 'BS': 'BHS', 'BH': 'BHR', 'BD': 'BGD', 'BB': 'BRB', 'BY': 'BLR', 'BE': 'BEL', 'BZ': 'BLZ', 'BJ': 'BEN', 'BM': 'BMU', 'BT': 'BTN', 'BO': 'BOL', 'BA': 'BIH', 'BW': 'BWA', 'BV': 'BVT', 'BR': 'BRA', 'VG': 'VGB', 'IO': 'IOT', 'BN': 'BRN', 'BG': 'BGR', 'BF': 'BFA', 'BI': 'BDI', 'KH': 'KHM', 'CM': 'CMR', 'CA': 'CAN', 'CV': 'CPV', 'KY': 'CYM', 'CF': 'CAF', 'TD': 'TCD', 'CL': 'CHL', 'CN': 'CHN', 'HK': 'HKG', 'MO': 'MAC', 'CX': 'CXR', 'CC': 'CCK', 'CO': 'COL', 'KM': 'COM', 'CG': 'COG', 'CK': 'COK', 'CR': 'CRI', 'CI': 'CIV', 'HR': 'HRV', 'CU': 'CUB', 'CY': 'CYP', 'CZ': 'CZE', 'DK': 'DNK', 'DJ': 'DJI', 'DM': 'DMA', 'DO': 'DOM', 'EC': 'ECU', 'EG': 'EGY', 'SV': 'SLV', 'GQ': 'GNQ', 'ER': 'ERI', 'EE': 'EST', 'ET': 'ETH', 'FK': 'FLK', 'FO': 'FRO', 'FJ': 'FJI', 'FI': 'FIN', 'FR': 'FRA', 'GF': 'GUF', 'PF': 'PYF', 'TF': 'ATF', 'GA': 'GAB', 'GM': 'GMB', 'GE': 'GEO', 'DE': 'DEU', 'GH': 'GHA', 'GI': 'GIB', 'GR': 'GRC', 'GL': 'GRL', 'GD': 'GRD', 'GP': 'GLP', 'GU': 'GUM', 'GT': 'GTM', 'GG': 'GGY', 'GW': 'GNB', 'HT': 'HTI', 'HM': 'HMD', 'HN': 'HND', 'IS': 'ISL', 'ID': 'IDN', 'IQ': 'IRQ', 'IM': 'IMN', 'IT': 'ITA', 'JP': 'JPN', 'JO': 'JOR', 'KZ': 'KAZ', 'KE': 'KEN', 'KI': 'KIR', 'KP': 'PRK', 'KR': 'KOR', 'KW': 'KWT', 'KG': 'KGZ', 'LA': 'LAO', 'LV': 'LVA', 'LB': 'LBN', 'LS': 'LSO', 'LR': 'LBR', 'LY': 'LBY', 'LI': 'LIE', 'LT': 'LTU', 'LU': 'LUX', 'MG': 'MDG', 'MW': 'MWI', 'MY': 'MYS', 'MV': 'MDV', 'ML': 'MLI', 'MT': 'MLT', 'MH': 'MHL', 'MQ': 'MTQ', 'MR': 'MRT', 'MU': 'MUS', 'YT': 'MYT', 'MX': 'MEX', 'FM': 'FSM', 'MD': 'MDA', 'MC': 'MCO', 'MN': 'MNG', 'ME': 'MNE', 'MS': 'MSR', 'MA': 'MAR', 'MZ': 'MOZ', 'MM': 'MMR', 'NA': 'NAM', 'NR': 'NRU', 'NP': 'NPL', 'NL': 'NLD', 'AN': 'ANT', 'NC': 'NCL', 'NZ': 'NZL', 'NI': 'NIC', 'NE': 'NER', 'NG': 'NGA', 'NU': 'NIU', 'NF': 'NFK', 'MP': 'MNP', 'NO': 'NOR', 'OM': 'OMN', 'PK': 'PAK', 'PW': 'PLW', 'PS': 'PSE', 'PA': 'PAN', 'PG': 'PNG', 'PY': 'PRY', 'PE': 'PER', 'PH': 'PHL', 'PN': 'PCN', 'PL': 'POL', 'PT': 'PRT', 'PR': 'PRI', 'QA': 'QAT', 'RE': 'REU', 'RO': 'ROU', 'RU': 'RUS', 'RW': 'RWA', 'BL': 'BLM', 'SH': 'SHN', 'KN': 'KNA', 'LC': 'LCA', 'MF': 'MAF', 'PM': 'SPM', 'VC': 'VCT', 'WS': 'WSM', 'SM': 'SMR', 'ST': 'STP', 'SA': 'SAU', 'SN': 'SEN', 'RS': 'SRB', 'SC': 'SYC', 'SL': 'SLE', 'SG': 'SGP', 'SK': 'SVK', 'SI': 'SVN', 'SB': 'SLB', 'SO': 'SOM', 'ZA': 'ZAF', 'GS': 'SGS', 'ES': 'ESP', 'LK': 'LKA', 'SD': 'SDN', 'SR': 'SUR', 'SJ': 'SJM', 'SZ': 'SWZ', 'SE': 'SWE', 'CH': 'CHE', 'SY': 'SYR', 'TJ': 'TJK', 'TZ': 'TZA', 'TH': 'THA', 'TL': 'TLS', 'TG': 'TGO', 'TK': 'TKL', 'TO': 'TON', 'TT': 'TTO', 'TN': 'TUN', 'TR': 'TUR', 'TM': 'TKM', 'TC': 'TCA', 'TV': 'TUV', 'UG': 'UGA', 'UA': 'UKR', 'AE': 'ARE', 'GB': 'GBR', 'US': 'USA', 'UM': 'UMI', 'UY': 'URY', 'UZ': 'UZB', 'VU': 'VUT', 'VE': 'VEN', 'VN': 'VNM', 'VI': 'VIR', 'WF': 'WLF', 'EH': 'ESH', 'YE': 'YEM', 'ZM': 'ZMB', 'ZW': 'ZWE' };

    return (iso_list[iso_alpha2] ? iso_list[iso_alpha2] : null);
}

export const formatLengowCustomerToVTEX = (deliveryAddress,billingAddress) => {
    let customerData = {
        'id' : 'clientProfileData',
        'email' : (billingAddress.email ? billingAddress.email : 'vtexlengow@vtexlengow.com'),
        'firstName' : (billingAddress.first_name ? billingAddress.first_name : 'Undefined'),
        'lastName' : (billingAddress.last_name ? billingAddress.last_name : 'Undefined'),
        'documentType' : null,
        'document' : null,
        'phone' : billingAddress.phone_mobile,
        'corporateName' : billingAddress.company,
        'tradeName' : null,
        'corporateDocument' : null,
        'stateInscription' : null,
        'corporatePhone' : null,
        'isCorporate' : false,
        'userProfileId' : null,
    }

    return customerData;
}

export const formatLengowDeliveryAddressToVTEX = (deliveryAddress) => {
    let address = {
        'addressType' : 'residential',
        'addressName' : deliveryAddress.id,
        'receiverName' : (deliveryAddress.first_name ? deliveryAddress.first_name : 'Undefined') + ' ' + (deliveryAddress.last_name ? deliveryAddress.last_name : 'Undefined'),
        'addressId' : '',
        'postalCode' : deliveryAddress.zipcode,
        'city' : deliveryAddress.city,
        'state' : deliveryAddress.state_region ? deliveryAddress.state_region : '',
        'country' : convertCountryAlpha2ToAlpha3(deliveryAddress.common_country_iso_a2),
        'street' : deliveryAddress.first_line + ' ' + (deliveryAddress.second_line ? deliveryAddress.second_line : 'Undefined') + ' ' + (deliveryAddress.complement ? deliveryAddress.complement : 'Undefined'),
    }

    return address;
}


export const formatSimulationToOrderVTEX = (totalOrder,account,simulationData,paymentData,lengowOrderData,dataLengowConfig) => {
    let logisticData = []
    paymentData.affiliateID = dataLengowConfig.wimLengowConfig.prefixAffiliateID

    simulationData.logisticsInfo.forEach(sla => {
        let slaData = {
            'itemIndex' : sla.itemIndex,
            'selectedSla' : sla.slas[0].id,
            'lockTTL' : sla.slas[0].shippingEstimate,
            'shippingEstimate' : sla.slas[0].shippingEstimate,
            'price' : (lengowOrderData.shipping / simulationData.logisticsInfo.length) * 100,
            'deliveryWindow' : !(sla.slas[0].availableDeliveryWindows)
                ? sla.slas[0].availableDeliveryWindows[0]
                : null,
        }
        logisticData.push(slaData)
    });
    
    let new_order_params = [{
        'marketplaceOrderId' : lengowOrderData.marketplace_order_id+'-EO'+Math.floor((Math.random() * 100) + 1),
        'marketplaceServicesEndpoint' : `http://${account}.myvtex.com/integration/lengow/`,
        //'marketplacePaymentValue' : lengowOrderData.total_order * 100,
        'marketplacePaymentValue': totalOrder,
        'items' : simulationData.items,
        'clientProfileData' : formatLengowCustomerToVTEX(lengowOrderData.packages[0].delivery,lengowOrderData.billing_address),
        'shippingData' : {
            'id' : 'shippingData',
            'address' : formatLengowDeliveryAddressToVTEX(lengowOrderData.packages[0].delivery),
            'logisticsInfo' : logisticData
        },
        'paymentData' : paymentData,
        'openTextField' : {
            'value' : 'Marketplace: ' + lengowOrderData.marketplace + "\n" + '---' + "\n" + lengowOrderData.comments,
            'expectedOrderFormSections' : {},
        },
        'marketingData' : null,
    }]
    return new_order_params;
}


export const getPaymentData = async(account,dataLengowConfig,authToken)=>{
    let optionsGetPaymentData = {
        url : `http://${account}.vtexpayments.com.br/api/pvt/merchants/payment-systems`,
        headers:{
            'x-vtex-api-appkey': dataLengowConfig.wimLengowConfig.vtexApiKey,
            'x-vtex-api-apptoken': dataLengowConfig.wimLengowConfig.vtexApiToken,
            'Proxy-Authorization': authToken,
            'X-Vtex-Proxy-To': `https://${account}.vtexpayments.com.br`
        }
    }

    let vtexPayments = await getAjaxDataByGET(optionsGetPaymentData);

    var paymentReturn = false;
    vtexPayments.forEach(paymentData => {
        if (paymentData.name.toLowerCase() == 'lengow') {
            paymentReturn = paymentData;
        }
    });
    if(!paymentReturn && vtexPayments){
        paymentReturn = vtexPayments[0];
    }
    return paymentReturn;
}

export const createSafePost = (callback: Function) => {
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

export const convertToXML = (object) => {
    var convert = require('xml-js');
    var options = { compact: true, ignoreComment: true, spaces: 4 };
    let result = convert.json2xml({ catalogue: object }, options);
  
    result = `<?xml version="1.0" encoding="utf-8"?>` + result
  
    return result;
}

export const checkValidEan = (ean) => {
    let isValidGTIN = false;
    try {
      isValidGTIN = validate(ean);
    } catch (e) { }
    return isValidGTIN;
}


export const lengowConfig = `query{
    wimLengowConfig{
      vtex_account,
      account,
      apiKey,
      apiSecret,
      vtexApiKey,
      vtexApiToken,
      prefixAffiliateID,
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