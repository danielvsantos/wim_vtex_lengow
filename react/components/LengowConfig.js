import React from 'react'

import { Button,Input,Toggle } from 'vtex.styleguide'

export default class LengowConfig extends React.Component{
    constructor(props) {
        super(props)    
        this.state = {
            loading: props.loading,
            vtex_account: props.vtex_account,
            account: props.account,
            apiKey: props.apiKey,
            boolSandbox: props.boolSandbox,
        }
    }

    handleInputChange = (event) => {
        let value = '';
        if(event.target.type == 'checkbox'){
            this.setState({boolSandbox: !this.state.boolSandbox})
            value = !this.state.boolSandbox;
            this.props.onChange('boolSandbox', value);
        }
        else{
            this.setState({[event.target.name]: event.target.value})
            value = event.target.value;
            this.props.onChange(event.target.name, value);
        }

        
    }

    render(){
        return (
            
                    <div className="w-50-ns center">
                        <h2>Lengow Config</h2>
                        
                        <div className="mb5">
                            <Input className="tc pa2" label="VTEX Account" type="text" id="vtex_account" name="vtex_account" value={this.state.vtex_account} onChange={this.handleInputChange}/>
                        </div>

                        <div className="mb5">
                            <Input className="tc pa2" label="Account" type="text" id="account" name="account" value={this.state.account} onChange={this.handleInputChange}/>
                        </div>

                        <div className="mb5">
                            <Input className="tc pa2" label="API KEY" type="text" id="apiKey" name="apiKey" value={this.state.apiKey} onChange={this.handleInputChange}/>
                        </div>

                        <div className="mb5">
                            <Toggle className="tc pa2" label="VTEX Account" id="boolSandbox" name="boolSandbox" checked={this.state.boolSandbox} onChange={this.handleInputChange}/>
                        </div>
                    
                </div>

        )
    }
}