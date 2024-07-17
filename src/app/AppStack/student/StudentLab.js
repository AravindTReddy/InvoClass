import React, { Component } from 'react';
import moment from 'moment';
import FullscreenIcon from '@material-ui/icons/Fullscreen';
import WarningDialog from '../shared/DialogBox/WarningDialog'
import Navbar from '../shared/Navbar'
import Utils from '../shared/Utils';
import { reactAPIURL, socketUrl } from "../shared/General.js";
import { toast } from 'react-toastify';
import CreateIcon from '@mui/icons-material/Create';
import UpdateIcon from '@mui/icons-material/Update';
import TimerIcon from '@mui/icons-material/Timer';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DnsIcon from '@mui/icons-material/Dns';
import Tooltip from '@material-ui/core/Tooltip';
import Switch from '@material-ui/core/Switch';
import loaderImg from "../../../assets/images/loader.gif";
import { w3cwebsocket as W3CWebSocket } from "websocket";

class StudentLab extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      primary_color: '#F38A2C',
      secondary_color: '#606060',
      show: false,
      idleTimer: '',
      checkedOTS: false,
      onScreenLoader: true,
      item: '',
      url: ''
    }
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleCloseDialog = this.handleCloseDialog.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }
  //componentDidMount() is invoked immediately after a component is mounted
  async componentDidMount() {
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    var assignedStudents = JSON.parse(localStorage.getItem('assignedStudents'));
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const lab_url = atob(urlParams.get('url'));
    const item = JSON.parse(atob(urlParams.get('item')));
    if(item!== undefined && item!== null && lab_url !== null){
      this.setState({item: item, url: lab_url})
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
    //
    this.interval = setTimeout(() => {
      this.setState({onScreenLoader: false})
    }, 5000);

    const client = new W3CWebSocket(socketUrl +'?email=' + JSON.parse(userAuthDetails).user);
    client.onopen = () => {
        // console.log('WebSocket Client Connected');
    };
    client.onmessage = (message) => {
        toast.dismiss();
        Utils.addsuccessNotification(message.data);
        if(message.data){
          //here we can do progress bar
        }
    };
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
    if (focused && focused !== document.body)
        return;
    // Ensure iframe is focused
    // iframe.focus(); //freaking guac documentation
    const iframe = document.getElementById("env_iframe");
    iframe.contentWindow.focus();
  };

  makeFullScreen() {
    var element = document.getElementById("env_iframe");
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
    await Utils.stopVM(this.state.item.student_id, this.state.item.vm_name)
    .then(data => {
      window.close();
    })
    .catch(err => { throw err });
  };

  //OTS share toogle onchange handler function to update state
  handleChange = async() => {
    if(this.state.checkedOTS === true){
      await this.setState({checkedOTS: false})
      this.deleteOtsLink();
      this.refocusGuacamole();
    }
    else{
      await this.setState({checkedOTS: true})
      this.createOtsLink();
      this.refocusGuacamole();
    }
    const element = document.getElementById("env_iframe");
    // Ensure iframe is focused
    element.contentWindow.focus();
  }

  /**
  * To share the lab URL with instructor(Over the shoulder capability)
  * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
  * @param  {String} class_id unique class identifier
  * @param  {String} course_id unique course identifier
  * @param  {String} student_email student email id
  * @return {JSON}  response with a success custom message and statusCode
  */
  createOtsLink = async()=>{
    if(this.state.checkedOTS === false){
    }else{
      Utils.addinfoNotification('Starting over the shoulder capability...');
      fetch(reactAPIURL + 'createotslink', {
        method: 'post',
        headers:{
          'Accept': 'application/json',
          'Content-type': 'application/json',
          'Authorization': this.state.id_token
        },
        body:JSON.stringify({
          "class_id": this.state.item.class_id,
          "student_id": this.state.item.student_id,
          "student_email": this.state.item.student_email,
          "refresh_token": this.state.refresh_token,
          "vm_name": this.state.item.vm_name,
          "instructor": this.state.item.class_educators[0]
        })
      })
      .then((response) => response.json())
        .then(responseJson => {
          // console.log(responseJson);
          toast.dismiss();
          if(responseJson.statusCode === 200){
            Utils.addsuccessNotification('Sharable URL for the lab is created and shared with the instructor')
          }
          else if(responseJson.statusCode === 500){
            Utils.adderrorNotification(responseJson.message);
          } else {
            Utils.adderrorNotification('Error creating sharable URL! Please try again later.')
          }
        })
        .catch((error)=>{
          toast.dismiss();
          Utils.adderrorNotification('Error creating sharable URL! Please try again later: ' + <br/> + error)
        });
      }
  }
  /**
    * To stop sharing the lab URL with instructor(Over the shoulder capability)
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} class_id unique class identifier
    * @param  {String} student_email student email id
    * @return {JSON}  response with a success custom message and statusCode
  */
  deleteOtsLink = async()=>{
    if(this.state.checkedOTS === true){
    }else{
      Utils.addinfoNotification('Stopping over the shoulder capability...');
      fetch(reactAPIURL + 'deleteotslink', {
        method: 'post',
        headers:{
          'Accept': 'application/json',
          'Content-type': 'application/json',
          'Authorization': this.state.id_token
        },
        body:JSON.stringify({
          "class_id": this.state.item.class_id,
          "student_id": this.state.item.student_id,
          "student_email": this.state.item.student_email,
          "refresh_token": this.state.refresh_token,
          "vm_name": this.state.item.vm_name,
          "instructor": this.state.item.instructor_email
        })
      })
      .then((response) => response.json())
          .then(responseJson => {
            toast.dismiss();
            // console.log(responseJson);
            this.setState({disabled: false})
            if(responseJson.statusCode === 200 && responseJson.message === "success"){
              Utils.addsuccessNotification('Sharable URL for the lab is deleted and stopped sharing with the instructor')
            }
            else{
              Utils.adderrorNotification('Error deleting sharable URL! Please try again later.')
            }
          })
        .catch((error)=>{
          toast.dismiss();
          Utils.adderrorNotification('Error deleting sharable URL! Please try again later: ' + <br/> + error)
          this.setState({disabled: false})
        });
      }
  }

  render () {
    const {item, url} = this.state;
    return (
      <div>
        <div class="page-header">
          <div class="btn-group pull-right header-btn-group" role="group" aria-label="...">
            <Tooltip title="Name">
              <p><DnsIcon/><span>{item!== undefined && item.vm_name}</span></p>
            </Tooltip>&nbsp;&nbsp;
            <Tooltip title="Status">
              <p>
                <AssessmentIcon/><span>{item!== undefined && item.vm_status}</span>
              </p>
            </Tooltip>&nbsp;&nbsp;
            <Tooltip title="Last Activity">
              <p>
                <UpdateIcon/><span>{moment(item!== undefined && item.vm_updated_time * 1000).format('MMM-DD-YYYY HH:mm:ss A')}</span>
              </p>
            </Tooltip>&nbsp;&nbsp;
            {/*<Tooltip title="Session Timer">
              <p>
                <TimerIcon/><span>{this.state.sessionTimer}{this.state.idleTimer}</span>
              </p>
            </Tooltip>*/}
            <Tooltip title="Fullscreen Mode" style={{cursor: 'pointer'}}>
              <p onClick={() => {this.makeFullScreen()}} id="fullscreen">
                <FullscreenIcon/>
              </p>
            </Tooltip>&nbsp;&nbsp;
            <Tooltip title="Over The Shoulder: Allow the instructor to access your computer to help you">
              <p id="ots">
                 OTS<span>
                      <Switch
                        checked={this.state.checkedOTS}
                        onChange={() => this.handleChange()}
                        name="checkedOTS"
                        color="primary"
                        size="small"
                      />
                    </span>
              </p>
            </Tooltip>
          </div>
        </div>
        <div className="body">
          <iframe
            title="student machine"
            src ={url}
            width="100%"
            allow="fullscreen"
            id="env_iframe"
            frameBorder="0"
            overflow="scroll"
            scrolling="yes"
            loading="lazy"
            className="env_iframe"
          />
          {this.state.onScreenLoader && (
            <div className="loader-container">
              <div className="loader">
                <img src={loaderImg} alt="load spinner" className="fSImage"></img><br/>
                <span>Loading your machine environment...</span>
              </div>
            </div>
          )}
          {/*<div id="overlay"></div>*/}
          {this.state.show && (
            <WarningDialog
                open={this.state.show}
                close={this.handleCloseDialog}
                poweroff={this.handlePoweroff}
            />
          )}
        </div>
        {/*<div className="footer_login"><Footer/></div>*/}
      </div>
    )
  }
}

export default StudentLab;
