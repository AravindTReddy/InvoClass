import React, { Component } from 'react';
import moment from 'moment';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import WarningDialog from '../../shared/DialogBox/WarningDialog'
import Navbar from '../../shared/Navbar'
import Utils from '../../shared/Utils';
import CreateIcon from '@mui/icons-material/Create';
import UpdateIcon from '@mui/icons-material/Update';
import TimerIcon from '@mui/icons-material/Timer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DnsIcon from '@mui/icons-material/Dns';
import Tooltip from '@material-ui/core/Tooltip';
import SaveIcon from '@material-ui/icons/Save';
import PolicyDialog from '../../shared/DialogBox/PolicyDialog';
import Functions from './Functions';
import IconButton from '@material-ui/core/IconButton';

class TemplateLab extends Component {
  constructor(props) {
    super(props);
    this.state = {
      primary_color: '#F38A2C',
      secondary_color: '#606060',
      show: false,
      idleTimer: '',
      active_lab: [],
      saveImage: false,
      saveImageData: [],
      lab_url: '',
      token: ''
    }
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleCloseDialog = this.handleCloseDialog.bind(this)
  }
  async componentDidMount() {
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    var userImages = JSON.parse(localStorage.getItem('images'));
    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const template_id = urlParams.get('template_id')
    const lab_url = urlParams.get('url')
    const token = urlParams.get('token')
    // if(userImages!== null){
    //   const index = userImages.findIndex(img => img.lab_id === lab_id);
    //   if(index > -1){
    //     this.setState({active_lab: userImages[index], lab_url: lab_url, token: token})
    //   }
    // }
    if(userTemplates!== null){
      const index = userTemplates.findIndex(temp => temp.template_id === template_id);
      if(index > -1){
        this.setState({active_lab: userTemplates[index], lab_url: lab_url, token: token})
      }
    }
    if(appearanceObject !== null && userAuthDetails !== null && userDetails !== null){
      await this.setState({
        primary_color: JSON.parse(appearanceObject).primary_color,
        secondary_color: JSON.parse(appearanceObject).secondary_color,
        logo: JSON.parse(appearanceObject).logo_image,
        mini_logo: JSON.parse(appearanceObject).minilogo_image,
        bg_image: JSON.parse(appearanceObject).bg_image,
        user: JSON.parse(userAuthDetails).user,
        access_token: JSON.parse(userAuthDetails).access_token,
        refresh_token: JSON.parse(userAuthDetails).refresh_token,
        id_token: JSON.parse(userAuthDetails).id_token,
        role: JSON.parse(userDetails).role,
        customer_id: JSON.parse(userDetails).customer_id,
        userIcon: JSON.parse(userDetails).userIcon,
        user_first_name: JSON.parse(userDetails).user_first_name,
        user_last_name: JSON.parse(userDetails).user_last_name,
        loaded: true
      });
    }
    window.addEventListener('load', this.refocusGuacamole);
    document.addEventListener('click', this.refocusGuacamole);
    document.addEventListener('keydown', this.refocusGuacamole);
    window.addEventListener('resize', this.refocusGuacamole);
    document.addEventListener("visibilitychange", this.handleVisibilityChange, false);

    // this.interval = setInterval(() => {
    //   // Get today's date and time
    //   var now = new Date().getTime();
    //   // Find the sessionTimer between now and the env_SessionTime
    //   var sessionTimer = this.state.env_SessionTime - now;
    //   // Time calculations for hours, minutes and seconds
    //   var hours = Math.floor((sessionTimer % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    //   var minutes = Math.floor((sessionTimer % (1000 * 60 * 60)) / (1000 * 60));
    //   var seconds = Math.floor((sessionTimer % (1000 * 60)) / 1000);
    //
    //   this.setState({sessionTimer: hours + "h "+ minutes + "m " + seconds + "s "})
    //   // If the count down is over, write some text
    //   if (sessionTimer < 0) {
    //     // clearInterval(this.interval);
    //     this.setState({sessionTimer: '2 hour window exceeded'})
    //   }
    // }, 1000);
  }

