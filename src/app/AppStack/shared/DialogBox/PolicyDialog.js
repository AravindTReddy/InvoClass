import React, { Component } from "react";
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Slide from "@material-ui/core/Slide";
import WarningIcon from '@material-ui/icons/Warning';
import Button from '@material-ui/core/Button';
import "react-datepicker/dist/react-datepicker.css";
import TextField from '@material-ui/core/TextField';
import { Form } from 'react-bootstrap';
import Tooltip from '@material-ui/core/Tooltip';
import { Typography } from '@mui/material';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

class PolicyDialog extends Component {
  constructor(props) {
      super(props);
      this.state = {
        serverStatus: true,
        save_description: '',
        network_redeploy: '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        template_version: (this.props.version + 0.2).toFixed(1),
        template_description: '',
        publish: this.props.data ? this.props.data.classPublish : false,
      }
  }

  async componentDidMount () {
    this.setState({template_version: (this.props.version + 0.2).toFixed(1)})
  }
  handleAgree = () => {
    if(this.props.dashboard === 'student'){
      this.props.start(this.props.data);
    } else {
      if(this.props.dashboard === 'class' || this.props.dashboard === 'customer'){
        // var props = this.state.serverStatus;
        var props = this.state.publish;
      }else if(this.props.dashboard === 'template'){
        props = this.props.data;
        var description = this.state.save_description;
      }else if (this.props.dashboard === 'classnetwork') {
        props = this.props.data;
        description = this.state.network_redeploy
      }else if (this.props.dashboard === 'nodepanel') {
        props = this.props.data;
        description = this.state.template_description;
        var version = this.state.template_version
      }
      this.props.create(props, description, version);
      this.setState({
        serverStatus: false,
        save_description: '',
        network_redeploy: '',
        template_version: '',
        template_description: ''
      })
    }
  }

  handleClose = () => {
    this.setState({
      serverStatus: false,
      save_description: '',
      network_redeploy: '',
      // template_version: '',
      template_description: ''
    })
    this.props.close(this.props.data);
  }

  handleOverride = () => {
    this.props.override(this.props.data);
  }

