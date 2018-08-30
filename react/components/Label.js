import React, { Component } from 'react'
import PropTypes from 'prop-types'

// eslint-disable-next-line
class Label extends Component {
  render () {
    const {htmlFor, children, className} = this.props
    return (
      <label
        htmlFor={htmlFor}
        className={`w-100 f4 ${className}`}
      >
        {children}
      </label>
    )
  }
}

Label.defaultProps = {
  className: '',
}

Label.propTypes = {
  children: PropTypes.node,
  htmlFor: PropTypes.string,
  className: PropTypes.string,
}

export default Label
