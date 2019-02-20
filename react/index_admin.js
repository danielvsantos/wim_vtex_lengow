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
                flagExportDisableSKU: true,
                flagExportOutOfStockSKU: true,
                listExludedSkus: '',
                numberDaysImportOrders: 30,
                feedFormat: 'json',
                domainShop: ''
            },
            loading: this.props.wimLengowConfig.loading,
            disabled_save: false,
            currentTab: 1
        }

        if (!this.props.wimLengowConfig.loading) {
            this.state.loading = true;
            this.props.wimLengowConfig.refetch().then(res => {
                let lengow_config = res.data.wimLengowConfig;
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

                this.setState({ lengow_config, loading: false });
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
                this.setState({
                    lengow_config: lengowConfig,
                    loading: nextProps.wimLengowConfig.loading
                })
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
                                hosts={this.props.getHosts.accountDomainHosts} onChangeArray={this.handleInputChangeArray} onChange={this.handleInputChange} saveProductForm={this.saveProductForm} />

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
