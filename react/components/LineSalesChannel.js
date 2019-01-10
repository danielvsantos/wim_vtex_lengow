import React, {Component, Fragment} from 'react'
import { Button,Input,Toggle, Dropdown} from 'vtex.styleguide'


export default class LineSalesChannel extends Component{
    constructor(props){
        super(props)
    }

    handleInputChangeDropdown = (event,id) => {
        this.props.onChangeArray(event.target.name,id,{id:event.target.value,name:this.props.saleChannel.name},"update")
    }
    
    handleInputChange = (event,id) => {
        this.props.onChangeArray(event.target.name,id,{id:this.props.saleChannel.id,name:event.target.value},"update")
    }

    handleDeleteLine = (name,id) => {
        this.props.onChangeArray(name,id,null,"delete")
    }

    
    render(){
        return (
            <div className="flex" data-line={this.props.lineId}>
                <div className="">
                    <Dropdown className="tc pa2" 
                            options={this.props.salesChannel.map((item) => {return {value: item.Id, label: item.Name}})}  
                            id="salesChannel" name="salesChannel"
                            value={this.props.saleChannel.id}
                            initialValue={this.props.saleChannel.id}
                            onChange={(event) => this.handleInputChangeDropdown(event,this.props.lineId)} />
                </div>
                <div>
                    <Input
                        name="salesChannel"
                        onChange={(event) => this.handleInputChange(event,this.props.lineId)}
                        value={this.props.saleChannel.name}
                    />
                </div>
                <div className="ml4">
                    <Button  variation="danger" onClick={() => this.handleDeleteLine('salesChannel',this.props.lineId)}>X</Button>
                </div>
            </div>
        )
    }
}