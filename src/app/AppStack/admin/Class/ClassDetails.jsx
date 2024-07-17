import React, { useState, memo, useEffect } from 'react';
import { socketUrl, backendAPIURL, url, enrollURL } from '../../shared/General'
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Utils from '../../shared/Utils';
import Builds from './Builds'
import Functions from './Functions'
import { Link, useParams, useHistory } from 'react-router-dom';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import AddIcon from '@material-ui/icons/Add';
import EditorDialog from '../Developer/TemplateEditor'
import DeleteDialog from '../../shared/DialogBox/DeleteDialog'
import PolicyDialog from '../../shared/DialogBox/PolicyDialog'
import RatingDialog from '../../shared/Rating/RatingDialog'
import SchedulerDialog from '../../shared/DialogBox/SchedulerDialog'
import BuildIcon from '@material-ui/icons/Build';
import DeleteIcon from '@material-ui/icons/Delete';
import StopIcon from '@material-ui/icons/Stop';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StepperWizard from './ClassStepperWizard'
import CopyLinkToClipboard from '../../shared/copyLinkToClipboard';
import SparkMD5 from 'spark-md5';
import StarIcon from '@mui/icons-material/Star';
import {Typography, Button, Tooltip, Checkbox, FormControlLabel, Box,
      Dialog, DialogTitle, DialogActions, DialogContent, DialogContentText,
      IconButton} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import LayersIcon from '@mui/icons-material/Layers';

// Utility function to get query parameters from URL
const getQueryParams = (queryString) => {
  const params = new URLSearchParams(queryString);
  let queryParams = {};
  for (let [key, value] of params.entries()) {
    queryParams[key] = value;
  }
  return queryParams;
};

