import React, {Component} from 'react'
import {Spinner} from "react-bootstrap";
import {getAppInsights} from '../shared/TelemetryService';
import TelemetryProvider from '../shared/telemetry-provider.jsx';
import {ThemeProvider, createTheme} from '@material-ui/core/styles';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Utils from '../shared/Utils';
import { StyleSheet, css } from 'aphrodite';
import CachedIcon from '@material-ui/icons/Cached';
import { backendAPIURL, stgName, root, socketUrl, s3BucketUrl } from "../shared/General.js";
import MenuItem from '@material-ui/core/MenuItem';
import AddIcon from '@material-ui/icons/Add';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import CustomToast from '../shared/CustomToast.js'
import CustomToastWithLink from '../shared/CustomToastWithLink.js'
import DeleteDialog from '../shared/DialogBox/DeleteDialog'
import PolicyDialog from '../shared/DialogBox/PolicyDialog'
import StopIcon from '@material-ui/icons/Stop';
import IconButton from '@mui/material/IconButton';
import empty_image from "../../../assets/images/dude_empty.png";
import Menu from '@mui/material/Menu';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import Functions from './Class/Functions';
import { Link } from 'react-router-dom';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import moment from 'moment';
import StepperWizard from './Class/ClassStepperWizard'
import CancelIcon from '@mui/icons-material/Cancel';
/* eslint-disable no-useless-escape */

class ClassroomManagement extends Component {
    constructor(props) {
        super(props);
          this.state = {
              loaded: false,
              loaded_instructors: false,
              theme: 'light',
              open: false,
              open_network: false,
              create_class: false,
              edit_class: false,
              primary_color: '#F38A2C',
              secondary_color: '#606060',
              classes: [],
              classDeleteData: '',
              class_item: null,
              open_options: false,
              anchorEl: null,
              item: '',
              refresh: props.history.location.state !== undefined &&
                     props.history.location.state.flag,
              notifications: [],
              subscription_status: null
          };
        this.deleteClass = this.deleteClass.bind(this);
    }

    async componentDidMount() {
      localStorage.setItem('stepValue', JSON.stringify(0));
      var appearanceObject = localStorage.getItem('appearanceObject');
      var userAuthDetails = localStorage.getItem('userAuthDetails');
      var userDetails = localStorage.getItem('userDetails');
      // if(this.state.refresh === 'refresh')
      this.readClass();
      var userClasses = JSON.parse(localStorage.getItem('classes'));
      var userInstructors = JSON.parse(localStorage.getItem('instructors'));
      var notifications = JSON.parse(localStorage.getItem('notifications'))
      var subStatus = JSON.parse(localStorage.getItem('subscriptionStatus'));
      if(appearanceObject !== null && userAuthDetails !== null && userDetails !== null){
        await this.setState({
          primary_color: JSON.parse(appearanceObject).primary_color,
          secondary_color: JSON.parse(appearanceObject).secondary_color,
          user: JSON.parse(userAuthDetails).user,
          access_token: JSON.parse(userAuthDetails).access_token,
          refresh_token: JSON.parse(userAuthDetails).refresh_token,
          id_token: JSON.parse(userAuthDetails).id_token,
          role: JSON.parse(userDetails).role,
          customer_id: JSON.parse(userDetails).customer_id,
          userIcon: JSON.parse(userDetails).userIcon,
          user_first_name: JSON.parse(userDetails).user_first_name,
          user_last_name: JSON.parse(userDetails).user_last_name,
          classes: userClasses !== null && userClasses,
          loaded: true,
          instructors: userInstructors !== null && userInstructors,
          loaded_instructors: true,
          notifications: notifications !== null && notifications,
          subscription_status: subStatus
        });
      }
      const client = new W3CWebSocket(socketUrl +'?email=' + JSON.parse(userAuthDetails).user);
      client.onopen = () => {
          // console.log('WebSocket Client Connected');
      };
      client.onmessage = (message) => {
        toast.dismiss();
        Utils.addsuccessNotification(message.data);
        this.readClass();
      };
    }

    /**
    * To get the list of classes available under a specific customer
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} role logged in user role
    * @return {JSON}  response with a success and list of classes
    */
    readClass = async () => {
      await this.setState({loaded: false, classes: []})
      var classes = [];
      Utils.getCustomerClasses(this.state.user, this.state.role,
            this.state.customer_id, this.state.refresh_token)
      .then((data) => {
        // console.log(data);
        this.setState({classes: data, loaded: true});
        localStorage.setItem('classes', JSON.stringify(data));
      })
      .catch((error) => { throw error; })
    };

