import React, { Component } from "react";
import loaderImg from "../../../assets/images/loader.gif";
import offlineImg from "../../../assets/images/offline.gif"

class FullPageLoader extends Component {
  render() {
    if(this.props.message === 'offline'){
      var info = "You're offline. Please check your connection."
      var image = offlineImg
    }
    else {
      info = "Please wait for a moment while we load your resources."
      image = loaderImg
    }
    return (
      <div className="loader-container">
        <div className="loader">
          <img src={image} alt="load spinner"></img><br/>
          <span>{info}</span>
        </div>
      </div>
    );
  }
}

export default FullPageLoader;
