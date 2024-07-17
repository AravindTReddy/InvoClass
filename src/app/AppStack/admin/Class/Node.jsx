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

const style = {
  border: '1px dashed gray',
  cursor: 'move',
  color: 'black',
  textAlign: 'center',
  borderRadius: '5px',
  alignItems: 'center'
};


{/*Node is an draggable and droppable item which you can find them as machines*/}
const Node = memo(function Node({ details, name, network, subnet_type, type,
                                    assigned, token, reload }) {
  const [{ opacity }, drag, preview] = useDrag(() => ({
      type,
      item: { details },
      collect: (monitor) => ({
          opacity: monitor.isDragging() ? 0.4 : 1,
      }),
  }), []);
  const [classes, setClasses] = useState([]);
  const [openMenu, setOpenMenu] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    var userClasses = JSON.parse(localStorage.getItem('classes'));
    userClasses.length > 0 && setClasses(userClasses);
  }, [])

  const startMachineAdmin = async(item) => {
    const newObj = {
      'vm_name': item.vm_name,
      'class_id': item.class_id
    }
    Utils.addinfoNotification(<CustomToast
      message = "Starting machine(s)"
      type = "request"
    />)
    // console.log(newObj);
    await Utils.startVM([newObj])
    .then(data => {
      if(data.message === 'success'){
        toast.dismiss();
        //here we update the class details in localStorage
        const newArr = [...classes]
        newArr.find(v => v.class_id === item.class_id).env_vms.find(n => n.network_name
          === item.network_name).machines.find(m => m.vm_name === item.vm_name).vm_status
          = 'online';
        localStorage.setItem('classes', JSON.stringify(newArr));
        reload();
        Utils.addsuccessNotification(<CustomToast
          message = "Successfully started machine(s)"
          type = "response"
        />)
      }
    })
    .catch(err => { throw err });
  }

  const stopMachineAdmin = async(item) => {
    const newObj = {
      'vm_name': item.vm_name,
      'class_id': item.class_id
    }
    Utils.addinfoNotification(<CustomToast
      message = "Stoping machine(s)"
      type = "request"
    />)
    // console.log(newObj);
    await Utils.stopVM([newObj])
    .then(data => {
      if(data.message === 'success'){
        toast.dismiss();
        const newArr = [...classes]
        newArr.find(v => v.class_id === item.class_id).env_vms.find(n => n.network_name
          === item.network_name).machines.find(m => m.vm_name === item.vm_name).vm_status
          = 'offline';
        localStorage.setItem('classes', JSON.stringify(newArr));
        reload();
        Utils.addsuccessNotification(<CustomToast
          message = "Successfully stopped machine(s)"
          type = "response"
        />)
      }
    })
    .catch(err => { throw err });
  }

  const launchMachineAdmin = (item) => {
    //when unassigned to student
    //validation before launch TODO
    Utils.addinfoNotification('Launching machine in a new tab..');
    Utils.getGuacToken(item, token, 'admin')
    .then(data => {
      toast.dismiss();
      window.open(data, "_blank")
    })
    .catch(err => {
      Utils.adderrorNotification('Error launching the machine, Please try launching again.');
    });
  }

  const handleDetails = (item, event) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu(!openMenu);
    //itemß
  }

  const handleClose = () => {
    setOpenMenu(false);
    setAnchorEl(null);
    //item: ''
  }

  return (
    <>
      {/*position: source === 'editor' ? 'absolute': null*/}
      {/*<DragPreviewImage connect={preview} src={knightImage} />*/}
      {!assigned ?

          <div ref={drag}
               role="Node"
               style={{ ...style, opacity }}
               // className="d-flex justify-content-center align-items-center"
          >
          <ListItem
            secondaryAction={
                  <IconButton
                    onClick={(evt) => handleDetails(details, evt)}
                    edge="end" aria-label="delete">
                    <MoreVertIcon />
                  </IconButton>
                }
            alignItems="flex-start">
            <ListItemText
              primary={name}
              primaryTypographyProps={{fontSize: '12px'}}
              secondary={
                <React.Fragment>
                  <Typography
                    sx={{ display: 'inline' }}
                    component="span"
                    variant="caption"
                    color="text.primary"
                  >
                  <span className={details.vm_status === 'online' ? "badge badge-pill badge-success" :
                                   details.vm_status === 'offline' && details.connection_url === 'pending' ?
                                   "badge badge-pill badge-warning" : "badge badge-pill badge-danger"}>
                       {details.vm_status !== undefined ? details.vm_status === 'online' ? 'Running' :
                         details.vm_status === 'offline' && details.connection_url === 'pending' ?
                         'Creating...' : 'Stopped' : "Not available"}
                  </span>
                  </Typography>
                  <span style={{fontSize: '8px'}}> {network} | {subnet_type}</span>
                </React.Fragment>
              }
            />
          </ListItem>
          <Menu
            anchorEl={anchorEl}
            id="basic-menu"
            open={openMenu}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'basic-button',
            }}
          >
              <Tooltip title={(details.vm_status === 'offline' ||
                              details.vm_status === undefined) ?
                              "Make sure the machine is in running state" :
                              "Launch machine"}>
                <span>
                  <MenuItem
                    disabled={(details.vm_status === 'offline' || details.connection_url === 'pending')
                          || details.vm_status === undefined}
                    onClick={() => launchMachineAdmin(details)}>
                      <LaunchIcon fontSize="small"/>&nbsp;Launch</MenuItem>
                </span>
              </Tooltip>
              {details.vm_status === 'online' ?
                <Tooltip title="Stop Machine">
                  <MenuItem
                  disabled={(details.vm_status === 'offline' && details.connection_url === 'pending')
                          || details.vm_status === undefined}
                    onClick={() => stopMachineAdmin(details)}>
                      <StopIcon fontSize="small"/>&nbsp;Stop</MenuItem>
                </Tooltip> :
                <Tooltip title="Start Machine">
                  <MenuItem
                  disabled={(details.vm_status === 'offline' && details.connection_url === 'pending')
                          || details.vm_status === undefined}
                    onClick={() => startMachineAdmin(details)}>
                      <PlayArrowIcon fontSize="small"/>&nbsp;Start</MenuItem>
                </Tooltip>
              }
            </Menu>
          </div> : <p style={{fontSize: '8px'}}>machine assigned</p> }
    </>
  );
});
export default Node