    /**
    * To delete a specific class/s that the user wishes
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {Array} rowData Array of classes(class_id)
    * @return {JSON}  response with a success custom message and statusCode
    */
    deleteClass = async (rowData) => {
      await this.setState({open: false});
      Utils.addinfoNotification('Deleting class...');
      Functions.deleteClass(rowData,
             this.state.refresh_token, this.state.role)
      .then((data) => {
        toast.dismiss();
        Utils.addsuccessNotification('Class deleted successfully')
        //here we update the classes in localStorage
        const newArr = [...this.state.classes]
        const index = newArr.findIndex(cls => cls.class_id === rowData.class_id);
        if (index > -1) {
          newArr.splice(index, 1);
          this.setState({classes: newArr})
          localStorage.setItem('classes', JSON.stringify(newArr));
        }
        //here we store the notification in localStorage
        // const newArr1 = [...this.state.notifications]
        // newArr1.length > 0 && newArr1.push({
        //   created: Date.now(),
        //   message: "You have deleted a class " + rowData.class_name,
        //   subject: "Class deleted",
        //   notification_type: 'delete_class_completed',
        //   read: false
        // })
        // localStorage.setItem('notifications', JSON.stringify(newArr1));
        // this.setState({notifications: newArr1})
      })
      .catch((error) => {
        toast.dismiss();
        Utils.adderrorNotification('Error deleting the class: ' + error)
       });
    };

    /**
    * To activate the class videochat server on demand
    * @param  {String} customer_id customer unique ID
    * @param  {Object} item An Object with class details(class_id, course_id, customer_id)
    * @return {JSON}  response with a success custom message and statusCode
    */
    activateBBBServer = async(item) => {
      var bearer = this.state.id_token;
      fetch(backendAPIURL + 'start_bbb_guacamoles', {
          method: 'post',
          headers: {
              'Accept': 'application/json',
              'Content-type': 'application/json',
              'Authorization': bearer
          },
          body: JSON.stringify({
              "class_id": item.class_id,
              "customer_id": this.state.customer_id,
              "stg": stgName
          })
      })
      .then((response) => response.json())
      .then(responseJson => {
         // console.log(responseJson);
      })
      .catch((error) => {
        toast.dismiss();
        Utils.adderrorNotification('Error activating the class server: ' + error)
      });
    }

    /**
      * To start the class server VM on demand
      * @param  {Object} item VM details object
      * @return {JSON}  response with a success custom message
    */
    startClassServerVM = async (item) => {
      const newObj = {
        'vm_name': item.vm_name,
        'class_id': item.class_id
      }
      Utils.addinfoNotification(<CustomToast
        message = "Starting machine"
        type = "request"
      />)
      await Utils.startVM([newObj])
      .then(data => {
        if(data.message === 'success'){
          Utils.addsuccessNotification(<CustomToast
            message = "Successfully started machine"
            type = "response"
          />)
          //here we update the class details in localStorage
          const newArr = [...this.state.classes]
          newArr.find(v => v.class_id === item.class_id).vm_status = 'online';
          this.setState({classes: newArr});
          localStorage.setItem('classes', JSON.stringify(newArr));
          //here we store the notification in localStorage
          const newArr1 = [...this.state.notifications]
          newArr1.push({
            created: Date.now(),
            message: "You have started the class server " + item.class_name,
            subject: "Server started",
            notification_type: 'start_vm_completed',
            read: false
          })
          localStorage.setItem('notifications', JSON.stringify(newArr1));
          this.setState({notifications: newArr1})
        }
      })
      .catch(err => { throw err });
    };

    /**
      * To sop the class server VM on demand
      * @param  {Object} item VM details object
      * @return {JSON}  response with a success custom message
    */
    stopClassServerVM = async (item) => {
      const newObj = {
        'vm_name': item.vm_name,
        'class_id': item.class_id
      }
      Utils.addinfoNotification(<CustomToast
        message = "Stopping machine"
        type = "request"
      />)
      await Utils.stopVM([newObj])
      .then(data => {
        if(data.message === 'success'){
          Utils.addsuccessNotification(<CustomToast
            message = "Successfully stopped machine"
            type = "response"
          />)
          //here we update the class details in localStorage
          const newArr = [...this.state.classes]
          newArr.find(v => v.class_id === item.class_id).vm_status = 'offline';
          this.setState({classes: newArr});
          localStorage.setItem('classes', JSON.stringify(newArr));
          //here we store the notification in localStorage
          const newArr1 = [...this.state.notifications]
          newArr1.push({
            created: Date.now(),
            message: "You have stopped the class server " + item.class_name,
            subject: "Server stopped",
            notification_type: 'stop_vm_completed',
            read: false
          })
          localStorage.setItem('notifications', JSON.stringify(newArr1));
          this.setState({notifications: newArr1})
        }
      })
      .catch(err => { throw err });
    };

