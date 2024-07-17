import React from 'react'
import { withRouter } from 'react-router-dom'
import SignIn from './AuthStack/SignIn'
//import SignUp from './AuthStack/SignUp'
import Navbar from './AppStack/shared/Navbar_bl';
import Footer from './AppStack/shared/Footer';

class Authenticator extends React.Component {
  state = {}

  componentDidMount() {
    localStorage.clear();
  }

  render() {
    return (
      <div className="container_login">
        <header><Navbar/></header>
          <div className="body">
            <SignIn />
          </div>
        <div className="footer_login"><Footer/></div>
      </div>
    )
  }
}

export default withRouter(Authenticator)