const ClassDetails = memo(function ClassDetails() {

  let { id } = useParams();
  var tmp, selectedTemp;
  if(id === 'create'){
    id = id
    tmp = {}
    selectedTemp= {}
  }else {
    id = "class-" + id;
    var userClasses = JSON.parse(localStorage.getItem('classes') || "[]");
    userClasses.forEach((cls) => {
      if(cls.class_id === id)
        tmp = {...cls}
    })
    if(tmp === undefined)
      window.location.href = url + '/admin/classes/';
    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    userTemplates!== null && userTemplates.forEach((item, i) => {
      if(tmp.template.id === item.template_id)
        selectedTemp = {...item}
    });
  }

  const history = useHistory();
  if(tmp === undefined)
    window.location.href = url + '/admin/classes/';
    // history.push('/admin/developer/');

  const [classSel, setClassSel] = useState(tmp);
  const [templateSel, setTemplateSel] = useState(selectedTemp);
  // const [className, setClassName] = useState(tmp.class_name);
  const [classId, setClassId] = useState(id);
  const [instructors, setInstructors] = useState([]);
  const [primaryColor, setPrimaryColor] = useState('#F38A2C');
  const [refreshToken, setRefreshToken] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('#606060');
  const [user, setUser] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [role, setRole] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [checkedType, setCheckedType] = useState('');
  const [classes, setClasses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState(id === 'create' ? '' : tmp.template.id);
  const [showEditor, setShowEditor] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [open, setOpen] = useState(false);
  const [classDeleteData, setClassDeleteData] = useState('');
  const [openNetwork, setOpenNetwork] = useState(false);
  const [templateBuild, setTemplateBuild] = useState(false);
  const [buildHistory, setBuildHistory] = useState([]);
  const [openRating, setOpenRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [code] = useState(SparkMD5.hash('student-class-invite'));
  const [activeStep, setActiveStep] = useState(JSON.parse(localStorage.getItem('stepValue') || 0 ));
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(true);

  useEffect(() => {
    //read from localStorage here
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    refreshToken && readClass();
    var userInstructors = JSON.parse(localStorage.getItem('instructors'));
    var userClasses = JSON.parse(localStorage.getItem('classes'));
    var notifications = JSON.parse(localStorage.getItem('notifications'));
    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    //set state here for the above
    userInstructors !== null && setInstructors(userInstructors);
    userClasses !== null && setClasses(userClasses);
    notifications !== null && setNotifications(notifications);
    userTemplates !== null && setTemplates(userTemplates);
    var subStatus = JSON.parse(localStorage.getItem('subscriptionStatus'));
    subStatus !== null && setSubscriptionStatus(subStatus);
    if(userDetails !== null){
      setCustomerId(JSON.parse(userDetails).customer_id);
      setRole(JSON.parse(userDetails).role);
      setUserLastName(JSON.parse(userDetails).user_last_name);
      setUserFirstName(JSON.parse(userDetails).user_first_name);
    }
    if(appearanceObject !== null){
      setPrimaryColor(JSON.parse(appearanceObject).primary_color);
      setSecondaryColor(JSON.parse(appearanceObject).secondary_color);
    }
    if(userAuthDetails !== null){
      setUser(JSON.parse(userAuthDetails).user);
      setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
    }
    if(id !== 'create'){ //this is when user clicks on an existing class to view
      if(classSel){
        if(classSel.template_type === 'network'){
          setCheckedType('network')
        }else
          setCheckedType('stand_alone');
        setTemplateId(classSel.template_id);
      }
      setBuildHistory(classSel.class_builds.length === 0 ?
                          classSel.class_builds : classSel.class_builds.sort())
      if(classSel !== null && classSel !== undefined){
        if(classSel.student_rating !== undefined){
          setRated(true);
        }else {
          setRated(false);
        }
      }
    }
  }, [refreshToken, user, templateId]);

  useEffect(() => {
    if(user){
      const client = new W3CWebSocket(socketUrl + '?email=' + user);
      client.onopen = () => {
          // console.log('WebSocket Client Connected');
      };
      client.onmessage = (message) => {
          toast.dismiss();
          Utils.addsuccessNotification(message.data);
          if(message.data){
            setRefresh(!refresh)
            // readClass();
          }
      };
      // returned function will be called on component unmount
    }
  }, [user])

  useEffect(() => {
    refreshToken && readClass();
  }, [refresh])

  const readClass = () => {
    Utils.getCustomerClasses(user, role, customerId, refreshToken)
    .then((data) => {
      // console.log(data);
      localStorage.setItem('classes', JSON.stringify(data));
    })
    .catch((error) => { throw error; })
  };

  const options = {
    cMapUrl: 'cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'standard_fonts/',
  };
  const createClassSuccess = () => {
    //here we go back to the classes .
    history.push({pathname: '/admin/classes/', state: { refresh: true } });
  }

  const handleCopyClick = (class_id) => {
    // Perform the copy action here (e.g., using document.execCommand or Clipboard API)
    const copyText = `${enrollURL}?id=${class_id}&&tkn=${code}`;
    // Use the Clipboard API to copy the text to the clipboard
    navigator.clipboard.writeText(copyText)
      .then(() => {
        // The text has been successfully copied
        // console.log('Text copied to clipboard:', copyText);
      })
      .catch((err) => {
        // Handle any errors that may occur while copying
        console.error('Error copying text to clipboard:', err);
      });
  };

  const deleteDialog = (item) => {
    setOpen(true);
    setClassDeleteData(item);
  }

  const reBuildDialog = (item) => {
    setTemplateBuild(true);
    // setTemplateBuildData(item);
  }

  /**
    * To start the class server VM on demand
    * @param  {Object} item VM details object
    * @return {JSON}  response with a success custom message
  */
  const startClassServerVM = (item) => {
    const newObj = {
      'vm_name': item.vm_name,
      'class_id': item.class_id
    }
    Utils.addinfoNotification("Starting machine...")
    Utils.startVM([newObj])
    .then(data => {
      if(data.message === 'success'){
        Utils.addsuccessNotification("Successfully started machine.")
        //here we update the class details in localStorage
        const newArr = [...classes]
        newArr.find(v => v.class_id === item.class_id).vm_status = 'online';
        setClasses(newArr);
        localStorage.setItem('classes', JSON.stringify(newArr));
        //here we store the notification in localStorage
        const newArr1 = [...notifications]
        newArr1.push({
          created: Date.now(),
          message: "You have started the class server " + item.class_name,
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
    * To sop the class server VM on demand
    * @param  {Object} item VM details object
    * @return {JSON}  response with a success custom message
  */
  const stopClassServerVM = (item) => {
    const newObj = {
      'vm_name': item.vm_name,
      'class_id': item.class_id
    }
    Utils.addinfoNotification("Stopping machine...")
    Utils.stopVM([newObj])
    .then(data => {
      if(data.message === 'success'){
        Utils.addsuccessNotification("Successfully stopped machine.")
        //here we update the class details in localStorage
        const newArr = [...classes]
        newArr.find(v => v.class_id === item.class_id).vm_status = 'offline';
        setClasses(newArr);
        localStorage.setItem('classes', JSON.stringify(newArr));
        //here we store the notification in localStorage
        const newArr1 = [...notifications]
        newArr1.push({
          created: Date.now(),
          message: "You have stopped the class server " + item.class_name,
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

  const deployTemplate = (item, redeploy) => {
    setOpenNetwork(false);
    Utils.addinfoNotification("Deploying lab template for this class...")
    fetch(backendAPIURL + 'deploy_class_env', {
    // fetch('http://areddy-cloud9.omnifsi.com:5000/deploy_class_env', {
      method: 'post',
      headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
      },
      body: JSON.stringify({
          'customer_id': item.customer_id,
          'class_id': item.class_id,
          'user': user,
          'redeploy': redeploy,
          'build_network': 'none'
      })
    })
    .then((response) => response.json())
    .then(responseJson => {
      if (responseJson) {
        toast.dismiss();
        if(responseJson.statusCode === 505){
            setOpenNetwork(true);
        }else {
          Utils.addinfoNotification(responseJson.message);
        }
        // readClass();
      } else {
          Utils.adderrorNotification('Error creating the class environment VM: ' + responseJson.errorMessage)
      }
    })
    .catch((error) => {
      toast.dismiss();
      Utils.addinfoNotification('Hang tight, the class environment will be up soon!')
    });
  }

  const deleteClass = (rowData) => {
    setOpen(false);
    Utils.addinfoNotification('Deleting class...');
    Functions.deleteClass(rowData, refreshToken, role)
    .then((data) => {
      toast.dismiss();
      Utils.addsuccessNotification('Class deleted successfully')
      //here we update the classes in localStorage
      const newArr = [...classes]
      const index = newArr.findIndex(cls => cls.class_id === rowData.class_id);
      if (index > -1) {
        newArr.splice(index, 1);
        setClasses(newArr);
        localStorage.setItem('classes', JSON.stringify(newArr));
      }
      //here we store the notification in localStorage
      const newArr1 = [...notifications]
      newArr1.push({
        created: Date.now(),
        message: "You have deleted a class " + rowData.class_name,
        subject: "Class deleted",
        notification_type: 'delete_class_completed',
        read: false
      })
      localStorage.setItem('notifications', JSON.stringify(newArr1));
      setNotifications(newArr1);
    })
    .catch((error) => {
      toast.dismiss();
      Utils.adderrorNotification('Error deleting the class: ' + error)
     });
  };

  const handleCloseEditorDialog = () => {
    setShowEditor(false);
    setOpen(false);
    setOpenNetwork(false);
    setTemplateBuild(false);
    setOpenRating(false);
  }

  const createClassTemplateBuild = (item, scheduler, type) => {
    if(scheduler.type === 'immediate' && classSel.vm_status !== 'online'){
      Utils.adderrorNotification('Make sure the class server is running and try again.')
      return false
    }else {
      // class_id, customer_id need to be appended to item
      item.customer_id = customerId;
      item.class_id = classId;
      item.redeploy = 'templatebuild'
      item.template_type = checkedType
      Utils.addinfoNotification("Scheduling build...")
      Functions.createTemplateBuild(item, scheduler, refreshToken, customerId, user)
      .then(data => {
        toast.dismiss();
        if(data.statusCode === 200){
          Utils.addsuccessNotification(data.message)
          setTemplateBuild(false);
          // readTemplate();
          const newArr = [...classes];
          const newBuildEntry = {
              'name': 'build' + '_' + data.data.tag,
              'build_data': item,
              'time': scheduler.time,
              'created_ts': Math.floor(new Date().getTime()/1000.0),
              'updated_ts': Math.floor(new Date().getTime()/1000.0)
          };
          newArr.find(temp => item.class_id === temp.class_id).class_builds = buildHistory.concat(newBuildEntry);
          setClasses(newArr);
          setBuildHistory(buildHistory.concat(newBuildEntry));
          localStorage.setItem('classes', JSON.stringify(newArr));
          setRefresh(!refresh)
        }
      })
      .catch(err => { throw err });
    }
  }

  const ratingDialog = () => {
    setOpenRating(true);
    // setClassRatingData(item);
  }

  const handleCreateClass = (type) => {
    const baseUrl = window.location.href;
    // console.log('Current URL:', baseUrl);
    if (type === "d2l") {
      //May be here we will create the same class in D2L but with a option
      const clientId = 'eb417d75-cf9d-4b91-9c78-707b396d7ff7';
      const redirectUri = 'https://react-api.omnifsi.com/dev/redirect_uri';
      // Redirect the user to the D2L authorization endpoint
      const d2lAuthorizationUrl = `https://auth.brightspace.com/oauth2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=core:*:*&state=${baseUrl}`;
      window.location.href = d2lAuthorizationUrl;
    } else {
      // Proceed with regular class creation
      const invoToken = 'regularinvoclassClass'
      const invoAuthorizationUrl = `${baseUrl}?access_token=${invoToken}`
      window.location.href = invoAuthorizationUrl;
    }
  };

  const handleCloseCreateClassDialog = () => {
    setCreateClassDialogOpen(false);
  };

  const queryParams = getQueryParams(window.location.search);
  const shouldShowCreateClassDialog = !queryParams.access_token;

  return (
    <>
    {subscriptionStatus == 'trialing' || subscriptionStatus === 'active' || subscriptionStatus === null ? (
      <>
        <div className= {`${ 'card-header d-flex justify-content-between align-items-center' }`}>
          <Link to="/admin/classes/">&larr; Back</Link>

          {id !== 'create' && role !== 'student' ?
          <div>
            {/*classes that use stand_alone lab templates don't need this feature*/}
            {classSel.template_type !== 'stand_alone' ?
              <Tooltip title={(classSel.vm_status === 'offline' ||
                              classSel.vm_status === undefined) ?
                              "Make sure the class server VM is in running state" :
                              "Deploy lab template for this class"}>
                <span>
                  <IconButton size='small'
                    disabled={(classSel.vm_status === 'offline' ||
                              classSel.vm_status === undefined) ||
                              classSel.template_type === 'stand_alone'}
                    onClick={() => deployTemplate(classSel, false)}>
                      <AddIcon fontSize='small'/></IconButton>
                </span>
              </Tooltip> : null
            }
            {/*<div className="invite-copy">*/}
              {/*Copy invite link{' '}*/}
              <CopyLinkToClipboard
                title="Link copied to clipboard"
                onClick={() => handleCopyClick(classSel.class_id)}
              />
            {/*</div>*/}
            {classSel.vm_status === 'online' ?
              <Tooltip title="Stop Class Server VM">
                <IconButton size='small'
                  disabled={classSel.vm_status !== 'online' ||
                  (classSel.vm_status === 'offline' && classSel.guac_server_url === 'pending')}
                  onClick={() => stopClassServerVM(classSel)}>
                    <StopIcon fontSize='small'/></IconButton>
              </Tooltip> :
              <Tooltip title="Start Class Server VM">
                <IconButton size='small'
                  disabled={(classSel.vm_status === 'offline' && classSel.guac_server_url === 'pending')
                            || classSel.vm_status === undefined}
                  onClick={() => startClassServerVM(classSel)}>
                    <PlayArrowIcon fontSize='small'/></IconButton>
              </Tooltip>
            }
            <Tooltip title="Rebuild lab template">
              <IconButton size='small'
                // disabled= {checkedType === 'st'}
                onClick={() => reBuildDialog(classSel)}>
                  <BuildIcon fontSize='small'/>
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Class">
              <IconButton size='small' onClick={() => deleteDialog(classSel)}>
                <DeleteIcon fontSize='small'/></IconButton>
            </Tooltip>
          </div> : id !== 'create' ?
          <div>
            <Tooltip title={rated ? "Edit your rating for this class" : "Leave a rating for this class"}>
              <IconButton disableFocusRipple disableRipple size='small'
                style={{ backgroundColor: "transparent" }} onClick={() => ratingDialog(classSel)}>
                <Typography variant="body2" style={{ marginRight: '4px' }}>
                  {rated ? "Edit your rating" : "Leave a rating"}
                </Typography>
                <StarIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </div> : null
         }
        </div>
        {(shouldShowCreateClassDialog && id === 'create') &&(
          <Dialog
            open={createClassDialogOpen}
            onClose={handleCloseCreateClassDialog}
            aria-labelledby="form-dialog-title"
            onBackdropClick="false"
            disableEscapeKeyDown
          >
            <DialogTitle id="form-dialog-title">Create Class</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Choose the type of class you want to create:
              </DialogContentText>
              <Box display="flex" alignItems="center">
                <IconButton onClick={() => handleCreateClass("invo")} color="primary">
                  <SchoolIcon />
                </IconButton>
                <Typography variant="body1">InvoClass</Typography>
              </Box>

              <Box display="flex" alignItems="center">
                <IconButton onClick={() => handleCreateClass("d2l")} color="primary">
                  <LayersIcon />
                </IconButton>
                <Typography variant="body1">InvoClass & D2L</Typography>
              </Box>
            </DialogContent>
            {/*<DialogActions>
              <Button onClick={handleCloseCreateClassDialog} color="primary">
                Cancel
              </Button>
            </DialogActions>*/}
          </Dialog>
        )}
        <StepperWizard
           data={id ==='create' ? null : classSel}
           success={createClassSuccess}
           // close={this.createClass}
           newclass={id ==='create' ? true : false}
           active_step={activeStep}
           token={queryParams!== undefined && queryParams.access_token}
        />
        {/*A dialog box to open rating system*/}
        <RatingDialog
          open={openRating}
          data={id ==='create' ? null : classSel}
          close={handleCloseEditorDialog}
          rated={rated}
          // delete={deleteClass}
        />
        {/*A dialog box to warn the user before a class is deleted*/}
        <DeleteDialog
          dashboard="class"
          open={open}
          data={classDeleteData}
          close={handleCloseEditorDialog}
          delete={deleteClass}
        />
        {templateBuild &&
           <SchedulerDialog dashboard="template"
            type={id !== 'create' ? 'create': null}
            template={checkedType}
            user={user}
            open={templateBuild}
            close={handleCloseEditorDialog}
            data={templateSel}
            create={createClassTemplateBuild}
          />
        }
        </>
      ):(
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
export default ClassDetails;