    deleteDialog = async(rowData) => {
      await this.setState({open: true, classDeleteData: rowData});
    };

    handleCloseDialog = () => {
      this.setState({open: false, open_network: false});
    };

    handleDetails = async(item, event) => {
      this.setState({
        item: item,
        open_options: !this.state.open_options,
        anchorEl: event.currentTarget
       })
    };

    deployTemplate = (item, redeploy) => {
      this.setState({open_network: false})
      Utils.addinfoNotification("Deploying lab template for this class...")
      fetch(backendAPIURL + 'deploy_class_env', {
      //fetch('http://areddy-cloud9.omnifsi.com:5000/deploy_class_env', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            'customer_id': item.customer_id,
            'class_id': item.class_id,
            'user': this.state.user,
            'redeploy': redeploy,
            'build_network': 'none'
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if (responseJson) {
          toast.dismiss();
          if(responseJson.statusCode === 505){
              this.setState({open_network: true})
          }else {
            Utils.addinfoNotification(responseJson.message);
          }
          this.readClass();
        } else {
            Utils.adderrorNotification('Error creating the class environment VM: ' + responseJson.errorMessage)
        }
      })
      .catch((error) => {
        toast.dismiss();
        Utils.addinfoNotification('Hang tight, the class environment will be up soon!')
      });
    }

    handleClose = async() => {
      this.setState({
        open_options: false,
        anchorEl: null,
        item: '',
        class_item: '',
        create_class: false,
        edit_class: false
      })
    }

