import React, { Component } from "react";
import { reactAPIURL } from "../General.js";
import Utils from '../Utils';
import {Dropdown, Spinner, Modal, Form} from 'react-bootstrap';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import CardContent from '@material-ui/core/CardContent';
import NotificationsIcon from '@material-ui/icons/Notifications';
import CancelIcon from '@material-ui/icons/Cancel';
import CachedIcon from '@material-ui/icons/Cached';
import CheckBoxIcon from '@material-ui/icons/Beenhere';
import Tooltip from '@material-ui/core/Tooltip';
import CloseIcon from '@material-ui/icons/Close';
import loaderImg from "../../../../assets/images/loader_dots.gif";
import { StyleSheet, css } from 'aphrodite';

class Notifications extends Component {
  constructor(props) {
    super(props);
    this.state = {
        show: false,
        unreadNotifications: [],
        customer_Notifications: [],
        width: window.innerWidth/3,
        height: window.innerHeight/4,
    }
    this.handleNotificationsClose = this.handleNotificationsClose.bind(this);
  }
  async componentDidMount() {
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    var notifications = JSON.parse(localStorage.getItem('notifications'));
    notifications!== null && notifications.sort(function(a, b) {
       var c = new Date(a.created);
       var d = new Date(b.created);
       return d-c;
    });
    var unreadNotifications = [];
    notifications !== null && notifications.forEach((item) => {
      if(item.read === false)
        unreadNotifications.push(item);
    })

    if(appearanceObject !== null && userAuthDetails !== null && userDetails !== null){
      await this.setState({
        primary_color: JSON.parse(appearanceObject).primary_color,
        secondary_color: JSON.parse(appearanceObject).secondary_color,
        user: JSON.parse(userAuthDetails).user,
        refresh_token: JSON.parse(userAuthDetails).refresh_token,
        id_token: JSON.parse(userAuthDetails).id_token,
        role: JSON.parse(userDetails).role,
        customer_id: JSON.parse(userDetails).customer_id,
        customer_Notifications: notifications!== null ? notifications : [],
        unreadNotifications: unreadNotifications!== null ? unreadNotifications : [],
        loaded: true
      });
      // this.readCustomerNotifications();
      this.reloadNotifications();
    }
    window.addEventListener('resize', this.updateDimensions);
  }

  updateDimensions = () => {
    this.setState({ width: window.innerWidth/3, height: window.innerHeight/4  });
  };

  /**
   * Get the list of all notifications created under the customer
   * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
   * @param  {String} customer_id The unique customer ID of the current logged in user
   * @param  {String} user logged in user's email ID
   * @param  {String} role logged in user's role
   * @return {JSON}  array of objects from the respective database
 */
  readCustomerNotifications = async()=>{
    await Utils.getCustomerNotifications(this.state.refresh_token, this.state.user,
                            this.state.customer_id, this.state.role)
    .then(async(data) => {
      // console.log(data);
      var customer_Notifications = [], unreadNotifications = [];
        customer_Notifications = await data.map((item) => {
           return item
        });
       customer_Notifications.forEach((item) => {
         if(item.read === false)
           unreadNotifications.push(item);
       })
       this.setState({
         customer_Notifications: customer_Notifications,
         unreadNotifications: unreadNotifications,
         loaded: true
       })
      // Put the array into storage
      localStorage.setItem('notifications', JSON.stringify(customer_Notifications));
    })
  }

  reloadNotifications() {
    this.interval = setInterval(() => {
      // this.readCustomerNotifications();
      // instead of making constant API calls here, we will check browser localStorage
      // for the session Notifications
      var notifications = JSON.parse(localStorage.getItem('notifications'));
      notifications!== null && notifications.sort(function(a, b) {
         var c = new Date(a.created);
         var d = new Date(b.created);
         return d-c;
      });
      var unreadNotifications = [];
      notifications!== null && notifications.forEach((item) => {
        if(item.read === false)
          unreadNotifications.push(item);
      })
      this.setState({
        customer_Notifications: notifications!== null && notifications,
        unreadNotifications: unreadNotifications,
      })
    }, 5000); //5 seconds
  }

