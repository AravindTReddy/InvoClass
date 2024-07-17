import React, { Component } from "react";
import Utils from '../Utils';
import {Dropdown, Spinner, Form} from 'react-bootstrap';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import Typography from '@material-ui/core/Typography';
import CardContent from '@material-ui/core/CardContent';
import CachedIcon from '@material-ui/icons/Cached';
import Tooltip from '@material-ui/core/Tooltip';
import CloseIcon from '@material-ui/icons/Close';
import { StyleSheet, css } from 'aphrodite';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import moment from 'moment';
import parse from 'html-react-parser';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TabContext from '@mui/lab/TabContext';
import TabPanel from '@mui/lab/TabPanel';
import AnnouncementIcon from '@material-ui/icons/Announcement';
import CustomToast from '../CustomToast.js'
import { toast } from 'react-toastify';

class Resources extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: window.innerWidth,
      height: window.innerHeight,
      class_id: '',
      class_Announcements:[],
      class_Contents:[],
      loaded: false,
      loaded_resources: true,
      defaultTab: 1,
    }
    this.class_Change = this.class_Change.bind(this);
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
      });
    }
    await this.getCustomerClasses();
    window.addEventListener('resize', this.updateDimensions);
  }

  /**
  * To get the list of classes available under a specific customer
  * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
  * @param  {String} customer_id The unique customer ID of the current logged in user
  * @param  {String} role logged in user role
  * @return {JSON}  response with a success and list of classes
  */
  getCustomerClasses = async () => {
    await this.setState({loaded: false, data: []})
    Utils.getCustomerClasses(this.state.user, this.state.role,
          this.state.customer_id, this.state.refresh_token)
    .then((data) => {
      var classes = data.map((item) => {
        return ({
            class_id: item.class_id,
            class_name: item.class_name
        })
      })
      this.setState({data: classes, loaded: true});
    })
    .catch((error) => { throw error; })
  };

  updateDimensions = () => {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  };

  //class dropdown onchange handler function to update state
  class_Change = async(event) => {
    await this.setState({
      class_id: event.target.value
    });
    this.readClassResources();
  }

  handleTabChange = (event, newValue) => {
    this.setState({defaultTab: newValue})
  };

  /**
    * Get the list of all announcements and files posted under a class
  */
  readClassResources = async() => {
    await Utils.getClassAnnouncements(this.state.class_id,
                                  this.state.refresh_token)
    .then(data => {
      this.setState({
         class_Announcements: data.announcements,
         class_Contents: data.contents,
         loaded_resources: true
       });
    })
    .catch(err => { throw err; });
  }

  /**
    * To get the pre signedURL(getObject) of the object from S3 bucket
  */
  getS3SignedUrl = async(item) => {
    Utils.addinfoNotification(<CustomToast
      message = "Opening file in a new tab..."
      type = "request"
    />)
    await Utils.getS3SignedUrl(item, this.state.refresh_token)
    .then(data => {
      toast.dismiss();
      window.open(data);
    })
    .catch(err => { throw err });
  }

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
        <Dropdown alignRight show={this.props.resourcesDropdown}>
          <Tooltip title='Resources'>
            <Dropdown.Toggle onClick={ () => this.props.toggler('resourcesDropdown') }
              className={`${ this.props.resourcesDropdown ? 'nav-link active' : 'nav-link' }
                          ${ this.props.resourcesDropdown ? css(styles.navitem_active) : css(styles.navitem) }
                          count-indicator bg-transparent toggle-arrow-hide`}>
              <AnnouncementIcon/>
            </Dropdown.Toggle>
          </Tooltip>
          <Dropdown.Menu style={{ width: this.state.width }}
                         className="navbar-dropdown preview-list">
            <div className="card">
              <div className= {`${ 'card-header d-flex justify-content-between align-items-center' } ${ css(styles.cardheader) }`}>Resources
                <span>
                  <Tooltip title="refresh resources list">
                    <CachedIcon className="refresh" onClick={() => {
                        this.getCustomerClasses();
                    }}/>
                  </Tooltip>&nbsp;{' '}&nbsp;
                  <span data-toggle="tooltip" data-placement="top"
                     title="close">
                    <CloseIcon className="refresh" onClick={() => this.props.close('resourcesDropdown')}/>
                  </span>
                </span>
              </div>
              <div className="card-body" style={{
                height: 'calc(100vh - 100px)',
                overflow: 'auto'
              }}>
              <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="row">
                      <div className="col-sm-12">
                        <TextField
                          fullWidth
                          size="small"
                          select
                          label="Class Name"
                          value={this.state.class_id}
                          onChange={this.class_Change}
                          helperText="Please select a class"
                          required
                          variant="outlined"
                        >
                          <MenuItem value="">Select</MenuItem>
                          {this.state.loaded ?
                              this.state.data.map((item) => {
                                  return (<MenuItem key={item.class_id}
                                                  name={item.class_name}
                                                  value={item.class_id}>{item.class_name}</MenuItem>);
                              })
                              : null
                          }
                        </TextField>
                      </div>
                    </Form.Group>
                  </div>
                </div>
                <Box sx={{ width: '100%', typography: 'body1' }}>
                  <TabContext value={this.state.defaultTab}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                      <Tabs value={this.state.defaultTab} onChange={this.handleTabChange} aria-label="class tabs">
                        <Tab label="Announcements" value={1} />
                        <Tab label="Assignments" value={2} />
                        <Tab label="Questions" value={3} />
                        <Tab label="Materials" value={4} />
                      </Tabs>
                    </Box>
                    <TabPanel value={1}>
                      <div className="d-flex justify-content-center">
                        <div className="col-lg-12 grid-margin">
                        {this.state.loaded_resources ?
                          <div className="fixed-height">
                              {this.state.class_Announcements.length > 0 ? this.state.class_Announcements.map((item, index) => {
                                return (
                                  <div key={index}>
                                    <Card className="rootcard" key={item.posted}>
                                      <CardHeader
                                        title={item.subject}
                                        subheader={'Posted on: ' + moment(item.posted).format('dddd, MMMM DD, YYYY HH:mm:ss A') + ' EST'}
                                        style={{backgroundColor: this.state.primary_color}}
                                        titleTypographyProps={{variant:'body1' }}
                                        subheaderTypographyProps={{variant:'body2' }}
                                      />
                                      <CardContent>
                                        <Typography>
                                          {parse(item.message)}
                                        </Typography>
                                      </CardContent>
                                    </Card>
                                  </div>
                                )
                              }) : <p>No announcements to display at this time.</p> }
                            </div> : <div className="dialog d-flex justify-content-center">
                            <Spinner animation="border" role="status">
                                <span className="sr-only">Loading...</span>
                            </Spinner>
                          </div>
                        }

                        </div>
                      </div>
                    </TabPanel>
                    <TabPanel value={2}>

                    </TabPanel>
                    <TabPanel value={3}>

                    </TabPanel>
                    <TabPanel value={4}>
                    <div className="d-flex justify-content-center">
                      <div className="col-lg-12 grid-margin">
                        <div className="table-responsive">
                          <table className="table table-striped">
                            <thead>
                              <tr>
                                <th> Name </th>
                                <th> Type </th>
                                <th> Download</th>
                                <th> Date</th>
                              </tr>
                            </thead>
                            {this.state.class_Contents.length > 0 ? this.state.class_Contents.map((item, index) => {
                              var splitFilename = item.file.split('/');
                              return (
                                    <tbody key={item.posted}>
                                      <tr>
                                        <td> {splitFilename[splitFilename.length - 1]}</td>
                                        <td> {item.type} </td>
                                        <td> <button onClick={() => this.getS3SignedUrl(item)}> Download </button></td>
                                        <td> {moment(item.posted).format('MMMM DD, YYYY HH:mm:ss A')} </td>
                                      </tr>
                                    </tbody>
                                  )
                                }) : null }
                            </table>
                          </div>
                        </div>
                      </div>
                    </TabPanel>
                  </TabContext>
                </Box>
              </div>
            </div>
         </Dropdown.Menu>
        </Dropdown>

      </li>
    );
  }
}

export default Resources;
