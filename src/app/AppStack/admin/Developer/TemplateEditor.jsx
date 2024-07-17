import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import NodePanel from './Network/NodePanel'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import Utils from '../../shared/Utils';
import Functions from './Functions';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {templateEditorText} from '../../shared/General';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function TemplateEditor({type, address, name, data, create, update, open, close}) {

  const [primaryColor, setPrimaryColor] = useState('#F38A2C');
  const [refreshToken, setRefreshToken] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('#606060');
  const [user, setUser] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [role, setRole] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    //read from localStorage here
    var appearanceObject = JSON.parse(localStorage.getItem('appearanceObject'));
    var userAuthDetails = JSON.parse(localStorage.getItem('userAuthDetails'));
    var userDetails = JSON.parse(localStorage.getItem('userDetails'));
    // var customerDetails = JSON.parse(localStorage.getItem('customerDetails'));
    var notifications = JSON.parse(localStorage.getItem('notifications'));
    notifications !== null && setNotifications(notifications);
    // customerDetails !== null && setCustomerDetails(customerDetails);
    // setLoadedCustomerDetails(true);
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
  }, [refreshToken, user]);

  const handleClose = () => {
    close();
  }

  const createNetwork = (item, address) => {
    create(item, address);
  }

  const updateNetwork = (item) => {
    update(item);
  }

  const toggleHelpText = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Design a network for {name} {type === "assignment" ? null : 'Lab Template'}
            </Typography>
            <Button autoFocus color="inherit" onClick={handleClose}>
              Cancel
            </Button>
          </Toolbar>
        </AppBar>
        <div className="steps-container">
          <div className="button-container">
            <Button onClick={toggleHelpText} size="small">
              {isCollapsed ? 'Show Help Text' : 'Hide Help Text'}
            </Button>
          </div>
          <div className="content-container">
            {!isCollapsed && Object.entries(templateEditorText).map(([title, content], index) => (
              <div key={index}>
                <h3>{title}</h3>
                <p>{content}</p>
              </div>
            ))}
          </div>
         </div>

          <DndProvider backend={HTML5Backend}>
            <NodePanel create={createNetwork}
              address={address}
              close={handleClose}
              type={type}
              data={data}
              updateN={updateNetwork}/>
          </DndProvider>
      </Dialog>
  );
}