  componentWillUnmount() {
    window.removeEventListener('load', this.refocusGuacamole);
    document.removeEventListener('click', this.refocusGuacamole);
    document.removeEventListener('keydown', this.refocusGuacamole);
    window.removeEventListener('resize', this.refocusGuacamole);
  }

  refocusGuacamole() {
    // Do not refocus if focus is on an input field
    var focused = document.activeElement;
    if (focused && focused !== document.body){
      return;
    }
    // Ensure iframe is focused
    // iframe.focus(); //freaking guac documentation
    const iframe = document.getElementById("env_iframe");
    iframe.contentWindow.focus();
  };

  makeFullScreen() {
    const element = document.getElementById("env_iframe");
    // Ensure iframe is focused
    element.contentWindow.focus();
    // These function will not exist in the browsers that don't support fullscreen mode yet,
    // so we'll have to check to see if they're available before calling them.
    if (element.mozRequestFullScreen) {
      // This is how to go into fullscren mode in Firefox
      // Note the "moz" prefix, which is short for Mozilla.
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullScreen) {
      // This is how to go into fullscreen mode in Chrome, IE and Safari
      // Both of those browsers are based on the Webkit project, hence the same prefix.
      element.webkitRequestFullScreen();
    } else if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.msRequestFullscreen) { /* IE11 */
      element.msRequestFullscreen();
    }
  }

  handleCloseDialog = () => {
    this.setState({show: false, idleTimer: ''});
    clearInterval(this.timer);
  };

  handlePoweroff = () => {
    this.setState({show: false, idleTimer: ''});
    this.poweroffVM();
  };

  handleVisibilityChange = () => {
    if(document.hidden) {
      // console.log('the page is hidden');
      this.setState({isVisible: false})
      this.idleTimer('start');
    } else {
      // console.log('the page is visible');
      this.setState({isVisible: true})
      this.idleTimer('stop');
    }
  }

  idleTimer = (value) => {
    var loadedTime = new Date().getTime();
    if(value === 'start'){
      this.timer = setInterval(() => {
        // Get today's date and time
        var now = new Date().getTime();
        var timeDifference = (now - loadedTime);
        var secondsInADay = 60 * 60 * 1000 * 24, secondsInAHour = 60 * 60 * 1000;
        var h = Math.floor((timeDifference % (secondsInADay)) / (secondsInAHour) * 1);
        var m = Math.floor(((timeDifference % (secondsInADay)) % (secondsInAHour)) / (60 * 1000) * 1);
        var s = Math.floor((((timeDifference % (secondsInADay)) % (secondsInAHour)) % (60 * 1000)) / 1000 * 1);

        this.setState({idleTimer: h + "h "+ m + "m " + s + "s "})
        if(timeDifference > 30 * 60 * 1000){ //30 minutes
          this.setState({show: true})
        }
      }, 1000);
    }else {
      //reset the Timer
      clearInterval(this.timer);
      this.setState({idleTimer: ''})
    }
  }

  /**
  * To stop the image VM on demand
  * @param  {Object} item VM details object
  * @return {JSON}  response with a success custom message
  */
  poweroffVM = async () => {
    await Utils.stopVM(this.state.active_lab.template_id, this.state.active_lab.vm_name)
    .then(data => {
      window.close();
    })
    .catch(err => { throw err });
  };

  saveImageDialog = async() => {
    this.setState({
      saveImage: true,
      saveImageData: this.state.active_lab
    })
  };

  handleClose = () => {
    this.setState({saveImage: false});
    const element = document.getElementById("env_iframe");
    // Ensure iframe is focused
    element.contentWindow.focus();
  }

  saveTemplateVM = (item, description) => {
    this.setState({saveImage: false});
    Utils.addinfoNotification("Capturing and saving template, This process will take some time and you will loose access to this machine.")
    //may be a notification here about the initiate
    Functions.saveTemplateVM(item, description, this.state.customer_id, this.state.user)
    .then((data) => {
      if(data.success === "success"){
        Utils.addsuccessNotification("Successfully captured and saved template. Now you can create new VM using the template.")
      }
    })
    .catch((error) => { throw error });
    //here we should hold for atleast 10 seconds & close the window.
    setTimeout(() => {
      window.close();
    }, 10000)
  }

  render () {
    const {active_lab, lab_url, token} = this.state;
    return (
      <div>
        <div class="page-header">
          <div class="btn-group pull-right header-btn-group" role="group" aria-label="...">
            <Tooltip title="Name">
              <p>
                <DnsIcon/><span>{active_lab!== undefined && active_lab.name}</span>
              </p>
            </Tooltip>&nbsp;&nbsp;
            <Tooltip title="Status"><p>
                <AssessmentIcon/><span>{active_lab!== undefined && active_lab.vm_status}</span>
            </p></Tooltip>&nbsp;&nbsp;
            <Tooltip title="Last Activity">
              <p id="activity">
                <UpdateIcon/><span>{active_lab.vm_updated_time!== undefined ?
                      moment(active_lab.vm_updated_time * 1000).format('MMM-DD-YYYY HH:mm:ss A') :
                    moment(active_lab.updated_ts * 1000).format('MMM-DD-YYYY HH:mm:ss A')}</span>
              </p>
            </Tooltip>&nbsp;&nbsp;
            {/*<button type="button" class="btn btn-default">
              <Tooltip title="Session Timer">
                <p id="timer">
                  <TimerIcon/><span>{this.state.sessionTimer}{this.state.idleTimer}</span>
                </p>
              </Tooltip>
            </button>*/}
            <Tooltip title="Fullscreen Mode" style={{cursor: 'pointer'}}>
              <p onClick={() => {this.makeFullScreen()}} id="fullscreen">
                <FullscreenIcon/>
              </p>
            </Tooltip>&nbsp;&nbsp;
            <Tooltip title={active_lab.version_history !== undefined && active_lab.version_history.length > 2 ?
                      "Maximum template version count reached"  : "Save Template" } style={{cursor: 'pointer'}}>
              <span>
                <IconButton
                  size='small'
                  disabled= { active_lab.version_history !== undefined && active_lab.version_history.length > 2 ?
                              true : false}
                  onClick={() => this.saveImageDialog()}>
                    <SaveIcon/>
                </IconButton>
              </span>
            </Tooltip>
            {/*<button type="button" class="btn btn-default">
            <Tooltip title="Created">
              <p id="created">
                <CreateIcon/><span>{moment(this.state.env_created_time * 1000).format('MMM-DD-YYYY HH:mm:ss A')}</span>
              </p>
            </Tooltip>
            </button>*/}
          </div>
        </div>
        <div className="body">
          <iframe
            title="template machine"
            src ={lab_url + '/#/?token=' +token}
            width="100%"
            allow="fullscreen"
            id="env_iframe"
            frameBorder="0"
            overflow="scroll"
            scrolling="yes"
            loading="lazy"
            className="env_iframe"
          />
          {/*<div id="overlay"></div>*/}
          {this.state.show && (
            <WarningDialog
                open={this.state.show}
                close={this.handleCloseDialog}
                poweroff={this.handlePoweroff}
            />
          )}
          {/*A dialog box to save image description before a new image version is created*/}
          {this.state.saveImage &&
            <PolicyDialog dashboard="template"
              open={this.state.saveImage}
              data={this.state.saveImageData}
              close={this.handleClose}
              create={this.saveTemplateVM}/>
          }
        </div>
        {/*<div className="footer_login"><Footer/></div>*/}
      </div>
    )
  }
}

export default TemplateLab;
