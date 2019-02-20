import React from 'react'
import { compose, graphql } from 'react-apollo'
import DatePicker from "react-datepicker";
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
            startDate: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }),
            logsData: masterLogsData
        }

        this.handleStartDate = this.handleStartDate.bind(this)
        this.getLogData = this.getLogData.bind(this);
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
            let date = moment(this.state.startDate)

            let startDate = date.format()
            let endDate = date.set({ hour: 23, minute: 59, second: 59, millisecond: 999 }).format()

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
                    <label htmlFor="startDate"> Log Date: </label>
                    <DatePicker
                        selected={this.state.startDate}
                        onChange={this.handleStartDate}
                    />
                </div>

                <div>
                    <h2>Logs</h2>   
                    {this.state.logsData && this.state.logsData.length >0 && this.state.logsData.map((item,key) => {
                        return (
                            <p key={key} className={colorError(item.type)}> {item.date} - {item.type}: {item.msg} </p>
                        )
                    })}
                    {this.state.logsData &&  this.state.logsData.length == 0 && 
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