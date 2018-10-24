import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {compose, graphql} from 'react-apollo'


import { Button } from 'vtex.styleguide'

import LengowConfig from './components/LengowConfig'

import wimLengowConfig from './graphql/wimLengowConfig.graphql'
import saveLengowConfig from './graphql//saveLengowConfig.graphql'
import salesChannel from './graphql/salesChannel.graphql'


class WimVtexLengowSetup extends Component {
    constructor(props) {
        super(props)

        this.state = {
            lengow_config: {
                vtex_account: '',
                account: '',
                apiKey: '',
                boolSandbox: true,

                salesChannel: false,
                flagExportDisableSKU: true,
                flagExportOutOfStockSKU: true,
                listExludedSkus: '',

                id_status_vtex: '',
                id_status_lengow: '',

                feedFormat: 'json'
            },

                disabled_save: false
        }

    }

    handleInputChange = (name, value) => {
        let lengow_config = Object.assign({}, this.state.lengow_config); 
        lengow_config[name] = value;
        console.log(lengow_config, name, value);
        this.setState({lengow_config});
    }

    saveProductForm = (event) => {
        this.setState({disabled_save: true})
        window.postMessage({ action: { type: 'START_LOADING' } }, '*')

        let lengow_config = this.state.lengow_config;

        const options = {
            variables: {
                data: lengow_config
            },
        }

        
            this.props.saveLengowConfig(options).then((res) => {
                this.setState({disabled_save: false})
            })
        

        window.postMessage({ action: { type: 'STOP_LOADING' } }, '*')
    }

    componentWillReceiveProps(nextProps){
       if (!nextProps.wimLengowConfig.loading && this.props.wimLengowConfig.loading && nextProps.wimLengowConfig.wimLengowConfig) {
            let lengowConfig = nextProps.wimLengowConfig.wimLengowConfig

            

            this.setState({
                lengow_config: lengowConfig
            })

        }
      }


    render() {
        
        
        if(this.props.wimLengowConfig.loading || this.props.salesChannel.loading){
            return (
                <div>AGUARDE</div>
            )
        }
        console.log("RENDER", this.state.lengow_config );
        window.postMessage({ action: { type: 'STOP_LOADING' } }, '*')

        const textButton = (!this.state.id_wim_lengow_config) ? 'SAVE' : 'UPDATE';

        return (
            <div className="font-display dark-gray flex flex-wrap justify-center">
                <div className="w-100 w-90-m w-60-l w-60-ns">
                
                <LengowConfig lengowConfig={this.state.lengow_config} salesChannel={ this.props.salesChannel.salesChannel} onChange={this.handleInputChange} saveProductForm={this.saveProductForm} />
            
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
    graphql(wimLengowConfig, {name: 'wimLengowConfig'}),
    graphql(salesChannel, {name: 'salesChannel'}),
    graphql(saveLengowConfig, {name: 'saveLengowConfig'}),
)(WimVtexLengowSetup)


//export default WimVtexLengowSetup
