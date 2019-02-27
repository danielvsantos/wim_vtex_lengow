import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { compose, graphql } from 'react-apollo'


import { Button, Tabs, Tab } from 'vtex.styleguide'

import LengowConfig from './components/LengowConfig'

import wimLengowConfig from './graphql/wimLengowConfig.graphql'
import saveLengowConfig from './graphql//saveLengowConfig.graphql'
import salesChannel from './graphql/salesChannel.graphql'
import getHosts from './graphql/getHosts.graphql'

import 'react-datepicker/dist/react-datepicker-cssmodules.css';
import LengowStats from './components/LengowStats';
import LengowLogs from './components/LengowLogs';





class WimVtexLengowSetup extends Component {
    constructor(props) {
        super(props)

        this.state = {
            lengow_config: {
                account: '',
                apiKey: '',
                apiSecret: '',
                vtexApiKey: '',
                vtexApiToken: '',
                prefixAffiliateID: 'LNGW',
                domainShop: '',
                boolSandbox: true,
                salesChannel: [],
                productSpecifications: [],
                skuSpecifications: [],
                flagExportDisableSKU: true,
                flagExportOutOfStockSKU: true,
                listExludedSkus: '',
                numberDaysImportOrders: 30,
                feedFormat: 'json',
                domainShop: ''
            },
            numProductSpecifications: 1,
            numSkuSpecifications: 1,
            loading: this.props.wimLengowConfig.loading,
            disabled_save: false,
            currentTab: 1
        }

        if (!this.props.wimLengowConfig.loading) {
            this.state.loading = true;
            this.props.wimLengowConfig.refetch().then(res => {
                let lengow_config = res.data.wimLengowConfig;
                if(lengow_config){
                    try{
                        
                        if(!lengow_config.salesChannel){
                            lengow_config.salesChannel = []
                        }else{
                            lengow_config.salesChannel = JSON.parse(lengow_config.salesChannel)
                        }
                        if(!Array.isArray(lengow_config.salesChannel)){
                            lengow_config.salesChannel = []
                        }
                    }catch(e){
                        lengow_config.salesChannel = []
                    }
                    try{
                        
                        if(!lengow_config.productSpecifications){
                            lengow_config.productSpecifications = []
                        }else{
                            lengow_config.productSpecifications = JSON.parse(lengow_config.productSpecifications)
                        }
                        if(!Array.isArray(lengow_config.productSpecifications)){
                            lengow_config.productSpecifications = []
                        }
                    }catch(e){
                        lengow_config.productSpecifications = []
                    }
                    try{
                        
                        if(!lengow_config.skuSpecifications){
                            lengow_config.skuSpecifications = []
                        }else{
                            lengow_config.skuSpecifications = JSON.parse(lengow_config.skuSpecifications)
                        }
                        if(!Array.isArray(lengow_config.skuSpecifications)){
                            lengow_config.skuSpecifications = []
                        }
                    }catch(e){
                        lengow_config.skuSpecifications = []
                    }
                    
                    this.setState({ lengow_config, loading: false });
                    this.state.numProductSpecifications = lengow_config.productSpecifications.length + 1
                    this.state.numSkuSpecifications = lengow_config.skuSpecifications.length + 1
                }
            });
        }

        this.handleTabChange = this.handleTabChange.bind(this)


    }

    handleInputChange = (name, value) => {
        let lengow_config = Object.assign({}, this.state.lengow_config);
        lengow_config[name] = value;
        this.setState({ lengow_config });
    }

    handleInputChangeArray = (name, key, value, operation) => {
        let lengow_config = Object.assign({}, this.state.lengow_config);
        switch (operation) {
            case "create":
                lengow_config[name].push(value)
                break;
            case "update":
                lengow_config[name][key] = value;
                break;
            case "delete":
                lengow_config[name].splice(key,1);
                break;
        }
        this.setState({ lengow_config });
    }

    saveProductForm = (event) => {
        this.setState({ disabled_save: true })
        window.postMessage({ action: { type: 'START_LOADING' } }, '*')

        let lengow_config = {...this.state.lengow_config};
        lengow_config.salesChannel = JSON.stringify(lengow_config.salesChannel)
        lengow_config.productSpecifications = JSON.stringify(lengow_config.productSpecifications)
        lengow_config.skuSpecifications = JSON.stringify(lengow_config.skuSpecifications)
        const options = {
            variables: {
                data: lengow_config
            },
        }
        


        this.props.saveLengowConfig(options).then((res) => {
            this.setState({ disabled_save: false })
        })


        window.postMessage({ action: { type: 'STOP_LOADING' } }, '*')
    }