  render() {
    if(this.props.dashboard === 'class'){
      var title = "Terms and Conditions";
      var message = `By creating a class, the information you have provided will become public.
        InvoClass reserves the right to take down your classes for any reasons and not limited to use of
        inappropriate or deceptive language, or misrepresentation of the materials to be covered in your class.
        Active classes count against your Virtual Asset Count.  Good luck, and if you need any help,
        we are here to help you succeed!`;
    } else if(this.props.dashboard === 'course'){
        title = "Terms and Conditions"
        message = `By creating this course without an image associated, the core OmniFSI features will not be accessible
                   (lab environments, over the shoulder, etc.). You can go back and assign a lab at anytime once you
                   have created one from the Developer Dashboard. You will still be able to upload and manage course content,
                   send announcements, video chat, and perform user management, and can go back and assign a lab after
                   creating one in the Developer Dashboard.`;
    } else if(this.props.dashboard === 'template'){
        title = "Save Template"
        message = `By saving this template, A new template version will be created considering all the latest configuration changes
                   on the existing template. The existing template will be still available for future use as an older version.`;
    } else if(this.props.dashboard === 'customer'){
        title = "Terms and Conditions"
        message = `By creating a customer, your server will then be readily available.
                   Additional resources will be created to support the template environments,
                   and that cost is included with your customer license.`;
    } else if (this.props.dashboard === 'student') {
        title = "Class server is offline, Do you wish to proceed?"
        message = `Looks like the class server is offline, To access your lab please proceed to start the
                  class server.`
    } else if (this.props.dashboard === 'classnetwork') {
      title = "Class network template deployment in progress..."
      message = `Looks like the network template deployment is in progress, Please wait until its finished.`
      var noteMsg = `If the deployment is initiated more than 30 minutes ago, Please type 'redeploy' in the below input field and hit agree to
                      initiate a new deployment. This will earse all the old resources created for this template.`
    } else if (this.props.dashboard === 'nodepanel') {
        title = "Save network?"
        message = `Do you like to save the changes as a new version of this template or override the existing template ?`
    }

    return (
      <Dialog
          open={this.props.open}
          TransitionComponent={Transition}
          keepMounted
          onClose={this.handleClose}
          aria-labelledby="alert-dialog-slide-title"
          aria-describedby="alert-dialog-slide-description"
          style={{zIndex: 100000}}
          hideBackdrop // Disable the backdrop color/image
          disableEnforceFocus // Let the user focus on elements outside the dialog
          // disableBackdropClick // Remove the backdrop click (just to be sure)
      >
          <DialogTitle
              id="alert-dialog-slide-title">{ title }</DialogTitle>
          <DialogContent>
              <DialogContentText id="alert-dialog-slide-description">
                <WarningIcon/>{message}<br/>
                {this.props.dashboard === 'classnetwork' ? noteMsg : null}
              </DialogContentText>
              {/*{(this.props.dashboard === 'class' || this.props.dashboard === 'customer') &&
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={this.state.serverStatus}
                      onChange={evt => this.setState({'serverStatus': !this.state.serverStatus})}
                      name="checkedA"
                      color="primary"
                    />
                  }
                  label="Leave my server running after creation"
                />
              }*/}
              {(this.props.dashboard === 'class') &&
                <>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={this.state.publish}
                        onChange={evt => this.setState({'publish': !this.state.publish})}
                        name="checkedA"
                        color="primary"
                      />
                    }
                    label={
                      <span>
                        Publish my class to marketplace
                        <Typography variant="body2" color="textSecondary">
                          (This will make your class visible to others)
                        </Typography>
                      </span>
                    }
                  />
                  {/*<FormControlLabel
                    control={
                      <Checkbox
                        checked={this.state.d2l}
                        onChange={evt => this.setState({'d2l': !this.state.d2l})}
                        name="checkedB"
                        color="primary"
                      />
                    }
                    label={
                      <span>
                        Publish my class to D2L
                        <Typography variant="body2" color="textSecondary">
                          (This will make your class visible to others within D2L)
                        </Typography>
                      </span>
                    }
                  />*/}
                </>
              }
              {this.props.dashboard === "template" &&
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  label="Save Description(Optional)"
                  value={this.state.save_description}
                  rows={5}
                  onChange={evt => this.setState({save_description: evt.target.value})}
                  multiline
                  id="Policy"
                  autoFocus
                  inputRef={input => input && input.focus()}
                />
              }
              {this.props.dashboard === 'classnetwork' &&
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  label="Type redeploy"
                  value={this.state.network_redeploy}
                  onChange={evt => this.setState({network_redeploy: evt.target.value})}
                  autoFocus
                  inputRef={input => input && input.focus()}
                />
              }
              {this.props.dashboard === 'nodepanel' &&
                <div className="row">
                  <div className="col-md-12">
                     <Form.Group className="row">
                         <div className="col-sm-12">
                           <TextField
                             fullWidth
                             size="small"
                             variant="outlined"
                             label="Lab Template version"
                             value={this.state.template_version}
                             type='number'
                             required
                             inputProps={{ min: this.state.template_version + 0.1, step: 0.1 }}
                             onChange={evt => this.setState({template_version: evt.target.value})}
                           />
                         </div>
                     </Form.Group>
                  </div>
                  <div className="col-md-12">
                      <Form.Group className="row">
                          <div className="col-sm-12">
                            <TextField
                              fullWidth
                              size="small"
                              variant="outlined"
                              label="Lab Template Description"
                              value={this.state.template_description}
                              rows={5}
                              multiline
                              onChange={evt => this.setState({template_description:evt.target.value})}
                            />
                          </div>
                      </Form.Group>
                  </div>
                </div>
              }
          </DialogContent>
          <DialogActions>
            <Button onClick={this.handleClose} color="primary">
                Cancel
            </Button>
            {this.props.dashboard === 'nodepanel' &&
              <Button onClick={this.handleOverride} color="primary">
                  override
              </Button>
            }
            <Tooltip title={this.props.dashboard === 'nodepanel' && this.props.versionHistory.length > 3 ?
                            "Maximum template version count reached" : "Save/Agree"}>
              <span>
                <Button onClick={this.handleAgree} color="primary"
                disabled={(this.state.network_redeploy !== 'redeploy' && this.props.dashboard === 'classnetwork') ||
                            (this.props.dashboard === 'nodepanel' && this.props.versionHistory.length > 2 )}>
                    {this.props.dashboard === 'nodepanel' ? 'Save as new version' : 'Agree' }
                </Button>
              </span>
            </Tooltip>
          </DialogActions>
      </Dialog>
    );
  }
}

export default PolicyDialog;
