import * as qs from 'querystring'
import * as url from 'url'

export const parseQuery = (req) => qs.parse(url.parse(req).query)
