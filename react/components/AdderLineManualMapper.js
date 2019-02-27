import React, { Component, Fragment } from 'react'
import { Layout, PageBlock, PageHeader, Button, Input, Toggle, Dropdown } from 'vtex.styleguide'
import { FormattedMessage } from 'react-intl'
import '../global.css'
import ManualMapperLine from './ManualMapperLine';

export default class AdderLineManualMapper extends Component {
    constructor(props) {
        super(props)
    }


    render() {
        return (

            <Fragment>


                <div className="flex">
                    <div className="mt-auto mb-auto mr-auto"><FormattedMessage id={this.props.componentName} /></div>
                    <div className="ml4">
                        <Button variation="primary" onClick={() => this.props.onAddLineSpec(this.props.specName,this.props.specCounterName)}>+</Button>
                    </div>
                </div>
                {this.props.specs.map((item, index) =>
                    <ManualMapperLine
                    key={index}
                    lineId={index}
                    onChangeArray={this.props.onChangeArray}
                    item={item}
                    specName={this.props.specName} />

                )}


            </Fragment>

          
        )
    }
}