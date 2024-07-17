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

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

class DeleteDialog extends Component {
  constructor(props) {
      super(props);
      this.state = {
        deleteMessage: ''
      }
  }

  handleDelete = () => {
    this.props.delete(this.props.data);
    this.setState({deleteMessage: ''})
  }

  handleClose = async() => {
    await this.setState({deleteMessage: ''})
    this.props.close();
  }

  render() {
    if(this.props.dashboard === 'class'){
      var title = this.props.data.class_name;
      var message = `Warning! Deleting the ` + this.props.data.class_name + ` class is irreversible.
                    The action you are about to take cant be undone.
                    Going further will delete this class and all the resources in it permanently.`;
      var label = "class name";
    } else if(this.props.dashboard === 'course'){
        title = this.props.data.course_name;
        message = `Warning! Deleting the ` + this.props.data.course_name + ` course is irreversible.
                   The action you are about to take cant be undone.
                   Going further will delete this course and all the resources in it permanently.`;
        label = "course name"
    } else if(this.props.dashboard === 'image'){
        title = this.props.data.image_name;
        message = `Warning! Deleting the ` + this.props.data.image_name + ` image is irreversible.
                   The action you are about to take cant be undone.
                   Going further will delete this image and all the resources in it permanently.`;
        label = "image name"
    } else if(this.props.dashboard === 'customer'){
        title = this.props.data.customer_org_name;
        message = `Warning! Deleting the ` + this.props.data.customer_org_name + ` customer is irreversible.
                   The action you are about to take cant be undone.
                   Going further will delete this customer and all the resources in it permanently.`;
        label = "customer name"
    } else if(this.props.dashboard === 'user'){
        title = 'user(s)';
        message = `Warning! Deleting the user(s) is irreversible. The action you are about to take cant be undone.
                   Going further will delete the user and the user can no longer use OmniFSI.`;
        label = "delete"
    } else if (this.props.dashboard === "environment") {
        title = this.props.data.name;
        message = `Warning! Deleting the ` + this.props.data.name + ` environment is irreversible.
                   The action you are about to take cant be undone.
                   Going further will delete this environment and all the resources in it permanently.`;
        label = "environment name"
    } else if (this.props.dashboard === "template") {
        title = this.props.data.name;
        message = `Warning! Deleting the ` + this.props.data.name + ` template is irreversible.
                   The action you are about to take cant be undone.
                   Going further will delete this template and all the resources in it permanently.`;
        label = "template name"
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
      >
          <DialogTitle
              id="alert-dialog-slide-title">{`${ 'Are you sure you want to delete ' } "${ title }"?`}</DialogTitle>
          <DialogContent>
              <DialogContentText id="alert-dialog-slide-description">
                <WarningIcon/>{message}
              </DialogContentText>
              <TextField
                fullWidth
                size="small"
                label={label}
                value={this.state.deleteMessage}
                type='text'
                required
                helperText={`To confirm deletion, type ${ label } in the text input field.`}
                onChange={evt => this.setState({'deleteMessage': evt.target.value})}
                autoFocus
                inputRef={input => input && input.focus()}
              />
          </DialogContent>
          <DialogActions>
              <Button onClick={this.handleClose} color="primary">
                  Cancel
              </Button>
              {this.props.dashboard === 'user' ?
                <Button onClick={this.handleDelete} color="primary"
                        disabled={this.state.deleteMessage !== label}>
                    Delete
                </Button> :
                <Button onClick={this.handleDelete} color="primary"
                        disabled={this.state.deleteMessage !== title}>
                    Delete
                </Button>
              }
          </DialogActions>
      </Dialog>
    );
  }
}

export default DeleteDialog;
