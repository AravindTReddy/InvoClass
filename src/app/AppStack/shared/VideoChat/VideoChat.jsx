import React, { Component } from "react";
import {Dropdown, Spinner, Form} from 'react-bootstrap';
import Tooltip from '@material-ui/core/Tooltip';
import { reactAPIURL, userIcons } from "../General.js";
import uuid from 'react-uuid';
import { toast } from 'react-toastify';
import Utils from '../Utils';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import IconButton from '@material-ui/core/IconButton';
import Divider from '@material-ui/core/Divider';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import CallMadeIcon from '@material-ui/icons/CallMade';
import CallReceivedIcon from '@material-ui/icons/CallReceived';
import CallMissedIcon from '@material-ui/icons/CallMissed';
import CallMissedOutgoingIcon from '@material-ui/icons/CallMissedOutgoing';
import moment from 'moment';
import VideoCallIcon from '@material-ui/icons/VideoCall';
import VideocamOffIcon from '@material-ui/icons/VideocamOff';
import VideocamIcon from '@material-ui/icons/Videocam';
import CachedIcon from '@material-ui/icons/Cached';
import CloseIcon from '@material-ui/icons/Close';
import { StyleSheet, css } from 'aphrodite';
import Button from '@mui/material/Button';

class VideoChat extends Component {
  constructor(props) {
    super(props);
    this.state = {
        show: false,
        videochatEvents: [],
        width: window.innerWidth/3,
        height: window.innerHeight,
        anchorEl: null,
        users: [],
        guestList: [],
        key: false,
    }
  }

  async componentDidMount() {
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    if(appearanceObject !== null && userAuthDetails !== null && userDetails !== null){
      await this.setState({
        primary_color: JSON.parse(appearanceObject).primary_color,
        secondary_color: JSON.parse(appearanceObject).secondary_color,
        user: JSON.parse(userAuthDetails).user,
        refresh_token: JSON.parse(userAuthDetails).refresh_token,
        id_token: JSON.parse(userAuthDetails).id_token,
        role: JSON.parse(userDetails).role,
        customer_id: JSON.parse(userDetails).customer_id,
        user_first_name: JSON.parse(userDetails).user_first_name,
        user_last_name: JSON.parse(userDetails).user_last_name,
      });
      this.readVideoChatEvents();
      Utils.getCustomerUsers(this.state.user, this.state.role,
        this.state.customer_id, this.state.refresh_token, 'default')
      .then(data => {
        var users = [];
        data.forEach((item) => {
          if(this.state.role ==='student'){
            if(this.state.user !== item.user_email && item.user_role!== 'student'){
                users.push({
                  customer_id: item.customer_id,
                  user_first_name: item.user_first_name,
                  user_last_name: item.user_last_name,
                  user_role: item.user_role,
                  user_email: item.user_email
                })
            }
          }else {
            if(this.state.user !== item.user_email){
                users.push({
                  customer_id: item.customer_id,
                  user_first_name: item.user_first_name,
                  user_last_name: item.user_last_name,
                  user_role: item.user_role,
                  user_email: item.user_email
                })
            }
          }
        })
        this.setState({users: users, loaded_users: true});
      })
      .catch(err => {
          throw err;
      });
    }
    window.addEventListener('resize', this.updateDimensions);
  }

  updateDimensions = () => {
    this.setState({ width: window.innerWidth/3, height: window.innerHeight });
  };

