import React, { memo, useEffect, useState } from 'react';
import { useDrag, DragPreviewImage } from 'react-dnd';
// import { knightImage } from './testImage'
import Tooltip from '@material-ui/core/Tooltip';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import { stockImages } from "../../shared/General.js";
import DeleteIcon from '@material-ui/icons/Delete';
import Typography from '@material-ui/core/Typography';
import LaunchIcon from '@material-ui/icons/Launch';
import { IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import Utils from '../../shared/Utils';
import CustomToast from '../../shared/CustomToast.js'
import { toast } from 'react-toastify';
import StopIcon from '@material-ui/icons/Stop';
import moment from 'moment';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import ListItem from '@mui/material/ListItem';
import Divider from '@mui/material/Divider';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import TemplateDialog from '../../shared/DialogBox/TemplateDialog'
import MaterialTable from 'material-table';
import { Spinner } from 'react-bootstrap';
import SchedulerDialog from '../../shared/DialogBox/SchedulerDialog'
import Functions from './Functions'

const Builds = memo(function Builds({data, setStep2Data}) {
  var selectedTemp;
  var userTemplates = JSON.parse(localStorage.getItem('templates'));
  userTemplates!== null && userTemplates.forEach((item, i) => {
    if(data.templateId === item.template_id)
      selectedTemp = {...item}
  });

  const [classes, setClasses] = useState([]);
  const [openMenu, setOpenMenu] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [buildHistory, setBuildHistory] =
          useState(data.classBuilds!== undefined ? data.classBuilds : []);
  const [primaryColor, setPrimaryColor] = useState('#F38A2C');
  const [refreshToken, setRefreshToken] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('#606060');
  const [user, setUser] = useState('');
  const [role, setRole] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [viewTemplateBuild, setViewTemplateBuild] = useState(false);
  const [templateBuild, setTemplateBuild] = useState(false);
  const [templateBuildData, setTemplateBuildData] = useState('');
  const [templateSel, setTemplateSel] = useState(selectedTemp);

  useEffect(() => {
    //read from localStorage here
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    var userInstructors = JSON.parse(localStorage.getItem('instructors'));
    // console.log(userInstructors);
    if(userDetails !== null){
      setCustomerId(JSON.parse(userDetails).customer_id);
      setRole(JSON.parse(userDetails).role);
    }
    if(appearanceObject !== null){
      setPrimaryColor(JSON.parse(appearanceObject).primary_color);
      setSecondaryColor(JSON.parse(appearanceObject).secondary_color);
    }
    if(userAuthDetails !== null){
      setUser(JSON.parse(userAuthDetails).user);
      setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
    }
    var userClasses = JSON.parse(localStorage.getItem('classes'));
    userClasses.length > 0 && setClasses(userClasses);
  }, [])

  const handleCloseDialog = () => {
    setViewTemplateBuild(false);
    setTemplateBuildData('');
    setTemplateBuild(false);
  }

  const templateBuildDialog = (event, rowData) => {
    setViewTemplateBuild(true);
    if(templateSel.type === 'stand_alone'){
      var item = {
        name: rowData.name,
        version: rowData.build_data.version,
        description: templateSel.description,
        version_history: templateSel.version_history,
        resource_id: rowData.build_data.resource_id,
        template_id: rowData.build_data.template_id,
        template_type: rowData.build_data.template_type,
        redeploy: rowData.build_data.redeploy,
        time: rowData.time,
        name: rowData.name
      }
    }else {
      item = {
        name: rowData.name,
        version: rowData.build_data.version,
        description: rowData.build_data.description,
        version_history: templateSel.version_history,
        network: rowData.build_data.network,
        template_id: rowData.build_data.template_id,
        template_type: rowData.build_data.template_type,
        redeploy: rowData.build_data.redeploy,
        time: rowData.time,
        name: rowData.name,
      }
    }
    setTemplateBuildData(item);
    setTemplateBuild(true);
  }

  const deleteTemplateBuild = (item) => {
    Utils.addinfoNotification("Deleting build...")
    Functions.deleteTemplateBuild(item, refreshToken, customerId)
    .then((res) => {
      toast.dismiss();
      if(res.message === "success" && res.statusCode === 200){
        Utils.addsuccessNotification("Successfully deleted build.")
        const newArr = [...buildHistory]
        const index = newArr.findIndex(build => build.name === item.name);
        if (index > -1) {
          newArr.splice(index, 1);
          setBuildHistory(newArr)
        }
        const newArr1 = [...classes];
        newArr1.find(temp => item.build_data.class_id === temp.class_id).class_builds = newArr
        setClasses(newArr1)
        localStorage.setItem('classes', JSON.stringify(newArr1));
      }
    })
    .catch((error) => {
      toast.dismiss();
      let customError = 'Rule ' + item.name + ' does not exist on EventBus default.'
      if(error === customError){
        Utils.addsuccessNotification("Successfully deleted build.")
        const newArr = [...buildHistory]
        const index = newArr.findIndex(build => build.name === item.name);
        if (index > -1) {
          newArr.splice(index, 1);
          setBuildHistory(newArr)
        }
        const newArr1 = [...classes];
        newArr1.find(temp => item.build_data.class_id === temp.class_id).class_builds = newArr
        setClasses(newArr1)
        localStorage.setItem('classes', JSON.stringify(newArr1));
      }
    });
  }

  const updateTemplateBuild = (item, scheduler) => {
    //class_id, customer_id need to be appended to item
    item.customer_id = customerId;
    item.class_id = data.class_id;
    Utils.addinfoNotification("Updating build...")
    Functions.updateTemplateBuild(item, scheduler, refreshToken, customerId, user)
    .then((data) => {
      toast.dismiss();
      if(data.statusCode === 200){
        setTemplateBuild(false);
        Utils.addsuccessNotification(data.message)
        //here we update the item value
        let newArr = [...buildHistory]
        const index = newArr.findIndex(build => build.build_data.template_id === item.template_id);
        if (index > -1) {
          newArr[index].time = scheduler.time
          newArr[index].build_data.network = item.network
          // newArr[index].build_data.build_classes = item.build_classes
        }
        setBuildHistory(newArr)
        const newArr1 = [...classes];
        newArr1.find(temp => temp.class_id === item.class_id).class_builds = newArr
        setClasses(newArr1);
        localStorage.setItem('classes', JSON.stringify(newArr1));
      }
    })
    .catch((error) => { throw error });
  }

  return (
    <>
    <MaterialTable
      onRowClick={templateBuildDialog}
      title="Lab Template Build History"
        localization={{ body:{ emptyDataSourceMessage:
          <>
            {buildHistory.length <= 0 ? 'No records to display' :
              <div style={{color: primaryColor}} className="d-flex justify-content-center">
                <Spinner  animation="border" role="status">
                    <span className="sr-only">Loading...</span>
                </Spinner>
              </div>
             }
          </>
        }
        }}
        columns={[
          {title: 'Name', field: 'name'},
          {title: 'Version', field: 'version',
            render: rowData => {
              return rowData.build_data.version
            }
          },
          {title: 'Time', field: 'time',
            render: rowData => {
              const time = moment(rowData.time).format('MMM DD, YYYY HH:mm a');
              return time
            }
          },
          {title: 'Status', field: 'time',
            render: rowData => {
              const dateIsAfter = moment().isAfter(moment(rowData.time));
              if(dateIsAfter){
                  return <span className="badge badge-success">Completed</span>
              }else{
                  return <span className="badge badge-warning">Scheduled</span>
              }
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
        data={buildHistory}
        options={{
          headerStyle: {
              backgroundColor: secondaryColor,
              color: '#FFF',
          },
          paging: false,
          padding: "dense",
          toolbar: false,
          headerStyle: {
              backgroundColor: secondaryColor,
              color: '#FFF',
              fontSize: '12px'
          },
          rowStyle: {
            fontSize: '12px'
          },
          padding: "dense",
        }}
        actions={[
          rowData => ({
              icon: 'delete',
              tooltip: 'Delete Build',
              onClick: (event, rowData) => deleteTemplateBuild(rowData)
          }),
        ]}
    />
    {templateBuild &&
       <SchedulerDialog dashboard="template"
        type={viewTemplateBuild ? 'update': 'create'}
        template={templateSel.type}
        user={user}
        open={templateBuild}
        close={handleCloseDialog}
        data={templateBuildData}
        update={updateTemplateBuild}
        // classData={templateClasses}
        // create={createTemplateBuild}
      />
    }
    </>
  );
});
export default Builds
