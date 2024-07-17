import React, { Component } from "react";
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import Slide from "@material-ui/core/Slide";
import WarningIcon from '@material-ui/icons/Warning';
import Button from '@material-ui/core/Button';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

class WarningDialog extends Component {
  constructor(props) {
      super(props);
      this.state = {
        warningTimer: ''
      }
  }

  componentDidMount(){
    const warningTime = new Date().setMinutes(new Date().getMinutes() + 10);
    this.interval = setInterval(() => {
      // Get today's date and time
      var now = new Date().getTime();
      // Find the distance between now and the env_SessionTime
      var distance = warningTime - now;
      // Time calculations for minutes and seconds
      var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      var seconds = Math.floor((distance % (1000 * 60)) / 1000);

      this.setState({warningTimer: minutes + "min " + seconds + "s "})
      // If the count down is over, write some text
      if (distance < 0) {
        clearInterval(this.interval);
        this.props.poweroff();
      }
    }, 1000);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <Dialog
          open={this.props.open}
          TransitionComponent={Transition}
          keepMounted
          onClose={this.props.close}
          aria-labelledby="alert-dialog-slide-title"
          aria-describedby="alert-dialog-slide-description"
          style={{zIndex: 100000}}
      >
          <DialogTitle
              id="alert-dialog-slide-title">You Have Been Idle!</DialogTitle>
          <DialogContent>
              <DialogContentText id="alert-dialog-slide-description">
                <WarningIcon/>Due to user inactivity, the machine will shutdown in <span className="badge badge-danger">{this.state.warningTimer}</span>,
                <br/>and the browser tab will automatically close. Do you want to stay?
              </DialogContentText>
          </DialogContent>
          <DialogActions>
              <Button variant="outlined" onClick={this.props.close} color="primary">
                  Stay
              </Button>
          </DialogActions>
      </Dialog>
    );
  }
}

export default WarningDialog;
