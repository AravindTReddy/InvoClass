import React, { Component } from 'react';

class Footer extends Component {
  render () {
    var theYear = new Date().getFullYear();
    return (
      <footer className="footer">
        <div className="container-fluid">
          <div className="text-center">
            <span className="text text-center text-sm-left d-block d-sm-inline-block">Copyright © {theYear} <a href="https://www.invoclass.com/" target="_blank" rel="noopener noreferrer">InvoClass</a>. All rights reserved.</span>
          </div>
        </div>
      </footer>
    );
  }
}

export default Footer;
