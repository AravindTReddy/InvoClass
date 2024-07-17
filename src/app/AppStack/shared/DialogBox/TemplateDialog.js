import React, { Component } from "react";
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import TextField from '@material-ui/core/TextField';
import Slide from "@material-ui/core/Slide";
import WarningIcon from '@material-ui/icons/Warning';
import Button from '@material-ui/core/Button';
import Template from '../../admin/TemplateManagement'
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

class TemplateDialog extends Component {
  constructor(props) {
      super(props);
      this.state = {
        deleteMessage: ''
      }
  }

  handleClose = async() => {
    await this.setState({deleteMessage: ''})
    this.props.close();
  }

  render() {

    return (
      <Dialog
        fullScreen
        open={this.props.open}
        onClose={this.handleClose}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={this.handleClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Button color="inherit" onClick={this.handleClose}>
              Back to class creation
            </Button>
          </Toolbar>
        </AppBar>
        <>
        <Template/>
        </>
      </Dialog>
    );
  }
}

export default TemplateDialog;
