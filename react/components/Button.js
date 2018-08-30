import React, { Component } from 'react'
import PropTypes from 'prop-types'

const DISABLED_CLASSES = 'o-20'

// eslint-disable-next-line
class Button extends Component {
  constructor (props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
  }

  handleClick () {
    this.props.onClick()
  }

  getSizeClass (size) {
    switch (size) {
      case 'small':
        return 'pa2'
      case 'medium':
        return 'pa2'
      case 'large':
        return 'pa4'
      default:
        return ''
    }
  }

  getTypeClass (type) {
    switch (type) {
      case 'primary':
        return 'bg-primary'
      case 'secondary':
        return 'bg-light-silver'
      case 'danger':
        return 'bg-light-red'
      case 'confirm':
        return 'bg-green'
      default:
        return ''
    }
  }

  render () {
    const {children, type, size, disabled, extraClasses } = this.props
    const sizeClass = this.getSizeClass(size)
    const typeClass = disabled ? this.getTypeClass(type) + " " + DISABLED_CLASSES : this.getTypeClass(type)
    const classes = `${sizeClass} ${typeClass} ${extraClasses}`
    return (
      <button
        disabled={disabled}
        className={`font-display fw5 bn br2 pa3 pa2-ns f4 mt3 lh-copy pointer ${classes}`}
        onClick={this.handleClick}
      >
        {children}
      </button>
    )
  }
}

Button.defaultProps = {
  size: 'medium',
  type: 'primary',
  extraClasses: '',
  disabled: false,
  onClick: () => {},
}

Button.propTypes = {
  type: PropTypes.string,
  size: PropTypes.string,
  extraClasses: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
  disabled: PropTypes.bool,
}

export default Button
