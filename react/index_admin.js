import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {compose, graphql} from 'react-apollo'

import Button from './components/Button';
import Input from './components/Input';
import Label from './components/Label';

import createAutopersistedProductsForm from './graphql/createProductsForm.graphql'
import getProductsForm from './graphql/getProductsForm.graphql'
import deleteAutopersistedProductForm from './graphql/deleteProductForm.graphql'


class WimVtexLengowSetup extends Component {
    constructor(props) {
        super(props)

        this.state = {
            accountId: '',
            idABorrar: '',
            data: this.props.data.autopersistedProductsForms,
        }

        this.handleAccountId = this.handleAccountId.bind(this)
        this.rellenarInputBorrar = this.rellenarInputBorrar.bind(this)

    }

    handleAccountId = (event) => {
        this.setState({accountId: event.target.value})
    }

    saveProductForm = (event) => {
        const options = {
            variables: {
                name: this.state.accountId,
            },
        }
        this.props.createAutopersistedProductsForm(options).then(
            this.setState({accountId: ''})
        );

    }

    deleteProductForm = (event) => {
        const options = {
            variables: {
                id: this.state.idABorrar
            }
        }

        this.props.deleteAutopersistedProductForm(options).then(
            this.setState({idABorrar: ''})
        )
    }

    rellenarInputBorrar = (event) => {
        alert("test");
    }

    /*handleAccountId({ target: { id, value } }) {
        const trimmedValue = value.trim()
    }*/

    render() {
        const {
            data: {autopersistedProductsForms},
        } = this.props


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
                            value={this.state.accountId || ''}
                            onChange={this.handleAccountId}
                        />
                        <Button onClick={this.saveProductForm}>
                            TEST
                        </Button>
                    </div>
                </div>

                <div>
                    <h1> Listado </h1>



                    {autopersistedProductsForms && autopersistedProductsForms.map(function (d, idx) {
                        return (<li key={idx}>{d.name} - {d.id}</li>)
                    })}


                    <Input
                        type="text"
                        id="idABorrar"
                        value={this.state.idABorrar}
                        onChange={this.handleidABorrar}
                    />
                    <Button onClick={this.deleteProductForm}>
                        BORRAR
                    </Button>

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
    graphql(createAutopersistedProductsForm, {name: 'createAutopersistedProductsForm'}),
    graphql(deleteAutopersistedProductForm, {name: 'deleteAutopersistedProductForm'}),
    graphql(getProductsForm)
)(WimVtexLengowSetup)
//export default WimVtexLengowSetup
