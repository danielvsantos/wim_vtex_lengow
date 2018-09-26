import { formatPrice, formatPriceToDecimal } from './price'
import http from 'axios'
import { map, prop } from 'ramda'

export async function createCheckoutItems(order, ctx) {
    const items = []
    let count = 0

    for (var i = 0; i < order.items.length; i++) {
        if (order.shippingData.logisticsInfo[i].deliveryIds.length > 1) {
            for (var key in order.shippingData.logisticsInfo[i].deliveryIds) {
                items.push({
                    id: count,
                    sku: order.items[i].id,
                    dockId: order.shippingData.logisticsInfo[i].deliveryIds[key].dockId,
                    freightPrice: formatPriceToDecimal(order.shippingData.logisticsInfo[i].sellingPrice),
                    itemPrice: formatPrice(order.items[i].price),
                    itemSellingPrice: formatPrice(order.items[i].sellingPrice),
                    quantity: order.shippingData.logisticsInfo[i].deliveryIds[key].quantity
                })
            }
        } else {
            const price = order.items[i].quantity * order.items[i].price
            const sellingPrice = order.items[i].quantity * order.items[i].sellingPrice
            items.push({
                id: count,
                sku: order.items[i].id,
                dockId: order.shippingData.logisticsInfo[i].deliveryIds[0].dockId,
                freightPrice: formatPriceToDecimal(order.shippingData.logisticsInfo[i].sellingPrice),
                itemPrice: formatPrice(price),
                itemSellingPrice: formatPrice(sellingPrice),
                quantity: order.items[i].quantity
            })
        }        

        count++
    }

    const checkoutItems = {
        items: items,
        shippingDestination: {
            street: order.shippingData.address.street,
            country: order.shippingData.address.country,
            state: order.shippingData.address.state,
            city: order.shippingData.address.city,
            neighborhood: order.shippingData.address.street,
            postalCode: order.shippingData.address.postalCode,
        },
        orderId: order.orderId,
        clientData: {
            email: await getEmailFromAlias(order.clientProfileData.email, ctx),
            userProfileId: order.clientProfileData.userProfileId
        }
    }
    return checkoutItems
}

async function getEmailFromAlias(alias, ctx) {
    try {
        const { account, authToken } = ctx
        const headers = {
            Authorization: `bearer ${authToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        }
        const data : any = await http.get(`http://conversationtracker.vtex.com.br/api/pvt/emailMapping?alias=${alias}&an=${account}`, { headers }).then(prop('data'))
        return (data && data.email) ? data.email : alias
    } catch (err) {
        return alias
    }
}