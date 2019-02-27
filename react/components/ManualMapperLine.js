import React, {Component, Fragment} from 'react'
import { Button,Input,Toggle, Dropdown} from 'vtex.styleguide'


export default class ManualMapperLine extends Component{
    constructor(props){
        super(props)
    }
    
    handleInputSpecName = (event,id) => {
        this.props.onChangeArray(this.props.specName,id,{id:this.props.item.id,specName:event.target.value,specXML:this.props.item.specXML},"update")
    }

    handleInputSpecXML = (event,id) => {
        this.props.onChangeArray(this.props.specName,id,{id:this.props.item.id,specName:this.props.item.specName,specXML:event.target.value},"update")
    }

    handleDeleteLine = (name,id,key) => {
        this.props.onChangeArray(name,key,null,"delete")
    }

    
    render(){
        return (
            <div className="flex mt3" data-line={this.props.lineId}>
                <div className="w-50">
                    <Input
                        name="specName"
                        onChange={(event) => this.handleInputSpecName(event,this.props.lineId)}
                        value={this.props.item.specName}
                        placeholder="Specificaction name from VTEX"
                    />
                </div>
                <div className="w-50">
                    <Input
                        name="specXML"
                        onChange={(event) => this.handleInputSpecXML(event,this.props.lineId)}
                        value={this.props.item.specXML}
                        placeholder="Specification label on XML"
                    />
                </div>
                <div className="ml4">
                    <Button  variation="danger" onClick={() => this.handleDeleteLine(this.props.specName,this.props.item.id,this.props.lineId)}>X</Button>
                </div>
            </div>
        )
    }
}