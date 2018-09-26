import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {compose, graphql} from 'react-apollo'


import { Button } from 'vtex.styleguide'

import LengowConfig from './components/LengowConfig'

import getLengowConfigs from './graphql/getLengowConfigs.graphql'
import createLengowConfig from './graphql/createLengowConfig.graphql'
import updateLengowConfig from './graphql/updateLengowConfig.graphql'


class WimVtexLengowSetup extends Component {
    constructor(props) {
        super(props)

        this.state = {

            id_wim_lengow_config: null,
            vtex_account: '',
            account: '',
            apiKey: '',
            boolSandbox: true,

            salesChanel: '',
            flagExportDisableSKU: '',
            flagExportOutOfStockSKU: '',
            listExludedSkus: [],

            id_status_vtex: '',
            id_status_lengow: '',

            disabled_save: false
        }

    }

    handleInputChange = (stateName, value) => {
        this.setState({[stateName]: value})
    }

    saveProductForm = (event) => {
        this.setState({disabled_save: true})
        window.postMessage({ action: { type: 'START_LOADING' } }, '*')

        const options = {
            variables: {
                data: {
                    vtex_account: this.state.vtex_account,
                    account: this.state.account,
                    apiKey: this.state.apiKey,
                    boolSandbox: this.state.boolSandbox
                }

            },
        }

        if(!this.state.id_wim_lengow_config){
            this.props.createLengowConfig(options).then((res) => {
                this.setState({id_wim_lengow_config: res.data.createwimLengowConfig.id})
                this.setState({disabled_save: false})
            })
        }
        else{
            options.variables.data.id = this.state.id_wim_lengow_config;
            this.props.updateLengowConfig(options).then((res) => {
                this.setState({disabled_save: false})
            })
        }

        window.postMessage({ action: { type: 'STOP_LOADING' } }, '*')
    }

    componentWillReceiveProps(nextProps){
        if (!nextProps.getLengowConfigs.loading && this.props.getLengowConfigs.loading && nextProps.getLengowConfigs.wimLengowConfigs[0]) {
            let lengowConfig = nextProps.getLengowConfigs.wimLengowConfigs[0]

            

            this.setState({
                id_wim_lengow_config: lengowConfig.id,
                vtex_account: lengowConfig.vtex_account,
                account: lengowConfig.account,
                apiKey: lengowConfig.apiKey,
                boolSandbox: lengowConfig.boolSandbox,
            })

        }
      }


    render() {
        const {loading} = this.props.getLengowConfigs
        
        if(loading){
            return (
                <div>AGUARDE</div>
            )
        }

        window.postMessage({ action: { type: 'STOP_LOADING' } }, '*')

        const textButton = (!this.state.id_wim_lengow_config) ? 'SAVE' : 'UPDATE';

        return (
            <div className="font-display dark-gray flex flex-wrap justify-center">
                <div className="w-100 w-90-m w-60-l w-60-ns">
                
                <LengowConfig loading={loading} vtex_account={this.state.vtex_account} 
            account={this.state.account} apiKey={this.state.apiKey}  boolSandbox={this.state.boolSandbox} onChange={this.handleInputChange} saveProductForm={this.saveProductForm} />
            
                <div className="w-50-ns center">
                    <Button disabled={this.state.disabled_save} className="tc pa2" onClick={this.saveProductForm}>
                            {textButton}
                    </Button>
                </div>
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
    graphql(getLengowConfigs, {name: 'getLengowConfigs'}),
    graphql(createLengowConfig, {name: 'createLengowConfig'}),
    graphql(updateLengowConfig, {name: 'updateLengowConfig'})
)(WimVtexLengowSetup)
//export default WimVtexLengowSetup
