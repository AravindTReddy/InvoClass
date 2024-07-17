import React, { useState, memo, useEffect } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from "@material-ui/core/DialogContent";
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@mui/material/Button';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import CachedIcon from '@material-ui/icons/Cached';
import CloseIcon from '@material-ui/icons/Close';
import moment from 'moment';
import {Spinner} from 'react-bootstrap';
import MaterialTable from 'material-table';
import Typography from '@material-ui/core/Typography';
import { Form } from 'react-bootstrap';
import { root, weekDays, videoConferenceInfo, reactAPIURL, url, socketUrl,
          generalTableOptions} from '../shared/General'
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import { StyleSheet, css } from 'aphrodite';
import Radio from '@material-ui/core/Radio';
import Utils from '../shared/Utils';
import Tooltip from '@material-ui/core/Tooltip';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import ReplayIcon from '@material-ui/icons/Replay';
import { Link, useParams, useHistory } from 'react-router-dom';
import uuid from 'react-uuid'
import CustomToast from '../shared/CustomToast.js'
import AddIcon from '@material-ui/icons/Add';
import Functions from './Developer/Functions';
import StepperWizard from './Developer/TemplateStepperWizard'
import { w3cwebsocket as W3CWebSocket } from "websocket";
import LaunchIcon from '@material-ui/icons/Launch';
import DeleteDialog from '../shared/DialogBox/DeleteDialog'
import FileUploadIcon from '@mui/icons-material/FileUpload';
import UploadPart from './UploadPart'
import IconButton from '@mui/material/IconButton';

var uniqid = require('uniqid');