  /**
 * Get the list of all videochat events under the logged in user
 * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
 * @param  {String} customer_id The unique customer ID of the current logged in user
 * @param  {String} role logged in user role
 * @param  {String} user logged in user email
 * @return {JSON}  array of objects from the respective database
 */
  readVideoChatEvents = async() => {
    await this.setState({loaded_videochatEvents: false, videochatEvents: []})
    var videochatEvents = [];
    fetch(reactAPIURL + 'readvideochatevents', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
        'Authorization': this.state.id_token
      },
      body:JSON.stringify({
        "refresh_token": this.state.refresh_token,
        "customer_id": this.state.customer_id,
        "role": this.state.role,
        "user": this.state.user
      })
    })
    .then((response) => response.json())
      .then(async responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body !== null && responseJson.body.length>=1){
            await responseJson.body.sort(function(a, b) {
              var c = new Date(a.updated_ts);
              var d = new Date(b.updated_ts);
              return d-c;
            });
            videochatEvents = responseJson.body.map((item) => {
              return item
            });
          }
        }else{
          Utils.adderrorNotification(responseJson.errorMessage)
        }
        this.setState({
          videochatEvents: videochatEvents,
          loaded_videochatEvents: true
        })
      })
    .catch((error)=>{
      throw error;
    });
  }

  /**
  * To invite users to join video chat (both 1 on 1 and group)
  * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
  * @param  {String} customer_id The unique customer ID of the current logged in user
  * @param  {String} type invite type
  * @param  {Object} videochat_event below created object with sender and receiver details
  * @return {JSON}  response with a success and statusCode
  */
  async createVideoChatInvite(item, type, e){
    //guestList is an array of users(receivers)
    e.preventDefault();
    await this.setState({disabled: true});
    Utils.addinfoNotification('Sending video chat invite...');
    if(type === 'invite'){
      var videochat_event = {
        callID: item,
        callSenderEmail: this.state.user,
        callSenderName: this.state.user_first_name + ' ' + this.state.user_last_name,
        callSenderRole: this.state.role,
        callReceiver: this.state.guestList,
        callDate: new Date(),
        callDuration: 'pending',
        videoConference: 'video'
      };
    }else{
      if(item.videochat_event.callSenderEmail !== this.state.user){
        videochat_event = {
          videochatID: item.videochat_id,
          callID: item.videochat_event.callID,
          callSenderEmail: this.state.user,
          callSenderName: this.state.user_first_name + ' ' + this.state.user_last_name,
          callSenderRole: this.state.role,
          callReceiver: [{
            user_email: item.videochat_event.callSenderEmail,
            user_first_name: item.videochat_event.callSenderName.split(" ")[0],
            customer_id: this.state.customer_id,
            user_last_name: item.videochat_event.callSenderName.split(" ")[1],
            user_role: item.videochat_event.callSenderRole
          }],
          callDate: new Date(),
          callDuration: 'pending',
          videoConference: 'video'
        };
      }else {
        videochat_event = {
          videochatID: item.videochat_id,
          callID: item.videochat_event.callID,
          callSenderEmail: item.videochat_event.callSenderEmail,
          callSenderName: item.videochat_event.callSenderName,
          callSenderRole: item.videochat_event.callSenderRole,
          callReceiver: item.videochat_event.callReceiver,
          callDate: new Date(),
          callDuration: 'pending',
          videoConference: 'video'
        };
      }
    }
    fetch(reactAPIURL + 'createvideochatinvite', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
        'Authorization': this.state.id_token
      },
      body:JSON.stringify({
        "refresh_token": this.state.refresh_token,
        "customer_id": this.state.customer_id,
        "videochat_event": videochat_event,
        "type": type
      })
    })
    .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        this.setState({
          disabled: false,
          open_search: false,
          anchorEl: null,
          class_id: '',
          class_name: '',
          guestList: [],
          key: !this.state.key
        })
        toast.dismiss();
        if(responseJson.message === "success" && responseJson.statusCode === 200){
          Utils.addsuccessNotification('Invite sent successfully.')
          this.readVideoChatEvents();
        }else {
          Utils.adderrorNotification('Error sending invite to the user: ' + responseJson.errorMessage )
        }
      })
    .catch((error)=>{
      toast.dismiss();
      Utils.adderrorNotification('Error sending invite to the user: ' + error )
    });
  }
  /**
  * To decline/delete an video chat invitation (only 1 on 1 for now)
  * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
  * @param  {String} customer_id The unique customer ID of the current logged in user
  * @param  {Object} item videochat event object with sender and receiver details(created during videochat invite)
  * @return {JSON}  response with a success and statusCode
  */
  async deleteVideoChatInvite(item){
    Utils.addinfoNotification('Declining video chat invite...');
    fetch(reactAPIURL + 'deletevideochatinvite', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
        'Authorization': this.state.id_token
      },
      body:JSON.stringify({
        "refresh_token": this.state.refresh_token,
        "customer_id": this.state.customer_id,
        "videochat_event": item
      })
    })
    .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        toast.dismiss();
        if(responseJson.message === "success" && responseJson.statusCode === 200){
          Utils.addsuccessNotification('Invite declined successfully.')
          this.readVideoChatEvents();
        }else {
          Utils.adderrorNotification('Error declining invite: ' + responseJson.errorMessage )
        }
      })
    .catch((error)=>{
      toast.dismiss();
      Utils.adderrorNotification('Error declining invite: ' + error )
    });
  }


  handleAutocompleteKeyPress = (event, value) => {
    if (event.key === 'Enter' && !this.state.users.includes(value)) {
      event.preventDefault(); // Prevent Enter key behavior
    }
  };

  render() {
    const styles = StyleSheet.create({
      cardheader: {
        backgroundColor: 'white',
        color: this.state.primary_color,
      },
      button: {
        ':hover': {
            color: this.state.secondary_color,
        }
      },
      navitem: {
        color: this.state.primary_color,
        ':hover': {
            color: this.state.secondary_color,
            textDecoration: 'none',
        }
      },
      navitem_active: {
        color: this.state.secondary_color,
        ':hover': {
            textDecoration: 'none',
            backgroundColor: 'rgba(74, 74, 74, 0)',
            color: this.state.primary_color,
        }
      },
    });
    return (
      <li className="nav-item nav-profile border-0 pl-3">
        <Dropdown alignRight show={this.props.videoChatDropdown}>
          <Tooltip title="Video chat">
            <Dropdown.Toggle onClick={ () => this.props.toggler('videoChatDropdown') }
              className={`${ this.props.videoChatDropdown ? 'nav-link active' : 'nav-link' }
                          ${ this.props.videoChatDropdown ? css(styles.navitem_active) : css(styles.navitem) }
                          count-indicator bg-transparent toggle-arrow-hide`}>
              <VideocamIcon/>
            </Dropdown.Toggle>
          </Tooltip>
          <Dropdown.Menu style={{ width: this.state.width }}
                         className="navbar-dropdown preview-list">
            <div className="card">
              <div className= {`${ 'card-header d-flex justify-content-between align-items-center' } ${ css(styles.cardheader) }`}>Video Chat
                <span>
                  <Tooltip title="refresh videochat events">
                    <CachedIcon className="refresh" onClick={() => {
                        this.readVideoChatEvents();
                    }}/>
                  </Tooltip>&nbsp;{' '}&nbsp;
                  <span data-toggle="tooltip" data-placement="top"
                     title="close">
                    <CloseIcon className="refresh" onClick={() => this.props.close('videoChatDropdown')}/>
                  </span>
                </span>
              </div>
              <div className="card-body" style={{
                height: 'calc(100vh - 130px)',
                overflow: 'auto'
              }}>
                 <form onSubmit={(e) => this.createVideoChatInvite(uuid(), 'invite', e)}>
                   <div className="row">
                     <div className="col-md-12">
                       <Form.Group className="row">
                         <div className="col-sm-12">
                           <Autocomplete
                             key={this.state.key}
                             multiple
                             noOptionsText= 'No users available'
                             options={this.state.users}
                             getOptionLabel={(option) => option.user_email}
                             renderOption={(option, { selected }) => (
                               <React.Fragment>
                                 <div style={{fontWeight: 'normal'}}>
                                   <span style={{fontSize: '13px'}}>
                                     {option.user_email}
                                   </span>
                                   <br />
                                   <span style={{fontSize: '11px', color: 'gray' }}>
                                     {option.user_first_name}{' '}{option.user_last_name}{' '}
                                     <span className="badge badge-success">{option.user_role}</span>
                                   </span>
                                 </div>
                               </React.Fragment>
                             )}
                             renderInput={(params) => <TextField {...params}
                                                         fullWidth
                                                         label="Search contacts"
                                                         required={this.state.guestList.length === 0}
                                                         variant="outlined" size="small"
                                                       />}
                             onChange={(event, newValue) => {
                               this.setState({guestList: newValue})
                             }}
                             autoHighlight
                             autoComplete
                             disableCloseOnSelect
                             onKeyDown={(event) => {
                               if (event.key === 'Enter' && !this.state.users.includes(event.target.value)) {
                                 event.preventDefault(); // Prevent Enter key behavior
                               }
                             }}
                           />
                         </div>

                       </Form.Group>
                     </div>
                     <div className="col-md-12">
                       <Form.Group className="row">
                         <div className="col-sm-6">
                           <Button disabled={this.state.disabled} type="submit"
                                   className="button">Send Invite
                           </Button>
                         </div>
                       </Form.Group>
                     </div>
                   </div>
                 </form>
                  {this.state.loaded_videochatEvents ?
                    <>
                    {this.state.videochatEvents.length > 0 ?
                      this.state.videochatEvents.map((item, index) => {
                        var name, userIcon;
                        if(item.videochat_event.callReceiver !== undefined && item.videochat_event.callReceiver.length === 1){
                          if(item.videochat_event.callSenderEmail === this.state.user){
                            name = item.videochat_event.callReceiver[0].user_first_name + ' ' + item.videochat_event.callReceiver[0].user_last_name
                            if(name)
                              name  = name
                            else
                              name = 'Unknown'
                            userIcons.map((entry) => {
                              if(entry.role === item.videochat_event.callReceiver[0].user_role){
                                userIcon = entry.icon;
                              }
                            })
                          }
                          else{
                            name = item.videochat_event.callSenderName
                            if(name === ' ')
                              name = 'Unknown'
                            else
                              name  = name
                            userIcons.map((entry) => {
                              if(entry.role === item.videochat_event.callSenderRole){
                                userIcon = entry.icon;
                              }
                            })
                          }
                        }
                        else{
                          name = ' Breakout Group'
                          userIcon = 'StudentGroup'
                        }
                        return(
                          <div key={index}>
                            <ListItem button>
                              <ListItemAvatar>
                                {item.videochat_event.callSenderEmail === this.state.user ?
                                  <>
                                  {item.videochat_event.videoConference === '' ?
                                    <Tooltip title="Call request declined">
                                     <CallMissedOutgoingIcon style={{fill: 'red'}}/>
                                    </Tooltip> :
                                   <Tooltip title="Call request made">
                                    <CallMadeIcon style={{fill: this.state.primary_color}}/>
                                   </Tooltip>
                                  }
                                  </> :
                                  <>
                                  {item.videochat_event.videoConference === '' ?
                                    <Tooltip title="You declined the call request">
                                     <CallMissedIcon style={{fill: 'red'}}/>
                                    </Tooltip> :
                                    <Tooltip title="Call request received">
                                     <CallReceivedIcon style={{fill: this.state.primary_color}}/>
                                    </Tooltip>
                                  }
                                  </>
                                }
                              </ListItemAvatar>
                              <ListItemAvatar>
                                <Avatar
                                  alt='userIcon'
                                  src={require(`../../../../assets/images/icons/gray/${userIcon}.png`)}
                                />
                              </ListItemAvatar>
                              <ListItemText
                                style={{color: this.state.primary_color}}
                                primary={name}
                                secondary={moment(item.videochat_event.callDate).format('MMMM DD, YYYY - HH:mm a')}
                              />
                              <ListItemSecondaryAction>
                                {item.videochat_event.videoConference === '' ?
                                  <Tooltip title="Call back">
                                    <IconButton
                                      edge="end" aria-label="invite"
                                      onClick={(e)=> this.createVideoChatInvite(item, 'reinvite', e)}
                                    >
                                      <VideocamIcon fontSize="large"/>
                                    </IconButton>
                                  </Tooltip> :
                                  <>
                                  <Tooltip title="Join call">
                                    <IconButton
                                      edge="end" aria-label="join"
                                      onClick={()=> Utils.joinMeetingModerator(
                                        item.videochat_event.callID, 'video call',
                                        this.state.user_first_name,
                                        this.state.user_last_name
                                      )}
                                    >
                                      <VideoCallIcon style={{fill: "green"}} fontSize="large"/>
                                    </IconButton>
                                  </Tooltip>
                                  {item.videochat_event.callSenderEmail === this.state.user ? null : <>
                                    {item.videochat_event.callReceiver.length === 1 && <Tooltip title="Decline call">
                                      <IconButton
                                        edge="end" aria-label="delete"
                                        onClick={()=> this.deleteVideoChatInvite(item)}
                                      >
                                        <VideocamOffIcon style={{fill: "red"}} fontSize="large"/>
                                      </IconButton>
                                    </Tooltip>
                                    } </>
                                  }
                                  </>
                                }
                                <IconButton aria-label="settings">
                                  <MoreVertIcon />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                            <Divider />
                          </div>
                        )
                      }): <p> No items to display </p>
                  }
                  </> : <div style={{color:this.state.primary_color}} className="d-flex justify-content-center">
                    <Spinner  animation="border" role="status">
                        <span className="sr-only">Loading...</span>
                    </Spinner>
                  </div>
                }
              </div>
            </div>
         </Dropdown.Menu>
        </Dropdown>
      </li>
    );
  }
}

export default VideoChat;
