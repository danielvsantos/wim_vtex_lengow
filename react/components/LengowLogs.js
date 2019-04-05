import React from 'react'
import { compose, graphql } from 'react-apollo'
import { DatePicker } from 'vtex.styleguide'
import moment from "moment";

import logsLengow from '../graphql/logsLengow.graphql'

import { Button, Input, Toggle, Dropdown } from 'vtex.styleguide'

let masterLogsData = []
/*masterLogsData.push({type: 'error', msg: 'Esto es una prueba de error 14', date: '2018-11-14T14:46:55.584Z'})
masterLogsData.push({type: 'warning', msg: 'Esto es una prueba de warning 14', date: '2018-11-14T14:46:55.584Z'})
masterLogsData.push({type: 'success', msg: 'Esto es una prueba de success 14', date: '2018-11-14T14:46:55.584Z'})

masterLogsData.push({type: 'warning', msg: 'Esto es una prueba de warning 15', date: '2018-11-15T14:46:55.584Z'})
masterLogsData.push({type: 'success', msg: 'Esto es una prueba de success 15', date: '2018-11-15T14:46:55.584Z'})*/

class LengowLogs extends React.Component {
    constructor(props) {
        super(props),
        this.state = {
            startDate: new Date(),
            logsData: masterLogsData
        }

        this.handleStartDate = this.handleStartDate.bind(this)
        this.getLogData = this.getLogData.bind(this);

        if (!this.props.logsLengow.loading) {
            masterLogsData = this.props.logsLengow.logsLengow;
            this.getLogData()
        }
    }

    handleStartDate(date) {
        this.setState({
            startDate: date
        }, () => { this.props.logsLengow.refetch();  masterLogsData = this.props.logsLengow.logsLengow; this.getLogData() });
        
    }

    componentDidMount() {
        this.getLogData()
    }

    componentWillReceiveProps(nextProps) {
        
        if (!nextProps.logsLengow.loading && this.props.logsLengow.loading) {
            masterLogsData = nextProps.logsLengow.logsLengow;
            this.getLogData()
        }
    }

    getLogData() {
        if(masterLogsData){

            let startDate = (moment(this.state.startDate).set({ hour: 0, minute: 0, second: 0, millisecond: 0 })).format()
            let endDate = (moment(this.state.startDate).set({ hour: 23, minute: 59, second: 59, millisecond: 999 })).format()

            let newLogData = masterLogsData.filter(
                item => item.date > startDate && item.date < endDate
            );

            this.setState({
                logsData: newLogData
            });
        }
    }

    render() {

        const colorError = ($type) => {
            switch($type){
                case 'error':
                    return 'red'
                    break
                case 'warning':
                    return 'yellow'
                    break
                case 'success':
                    return 'green'
                    break
                default:
                    return ''
            }
        }

        return (
            <div className="w-100-ns center">
                <div >
                     <h3>Select Date</h3>
                     <DatePicker
                        label="Log Date"
                        value={this.state.startDate}
                        onChange={this.handleStartDate}
                        locale="en-US"
                    />
                </div>

                <div>
                    <h2>Logs</h2>   
                    {this.state.logsData && this.state.logsData.length >0 && this.state.logsData.map((item,key) => {
                        let class_name = `${colorError(item.type)} lengow-${item.type}`;
                        return (
                            <p key={key} className={class_name}> {item.date} - #{item.orderID}# - {item.type}: {item.msg} </p>
                        )
                    })}
                    {this.props.logsLengow.loading && 
                        <p> Loading...</p>
                    }
                    {this.state.logsData &&  this.state.logsData.length == 0 && !this.props.logsLengow.loading &&
                        <p> There's no exists logs on the selected day </p>
                     }
                </div>
            </div>

        )
    }
}

export default compose(
    graphql(logsLengow, { name: 'logsLengow' })
)(LengowLogs)