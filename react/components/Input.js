import React, { Component } from 'react'
import PropTypes from 'prop-types'

class Input extends Component {
  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
  }

    handleChange (e) {
        this.props.onChange(e)
    }

  render () {
    const {id, type, value, invalid} = this.props
    const borderColor = invalid ? 'b--dark-red' : 'b--black-30'
    return (
      <input
        id={id}
        type={type}
        value={value}
        onChange={this.handleChange}
        className={`w-100 ba h2 br2 mt1 pa3 outline-0 ${borderColor}`}
      />
    )
  }
}

Input.defaultProps = {
  invalid: false,
  onChange: () => {},
}

Input.propTypes = {
  id: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.string,
  invalid: PropTypes.bool,
  onChange: PropTypes.func,
}

export default Input