    render() {
      const menuItem = this.state.item;
      let appInsights = null;
      const theme = createTheme({
        palette: {
          // type: "dark",
          primary: {
              main: this.state.primary_color,
          },
          secondary: {
              main: this.state.secondary_color,
          },
        },
      });
      const styles = StyleSheet.create({
        cardheader: {
          // backgroundColor: 'white',
          color: this.state.primary_color,
        },
        button: {
          ':hover': {
              color: this.state.secondary_color,
          }
        }
      });
      const { instructors, subscription_status } = this.state;
      
      return (
          <TelemetryProvider instrumentationKey="7696784d-3192-42a6-891e-1f8ca728cfae" after={() => { appInsights = getAppInsights() }}>
            <ThemeProvider theme={theme}>
              {subscription_status === 'trialing' || subscription_status === 'active' || subscription_status === null ? (
                <div className="App">
                    {this.state.role === "admin" || this.state.role === "customer_admin" ||
                      this.state.role === "instructor" || this.state.role === "student" ?
                      <div className="row">
                        <div className="col-lg-12 grid-margin">
                          <div className="card">
                            <div className= {`${ 'card-header d-flex justify-content-between align-items-center' } ${ css(styles.cardheader) }`}>
                              <div>{this.state.role === "student" ? 'Classes' : 'Class Management' }</div>
                              <div>
                              {this.state.role !== 'student' ?
                                <>
                                  {this.state.classes.length <= 0 ?
                                    this.state.create_class ? null : <span className="rightArrowImageText">Create your first class</span> :
                                    this.state.create_class ? null : <span className="rightArrowImageText">Create a new class</span>
                                  }
                                  {this.state.create_class ? null :
                                    <img src={require(`../../../assets/images/right-arrow.png`).default}
                                       alt="rightarrow" className="rightArrowImage"/> }
                                  <Tooltip title="Create a new class">
                                    <Link
                                      to={{
                                        pathname: '/admin/classes/class/create',
                                      }}
                                      style={{textDecoration: 'none'}}
                                    >
                                      <IconButton
                                        disabled={this.state.classes.length >= 5}
                                        size="small">
                                          <AddIcon/>
                                      </IconButton>
                                    </Link>
                                  </Tooltip>{' '}
                                </> : null }
                                <Tooltip title="refresh class data">
                                  <IconButton
                                    size="small"
                                    onClick={() => this.readClass()}>
                                      <CachedIcon/>
                                  </IconButton>
                                </Tooltip>
                              </div>
                            </div>
                          </div>

                          <div className="card">
                           <div className="card-body">
                             {this.state.loaded ?
                               <Grid
                                   container
                                   spacing={2}
                                   direction="row"
                                   justifyContent="flex-start"
                                   alignItems="flex-start"
                               >
                               {this.state.classes.length > 0 ?
                                 <>
                                 {this.state.classes.map((item, index) => {
                                   return (
                                     <Grid item style={{display: 'flex'}} key={index}>
                                      <Card style={root}>
                                        <CardHeader
                                          titleTypographyProps={ item.class_name &&
                                              item.class_name.length < 49 ? {variant:'h6' } :
                                              item.class_name.length < 70 && item.class_name.length > 48
                                              ? {variant: 'subtitle1' } : {variant: 'subtitle2' }}
                                          style={{ height: '80px'}}
                                          title={item.class_name}
                                          action={this.state.role === "student" ? null :
                                            <IconButton onClick={(evt) => this.handleDetails(item, evt)} aria-label="settings">
                                              <MoreVertIcon />
                                              <Menu
                                                anchorEl={this.state.anchorEl}
                                                id="basic-menu"
                                                open={this.state.open_options}
                                                onClose={this.handleClose}
                                                MenuListProps={{
                                                  'aria-labelledby': 'basic-button',
                                                }}
                                              >
                                                {/*For some reason if the class server deployment didn't triggered automatic*/}
                                                {menuItem.vm_status === undefined &&
                                                  <Tooltip title={"Deploy the class server manually"}>
                                                    <span>
                                                      <MenuItem
                                                        onClick={() => Functions.createClassServerVM(menuItem.class_id, true, this.state.user)}>
                                                          <AddIcon fontSize="small"/>&nbsp;Deploy</MenuItem>
                                                    </span>
                                                  </Tooltip>
                                                }
                                                {menuItem.template_type !== 'stand_alone' &&
                                                  <Tooltip title={(menuItem.vm_status === 'offline' ||
                                                                  menuItem.vm_status === undefined) ?
                                                                  "Make sure the class server VM is in running state" :
                                                                  "Deploy the network template for this class"}>
                                                    <span>
                                                      <MenuItem
                                                        disabled={(menuItem.vm_status === 'offline' ||
                                                                  menuItem.vm_status === undefined) ||
                                                                  menuItem.template_type === 'stand_alone'}
                                                        onClick={() => this.deployTemplate(menuItem, false)}>
                                                          <AddIcon fontSize="small"/>&nbsp;Deploy</MenuItem>
                                                    </span>
                                                  </Tooltip>
                                                }
                                                {menuItem.vm_status === 'online' ?
                                                  <Tooltip title="Stop Class Server VM">
                                                    <MenuItem
                                                      disabled={menuItem.vm_status !== 'online' ||
                                                      (menuItem.vm_status === 'offline' && menuItem.guac_server_url === 'pending')}
                                                      onClick={() => this.stopClassServerVM(menuItem)}>
                                                        <StopIcon fontSize="small"/>&nbsp;Stop</MenuItem>
                                                  </Tooltip> :
                                                  <Tooltip title="Start Class Server VM">
                                                    <MenuItem
                                                      disabled={(menuItem.vm_status === 'offline' && menuItem.guac_server_url === 'pending')
                                                                || menuItem.vm_status === undefined}
                                                      onClick={() => this.startClassServerVM(menuItem)}>
                                                        <PlayArrowIcon fontSize="small"/>&nbsp;Start</MenuItem>
                                                  </Tooltip>
                                                }
                                                {(this.state.role !== 'customer_admin' &&
                                                  this.state.role!== 'admin') ? null :
                                                  <Tooltip title="Delete Class">
                                                    <MenuItem onClick={() => this.deleteDialog(menuItem)}>
                                                      <DeleteIcon/>&nbsp;Delete</MenuItem>
                                                  </Tooltip>
                                                }
                                              </Menu>
                                            </IconButton>
                                          }
                                        />
                                        <Link
                                          to={{
                                            pathname: `/admin/classes/class/${item.class_id.split('-')[1]}`,
                                            state: { fromDashboard: true },
                                          }}
                                          style={{textDecoration: 'none'}}
                                        >
                                          <CardActionArea style={{backgroundColor: 'transparent'}}>
                                            <CardMedia
                                              style={{height: 70}}
                                              image={item.class_banner === null ? require("../../../assets/images/empty-class.jpg").default :
                                                    s3BucketUrl + item.customer_id + "/" + 'classes' + "/" + item.class_id + "/" + item.class_banner}
                                              title={item.class_name}
                                              // image={item.class_banner}
                                            />
                                            <CardContent>
                                              <Typography variant="subtitle2" color="textPrimary" gutterBottom>
                                                Server State:{' '}
                                                <span className={item.vm_status === 'online' ? "badge badge-pill badge-success" :
                                                                 item.vm_status === 'offline' && item.guac_server_url === 'pending' ?
                                                                 "badge badge-pill badge-warning" : "badge badge-pill badge-danger"}>
                                                   {item.vm_status !== undefined ? item.vm_status === 'online' ? 'Running' :
                                                     item.vm_status === 'offline' && item.guac_server_url === 'pending' ?
                                                     'Creating...' : 'Stopped' : "Not available"}
                                                </span>
                                              </Typography>
                                              <Typography variant="subtitle2" color="textPrimary" gutterBottom>
                                                Educator(s):{" "}
                                                {item.class_educators &&
                                                  item.class_educators.map((educatorEmail, index) => {
                                                    const matchingInstructor = instructors && instructors.find(
                                                      (instructor) => instructor.email === educatorEmail
                                                    );

                                                    return (
                                                      <span key={index}>
                                                        {matchingInstructor ? (
                                                          <a href="#">
                                                            {matchingInstructor.name || matchingInstructor.email}
                                                          </a>
                                                        ) : (
                                                          educatorEmail
                                                        )}
                                                        {index < item.class_educators.length - 1 && ", "}
                                                      </span>
                                                    );
                                                  })}
                                              </Typography>
                                              {item.class_type !== 'online' ? null :
                                                <Typography variant="subtitle2" color="textPrimary" gutterBottom>
                                                  Dates: {moment(item.start_date).format('MMM DD, YYYY')}{' - '}
                                                    {moment(item.end_date).format('MMM DD, YYYY')}
                                                </Typography>
                                              }
                                            </CardContent>
                                          </CardActionArea>
                                        </Link>
                                      </Card>
                                    </Grid>
                                  );
                                 })}
                                 </> :
                                 <div className="dude_empty">
                                   <img src={empty_image} alt="omni"/>
                                   <span className="caption">
                                    You don't have any classes at this moment.<br/>
                                    {this.state.role !== 'student' ? <>
                                    Create your first class.{' '}
                                    <Tooltip title="Create a new class">
                                      <Link
                                        to={{
                                          pathname: `/admin/classes/class/${'create'}`,
                                        }}
                                        style={{textDecoration: 'none'}}
                                      >
                                        <a href="#">
                                          here
                                        </a>
                                      </Link>
                                    </Tooltip>
                                    </> :
                                    <a href="https://market.portal.omnifsi.com/" target="_blank">Enroll here</a>
                                   }
                                  </span>
                                 </div>
                               }
                              </Grid> :
                              <div style={{color:this.state.primary_color}} className="d-flex justify-content-center">
                                <Spinner  animation="border" role="status">
                                    <span className="sr-only">Loading...</span>
                                </Spinner>
                              </div>
                            }
                          </div>
                        </div>
                      </div>
                    {/*A dialog box to warn the user before a class is deleted*/}
                    <DeleteDialog dashboard="class"
                                  open={this.state.open}
                                  data={this.state.classDeleteData}
                                  close={this.handleCloseDialog}
                                  delete={this.deleteClass}/>
                    {/*A dialog box to warn the user before rebuilding the network*/}
                    <PolicyDialog dashboard="classnetwork"
                                  open={this.state.open_network}
                                  data={menuItem}
                                  create={this.deployTemplate}
                                  close={this.handleCloseDialog}
                                />

                    </div> : null
                  }
                </div>
              ) : (
                <>
                  <p>You do not have an active subscription. Please subscribe to continue using InvoClass.</p>
                  <Link
                    to={{
                      pathname: '/user/my-account',
                    }}
                    style={{textDecoration: 'none'}}
                  >
                  <button>Membership</button>
                  </Link>
                </>
              )}
            </ThemeProvider>
          </TelemetryProvider>
      )
    }
}

export default ClassroomManagement;