const TemplateManagement = memo(function TemplateManagement() {

  const [primaryColor, setPrimaryColor] = useState('#F38A2C');
  const [refreshToken, setRefreshToken] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('#606060');
  const [user, setUser] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [role, setRole] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [defaultTab, setDefaultTab] = useState(1);
  const [environments, setEnvironments] = useState([]);
  const [images, setImages] = useState([]);
  const [classes, setClasses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [customerDetails, setCustomerDetails] = useState([]);
  const [loadedCustomerDetails, setLoadedCustomerDetails] = useState(false);
  const [addTemplate, setAddTemplate] = useState(false);
  const [uploadTemplate, setUploadTemplate] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadedTemplates, setLoadedTemplates] = useState(false);
  const [open, setOpen] = useState(false);
  const [templateDeleteData, setTemplateDeleteData] = useState('');
  const [maxVmCount, setMaxVmCount] = useState();
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    //read from localStorage here
    var appearanceObject = JSON.parse(localStorage.getItem('appearanceObject'));
    var userAuthDetails = JSON.parse(localStorage.getItem('userAuthDetails'));
    var userDetails = JSON.parse(localStorage.getItem('userDetails'));
    var notifications = JSON.parse(localStorage.getItem('notifications'));
    var userClasses = JSON.parse(localStorage.getItem('classes'));
    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    var customerDetails = JSON.parse(localStorage.getItem('customerDetails'));
    //set state here for the above
    userClasses !== null && setClasses(userClasses);
    notifications !== null && setNotifications(notifications);
    customerDetails !== null && setCustomerDetails(customerDetails);
    setLoadedCustomerDetails(true);
    userTemplates !== null && setTemplates(userTemplates);
    setLoadedTemplates(true);
    var subStatus = JSON.parse(localStorage.getItem('subscriptionStatus'));
    subStatus !== null && setSubscriptionStatus(subStatus);
    if(userDetails !== null){
      setCustomerId(userDetails.customer_id);
      setRole(userDetails.role);
      setUserLastName(userDetails.user_last_name);
      setUserFirstName(userDetails.user_first_name);
    }
    if(appearanceObject !== null){
      setPrimaryColor(appearanceObject.primary_color);
      setSecondaryColor(appearanceObject.secondary_color);
    }
    if(userAuthDetails !== null){
      setUser(userAuthDetails.user);
      setRefreshToken(userAuthDetails.refresh_token);
    }
    refreshToken && readTemplate();
    refreshToken && readCustomer();
  }, [refreshToken, user]);

  useEffect(() => {
    if(user){
      const client = new W3CWebSocket(socketUrl + '?email=' + user);
      client.onopen = () => {
          // console.log('WebSocket Client Connected');
      };
      client.onmessage = (message) => {
        toast.dismiss();
          Utils.addsuccessNotification(message.data);
          readTemplate();
      };
      // returned function will be called on component unmount
    }
  }, [user])

  /**
    * To get the details of customer
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @return {JSON}  response with a success and customer details
  */
  const readCustomer = () => {
    Utils.getCustomerDetails(refreshToken, customerId, role)
    .then(data => {
      setCustomerDetails(data);
      setLoadedCustomerDetails(true);
      //update the localStorage details array
      localStorage.setItem('customerDetails', JSON.stringify(data));
    })
    .catch(err => { throw err; });
  }

  const readTemplate = async () => {
    await setLoadedTemplates(false);
    Utils.getCustomerTemplates(refreshToken, user, customerId, role)
    .then(data => {
      setTemplates(data);
      setLoadedTemplates(true);
      //update the localStorage details array
      localStorage.setItem('templates', JSON.stringify(data));
    })
  }

  /**
    * To start the customer server VM on demand
    * @param  {Object} item VM details object
    * @return {JSON}  response with a success message
  */
  const startCustomerServerVM = async (item) => {
    const newObj = {
      'vm_name': item.customer_vm_name,
      'customer_id': item.customer_id
    }
    await Utils.startVM([newObj])
    .then(data => {
      if(data.message === 'success'){
        startTemplateVM(item);
        readCustomer();
        //here we update the customer details in localStorage
        const newArr = [...customerDetails]
        newArr.find(v => v.customer_id === item.customer_id).vm_status = 'online';
        setCustomerDetails(newArr);
        localStorage.setItem('customerDetails', JSON.stringify(newArr));
        //here we store the notification in localStorage
        const newArr1 = [...notifications]
        newArr1.push({
          created: Date.now(),
          message: "You have started the customer server " + item.customer_org_name,
          subject: "Server started",
          notification_type: 'start_vm_completed',
          read: false
        })
        localStorage.setItem('notifications', JSON.stringify(newArr1));
        setNotifications(newArr1);
      }
    })
    .catch(err => { throw err });
  };
  /**
    * To stop the customer server VM on demand
    * @param  {Object} item VM details object
    * @return {JSON}  response with a success message
  */
  const stopCustomerServerVM = async (item) => {
    const newObj = {
      'vm_name': item.vm_name,
      'customer_id': item.customer_id
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
        //here we update the customer details in localStorage
        const newArr = [...customerDetails]
        newArr.find(v => v.customer_id === item.customer_id).vm_status = 'offline';
        setCustomerDetails(newArr);
        localStorage.setItem('customerDetails', JSON.stringify(newArr));
        //here we store the notification in localStorage
        const newArr1 = [...notifications]
        newArr1.push({
          created: Date.now(),
          message: "You have stopped the customer server " + item.customer_org_name,
          subject: "Server stopped",
          notification_type: 'stop_vm_completed',
          read: false
        })
        localStorage.setItem('notifications', JSON.stringify(newArr1));
        setNotifications(newArr1);
      }
    })
    .catch(err => { throw err });
  };

  const addLabTemplate = () => {
    setAddTemplate(!addTemplate);
    setUploadTemplate(false);
  }

  const createTemplate = (item) => {
    Utils.addinfoNotification("Creating new template...")
    Functions.createTemplate(item, refreshToken, customerId, user, role)
    .then((data) => {
      toast.dismiss();
      if(data.message === "success" && data.statusCode === 200){
        Utils.addsuccessNotification("Successfully created/uploaded template.");
        setAddTemplate(false);
        setUploadTemplate(false);
        readTemplate();
        //here we store the notification in localStorage here
        const newArr = [...notifications]
        newArr.push({
          created: Date.now(),
          message: "You have created a new lab template " + item.template_name,
          subject: "New template created",
          notification_type: 'create_template_completed',
          read: false
        })
        localStorage.setItem('notifications', JSON.stringify(newArr));
        setNotifications(newArr);
        // socket && socket.emit("API_response", {data: 'Successfully created image from socket!'});
      }
    })
    .catch((error) => { throw error });
  }

  const deployTemplate = (item) => {
    //stand alone and network both deployment here
    Utils.addinfoNotification("Deploying VM(s) using the selected template...")
    Functions.deployTemplateVM(item, customerId, user)
    .then(data => {
        toast.dismiss();
        Utils.addsuccessNotification(data.message)
        readTemplate();
    })
    .catch(err => { throw err });
    //notification from socket that deployment started properly
    //wait for a couple of seconds and refresh to update the vm_status
    setTimeout(() => {
      readTemplate();
    }, 2000)
  }

  const launchTemplate = (item) => {
    if (item.lab_access_url === '' || item.lab_access_url === 'pending') {
        Utils.adderrorNotification('Please wait until the image VM is running and try again later!')
    } else {
        Utils.addinfoNotification("Launching template in a new tab...")
        Utils.getImageGuacToken(item, refreshToken, 'none')
        .then(async (data) => {
          toast.dismiss();
          await window.open('/admin/developer/template-lab?template_id='+item.template_id+'&&url='+data.split('/#/')[0]+'&&token='+data.split('?token=')[1]);
        })
        .catch(err => {
          toast.dismiss();
          // launchTemplate(item);
          throw err
        });
      }
  }

  const preStartTemplateVM = (item) => {
    if(customerDetails[0].vm_status !== 'online'){
      //WE START CUSTOMER SERVER
      item.customer_vm_name = customerDetails[0].vm_name
      startCustomerServerVM(item);
      startTemplateVM(item);
    }else {
      startTemplateVM(item);
    }
  }

  /**
  * To start the template lab VM on demand
  * @param  {Object} item VM details object
  * @return {JSON}  response with a success custom message
  */
  const startTemplateVM = (item) => {
    const newObj = {
      'vm_name': item.vm_name,
      'template_id': item.template_id
    }
    Utils.addinfoNotification(<CustomToast
      message = "Starting machine"
      type = "request"
    />)
    Utils.startVM([newObj])
    .then(data => {
      toast.dismiss();
      if(data.message === 'success'){
        // readImages();
        Utils.addsuccessNotification("Successfully started machine")
        //here we update the image details in localStorage
        const newArr = [...templates];
        newArr.find(temp => item.template_id === temp.template_id).vm_status = 'online';
        setTemplates(newArr);
        localStorage.setItem('templates', JSON.stringify(newArr));
        //here we store the notification in localStorage
        const newArr1 = [...notifications]
        newArr1.push({
          created: Date.now(),
          message: "You have started the template " + item.name,
          subject: "Template started",
          notification_type: 'start_vm_completed',
          read: false
        })
        localStorage.setItem('notifications', JSON.stringify(newArr1));
        setNotifications(newArr1);
      }
    })
    .catch(err => { throw err });
  }

  /**
  * To stop the image VM on demand
  * @param  {Object} item VM details object
  * @return {JSON}  response with a success custom message
  */
  const stopTemplateVM = (item) => {
    const newObj = {
      'vm_name': item.vm_name,
      'template_id': item.template_id
    }
    Utils.addinfoNotification(<CustomToast
      message = "Stopping machine"
      type = "request"
    />)
    Utils.stopVM([newObj])
    .then(data => {
      toast.dismiss();
      if(data.message === 'success'){
        // readImages();
        Utils.addsuccessNotification("Successfully stopped machine")
        //here we update the image details in localStorage
        const newArr = [...templates];
        newArr.find(temp => item.template_id === temp.template_id).vm_status = 'offline';
        setTemplates(newArr);
        localStorage.setItem('templates', JSON.stringify(newArr));
        //here we store the notification in localStorage
        const newArr1 = [...notifications]
        newArr1.push({
          created: Date.now(),
          message: "You have stopped the template " + item.name,
          subject: "Template stopped",
          notification_type: 'stop_vm_completed',
          read: false
        })
        localStorage.setItem('notifications', JSON.stringify(newArr1));
        setNotifications(newArr1);
      }
    })
    .catch(err => { throw err });
  };

  const deleteTemplate = (item) => {
    setOpen(false);
    Utils.addinfoNotification("Deleting template...")
    Functions.deleteTemplate(templateDeleteData, refreshToken, customerId)
    .then((data) => {
      toast.dismiss();
      if(data.message === "success" && data.statusCode === 200){
        Utils.addsuccessNotification("Successfully deleted template.")
        //here we update the images in localStorage
        const newArr = [...templates]
        const index = newArr.findIndex(template => template.template_id === item.template_id);
        if (index > -1) {
          newArr.splice(index, 1);
          setTemplates(newArr)
          localStorage.setItem('templates', JSON.stringify(newArr));
        }
        //here we store the notification in localStorage
        const newArr1 = [...notifications]
        newArr1.push({
          created: Date.now(),
          message: "You have deleted a template " + item.name,
          subject: "Template deleted",
          notification_type: 'delete_template_completed',
          read: false
        })
        localStorage.setItem('notifications', JSON.stringify(newArr1));
        setNotifications(newArr1);
      }
    })
    .catch((error) => { throw error });
  }

  const restartTemplateVM = (item) => {
    // fetch(backendAPIURL + 'deploy_class_env', {
    fetch('http://areddy-cloud9.omnifsi.com:5000/restart_vm', {
      method: 'post',
      headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
      },
      body: JSON.stringify({
          'secret_password': 'restart_vm_im@G&^!fr',
          'stg': 'dev',
          'user': user,
          'vm_name_param': item.vm_name,
          'template_id': item.template_id
      })
    })
    .then((response) => response.json())
    .then(responseJson => {
      // console.log(responseJson);
      toast.dismiss();
      if (responseJson) {
          Utils.addinfoNotification(responseJson.message);
      } else {
          Utils.adderrorNotification('Error creating the class environment VM: ' + responseJson.errorMessage)
      }
    })
    .catch((error) => {
      toast.dismiss();
      Utils.addsuccessNotification('Hang tight, the class environment will be up soon!')
      // Utils.adderrorNotification('Error creating the class server VM: ' + error)
    });
  }

  const deleteDialog = async(item) => {
    setOpen(true);
    setTemplateDeleteData(item);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  const uploadLabTemplate = () => {
    // window.open("/admin/upload-image", "", "resizable=0,width=500,height=460");
    setUploadTemplate(!uploadTemplate);
    setAddTemplate(false);
  }

  const truncateDescription = (text, limit) => {
    if (text.length <= limit) {
      return text;
    }
    return text.slice(0, limit) + '...';
  };


  const styles = StyleSheet.create({
    cardheader: {
      // backgroundColor: 'white',
      color: primaryColor,
    },
    button: {
      ':hover': {
          color: secondaryColor,
      }
    }
  });

  return (
    <>
      {subscriptionStatus == 'trialing' || subscriptionStatus === 'active' || subscriptionStatus === null ? (
        <div className="row">
        {role === "admin" || role === "customer_admin" || role === "biz_customer_admin" ?
          <div className="col-lg-12 grid-margin">
            <div className="card">
              <div className= {`${ 'card-header d-flex justify-content-between align-items-center' } ${ css(styles.cardheader) }`}>
                <div>Lab Template Management</div>
                <div>
                  {templates.length <= 0 ?
                    <span className="rightArrowImageText">Create your first template</span> :
                    <span className="rightArrowImageText">Create a new template</span>
                  }
                  <img src={require(`../../../assets/images/right-arrow.png`).default}
                       alt="rightarrow" className="rightArrowImage"/>
                  <Tooltip title={templates.length >= 5 ? "Only 5 custom templates are allowed" :
                                  "Create a new template" }>
                    <span>
                    <IconButton
                      disabled={templates.length >= 5}
                      size="small"
                      onClick={() => addLabTemplate()}>
                        <AddIcon/>
                    </IconButton>
                    </span>
                  </Tooltip>{' '}
                  <Tooltip title="Upload your Custom Stock Image here">
                    <IconButton
                      // disabled={!(customerDetails.length === 1 && customerDetails[0].customer_plan.conversion)}
                      size="small"
                      onClick={() => uploadLabTemplate()}>
                        <FileUploadIcon/>
                    </IconButton>
                  </Tooltip>{' '}
                  <Tooltip title="refresh template data">
                    <IconButton
                      size="small"
                      onClick={() => readTemplate()}>
                        <CachedIcon/>
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                {addTemplate ?
                  <p className="card-text">
                   A lab template is the starting point for the classes you create.
                   A template contains one or more virtual computers to be used by you and your
                   learners.  These virtual computers can individually be configured and snapshotted
                   prior to being used in your classes
                  </p> : templates && templates.length > 0 ?
                  <p className="card-text">
                    You can configure and snapshot your Lab Templates by selecting the Lab Template Name below
                  </p> : null
                }
                {addTemplate ?
                  <StepperWizard
                     create={createTemplate}
                     close={addLabTemplate}
                  /> : uploadTemplate ?
                  <UploadPart
                     create={createTemplate}
                     close={uploadLabTemplate}
                  /> :
                  <MaterialTable
                      localization={{ body:{ emptyDataSourceMessage:
                        <>
                          {loadedTemplates ? 'No Templates to manage yet' :
                            <div style={{color:primaryColor}} className="d-flex justify-content-center">
                              <Spinner  animation="border" role="status">
                                  <span className="sr-only">Loading...</span>
                              </Spinner>
                            </div>
                           }
                        </>
                      }
                      }}
                      columns={[
                        {title: 'Lab Template Name', field: 'name',
                          render: rowData => {
                            return(
                              <Link
                                to={{
                                  pathname: `/admin/templates/${rowData.template_id.split('-')[1]}`,
                                  state: { customer: customerDetails }
                                }}
                                style={{textDecoration: 'none'}}
                              >
                                {rowData.name}
                              </Link>
                            )
                          }
                        },
                        {title: 'Description', field: 'description',
                          render: rowData => {
                            return(
                              <div style={{ whiteSpace: 'normal' }}>
                                <i style={{ fontSize: '10px' }}>{truncateDescription(rowData.description, 100)}</i>
                              </div>
                            )
                          }
                        },
                        {title: 'Lab Template Type', field: 'type',
                          render: rowData => {
                            return(
                              rowData.type === 'network' ? 'Network' : 'Stand alone'
                            )
                          }
                        },
                        {
                          field: 'state', title: 'State',
                          render: rowData => {
                              return (
                                <Tooltip title={rowData.converted === false ?
                                  `You have uploaded your custom template and it is in the process of being converted to an deployable image.
                                  We will let you know once the template is ready to be deployed.` : 'VM state'
                                }>
                                  <span className={rowData.vm_status === 'online' ? "badge badge-pill badge-success" :
                                                   (rowData.vm_status === 'offline' && rowData.lab_access_url === 'pending')
                                                   || rowData.vm_status === 'capturing' ?
                                                   "badge badge-pill badge-warning" : "badge badge-pill badge-danger"}>
                                    {rowData.vm_status !== undefined ? rowData.vm_status === 'online' ? 'Running' :
                                      rowData.vm_status === 'offline' && rowData.lab_access_url === 'pending' ?
                                      'Creating...' : rowData.vm_status === 'capturing' ? 'Capturing...' :
                                      rowData.vm_status === 'captured' ? 'Captured' : 'Stopped' :
                                      rowData.converted === false ? "Conversion in process" : "Not available"}
                                  </span>
                                </Tooltip>
                              )
                          }
                        },
                        {
                            title: 'Created',
                            field: 'created_ts',
                            editable: 'never',
                            render: rowData => {
                                const c_date = moment(rowData.created_ts * 1000).format('MMM-DD-YYYY HH:mm a');
                                return c_date
                            }
                        },
                        {
                            title: 'Last Updated',
                            field: 'updated_ts',
                            editable: 'never',
                            render: rowData => {
                                const u_date = moment(rowData.updated_ts * 1000).format('MMM-DD-YYYY HH:mm a');
                                return u_date
                            }
                        },
                      ]}
                      data={templates}
                      options={generalTableOptions}
                      actions={[
                        rowData => ({
                          icon: () => rowData.vm_status!== undefined && rowData.vm_status === 'online' ?
                            <LaunchIcon fontSize='medium'/> :
                            rowData.vm_status === undefined || rowData.vm_status === 'captured' ?
                            <AddIcon fontSize='medium'/> : <AddIcon fontSize='medium'/>,
                          tooltip: rowData.vm_status!== undefined && rowData.vm_status === 'online' ?
                            'Launch Template' : rowData.vm_status === undefined || rowData.vm_status === 'captured' ? 'Deploy' : null,
                          onClick: (event, rowData) => rowData.vm_status!== undefined && rowData.vm_status === 'online' ?
                            launchTemplate(rowData) : rowData.vm_status === 'pending' ? null : deployTemplate(rowData),
                          position: 'row',
                          disabled: rowData.vm_status === 'offline' || rowData.vm_status === 'pending' || rowData.vm_status === 'capturing'
                                    || rowData.converted === false
                      }),
                        rowData => ({
                          icon: () => rowData.vm_status!== undefined && rowData.vm_status === 'online' ?
                            <StopIcon fontSize='medium'/> : <PlayArrowIcon fontSize='medium'/>,
                          tooltip: rowData.vm_status!== undefined && rowData.vm_status === 'online' ?
                            'Stop Template' : 'Start Template',
                          onClick: (event, rowData) => rowData.vm_status!== undefined && rowData.vm_status === 'online' ?
                            stopTemplateVM(rowData) : preStartTemplateVM(rowData),
                          position: 'row',
                          disabled: rowData.vm_status === undefined || rowData.lab_access_url === 'pending' ||
                                    rowData.vm_status === 'capturing' || rowData.vm_status === 'captured' ||
                                    rowData.type === 'network' || rowData.converted === false
                        }),
                        rowData => ({
                            icon: 'delete',
                            tooltip: 'Delete Template',
                            onClick: (event, rowData) => deleteDialog(rowData)
                        })
                      ]}
                  />
                }
              </div>
            </div>
          </div> : "Access Denied" }
          {/*A dialog box to warn the user before a image is deleted*/}
            <DeleteDialog
              dashboard="template"
              open={open}
              data={templateDeleteData}
              close={handleCloseDialog}
              delete={deleteTemplate}
            />
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
    </>
  );
});
export default TemplateManagement;
