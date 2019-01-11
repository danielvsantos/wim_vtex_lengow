import React, { Component, Fragment } from 'react'
import { Button, Input, Toggle, Dropdown } from 'vtex.styleguide'
import LineSalesChannel from './LineSalesChannel'
import '../global.css'

export default class AdderLineSalesChannel extends Component {
    constructor(props) {
        super(props)
        this.state = {
            numSalesChannel: 0
        }
    }

    handleAddLine = () => {
        this.props.onChangeArray('salesChannel',null,{id:2,name:''},"create")
    }

    render() {
        return (
            <Fragment>


                <div className="flex">
                    <div className="mt-auto mb-auto mr-auto">Sales Channel</div>
                    <div className="ml4">
                        <Button variation="primary" onClick={() => this.handleAddLine()}>+</Button>
                    </div>
                </div>
                {this.props.salesChannelConfig.map((item, index) =>
                    <LineSalesChannel
                        key={index}
                        lineId={index}
                        onChangeArray={this.props.onChangeArray}
                        salesChannel={this.props.salesChannel}
                        saleChannel={item} />

                )}


            </Fragment>
        )
    }
}