  /**
   * To update the read status of an notification/s
   * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
   * @param  {Object} item notification item object
   * @return {JSON}  success response
 */
  changeNotificationReadStatus = async(item)=>{
    fetch(reactAPIURL + 'changenotificationreadstatus', {
      method: 'post',
      headers:{
        'Accept': 'application/json',
        'Content-type': 'application/json',
        'Authorization': this.state.id_token
      },
      body:JSON.stringify({
        "refresh_token": this.state.refresh_token,
        "user": this.state.user,
        "item": item
      })
    })
    .then((response) => response.json())
      .then(async responseJson => {
         // console.log(responseJson)
        // this.readCustomerNotifications();
      })
    .catch((error)=>{
      Utils.adderrorNotification('Error changing notifications status: ' + error.message )
    });
  }

  handleNotificationsClose() {
    this.setState({
      show: false,
      selectedNotificationItem: '',
      selectedNotification: false
    })
  }

  async handleShowItem(item) {
    this.changeNotificationReadStatus([item]);
    await this.setState({
      show: true,
      selectedNotificationItem: [item],
      selectedNotification: true
    })
  }

  selectedNotification(item){
    this.changeNotificationReadStatus([item]);
    this.setState({
      selectedNotification: true,
      selectedNotificationItem: [item]
    })
  }

