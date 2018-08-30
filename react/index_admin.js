import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {compose, graphql} from 'react-apollo'

import Button from './components/Button';
import Input from './components/Input';
import Label from './components/Label';



class WimVtexLengowSetup extends Component {
  render() {



    return (
      <div className="font-display dark-gray flex flex-wrap justify-center">
        <div className="w-100 w-90-m w-60-l w-60-ns">
          <div className="w-50-ns center">
            <h1>TEST TITLE</h1>
            <Label htmlFor="production-mode">
                Production Mode <span className="dark-red">*</span>
            </Label>
            <Input
                type="text"
                id="account-id"
                value={''}
              />
            <Button>
              TEST
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
/*export default compose(
  graphql(createProductsForm, {name: 'createProductsForm'}),
  graphql(getProductsForm)
)(WimVtexLengowSetup)*/
export default WimVtexLengowSetup
