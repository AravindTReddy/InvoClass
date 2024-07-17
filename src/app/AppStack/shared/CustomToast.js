import React, { Component } from 'react';
import loaderImg from "../../../assets/images/loader_dots.gif";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import CancelIcon from '@material-ui/icons/Cancel';
import './CustomToast.css'; // Import the CSS file

class CustomToast extends Component {
  render() {
    return (
      <div className="toast-wrapper">
          {/*{this.props.type === 'response' ? <CheckCircleOutlineIcon style={{ fill: 'green' }} /> :
          this.props.type === 'error' ? <CancelIcon style={{ fill: 'red' }} /> : <img className="responsive" src={loaderImg} alt="loading dots" />}*/}
          <p style={{ display: "inline" }}>
          {' '}{this.props.message}{' '}
          {this.props.type === 'link' ? <a href="#" onClick={this.props.onClick}>HERE</a> : null }
        </p>
      </div>
    );
  }
}

export default CustomToast;
