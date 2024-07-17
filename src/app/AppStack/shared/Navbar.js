import React, {Component} from 'react';
import { Link, withRouter } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import FullPageLoader from './FullPageLoader.js'
import {ThemeProvider, createTheme} from '@material-ui/core/styles';
import Tooltip from '@material-ui/core/Tooltip';
import Calendar from "../shared/Calendar/Calendar";
import VideoChat from "../shared/VideoChat/VideoChat";
import Notifications from "../shared/Notifications/Notifications";
import Account from "../shared/Account/Account";
import { StyleSheet, css } from 'aphrodite';
import FaceIcon from '@material-ui/icons/Face';
import HomeIcon from '@material-ui/icons/Home';
import FavoriteBorderIcon from '@material-ui/icons/FavoriteBorder';
import ClassIcon from '@material-ui/icons/Class';
import BusinessIcon from '@material-ui/icons/Business';
import DesktopMacIcon from '@material-ui/icons/DesktopMac';
import { s3BucketUrl } from "./General.js";
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
/* eslint-disable no-useless-escape */

class Navbar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            userIcon: 'OmniLab01',
            isDisconnected: false,
            primary_color: '#F38A2C',
            secondary_color: '#606060',
            dropDown: '',
            customerPlan: {}
        };
        this.toggleDropdownState = this.toggleDropdownState.bind(this);
        this.dropdownClose = this.dropdownClose.bind(this);
    }

    isPathActive(path) {
      return this.props.location.pathname.startsWith(path);
    }

    async componentDidMount() {
      var appearanceObject = localStorage.getItem('appearanceObject');
      var userAuthDetails = localStorage.getItem('userAuthDetails');
      var userDetails = localStorage.getItem('userDetails');
      var customerDetails = JSON.parse(localStorage.getItem('customerDetails'));
      // console.log(customerDetails);
      if(appearanceObject !== null && userAuthDetails !== null && userDetails !== null){
        await this.setState({
          primary_color: JSON.parse(appearanceObject).primary_color,
          secondary_color: JSON.parse(appearanceObject).secondary_color,
          logo: JSON.parse(appearanceObject).logo_image,
          mini_logo: JSON.parse(appearanceObject).minilogo_image,
          bg_image: JSON.parse(appearanceObject).bg_image,
          user: JSON.parse(userAuthDetails).user,
          access_token: JSON.parse(userAuthDetails).access_token,
          refresh_token: JSON.parse(userAuthDetails).refresh_token,
          id_token: JSON.parse(userAuthDetails).id_token,
          role: JSON.parse(userDetails).role,
          customer_id: JSON.parse(userDetails).customer_id,
          userIcon: JSON.parse(userDetails).userIcon,
          user_first_name: JSON.parse(userDetails).user_first_name,
          user_last_name: JSON.parse(userDetails).user_last_name,
          loaded_appearance: true,
          customerPlan: customerDetails!== null && customerDetails.length > 0 && customerDetails[0].customer_plan,
        });
      }
      await this.handleConnectionChange();
      window.addEventListener('online',  this.handleConnectionChange);
      window.addEventListener('offline', this.handleConnectionChange);
      // document.addEventListener('click', ()=> {this.resetDropDowns('somewhere')});

      // add className 'hover-open' to sidebar navitem while hover in sidebar-icon-only menu
      const body = document.querySelector('body');
      document.querySelectorAll('.sidebar .nav-item').forEach((el) => {

        el.addEventListener('mouseover', function() {
          if(body.classList.contains('sidebar-icon-only')) {
            el.classList.add('hover-open');
          }
        });
        el.addEventListener('mouseout', function() {
          if(body.classList.contains('sidebar-icon-only')) {
            el.classList.remove('hover-open');
          }
        });
      });
    }

    componentWillUnmount() {
      // window.removeEventListener('resize', this.updateDimensions);
      window.removeEventListener('online',  this.handleConnectionChange);
      window.removeEventListener('offline', this.handleConnectionChange);
      // document.removeEventListener('click', ()=> {this.resetDropDowns('somewhere')});
    }

    toggleOffcanvas() {
        document.querySelector('.sidebar-offcanvas').classList.toggle('active');
    }

    handleConnectionChange = () => {
      const condition = navigator.onLine ? 'online' : 'offline';
      if (condition === 'online') {
        const webPing = setInterval(
          () => {
            fetch('//google.com', {
              mode: 'no-cors',
              })
            .then(() => {
              this.setState({ isDisconnected: false }, () => {
                return clearInterval(webPing)
              });
            }).catch(() => this.setState({ isDisconnected: true }) )
          }, 2000);
        return;
    }

    return this.setState({ isDisconnected: true });
  }

  toggleDropdownState = (dropdownState) => {
    // this.setState({dropDown: dropdownState});
    if (this.state[dropdownState]) {
      this.setState({[dropdownState] : false});
     }
    else {
     this.setState({
        videoChatDropdown: false,
        calendarDropdown: false,
        notificationDropdown: false,
        accountDropdown: false,
        resourcesDropdown: false,
        home: false, customer: false,
        users: false, developer: false,
        machine: false, classes: false,
        health: false, student: false,
        [dropdownState] : true,
      });
    }
  }

  resetDropDowns = () => {
    if(this.state.dropDown === 'somewhere'){
      this.setState({
         videoChatDropdown: false,
         calendarDropdown: false,
         notificationDropdown: false,
         accountDropdown: false,
         resourcesDropdown: false,
         home: false, customer: false,
         users: false, developer: false,
         machine: false, classes: false,
         health: false, student: false
       });
    }else {
      this.setState({dropDown: 'somewhere'})
    }
  }

  dropdownClose(dropdownState) {
    this.setState({[dropdownState]: !this.state[dropdownState]})
  }

  render() {
    const styles = StyleSheet.create({
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
      nav_mainitem: {
        ':hover': {
            color: this.state.primary_color,
            textDecoration: 'none',
        }
      },
      nav_mainitem_active: {
        color: 'white',
        ':hover': {
            textDecoration: 'none',
            backgroundColor: 'rgba(74, 74, 74, 0)',
            color: 'black',
        }
      },
    });
    const theme = createTheme({
      palette: {
        primary: {
            main: this.state.primary_color,
        },
        secondary: {
            main: this.state.secondary_color,
        },
      },
    });
    const { isDisconnected, customerPlan } = this.state;

    return (
      <ThemeProvider theme={theme}>
        <nav className="navbar col-lg-12 col-12 p-lg-0 fixed-top d-flex flex-row" id="navbar">
          <div
             className="navbar-menu-wrapper d-flex align-items-center justify-content-between">
            {/*<button className="navbar-toggler navbar-toggler align-self-center" type="button"
                    onClick={() => document.body.classList.toggle('sidebar-icon-only')}>
                <i className="mdi mdi-menu"/>
            </button>*/}
            <a className="navbar-brand brand-logo" href="index.html">
              {!this.state.logo || this.state.logo === s3BucketUrl + this.state.customer_id + '/appearance/' ?
                <Tooltip title="Add your own logo here in My Account -> Appearance">
                  <Link style={{textDecoration: 'none'}} to="/user/my-account">
                    <img src={require("../../../assets/images/logo.png").default} alt=" default_logo" />
                  </Link>
                </Tooltip>
                :  <img src={this.state.logo} alt="logo" />
              }
            </a>
            {/*<ul className="navbar-nav navbar-nav-left header-links"></ul>*/}

            <ul className="navbar-nav navbar-nav-right ml-lg-auto">

            {/*NOTE: All the tabs are available for the super user brixon admin (role: admin)*/}
            {/*Home tab is available for all users (role: all roles)*/}
            {this.state.role !== "student" ?
            <li className={ this.isPathActive('/admin/home') ? 'nav-item active d-none d-md-flex' : 'nav-item d-none d-md-flex' }>
              <Link className={`${ this.isPathActive('/admin/home') ? 'nav-link active' : 'nav-link' }
                                ${ this.isPathActive('/admin/home') ? css(styles.navitem_active) : css(styles.navitem) }`} to="/admin/home"
                                onClick={ () => this.toggleDropdownState('home') }>
                   <Tooltip title="Home">
                    <HomeIcon/>
                  </Tooltip>
              </Link>
            </li> : null }
            {/*Customers tab is only available for brixon admin (role: admin)*/}
            {this.state.role === "admin" ?
              <li className={ this.isPathActive('/brixon_admin/customer-management') ? 'nav-link active d-none d-md-flex' : 'nav-item d-none d-md-flex' }>
                <Link className={`${ this.isPathActive('/brixon_admin/customer-management') ? 'nav-link active' : 'nav-link' }
                                  ${ this.isPathActive('/brixon_admin/customer-management') ? css(styles.navitem_active) : css(styles.navitem) }`}
                      to="/brixon_admin/customer-management" onClick={ () => this.toggleDropdownState('customer') }>
                  <BusinessIcon/>
                  {/*<span className="submenu-title">Customers</span>*/}
                </Link>
              </li>: null
            }

            {this.state.role === "admin" || this.state.role === "customer_admin" || this.state.role === "biz_customer_admin"
              || this.state.role === "biz_default_user" ?
              <li className="nav-item">
                <Link className={`${ this.isPathActive('/admin/templates') ? 'nav-link active' : 'nav-link' }
                                  ${ this.isPathActive('/admin/templates') ? css(styles.navitem_active) : css(styles.navitem) }`}
                      to="/admin/templates" onClick={ () => this.toggleDropdownState('developer') }>
                  <Tooltip title="Lab Templates">
                    {/*<CodeIcon/>*/}
                    <IntegrationInstructionsIcon/>
                  </Tooltip>
                  {/*<span className="submenu-title">Developer</span>*/}
                </Link>
              </li> : null
            }

            {/*biz_customer_admin the new role will have some restrictions on the sub menu tabs*/}
            {this.state.role === "admin" || this.state.role === "customer_admin" || this.state.role === 'instructor'
              || this.state.role === "student" ?
              <li className="nav-item">
                <Link className={`${ this.isPathActive('/admin/classes') ? 'nav-link active' : 'nav-link' }
                                  ${ this.isPathActive('/admin/classes') ? css(styles.navitem_active) : css(styles.navitem) }`}
                      to="/admin/classes" onClick={ () => this.toggleDropdownState('classes') }>
                  <Tooltip title="Classes">
                    <ClassIcon/>
                  </Tooltip>
                  {/*<span className="submenu-title">Classes</span>*/}
                </Link>
              </li> : null
            }

            {/*Administrator tab is only available for customer admin (role: customer_admin, biz_customer_admin, biz_default_user)*/}
            {this.state.role === "admin" || (this.state.role === "customer_admin" && customerPlan.type !== 'starter') || this.state.role === "biz_customer_admin" ?
              <li className="nav-item">
                <Link className={`${ this.isPathActive('/admin/users') ? 'nav-link active' : 'nav-link' }
                                  ${ this.isPathActive('/admin/users') ? css(styles.navitem_active) : css(styles.navitem) }`}
                      to="/admin/users" onClick={ () => this.toggleDropdownState('users') }>
                  <Tooltip title="Users">
                    <FaceIcon/>
                  </Tooltip>
                  {/*<span className="submenu-title">Users</span>*/}
                </Link>
              </li> : null
            }

            {/*This new sub menu tab is only visible for biz_roles (role: biz_default_user, biz_customer_admin)*/}
            {this.state.role === "admin" || this.state.role === "biz_customer_admin" || this.state.role === "biz_default_user" ?
              <li className="nav-item">
                <Link className={`${ this.isPathActive('/admin/machine-management') ? 'nav-link active' : 'nav-link' }
                                  ${ this.isPathActive('/admin/machine-management') ? css(styles.navitem_active) : css(styles.navitem) }`}
                      to="/admin/machine-management" onClick={ () => this.toggleDropdownState('machine') }>
                  <DesktopMacIcon/>
                  {/*<span className="submenu-title">Desktops</span>*/}
                </Link>
              </li> : null
            }
            {this.state.role === "admin" || this.state.role === "customer_admin" || this.state.role === "biz_customer_admin"
              || this.state.role === "biz_default_user" ?
              <li className={ this.isPathActive('/admin/health') ? 'nav-item active d-none d-md-flex' : 'nav-item d-none d-md-flex' }>
                <Link className={`${ this.isPathActive('/admin/health') ? 'nav-link active' : 'nav-link' }
                                  ${ this.isPathActive('/admin/health') ? css(styles.navitem_active) : css(styles.navitem) }`}
                      to="/admin/health" onClick={ () => this.toggleDropdownState('health') }>
                  <Tooltip title="Health and Status">
                    <FavoriteBorderIcon/>
                  </Tooltip>
                </Link>
              </li> : null
            }
            {/*Student tab is only available for students, customer_admin (role: student, customer_admin)*/}
            {/*{this.state.role === "admin" || this.state.role === "student" ?
              <li className="nav-item">
                <Link className={`${ this.isPathActive('/student/student-dashboard') ? 'nav-link active' : 'nav-link' }
                                  ${ this.isPathActive('/student/student-dashboard') ? css(styles.navitem_active) : css(styles.navitem) }`}
                      to="/student/student-dashboard" onClick={ () => this.toggleDropdownState('student') }>
                  <Tooltip title="Dashboard">
                    <DashboardIcon/>
                  </Tooltip>
                  <span className="submenu-title">Dashboard</span>
                </Link>
              </li>: null
            }*/}

              <Calendar
                toggler={this.toggleDropdownState}
                calendarDropdown={this.state.calendarDropdown}
                close={this.dropdownClose}
              />

              {/*{this.state.role === 'student' &&
                <Resources
                  toggler={this.toggleDropdownState}
                  resourcesDropdown={this.state.resourcesDropdown}
                  close={this.dropdownClose}
                />
              }*/}

              <VideoChat
                toggler={this.toggleDropdownState}
                videoChatDropdown={this.state.videoChatDropdown}
                close={this.dropdownClose}
              />

              <Notifications
                toggler={this.toggleDropdownState}
                notificationDropdown={this.state.notificationDropdown}
                close={this.dropdownClose}
              />

              <Account
                toggler={this.toggleDropdownState}
                accountDropdown={this.state.accountDropdown}
                close={this.dropdownClose}
              />

            </ul>

            {/*<button className="navbar-toggler navbar-toggler-right d-lg-none align-self-center" type="button"
                    onClick={this.toggleOffcanvas}>
                <span className="mdi mdi-menu"></span>
            </button>*/}
        </div>
          { isDisconnected ?  <FullPageLoader message= "offline"/> : null}
          { this.state.loaded_appearance ? null : <FullPageLoader message= "before_login"/> }
        </nav>
      </ThemeProvider>
    );
  }
}

export default withRouter(Navbar);