    componentWillReceiveProps(nextProps) {
        if (!nextProps.wimLengowConfig.loading && this.props.wimLengowConfig.loading) {
            let lengowConfig = nextProps.wimLengowConfig.wimLengowConfig

            if (nextProps.wimLengowConfig.wimLengowConfig) {
                try{ 
                    if(!lengowConfig.salesChannel){
                        lengowConfig.salesChannel = []
                    }else{
                        lengowConfig.salesChannel = JSON.parse(lengowConfig.salesChannel)
                    }
                    if(!Array.isArray(lengowConfig.salesChannel)){
                        lengowConfig.salesChannel = []
                    }
                }catch(e){
                    lengowConfig.salesChannel = []
                }
                try{
                    if(!lengowConfig.productSpecifications){
                        lengowConfig.productSpecifications = []
                    }else{
                        lengowConfig.productSpecifications = JSON.parse(lengowConfig.productSpecifications)
                    }
                    if(!Array.isArray(lengowConfig.productSpecifications)){
                        lengowConfig.productSpecifications = []
                    }
                }catch(e){
                    lengowConfig.productSpecifications = []
                }
                try{
                    if(!lengowConfig.skuSpecifications){
                        lengowConfig.skuSpecifications = []
                    }else{
                        lengowConfig.skuSpecifications = JSON.parse(lengowConfig.skuSpecifications)
                    }
                    if(!Array.isArray(lengowConfig.skuSpecifications)){
                        lengowConfig.skuSpecifications = []
                    }
                }catch(e){
                    lengowConfig.skuSpecifications = []
                }
                this.setState({
                    lengow_config: lengowConfig,
                    loading: nextProps.wimLengowConfig.loading
                })
                this.state.numProductSpecifications = lengowConfig.productSpecifications.length + 1
                this.state.numSkuSpecifications = lengowConfig.skuSpecifications.length + 1
            } else {
                this.setState({
                    loading: nextProps.wimLengowConfig.loading
                })
            }

        }
    }

    handleTabChange(tabIndex) {
        this.setState({
            currentTab: tabIndex,
        })
    }

    handleAddLineSpecifications = (name,counterName) => {
        this.handleInputChangeArray(`${name}`, null, { id: `${name}-${this.state[counterName]}`, specName: '', specXML: '' }, "create")
        this.state[counterName]+=1
    }


    render() {
        if (this.props.wimLengowConfig.loading || this.props.salesChannel.loading || this.props.getHosts.loading || this.state.loading) {
            return (
                <div>AGUARDE</div>
            )
        }
        //console.log("RENDER", this.state.lengow_config);
        window.postMessage({ action: { type: 'STOP_LOADING' } }, '*')

        const textButton = (!this.state.id_wim_lengow_config) ? 'SAVE' : 'UPDATE';

        return (
            <div className="font-display dark-gray flex flex-wrap justify-center">
                <div className="w-100 w-90-m w-60-l w-60-ns">

                    <Tabs>
                        <Tab label="Config" active={this.state.currentTab === 1} onClick={() => this.handleTabChange(1)}>
                            <LengowConfig lengowConfig={this.state.lengow_config} salesChannel={this.props.salesChannel.salesChannel}
                                hosts={this.props.getHosts.accountDomainHosts} onChangeArray={this.handleInputChangeArray} onAddLineSpec={this.handleAddLineSpecifications} onChange={this.handleInputChange} saveProductForm={this.saveProductForm} />

                            <div className="w-50-ns center">
                                <Button disabled={this.state.disabled_save} className="tc pa2" onClick={this.saveProductForm}>
                                    {textButton}
                                </Button>
                            </div>
                            <div className="w-50-ns center">
                                <p><a href="/integration/lengow/createFeed" target="_blank">https://ACCOUNT.myvtex.com/integration/lengow/createFeed</a> (to be a cronjob)</p>
                                <p><a href="/integration/lengow/feed" target="_blank">https://ACCOUNT.myvtex.com/integration/lengow/feed</a></p>
                                <p><a href="/integration/lengow/importorders" target="_blank">https://ACCOUNT.myvtex.com/integration/lengow/importorders</a> (to be a cronjob)</p>
                            </div>
                        </Tab>
                        <Tab label="Stats" active={this.state.currentTab === 2} onClick={() => this.handleTabChange(2)}>
                            <LengowStats />
                        </Tab>
                        <Tab label="Logs" active={this.state.currentTab === 3} onClick={() => this.handleTabChange(3)}>
                            <LengowLogs />
                        </Tab>
                    </Tabs>
                </div>
            </div>
        )
    }
}

/*
WimVtexLengowSetup.propTypes = {
  data: PropTypes.object,
  mutate: PropTypes.func
}
*/

export default compose(
    graphql(wimLengowConfig, { name: 'wimLengowConfig' }),
    graphql(salesChannel, { name: 'salesChannel' }),
    graphql(getHosts, { name: 'getHosts' }),
    graphql(saveLengowConfig, { name: 'saveLengowConfig' }),
)(WimVtexLengowSetup)


//export default WimVtexLengowSetup
