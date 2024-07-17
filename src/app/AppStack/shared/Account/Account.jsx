import React, { Component } from "react";
import {Dropdown} from 'react-bootstrap';
import {Auth} from 'aws-amplify';
import Tooltip from '@material-ui/core/Tooltip';
import Utils from '../Utils';
import CloseIcon from '@material-ui/icons/Close';
import { StyleSheet, css } from 'aphrodite';
import { Link } from 'react-router-dom';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import SecurityIcon from '@mui/icons-material/Security';
import SchoolIcon from '@mui/icons-material/School';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import AppleIcon from '@mui/icons-material/Apple';
import SwitchCameraIcon from '@mui/icons-material/SwitchCamera';

class Account extends Component {
  constructor(props) {
    super(props);
    this.state = {
        show: false,
        width: window.innerWidth/4,
        height: window.innerHeight,
        anchorEl: null,
        users: [],
        guestList: [],
        key: false,
        additonal_roles: []
    }
    this.signOut = this.signOut.bind(this);
  }

  async componentDidMount() {
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    if(appearanceObject !== null && userAuthDetails !== null && userDetails !== null){
      JSON.parse(userDetails).additonal_roles !== undefined &&
        this.setState({additonal_roles: JSON.parse(userDetails).additonal_roles})
      await this.setState({
        primary_color: JSON.parse(appearanceObject).primary_color,
        secondary_color: JSON.parse(appearanceObject).secondary_color,
        user: JSON.parse(userAuthDetails).user,
        refresh_token: JSON.parse(userAuthDetails).refresh_token,
        id_token: JSON.parse(userAuthDetails).id_token,
        role: JSON.parse(userDetails).role,
        customer_id: JSON.parse(userDetails).customer_id,
        userIcon: JSON.parse(userDetails).userIcon,
        user_first_name: JSON.parse(userDetails).user_first_name,
        user_last_name: JSON.parse(userDetails).user_last_name,
      });
    }
    window.addEventListener('resize', this.updateDimensions);
  }

  updateDimensions = () => {
    this.setState({ width: window.innerWidth/4, height: window.innerHeight });
  };

  signOut = () => {
    let customerDetails = JSON.parse(localStorage.getItem('customerDetails'));
    if(customerDetails && customerDetails.length === 1){
      const newObj = {
        'vm_name': customerDetails[0].vm_name,
        'customer_id': customerDetails[0].customer_id
      }
      console.log(newObj);
      Utils.stopVM([newObj])
      .then(data => {
        if(data.message === 'success'){
          //stopped customer server
        }
      })
      .catch(err => { throw err });
    }
    Auth.signOut()
    .then(() => {
      localStorage.clear();
      window.open('/', "_self");
    })
    .catch(err => console.log('error signing out: ', err))
  };

  switchUserRole = (role) => {
    // Retrieve userDetails object from localStorage
    let userDetails = JSON.parse(localStorage.getItem('userDetails'));
    // Check if userDetails is not null and role exists
    if (userDetails && userDetails.role) {
        // Update the role property
        userDetails.role = role; // Replace "new_role" with the new role value
        // Store the updated userDetails object back into localStorage
        localStorage.setItem('userDetails', JSON.stringify(userDetails));

        // console.log("Role updated successfully:", userDetails);
        window.open('/admin/classes', "_self");

    } else {
        console.error("userDetails or role not found");
    }
  };

  render() {
    const styles = StyleSheet.create({
      cardheader: {
        backgroundColor: 'white',
        color: this.state.primary_color,
      },
      button: {
        ':hover': {
            color: this.state.secondary_color,
        }
      },
      navitem: {
        color: this.state.primary_color,
        ':hover': {
            color: this.state.secondary_color,
            textDecoration: 'none',
        }
      },
      navitem_active: {
        color: this.state.secondary_color,
        ':hover': {
            textDecoration: 'none',
            backgroundColor: 'rgba(74, 74, 74, 0)',
            color: this.state.primary_color,
        }
      },
      menuItem: {
        padding: '10px 10px', // Padding for menu items
        color: this.state.primary_color, // Default text color
        textDecoration: 'none', // Remove underline from links
        display: 'block', // Block-level elements
        transition: 'background-color 0.3s ease', // Smooth background color transition
        ':hover': {
          backgroundColor: '#f5f5f5', // Background color on hover
        },
      },
    });
    const { additonal_roles } = this.state;
    return (
      <li className="nav-item nav-profile border-0 pl-3">
        <Dropdown alignRight show={this.props.accountDropdown}>
          <Tooltip title="My Account">
            <Dropdown.Toggle onClick={ () => this.props.toggler('accountDropdown') }
              className={`${ this.props.accountDropdown ? 'nav-link active' : 'nav-link' }
                          ${ this.props.accountDropdown ? css(styles.navitem_active) : css(styles.navitem) }
                          count-indicator bg-transparent toggle-arrow-hide`}>
              {this.state.role === 'customer_admin' || this.state.role === 'biz_customer_admin'
                || this.state.role === 'biz_default_user' ? <SecurityIcon/> : null}
              {this.state.role === 'student' ? <SchoolIcon/> : null}
              {this.state.role === 'admin' ? <SupervisorAccountIcon/> : null}
              {this.state.role === 'instructor' ? <AppleIcon/> : null}
            </Dropdown.Toggle>
          </Tooltip>
          <Dropdown.Menu style={{ width: this.state.width }}
                         className="navbar-dropdown preview-list">

             <div className= {`${ 'card-header d-flex justify-content-between align-items-center' } ${ css(styles.cardheader) }`}>
               <div className="d-flex" style={{cursor: 'default', color: this.state.primary_color}}>
                 <div className="py-2 px-2 d-flex align-items-center justify-content-center">
                   <span className="profile-text">
                     {this.state.user}
                   </span>
                 </div>
               </div>
               <span data-toggle="tooltip" data-placement="top"
                  title="close">
                 <CloseIcon className="refresh" onClick={() => this.props.close('accountDropdown')}/>
               </span>
             </div>

            <Link to="/user/my-account" style={{textDecoration: 'none'}}
                  onClick={() => this.props.toggler('accountDropdown')}>
              <span className={`${css(styles.menuItem)}`}>
                &nbsp;{' '}&nbsp; <AccountBoxIcon/> My Account
              </span>
            </Link>
            <div className="dropdown-divider"/>
            {additonal_roles && additonal_roles.length > 0 &&
              additonal_roles.map((role, index) => {
                // Check if the role is not equal to the user's primary role
                if (role !== this.state.role) {
                  return (
                    <Tooltip key={index} title={`Switch to ${role} view`}>
                      <span className={`${css(styles.menuItem)}`} onClick={() => this.switchUserRole(role)}>
                        &nbsp;{' '}&nbsp; <SwitchCameraIcon/>{' '}{role}
                      </span>
                    </Tooltip>
                  );
                } else {
                  return null; // Don't render the role if it's equal to the user's primary role
                }
              })
            }
            <div className="dropdown-divider"/>
            <span className={`${css(styles.menuItem)}`} onClick={this.signOut}>
              &nbsp;{' '}&nbsp; <ExitToAppIcon/> Sign Out
            </span>

         </Dropdown.Menu>
        </Dropdown>
      </li>
    );
  }
}

export default Account;
