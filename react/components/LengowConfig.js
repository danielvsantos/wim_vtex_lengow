import React from 'react'

import { Button,Input,Toggle, Dropdown} from 'vtex.styleguide'

export default class LengowConfig extends React.Component{
    constructor(props) {
        super(props)    
    }

    handleInputChange = (event, objectName=null) => {
        const lengow_config = this.props.lengowConfig;
        
        if(event.target.type == 'checkbox'){
            this.props.onChange(objectName, !lengow_config[objectName]);
        }
        else{
            this.props.onChange(event.target.name, event.target.value);
        }
    }

    componentWillReceiveProps(nextProps){
        if (nextProps.lengowConfig) {   
            
          /*   this.setState({
                lengow_config: nextProps.lengowConfig
             })*/
 
         }
       }

    render(){
        const lengow_config = this.props.lengowConfig;
        console.log(this.props.hosts)
        return (
            
            
                    <div className="w-50-ns center">
                        

                        <h2>Lengow Config</h2>
                        
                        
                        <div className="mb5">
                            <Input className="tc pa2" label="VTEX Api Key" type="text" id="vtexApiKey" name="vtexApiKey" value={lengow_config.vtexApiKey} onChange={this.handleInputChange}/>
                        </div>
                        <div className="mb5">
                            <Input className="tc pa2" label="VTEX Api Token" type="text" id="vtexApiToken" name="vtexApiToken" value={lengow_config.vtexApiToken} onChange={this.handleInputChange}/>
                        </div>
                        <div className="mb5">
                            <Input className="tc pa2" label="Prefix to imported orders - Affilitiate ID" type="text" id="prefixAffiliateID" name="prefixAffiliateID" value={lengow_config.prefixAffiliateID} onChange={this.handleInputChange}/>
                        </div>

                        <div className="mb5">
                            <Dropdown className="tc pa2" 
                            options={this.props.hosts.map((item) => {return {value: item, label: item}})}  
                            label="Shop Domain" id="domainShop" name="domainShop" 
                            value={lengow_config.domainShop}
                            initialValue={lengow_config.domainShop}
                            onChange={this.handleInputChange} />
                        </div>

                        <div className="mb5">
                            <Input className="tc pa2" label="Lengow Account" type="text" id="account" name="account" value={lengow_config.account} onChange={this.handleInputChange}/>
                        </div>

                        <div className="mb5">
                            <Input className="tc pa2" label="Lengow API KEY" type="text" id="apiKey" name="apiKey" value={lengow_config.apiKey} onChange={this.handleInputChange}/>
                        </div>
                        <div className="mb5">
                            <Input className="tc pa2" label="Lengow API Secret" type="text" id="apiSecret" name="apiSecret" value={lengow_config.apiSecret} onChange={this.handleInputChange}/>
                        </div>

                        <div className="mb5">
                            <Toggle className="tc pa2" label="Sandbox" id="boolSandbox" name="boolSandbox" checked={lengow_config.boolSandbox} onChange={(e) => this.handleInputChange(e,"boolSandbox")}/>
                        </div>
                        <div className="mb5">
                            <Input className="tc pa2" label="Number of Days to recover orders from today (max 100)" type="text" id="numberDaysImportOrders" name="numberDaysImportOrders" value={lengow_config.numberDaysImportOrders} onChange={this.handleInputChange}/>
                        </div>

                        <div className="mb5">
                            <Dropdown className="tc pa2" 
                            options={this.props.salesChannel.map((item) => {return {value: item.Id, label: item.Name}})}  
                            label="Sales Channel" id="salesChannel" name="salesChannel" 
                            value={lengow_config.salesChannel}
                            initialValue={lengow_config.salesChannel}
                            onChange={this.handleInputChange} />
                        </div>

                        <div className="mb5">
                            <Dropdown className="tc pa2" 
                            options={[
                                {value: 'json', label: 'json'},
                                {value: 'xml', label: 'xml'},
                              ]}
                            label="Feed Format" id="feedFormat" name="feedFormat" 
                            value={lengow_config.feedFormat}
                            initialValue={lengow_config.feedFormat}
                            onChange={this.handleInputChange} />
                        </div>

                        <div className="mb5">
                            <Input className="tc pa2" label="Excluded SKU" helpText="Insert SKU excluded separated by `,`" type="text" id="listExludedSkus" name="listExludedSkus" value={lengow_config.listExludedSkus} onChange={this.handleInputChange}/>
                        </div>

                        <div className="mb5">
                            <Toggle className="tc pa2" label="Exclude Disabled SKU" id="flagExportDisableSKU" name="flagExportDisableSKU" checked={lengow_config.flagExportDisableSKU} onChange={(e) => this.handleInputChange(e, "flagExportDisableSKU")}/>
                        </div>

                        <div className="mb5">
                            <Toggle className="tc pa2" label="Exclude Out Of Stock SKU" id="flagExportOutOfStockSKU" name="flagExportOutOfStockSKU" checked={lengow_config.flagExportOutOfStockSKU} onChange={(e) => this.handleInputChange(e, "flagExportOutOfStockSKU")}/>
                        </div>

                         <div className="mb5">
                            <Toggle className="tc pa2" label="CheckValidGTIN" id="flagCheckValidGTIN" name="flagCheckValidGTIN" checked={lengow_config.flagCheckValidGTIN} onChange={(e) => this.handleInputChange(e, "flagCheckValidGTIN")}/>
                        </div>

                    
                </div>

        )
    }
}