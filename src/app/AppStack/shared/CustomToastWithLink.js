import React, { Component } from 'react'
import loaderImg from "../../../assets/images/loader_dots.gif";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';

class CustomToastWithLink extends Component {
  render() {
    return (
      <div className="toast-wrapper">
          {this.props.type === 'response' ? <CheckCircleOutlineIcon style={{fill: 'green'}}/> :
          <img className="responsive" src={loaderImg} alt="loading dots"/>}
          <p style={{display: "inline"}}>
            {' '}{this.props.message}{' '}
            <a href={this.props.link} target="_blank">OTS</a>
          </p>
      </div>
    )
  }
}

export default CustomToastWithLink
