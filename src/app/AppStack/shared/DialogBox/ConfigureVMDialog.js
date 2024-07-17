import React, { Component, useState, useEffect, useRef } from "react";
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import TextField from '@material-ui/core/TextField';
import Slide from "@material-ui/core/Slide";
import WarningIcon from '@material-ui/icons/Warning';
import Button from '@material-ui/core/Button';
import {Spinner, Form} from 'react-bootstrap';
import { toast } from 'react-toastify';
import Utils from '../../shared/Utils';
import axios from 'axios'
import CustomToast from '../../shared/CustomToast.js'
import { reactAPIURL } from "../../shared/General.js";
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormLabel from "@material-ui/core/FormLabel";
import FormControl from "@material-ui/core/FormControl";
import FormGroup from "@material-ui/core/FormGroup";
import FormHelperText from "@material-ui/core/FormHelperText";
import Typography from '@material-ui/core/Typography';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const ConfigureVMDialog = (function ConfigureVMDialog({open, data, close, add}) {

  const [chapterName, setChapterName] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileMain, setFileMain] = useState('');
  const [fileType, setFileType] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [user, setUser] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [role, setRole] = useState('');
  const inputRef = useRef(null);
  const [serverStatus] = useState(false);

  useEffect(() => {
    //this is like our componentDidMount

    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    var notifications = JSON.parse(localStorage.getItem('notifications'));
    if(userAuthDetails !== null && userDetails !== null){
      setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
      setUser(JSON.parse(userAuthDetails).user);
      setCustomerId(JSON.parse(userDetails).customer_id);
      setRole(JSON.parse(userDetails).role)
    }
  }, [refreshToken, user]);

  const handleAdd = async() => {
    console.log('add');
  }

  const handleClose = async() => {
    // await this.setState({deleteMessage: ''})
    close();
  }

  return (
    <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={close}
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
        style={{zIndex: 100000}}
    >
        <DialogTitle
            id="alert-dialog-slide-title">Configure</DialogTitle>
        <DialogContent>
            <DialogContentText id="alert-dialog-slide-description">
              <p className="card-description">some notes here</p>
            </DialogContentText>
            <FormControl component="fieldset">
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={true}
                // onChange={evt => this.setState({'serverStatus': !this.state.serverStatus})}
                name="checkedA"
                color="primary"
                disabled
              />
            }
            label={
                      <>
                        <Typography color="inherit">AllowAnySSHInbound</Typography>
                        <Typography variant="subtitle2" color="inherit">For guacamole and s3fs.
                        We need to allow only those hosts to communicate and block all other traffic.</Typography>
                      </>
                   }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={serverStatus}
                // onChange={evt => this.setState({'serverStatus': !this.state.serverStatus})}
                name="checkedA"
                color="primary"
              />
            }
            label={
                      <>
                        <Typography color="inherit">AllowVnetInBound</Typography>
                        <Typography variant="subtitle2" color="inherit">This rule permits all the hosts
                          inside the virtual network (including subnets) to communicate
                          between them without any blocks.</Typography>
                      </>
                   }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={serverStatus}
                // onChange={evt => this.setState({'serverStatus': !this.state.serverStatus})}
                name="checkedA"
                color="primary"
              />
            }
            label={
                      <>
                        <Typography color="inherit">AllowAzureLoadBalancerInBound</Typography>
                        <Typography variant="subtitle2" color="inherit">This rule allows an Azure
                        load balancer to communicate with your VM and send heartbeats.</Typography>
                      </>
                   }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={serverStatus}
                // onChange={evt => this.setState({'serverStatus': !this.state.serverStatus})}
                name="checkedA"
                color="primary"
              />
            }
            label={
                      <>
                        <Typography color="inherit">DenyAllInBound</Typography>
                        <Typography variant="subtitle2" color="inherit">This is the deny all
                        rule that blocks any inbound traffic to the VM by default and protect
                        the VM from malicious access outside the Azure Vnet.</Typography>
                      </>
                   }
          />
        </FormGroup>
      </FormControl>
            <div className="col-md-12">
                <Form.Group className="row">
                  <div className="col-sm-12">
                  <TextField
                    fullWidth
                    size="small"
                    label="Name"
                    value={chapterName}
                    type='text'
                    required
                    onChange={evt => setChapterName(evt.target.value)}
                    autoFocus
                    inputRef={input => input && input.focus()}
                  />
                  </div>
                </Form.Group>
              </div>




        </DialogContent>
        <DialogActions>
            <Button onClick={close} color="primary">
                Cancel
            </Button>
            <Button onClick={handleAdd}>
                Save
            </Button>
        </DialogActions>
    </Dialog>
  );
});

export default ConfigureVMDialog;