  handleDismissAll() {
    localStorage.setItem('notifications', JSON.stringify([]));
  }

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
    });

    return (
      <li className="nav-item nav-profile border-0 pl-3">
        <Dropdown alignRight show={this.props.notificationDropdown}>
          <Tooltip title={`You have ${ this.state.unreadNotifications.length} unread notifications`}>
            <Dropdown.Toggle onClick={ () => this.props.toggler('notificationDropdown') }
              className={`${ this.props.notificationDropdown ? 'nav-link active' : 'nav-link' }
                          ${ this.props.notificationDropdown ? css(styles.navitem_active) : css(styles.navitem) }
                          count-indicator bg-transparent toggle-arrow-hide`}>
              <NotificationsIcon/>
              <span className="count bg-success">{this.state.unreadNotifications.length}</span>
            </Dropdown.Toggle>
          </Tooltip>
          <Dropdown.Menu style={{ width: this.state.width }}
                         className="navbar-dropdown preview-list">
            <div className="card">
              <div className= {`${ 'card-header d-flex justify-content-between align-items-center' } ${ css(styles.cardheader) }`}>
                  Notifications
                  <span data-toggle="tooltip" data-placement="top"
                     title="close">
                    <CloseIcon className="refresh" onClick={() => this.props.close('notificationDropdown')}/>
                  </span>
              </div>
              <div className="card-body" style={{
                height: 'calc(100vh - 130px)',
                overflow: 'auto'
              }}>
              <div className="card-title d-flex justify-content-between align-items-center">
                <a style={{fontSize: '12px', color: this.state.primary_color}}
                   href="#" onClick={this.handleClick}>
                  More events in the activity log &rarr;
                </a>
                <a style={{fontSize: '12px', color: this.state.primary_color}}
                   href="#" onClick={this.handleDismissAll}>
                  Dismiss all
                </a>
                {/*<Button color="primary" onClick={() => this.changeNotificationReadStatus(this.state.unreadNotifications)}
                        size="small" style={{textTransform: 'none'}} variant="outlined">
                </Button>&nbsp;{' '}&nbsp;
                <Tooltip title="refresh notifications list">
                  <CachedIcon className="refresh" onClick={() => {
                      this.readCustomerNotifications();
                  }}/>
                </Tooltip>&nbsp;{' '}&nbsp;*/}
              </div>
                {this.state.loaded && this.state.customer_Notifications!== null ?
                  <>
                  {this.state.customer_Notifications.length > 0 ?
                    this.state.customer_Notifications.map((item, index) => {
                      return (
                          <div key={index} className={ item.read ? 'notifications-card-read' : 'notifications-card-unread' }>
                            <Dropdown.Item className="dropdown-item preview-item d-flex align-items-center" >
                              <div style={{whiteSpace: 'initial'}} className="preview-item-content py-2">
                                <h6 style={{color: this.state.primary_color}} className="preview-subject font-weight-normal mb-1">
                                  {item.notification_type.split("_")[2] === "running" ?
                                    <><img className="responsive" src={loaderImg} alt="loading dots"/>{' '}{item.subject}</> :
                                   item.notification_type.split("_")[2] ===  "completed" && item.notification_type.split("_")[0] ===  "delete" ?
                                    <><CancelIcon style={{fill: 'red'}}/>{' '}{item.subject}</> :
                                    <><CheckBoxIcon style={{fill: 'green'}}/>{' '}{item.subject}</>
                                  }
                                </h6>
                                <p className="preview-subject font-weight-normal text-dark mb-1">{item.message}</p>
                                <p className="font-weight-light small-text mb-0"> {Utils.timeSince(new Date(item.created))} </p>
                              </div>
                            </Dropdown.Item>
                          <div className="dropdown-divider"/>
                        </div>
                      )
                    }) : <p><NotificationsIcon/> No new notifications from this session </p>
                  }
                  </> : <div style={{color:this.state.primary_color}} className="d-flex justify-content-center">
                    <Spinner  animation="border" role="status">
                        <span className="sr-only">Loading...</span>
                    </Spinner>
                  </div>
                }
              </div>
            </div>
         </Dropdown.Menu>
        </Dropdown>
        {/* modal for notification panel */}
        {/*<Modal show={this.state.show} onHide={this.handleNotificationsClose}
          aria-labelledby="contained-modal-title-vcenter"
          centered
          dialogClassName="modal-90w"
        >
            <Modal.Header className="modal-90w-header" closeButton>
              <Modal.Title id="contained-modal-title-vcenter">Notifications panel</Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-90w-body-fixed">
            <div className="col-lg-12 grid-margin stretch-card">
              <div className="card">
                 <div className="card-body">
                   <div className="row">
                     <div className="col-md-8">
                       <Form.Group className="row">
                         <div className="col-sm-12">
                           <span>Notification details</span>
                           {this.state.selectedNotification === true ?
                             <>
                              {this.state.selectedNotificationItem.map((item, index) => {
                                return (
                                    <div key={index}>
                                      <Card key={index}>
                                        <CardContent>
                                          <Typography>
                                            {item.subjectDetails}<br/>
                                            {item.messageDetails}<br/>
                                            {Utils.timeSince(new Date(item.created_ts))}
                                          </Typography>
                                        </CardContent>
                                      </Card>
                                    </div>
                                  )
                                })
                              }</> : <div className="justify-content-center">
                                <i className="mdi mdi-bell-ring-outline mdi-36px"/>
                                <p>Select a notification to open.</p>
                              </div>
                           }
                         </div>
                       </Form.Group>
                     </div>
                     <div className="col-md-4">
                       <Form.Group className="row">
                         <div className="col-sm-12">
                           <span>Notifications</span>
                           <Grid>
                             {this.state.loaded === true || this.state.selectedNotification === true ?
                               <div className="scroll">
                                {this.state.customer_Notifications.length > 0 && this.state.customer_Notifications.map((item, index) => {
                                  return (
                                    <Grid item xs={12} sm={6} md={12} key={index}>
                                      <div key={index}>
                                        <Card  key={index} onClick={() => this.selectedNotification(item)}>
                                          <CardContent className={ item.read ? 'notifications-card-read' : 'notifications-card-unread' }>
                                            <Typography>
                                              {item.subject}<br/>
                                              {Utils.timeSince(new Date(item.created_ts))}
                                            </Typography>
                                          </CardContent>
                                        </Card>
                                      </div>
                                     </Grid>
                                    )
                                  })
                                }</div> : <div className="dialog d-flex justify-content-center">
                                  <Spinner animation="border" role="status">
                                      <span className="sr-only">Loading...</span>
                                  </Spinner>
                                </div>
                             }
                           </Grid>
                         </div>
                       </Form.Group>
                     </div>
                   </div>
                 </div>
               </div>
             </div>
            </Modal.Body>
            <Modal.Footer>
              <Button onClick={this.handleNotificationsClose}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>*/}
      </li>
    );
  }
}

export default Notifications;
