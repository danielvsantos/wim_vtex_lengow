import React from 'react'
import { compose, graphql } from 'react-apollo'
import { Doughnut } from 'react-chartjs-2';
import DatePicker from "react-datepicker";
import moment from "moment";

import ordersLengow from '../graphql/ordersLengow.graphql'

import { Button, Input, Toggle, Dropdown } from 'vtex.styleguide'

var dynamicColors = function () {
    var r = Math.floor(Math.random() * 255);
    var g = Math.floor(Math.random() * 255);
    var b = Math.floor(Math.random() * 255);
    return "rgb(" + r + "," + g + "," + b + ")";
};


let ordersData = []
/*ordersData.push({ orderID: '1', date: "2018-11-02T14:46:55.584Z", marketPlace: 'amazon', total: 2932 })
ordersData.push({ orderID: '2', date: "2018-11-03T14:46:55.584Z", marketPlace: 'ebay', total: 4022 })
ordersData.push({ orderID: '3', date: "2018-11-05T14:46:55.584Z", marketPlace: 'amazon', total: 5022 })
ordersData.push({ orderID: '4', date: "2018-11-10T14:46:55.584Z", marketPlace: 'ebay', total: 6022 })
ordersData.push({ orderID: '5', date: "2018-11-11T14:46:55.584Z", marketPlace: 'ebay', total: 7022 })
ordersData.push({ orderID: '6', date: "2018-11-14T14:46:55.584Z", marketPlace: 'amazon', total: 300 })
ordersData.push({ orderID: '6', date: "2018-10-30T14:46:55.584Z", marketPlace: 'amazon_es', total: 12300 })*/


let backgroundColor = [
    dynamicColors(),
    dynamicColors(),
    dynamicColors(),
    dynamicColors(),
    dynamicColors(),
    dynamicColors(),
    dynamicColors(),
    dynamicColors(),
    dynamicColors(),
    dynamicColors(),
    dynamicColors(),
]

class LengowStats extends React.Component {
    constructor(props) {
        super(props)



        this.state = {
            startDate: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }),
            endDate: moment().set({ hour: 23, minute: 59, second: 59, millisecond: 999 }),
            ordersData: ordersData,
            chartCountOrders: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                }]
            },
            chartAmountOrders: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                }]
            }
        }

        this.handleStartDate = this.handleStartDate.bind(this);
        this.handleEndDate = this.handleEndDate.bind(this);
        this.getChartData = this.getChartData.bind(this);
    }

    componentDidMount() {
        this.getChartData()
    }

    getChartData() {
        let newOrdersData = ordersData.filter(
            item => item.date > this.state.startDate.format() && item.date < this.state.endDate.format()
        );

        let marketPlaces = [...new Set(newOrdersData.map(item => item.marketPlace))]
        //let backgroundColor = [];

        let countOrdersData = marketPlaces.map(item => {
            //backgroundColor.push(dynamicColors())
            return newOrdersData.filter(order => order.marketPlace == item).length
        })

        let countAmountData = marketPlaces.map(item => {
            let filterByMarketPlace = newOrdersData.filter(order => order.marketPlace == item)
            let amountsByMarketPlace = filterByMarketPlace.map(order => order.total);
            let sumAmountByMarketPlace = amountsByMarketPlace.reduce((prev, next) => prev + next)
            return (sumAmountByMarketPlace / 100).toFixed(2)
        })

        this.setState(
            {
                ordersData: newOrdersData,
                chartCountOrders: {
                    labels: marketPlaces,
                    datasets: [{
                        data: countOrdersData,
                        backgroundColor
                    }]
                },
                chartAmountOrders: {
                    labels: marketPlaces,
                    datasets: [{
                        data: countAmountData,
                        backgroundColor
                    }]
                }
            });

    }

    handleStartDate(date) {
        this.setState({
            startDate: date
        }, () =>
                this.getChartData()
        );
    }

    handleEndDate(date) {
        this.setState({
            endDate: date
        }, () =>
                this.getChartData()
        );
    }

    componentWillReceiveProps(nextProps) {
        
        if (!nextProps.ordersLengow.loading && this.props.ordersLengow.loading) {
            console.log("Pablooo",nextProps.ordersLengow);
            ordersData = nextProps.ordersLengow.ordersLengow;
            
            this.getChartData()
        }
    }

    render() {
       
        const lengow_config = this.props.lengowConfig;
        return (


            <div className="w-100 center">
                <h3>Select Dates</h3>

                <div >
                    <label htmlFor="startDate"> Start Date: </label>
                    <DatePicker
                        selected={this.state.startDate}
                        onChange={this.handleStartDate}
                    />
                </div>
                <div>
                    <label htmlFor="startDate"> End Date: </label>
                    <DatePicker
                        selected={this.state.endDate}
                        onChange={this.handleEndDate}
                    />
                </div>

                 {this.state.ordersData.length == 0 && 
                    <p> There's no exists orders between selected dates </p>
                }

                {this.state.ordersData.length > 0 &&
                    <div className="cf">
                        <div className="fl w-50 center">
                            <h2>Orders Count</h2>
                            <Doughnut width={900} height={450} data={this.state.chartCountOrders} />
                            {this.state.chartCountOrders.datasets[0].data.length > 0 && 
                                <p className="tc">Total orders: {this.state.chartCountOrders.datasets[0].data.reduce((prev, next) => (parseFloat(prev)+parseFloat(next)).toFixed(0) )} </p>
                            }
                        </div>

                        <div className="fl w-50 center">
                            <h2>Orders Amount</h2>
                            <Doughnut data={this.state.chartAmountOrders} />
                            {this.state.chartAmountOrders.datasets[0].data.length > 0 && 
                                <p className="tc">Total amount: {this.state.chartAmountOrders.datasets[0].data.reduce((prev, next) => (parseFloat(prev)+parseFloat(next)).toFixed(2) )} </p>
                            }
                        </div>
                    </div>
                }

               


            </div>

        )
    }
}

export default compose(
    graphql(ordersLengow, { name: 'ordersLengow' })
)(LengowStats)