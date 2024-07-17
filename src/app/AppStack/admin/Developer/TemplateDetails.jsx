import React, { useState, memo, useEffect } from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from "@material-ui/core/DialogContent";
import TextField from '@material-ui/core/TextField';
import Slide from "@material-ui/core/Slide";
import Button from '@mui/material/Button';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';
import moment from 'moment';
import { StyleSheet, css } from 'aphrodite';
import Typography from '@material-ui/core/Typography';
import {Spinner, Form, Table } from 'react-bootstrap';
import { stockImage, url, socketUrl } from '../../shared/General'
import Card from '@material-ui/core/Card';
import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import Radio from '@material-ui/core/Radio';
import MaterialTable from 'material-table';
import Utils from '../../shared/Utils';
import Functions from './Functions';
import {toast} from 'react-toastify';
import SchedulerDialog from '../../shared/DialogBox/SchedulerDialog'
import { useLocation } from "react-router";
import { Link, useParams, useHistory } from 'react-router-dom';
import CachedIcon from '@material-ui/icons/Cached';
import DeleteIcon from '@material-ui/icons/Delete';
import Tooltip from '@material-ui/core/Tooltip';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import AddIcon from '@material-ui/icons/Add';
import LaunchIcon from '@material-ui/icons/Launch';
import SaveIcon from '@material-ui/icons/Save';
import BuildIcon from '@material-ui/icons/Build';
import CustomToast from '../../shared/CustomToast.js'
import DeleteDialog from '../../shared/DialogBox/DeleteDialog'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import EditorDialog from './TemplateEditor'

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const TemplateDetails = memo(function TemplateDetails(props) {
  let { id } = useParams();
  const history = useHistory();
  id = "template-" + id;
  // let props = useLocation();
  var userTemplates = JSON.parse(localStorage.getItem('templates') || "[]");
  var tmp;
  userTemplates.forEach((template) => {
    if(template.template_id === id)
      tmp = {...template}
  })

  if(tmp === undefined)
    // navigate('/admin/templates/', {replace: true});
    window.location.href = url + '/admin/templates/';
  const [templateSel, setTemplateSel] = useState(tmp);
  const [templateNsg, setTemplateNsg] = useState(tmp.nsg);
  const [templateType, setTemplateType] = useState(tmp.type);
  const [templateName, setTemplateName] = useState(tmp.name);
  const [vnetAddressRange, setVnetAddressRange] = useState(tmp.vnet_address_range)
  const [templateNetwork, setTemplateNetwork] = useState(tmp.network);

  const [templateResourceId] = useState(tmp.resource_id)
  const [templateDescription, setTemplateDescription] = useState(tmp.description);
  const [templateId, setTemplateId] = useState(id);
  const [templateVersion, setTemplateVersion] = useState(tmp.version);
  const [buildHistory, setBuildHistory] = useState(tmp.build_history.length === 0 ?
                                    tmp.build_history : tmp.build_history.sort())
  const [versionHistory, setVersionHistory] = useState(tmp.version_history);
  const [primaryColor, setPrimaryColor] = useState('#F38A2C');
  const [refreshToken, setRefreshToken] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('#606060');
  const [user, setUser] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [role, setRole] = useState('');
  const [templateBuild, setTemplateBuild] = useState(false);
  const [templateBuildEditData, setTemplateBuildEditData] = useState('');

  const [templateBuildData, setTemplateBuildData] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [customerDetails] = useState(props.history.location.state !== undefined &&
         props.history.location.state.customer);
  const [open, setOpen] = useState(false);
  const [templateDeleteData, setTemplateDeleteData] = useState('');
  const [viewTemplateBuild, setViewTemplateBuild] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    //this is like our componentDidMount
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    readTemplate();
    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    var notifications = JSON.parse(localStorage.getItem('notifications'));
    if(appearanceObject !== null && userAuthDetails !== null && userDetails !== null){
      setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
      setPrimaryColor(JSON.parse(appearanceObject).primary_color);
      setSecondaryColor(JSON.parse(appearanceObject).secondary_color);
      setUser(JSON.parse(userAuthDetails).user);
      setCustomerId(JSON.parse(userDetails).customer_id);
      setRole(JSON.parse(userDetails).role)
    }
    notifications!== null && setNotifications(notifications);
    userTemplates !== null && setTemplates(userTemplates);
    var subStatus = JSON.parse(localStorage.getItem('subscriptionStatus'));
    subStatus !== null && setSubscriptionStatus(subStatus);
  }, [refreshToken, user]);

  useEffect(() => {
    if(user){
      const client = new W3CWebSocket(socketUrl +'?email=' + user);
      client.onopen = () => {
          // console.log('WebSocket Client Connected');
      };
      client.onmessage = (message) => {
          toast.dismiss();
          Utils.addsuccessNotification(message.data);
          readTemplate();
      };
    }
  }, [user])

  const readTemplate = async () => {
    Utils.getCustomerTemplates(refreshToken, user, customerId, role)
    .then(data => {
      setTemplates(data);
      //update the localStorage details array
      localStorage.setItem('templates', JSON.stringify(data));
    })
  }

  const osPort = templateNsg && templateNsg.split("/")[8]
  if(osPort === 'centOS-nsg')
    var template_os = 'Linux'
  else template_os = 'Windows'
  const version_history = (versionHistory.concat({
    version: templateSel.version,
    resource_id: templateSel.resource_id,
    description: templateSel.description
  })).reverse()

  const updateTemplate = (e) => {
    e.preventDefault();
    var newItem = {
      name : templateName,
      template_id : templateId,
      template_description : templateDescription,
      network: templateNetwork,
      type: templateType,
      version_history: versionHistory,
      version: templateVersion
    };
    Utils.addinfoNotification("Updating template...")
    Functions.updateTemplate(newItem, refreshToken, customerId, user)
    .then((data) => {
      toast.dismiss();
      if(data.message === "success" && data.statusCode === 200){
        Utils.addsuccessNotification("Successfully updated template.")
        //here we update the images in localStorage
        let newArr = [...templates];
        newArr = newArr.map((template) => {
          var res = { ...template}
          if(template.template_id === templateId){
            template.name = templateName
            template.description = templateDescription
            template.network = templateNetwork
            res = { ...template}
          }
          return res
        })
        localStorage.setItem('templates', JSON.stringify(newArr));
        //here we store the notification in localStorage
        const newArr1 = [...notifications]
        newArr1.push({
          created: Date.now(),
          message: "You have updated the template " + templateName,
          subject: "Template updated",
          notification_type: 'update_template_completed',
          read: false
        })
        localStorage.setItem('notifications', JSON.stringify(newArr1));
        setNotifications(newArr1);
      }
    })
    .catch((error) => { throw error });
  }

  const deployTemplate = (item) => {
    //stand alone and network both deployment here
    Utils.addinfoNotification("Deploying a VM using the selected template...")
    Functions.deployTemplateVM(item, customerId, user)
    .then(data => {
      toast.dismiss();
      Utils.addsuccessNotification(data.message)
    })
    .catch(err => { throw err });
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
        .catch(err => { throw err });
      }
  }

  const launchMachine = (item) => {
    Utils.addinfoNotification('Launching machine in a new tab..');
    Utils.getImageGuacToken(item, refreshToken, 'network')
    .then(data => {
      toast.dismiss();
      window.open(data, "_blank")
    })
    .catch(err => {
      // console.log(err);
      Utils.adderrorNotification('Error launching the machine, Please try launching again.');
    });
  }

  const deployMachine = (item) => {
    console.log('coming soon');
  }

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
        //here we go back to the templates.
        window.location.href = url + '/admin/templates/';
        // history.push('/admin/templates');
      }
    })
    .catch((error) => { throw error });
  }

  const deleteDialog = (item) => {
    setOpen(true);
    setTemplateDeleteData(item);
  }

  const handleCloseDialog = () => {
    setOpen(false);
    setTemplateBuild(false);
    setTemplateBuildData('');
    setViewTemplateBuild(false);
    setShowEditor(false);
    //reload somehow
  };

  const useNetwork = (item) => {
    setTemplateNetwork(item.network)
  }

  const updateNetwork = (item) => {
    const newItems = item.map((itm) => {
      return({
        machines: itm.droppedItems,
        subnet_type: itm.subnet_type,
        subnet_name: itm.name,
        subnet_id: itm.id
      })
    })
    setTemplateNetwork(newItems)
  }


  /**
  * To start the template lab VM on demand
  * @param  {Object} item VM details object
  * @return {JSON}  response with a success custom message
  */
  const startTemplateVM = (item, type) => {
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
        if(type === 'network'){
          //here we handle template with network machines
          newArr.find(temp => item.template_id === temp.template_id).network.map((subnet) => {
            subnet.machines.map((machine) => {
              if(machine.vm_name === item.vm_name){
                machine.vm_status = 'online'
              }
            })
          })
        }else {
          newArr.find(temp => item.template_id === temp.template_id).vm_status = 'online';
        }
        setTemplates(newArr);
        localStorage.setItem('templates', JSON.stringify(newArr));
      }
    })
    .catch(err => { throw err });
  };

  /**
  * To stop the image VM on demand
  * @param  {Object} item VM details object
  * @return {JSON}  response with a success custom message
  */
  const stopTemplateVM = (item, type) => {
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
        if(type === 'network'){
          //here we handle template with network machines
          newArr.find(temp => item.template_id === temp.template_id).network.map((subnet) => {
            subnet.machines.map((machine) => {
              if(machine.vm_name === item.vm_name){
                machine.vm_status = 'offline'
              }
            })
          })
        }else {
          newArr.find(temp => item.template_id === temp.template_id).vm_status = 'offline';
        }
        setTemplates(newArr);
        localStorage.setItem('templates', JSON.stringify(newArr));
      }
    })
    .catch(err => { throw err });
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
      {subscriptionStatus === 'trialing' || subscriptionStatus === 'active' || subscriptionStatus === null ? (
        <div className="d-flex justify-content-center">
          {role === "admin" || role === "customer_admin" || role === "biz_customer_admin" ?
          <div className="col-lg-12 grid-margin">
            <div className="card">
              <div className= {`${ 'card-header d-flex justify-content-between align-items-center' } ${ css(styles.cardheader) }`}>
                <div>
                  <Link to="/admin/templates/">&larr; Back</Link>
                </div>
                <div>
                <Tooltip title={templateSel.vm_status!== undefined && templateSel.vm_status === 'online' ?
                  'Launch Template' : customerDetails[0].vm_status !== 'online' ? "Before you deploy, Make sure the customer server is in running state" :
                  templateSel.vm_status === undefined || templateSel.vm_status === 'captured' ? 'Deploy' : 'Deploy'}>
                  <span>
                    <IconButton disabled = {customerDetails[0].vm_status !== 'online' ||
                       templateSel.vm_status === 'offline' || templateSel.vm_status === 'pending' || templateSel.converted === false}
                        onClick={(evt) => templateSel.vm_status!== undefined &&
                        templateSel.vm_status === 'online' ? launchTemplate(templateSel) : templateSel.vm_status === 'pending'
                        ? null : deployTemplate(templateSel)} size='small'>
                      {templateSel.vm_status!== undefined && templateSel.vm_status === 'online' ?
                        <LaunchIcon fontSize='small'/> :
                        templateSel.vm_status === undefined || templateSel.vm_status === 'captured' ?
                        <AddIcon fontSize='small'/> : <AddIcon fontSize='small'/>
                      }
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title={templateSel.vm_status!== undefined && templateSel.vm_status === 'online' ?
                                'Stop Template' : 'Start Template'}>
                  <span>
                    <IconButton size='small' disabled= { templateSel.vm_status === undefined || templateSel.lab_access_url === 'pending' ||
                                            templateSel.vm_status === 'capturing' || templateSel.vm_status === 'captured' ||
                                            templateSel.type === 'network' || templateSel.converted === false}
                               onClick={(evt) => templateSel.vm_status!== undefined &&
                                templateSel.vm_status === 'online' ? stopTemplateVM(templateSel, 'none') : startTemplateVM(templateSel, 'none')}>
                      {templateSel.vm_status!== undefined && templateSel.vm_status === 'online' ?
                        <StopIcon fontSize='small'/> : <PlayArrowIcon fontSize='medium'/>
                      }
                    </IconButton>
                  </span>
                </Tooltip>
                {/*<Tooltip title="Rebuild lab template">
                <IconButton
                  disabled= {templateSel.type === 'network'}
                  onClick={() => reBuildDialog(templateSel)}>
                    <BuildIcon fontSize='medium'/>
                </IconButton>
                </Tooltip>*/}
                <Tooltip title="Delete Template">
                <IconButton size='small' onClick={() => deleteDialog(templateSel)}>
                    <DeleteIcon fontSize='small'/>
                </IconButton>
                </Tooltip>
                </div>

              </div>
            </div>
            <div className="card">
            <div className="card-body">
              <p className="card-description">All fields marked with * are required</p>
                <form onSubmit={updateTemplate}>
                    <div className="row">
                        <div className="col-md-4">
                            <Form.Group className="row">
                                <div className="col-sm-12">
                                  <TextField
                                    fullWidth
                                    size="small"
                                    variant="outlined"
                                    label="Lab Template name"
                                    value={templateName}
                                    type='text'
                                    required
                                    onChange={evt => setTemplateName(evt.target.value.trim())}
                                    helperText='No spaces are allowed in the name.'
                                  />
                                </div>
                            </Form.Group>
                        </div>
                        <div className="col-md-4">
                            <Form.Group className="row">
                                <div className="col-sm-12">
                                <TextField
                                  fullWidth
                                  size="small"
                                  variant="outlined"
                                  label="Description"
                                  value={templateDescription}
                                  minRows={5}
                                  InputLabelProps={{ shrink: true }}
                                  onChange={evt => setTemplateDescription(evt.target.value)}
                                  multiline
                                />
                                </div>
                            </Form.Group>
                        </div>
                        {templateType !== 'network' && (
                          <div className="col-md-4">
                              <Form.Group className="row">
                                  <div className="col-sm-12">
                                    <TextField
                                      disabled
                                      fullWidth
                                      size="small"
                                      variant="outlined"
                                      label="Base Image OS"
                                      value={template_os}
                                      InputLabelProps={{ shrink: true }}
                                    />
                                </div>
                              </Form.Group>
                          </div>
                        )}
                      </div>
                      <Button variant="contained"
                              type="submit"
                              color="primary"
                              size="small"
                      >
                        UPDATE
                      </Button>
                  </form>
                  <br/>
                  {templateType !== 'network' ? (<>
                    <p style={{fontSize: '14px'}}className="card-description">Template Version History</p>
                    <div className="row">
                      <div className="col-md-12">
                        <Form.Group className="row">
                          <div className="col-sm-12">
                            <MaterialTable
                              title="Lab Template Version History"
                                localization={{ body:{ emptyDataSourceMessage:
                                  <>
                                    {version_history.length <= 0 ? 'No records to display' :
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
                                  {title: 'Image ID', field: 'resource_id',
                                    render: rowData => {
                                        return rowData.resource_id.split("/")[8]
                                    }
                                  },
                                  {title: 'Version', field: 'version',
                                    render: rowData => {
                                        return (rowData.version)
                                    }
                                  },
                                  {title: 'Description', field: 'description',
                                    render: rowData => {
                                      return (rowData.description === '' || rowData.description === undefined
                                              ? 'Not Available': rowData.description);
                                    }
                                  },
                                ]}
                                data={version_history}
                                options={{
                                  headerStyle: {
                                      backgroundColor: secondaryColor,
                                      color: '#FFF',
                                  },
                                  paging: false,
                                  padding: "dense",
                                  toolbar: false,
                                }}
                            />
                          </div>
                        </Form.Group>
                      </div>
                </div></>
              ) :
                <>
                <p style={{fontSize: '14px'}}className="card-description">Template network overview</p>
                <Button size="small"
                  onClick = {() => setShowEditor(!showEditor)}
                >
                    <LaunchIcon/>Editor</Button>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  Vnet address range: {vnetAddressRange} </Typography>
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Subnet name</th>
                      <th>Subnet type</th>
                      <th>Subnet address range</th>
                      <th>No of machines</th>
                      <th>Machine names</th>
                    </tr>
                  </thead>
                  <tbody>
                  {templateNetwork.map((item, index) => {
                      return(
                          <tr key={index}>
                            <td>{item.subnet_name.replace(/_/g, ' ')}</td>
                            <td>{item.subnet_type}</td>
                            <td>{item.subnet_address_range}</td>
                            <td>{item.machines.length}</td>
                            <td>{item.machines.map((machine, i) => {
                              return(
                                <div key={i}>
                                  <li style={{color: machine.vm_status === 'online' ? 'green' : 'red'}}>
                                    {machine.name === undefined ? machine.image_name : machine.name}
                                    {' '}(v{machine.version})
                                    {/*{machine.description}*/}
                                    <Tooltip title={machine.vm_status!== undefined && machine.vm_status === 'online' ?
                                      'Launch Machine' : customerDetails[0].vm_status !== 'online' ? "Before you deploy, Make sure the customer server is in running state" :
                                      machine.vm_status !== undefined && machine.vm_status === 'offline' ? 'Machine is not in running state' : 'N/A'}>
                                      <span>
                                        <IconButton disabled = {customerDetails[0].vm_status !== 'online' ||
                                           machine.vm_status === undefined || machine.vm_status === 'offline' || machine.vm_status === 'pending'}
                                            onClick={(evt) => machine.vm_status!== undefined &&
                                            machine.vm_status === 'online' ? launchMachine(machine) : machine.vm_status === 'pending'
                                            ? null : deployMachine(machine)} size='small'>
                                          {machine.vm_status!== undefined && machine.vm_status === 'online' ?
                                            <LaunchIcon fontSize='small'/> : <LaunchIcon fontSize='small'/>
                                          }
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                    <Tooltip title={machine.vm_status!== undefined && machine.vm_status === 'online' ?
                                                    'Stop Machine' : 'Start Machine'}>
                                      <span>
                                        <IconButton size='small' disabled= { machine.vm_status === undefined || machine.connection_url === 'pending' ||
                                                                 templateSel.converted === false}
                                                   onClick={(evt) => machine.vm_status!== undefined &&
                                                    machine.vm_status === 'online' ? stopTemplateVM(machine, 'network') : startTemplateVM(machine, 'network')}>
                                          {machine.vm_status!== undefined && machine.vm_status === 'online' ?
                                            <StopIcon fontSize='small'/> : <PlayArrowIcon fontSize='medium'/>
                                          }
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  </li>

                                </div>
                              )
                            })}</td>
                          </tr>
                      )
                    })
                  }
                  </tbody>
                </Table><br/>
                <p style={{fontSize: '14px'}}className="card-description">Template Version History</p>
                <div className="row">
                  <div className="col-md-12">
                    <Form.Group className="row">
                      <div className="col-sm-12">
                        <MaterialTable
                            localization={{ body:{ emptyDataSourceMessage:
                              <>
                                {version_history.length <= 0 ? 'No records to display' :
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
                              {title: 'Version', field: 'version',
                                render: rowData => {
                                    return (rowData.version)
                                }
                              },
                              {title: 'Description', field: 'description',
                                render: rowData => {
                                  return (rowData.description === '' || rowData.description === undefined
                                          ? 'Not Available': rowData.description);
                                }
                              },
                            ]}
                            data={version_history}
                            options={{
                              headerStyle: {
                                  backgroundColor: secondaryColor,
                                  color: '#FFF',
                              },
                              paging: false,
                              padding: "dense",
                              toolbar: false,
                            }}
                        />
                      </div>
                    </Form.Group>
                  </div>
                </div>
                </>
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
            {/*A pop up with drag and drop interface to create new network template*/}
            {showEditor && (
              <EditorDialog
                type="template_view"
                address={vnetAddressRange}
                name={templateName}
                data={templateSel}
                fullScreen
                create={useNetwork}
                update={updateNetwork}
                open={showEditor}
                close={handleCloseDialog}
              />
            )}
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
export default TemplateDetails;
