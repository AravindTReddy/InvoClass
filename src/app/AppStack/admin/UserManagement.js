import React, { useCallback, useState } from "react";
import {Spinner, Table, Form} from "react-bootstrap";
import MaterialTable from 'material-table';
import {getAppInsights} from '../shared/TelemetryService';
import TelemetryProvider from '../shared/telemetry-provider.jsx';
import {ThemeProvider, createTheme} from '@material-ui/core/styles';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Utils from '../shared/Utils';
import Button from '@mui/material/Button';
import moment from 'moment';
import { StyleSheet, css } from 'aphrodite';
import CachedIcon from '@material-ui/icons/Cached';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import { reactAPIURL, backendAPIURL, stgName, sampleFile, socketUrl } from "../shared/General.js";
import DeleteDialog from '../shared/DialogBox/DeleteDialog';
import Switch from '@mui/material/Switch';
// import Papa from 'papaparse';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@mui/material/IconButton';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import AddIcon from '@material-ui/icons/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import XLSX from "xlsx";
import { w3cwebsocket as W3CWebSocket } from "websocket";
var uniqid = require('uniqid');

class UserManagement extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            data: [],
            filedata: [],
            disabled: false,
            user_email: '',
            user_fname: '',
            user_lname: '',
            user_role: '',
            roles: [],
            open: false,
            userDeleteData: '',
            primary_color: '#F38A2C',
            secondary_color: '#606060',
            checked: false,
            notifications: [],
            instructors: [],
            students: [],
            users: [],
            addUser: false,
            customerPlan: {}
        };
        this.roleChange = this.roleChange.bind(this);
        this.createUser = this.createUser.bind(this);
        this.readUser = this.readUser.bind(this);
        this.deleteUser = this.deleteUser.bind(this);
        this.updateUser = this.updateUser.bind(this);
        this.handleFileChange = this.handleFileChange.bind(this);
    }

    async componentDidMount() {
      var appearanceObject = localStorage.getItem('appearanceObject');
      var userAuthDetails = localStorage.getItem('userAuthDetails');
      var userDetails = localStorage.getItem('userDetails');
      var users = JSON.parse(localStorage.getItem('users'));
      var userInstructors = JSON.parse(localStorage.getItem('instructors'));
      var userStudents = JSON.parse(localStorage.getItem('students'));
      var notifications = JSON.parse(localStorage.getItem('notifications'));
      var customerDetails = JSON.parse(localStorage.getItem('customerDetails'));

      if(userDetails !== null){
        await this.setState({
          role: JSON.parse(userDetails).role,
          customer_id: JSON.parse(userDetails).customer_id,
          userIcon: JSON.parse(userDetails).userIcon,
          user_first_name: JSON.parse(userDetails).user_first_name,
          user_last_name: JSON.parse(userDetails).user_last_name,
        })
      }
      if(appearanceObject !== null){
        await this.setState({
          primary_color: JSON.parse(appearanceObject).primary_color,
          secondary_color: JSON.parse(appearanceObject).secondary_color
        });
      }
      if(userAuthDetails !== null){
        await this.setState({
          user: JSON.parse(userAuthDetails).user,
          access_token: JSON.parse(userAuthDetails).access_token,
          refresh_token: JSON.parse(userAuthDetails).refresh_token,
          id_token: JSON.parse(userAuthDetails).id_token,
        });
      }
      await this.setState({
        customerPlan: customerDetails!== null && customerDetails[0].customer_plan,
        users: users !== null && users,
        loaded: true,
        notifications: notifications !== null && notifications,
        instructors: userInstructors !== null && userInstructors,
        students: userStudents !== null && userStudents
      })
      if(this.state.role === 'admin'){
        this.setState({
          roles: [
              {role: 'admin', role_name: 'Brixon Administrator'},
              {role: 'brixon_developer', role_name: 'Brixon Developer'},
              {role: 'customer_admin', role_name: 'Administrator'},
              {role: 'customer_developer', role_name: 'Developer'},
              {role: 'instructor', role_name: 'Instructor'},
              {role: 'course_author', role_name: 'Course Author'},
              {role: 'student', role_name: 'Student'}
          ]
        })
      }else {
        this.setState({
          roles: [
              {role: 'customer_admin', role_name: 'Administrator'},
              {role: 'instructor', role_name: 'Instructor'},
              // {role: 'student', role_name: 'Student'}
          ]
        })
      }
      const client = new W3CWebSocket(socketUrl +'?email=' + JSON.parse(userAuthDetails).user);
      client.onopen = () => {
          // console.log('WebSocket Client Connected');
      };
      client.onmessage = (message) => {
          Utils.addsuccessNotification(message.data);
          if(message.data){
            console.log('setState');
            //here we can do progress bar
          }
      };
    }

    /**
    * To get the list of users available under a specific customer
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} role logged in user role
    * @return {JSON}  response with a success and list of users
    */
    readUser = async () => {
      await this.setState({loaded: false, data: []})
      var users = [],  mappedData;
      var instructors = [], students = [];
      Utils.getCustomerUsers(this.state.user, this.state.role,
            this.state.customer_id, this.state.refresh_token)
      .then((data) => {
        data.map(async(item) => {
          if(this.state.user !== item.user_email){
            if (item.user_role === 'admin') {
                mappedData = "Brixon Administrator"
            } else if (item.user_role === 'customer_admin') {
                mappedData = "Administrator"
            } else if (item.user_role === 'brixon_developer') {
                mappedData = "Brixon Developer"
            } else if (item.user_role === 'customer_developer') {
                mappedData = "Customer Developer"
            } else if (item.user_role === 'course_author') {
                mappedData = "Course Author"
            } else if (item.user_role === 'instructor'){
                mappedData = "Instructor"
                // instructors = instructors.concat({
                //     instructor_name: item.user_first_name + ' ' + item.user_last_name,
                //     instructor_email: item.user_email
                // })
            }else{
                mappedData = "Student"
                students = students.concat({
                  customer_id: item.customer_id,
                  student_fname: item.user_first_name,
                  student_lname: item.user_last_name,
                  email_address: item.user_email,
                })
            }
            item.user_role = mappedData;
            users = users.concat(item);
            // if(item.user_role === 'Instructor'){
            //   instructors = await instructors.push({
            //     instructor_name: item.user_first_name + ' ' + item.user_last_name,
            //     instructor_email: item.user_email
            //   })
            // }
          }
        });
        this.setState({users: users, loaded:true, instructors: instructors, students: students });
        localStorage.setItem('users', JSON.stringify(users));
        // localStorage.setItem('instructors', JSON.stringify(instructors));
        localStorage.setItem('students', JSON.stringify(students));
      })
      .catch((error) => {
          throw error;
      });
    }
    /**
    * To create a user under a specific customer
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} user_fname user first name
    * @param  {String} user_lname user last name
    * @param  {String} user_email user email id
    * @param  {String} user_role user role
    * @return {JSON}  response with a success and statusCode
    */
    createUser = async (e) => {
      e.preventDefault();
      await this.setState({disabled: true})
      const user_email = this.state.user_email.toLowerCase();
      //regex expression to validate the user input email
      let reg = /^[^<>()[\]\\,;:\%#^\s@+\"$&!@-]+@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z0-9]+\.)+[a-zA-Z]{2,}))$/gm
      let user_id = uniqid.time('user-');
      if (reg.test(String(user_email).toLowerCase()) === false) {
          Utils.adderrorNotification('Please enter a valid email address and try again')
          this.setState({disabled: false})
          return false;
      } else {
          Utils.addinfoNotification('Creating user...');
          fetch(reactAPIURL + 'createuser', {
              method: 'post',
              headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json',
                'Authorization': this.state.id_token
              },
              body: JSON.stringify({
                "user_id": user_id,
                "user": this.state.user,
                "refresh_token": this.state.refresh_token,
                "customer_id": this.state.customer_id,
                "role": this.state.role,
                "user_fname": this.state.user_fname,
                "user_lname": this.state.user_lname,
                "user_email": user_email,
                "user_role": this.state.user_role,
                "user_notification_preferences": {
                  "allowNotifications" : true,
                  "pushNotifications": true,
                  "allNotifications": ["create", "delete"],
                  "emailNotifications": false
                }
              })
          })
          .then((response) => response.json())
          .then(responseJson => {
            //console.log(responseJson);
            toast.dismiss();
            this.setState({disabled: false})
            if (responseJson.message === "success" && responseJson.statusCode === 200) {
              Utils.addsuccessNotification('New user created successfully and an email has been sent with the login details.')
              //here we store the notification in localStorage
              const newArr1 = [...this.state.notifications]
              newArr1.push({
                created: Date.now(),
                message: "You have added a new user " + this.state.user_fname + " " + this.state.user_lname,
                subject: "User added",
                notification_type: 'create_user_completed',
                read: false
              })
              localStorage.setItem('notifications', JSON.stringify(newArr1));
              this.setState({notifications: newArr1})
              this.resetForm();
              this.readUser();
            } else {
              Utils.adderrorNotification('Error creating the user: ' + responseJson.errorType + ': ' + responseJson.errorMessage)
            }
          })
          .catch((error) => {
            toast.dismiss();
            Utils.adderrorNotification('Error creating the user: ' + error)
            this.setState({disabled: false})
          });
      }
    }
    /**
    * To add a list of user/s under a specific customer using .csv file
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} class_id The unique class ID of the selected class
    * @param  {Array} filedata array of user/s that need to be added
    * @return {JSON}  response with a success and statusCode
    */
    createUserCsv = async (e) => {
      e.preventDefault();
      await this.setState({disabled: true});
      const valid = this.state.filedata.length;
      if (valid >= 1) {
          Utils.addinfoNotification('Adding user(s)...');
          fetch(reactAPIURL + 'createstudentcsv', {
              method: 'post',
              headers: {
                  'Accept': 'application/json',
                  'Content-type': 'application/json',
                  'Authorization': this.state.id_token
              },
              body: JSON.stringify({
                "refresh_token": this.state.refresh_token,
                "entries": this.state.filedata,
                "customer_id": this.state.customer_id,
                "user": this.state.user,
                "role": this.state.role
              })
          })
          .then((response) => response.json())
          .then(responseJson => {
            // console.log(responseJson);
            toast.dismiss();
            this.fileInput.value = "";
            this.setState({filedata: [], disabled: false})
            if (responseJson.message === "success" && responseJson.statusCode === 200) {
                Utils.addsuccessNotification('User(s) added successfully');
                this.readUser();
            } else {
                Utils.adderrorNotification('Error adding the user data: ' + responseJson.errorMessage);
            }
          })
          .catch((error) => {
            toast.dismiss();
            Utils.adderrorNotification('Error adding the user data: ' + error)
            this.setState({disabled: false})
          });
      } else {
          Utils.adderrorNotification('No user data! Please select a file to see the preview table first and try submitting again');
          this.setState({disabled: false})
      }
    };
    /**
    * To delete a specific user/s that the admin wishes
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {Array} rowData Array of users(user_id)
    * @return {JSON}  response with a success custom message and statusCode
    */
    deleteUser = async (rowData) => {
      await this.setState({disabled: true, open: false})
      var bearer = this.state.id_token;
      Utils.addinfoNotification('Deleting user(s)...');
      fetch(reactAPIURL + 'deleteuser', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
            'Authorization': bearer
        },
        body: JSON.stringify({
            "refresh_token": this.state.refresh_token,
            "entries": rowData,
            "user": this.state.user,
            "customer_id": this.state.customer_id
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
          // console.log(responseJson);
        toast.dismiss();
        this.setState({disabled: false});
        if (responseJson.message === "success" && responseJson.statusCode === 200) {
            Utils.addsuccessNotification('User(s) deleted successfully.')
            //here we update the users in localStorage
            const newArr = [...this.state.users]
            rowData.map((item) => {
              const index = newArr.findIndex(user => user.user_id === item.user_id);
              if (index > -1)
                newArr.splice(index, 1);
            })
            this.setState({users: newArr})
            localStorage.setItem('users', JSON.stringify(newArr));
            //here we update the either students or instructors in localStorage based on role
            let newArr2 = [...this.state.instructors]
            let newArr3 = [...this.state.students]
            rowData.map((item) => {
              if(item.user_role === 'Instructor'){
                const index = newArr2.findIndex(ins => ins.instructor_email === item.user_email);
                if (index > -1)
                  newArr2.splice(index, 1);
              }else if(item.user_role === 'Student'){
                const index = newArr3.findIndex(ins => ins.email_address === item.user_email);
                if (index > -1)
                  newArr3.splice(index, 1);
              }
            })
            this.setState({instructors: newArr2, students: newArr3})
            localStorage.setItem('instructors', JSON.stringify(newArr2));
            localStorage.setItem('students', JSON.stringify(newArr3));
            //here we store the notification in localStorage
            const newArr1 = [...this.state.notifications]
            newArr1.push({
              created: Date.now(),
              message: "You have deleted " + rowData.length + " user(s)",
              subject: "User(s) deleted",
              notification_type: 'delete_user_completed',
              read: false
            })
            localStorage.setItem('notifications', JSON.stringify(newArr1));
            this.setState({notifications: newArr1})
        } else {
            Utils.adderrorNotification('Error deleting the user(s): ' + responseJson.errorMessage)
        }
      })
      .catch((error) => {
        toast.dismiss();
        Utils.adderrorNotification('Error deleting the user: ' + error)
        this.setState({disabled: false})
      });
    }
    /**
    * To update the user details
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {Array} item An array of new/edited course details
    * @return {JSON}  response with a success custom message and statusCode
    */
    updateUser = (item, itemOld) => {
      if (item.user_role === 'select') {
          Utils.adderrorNotification('Please select a role for the user and submit again')
      } else {
          fetch(reactAPIURL + 'updateuser', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json',
                'Authorization': this.state.id_token
            },
            body: JSON.stringify({
                "user_id": item.user_id,
                "user": this.state.user,
                "refresh_token": this.state.refresh_token,
                "customer_id": item.customer_id,
                "customer_first_name": item.user_first_name,
                "customer_last_name": item.user_last_name
            })
          })
          .then((response) => response.json())
          .then(responseJson => {
              // console.log(responseJson);
              if (responseJson.message === "success" && responseJson.statusCode === 200) {
                  Utils.addsuccessNotification('User details updated successfully.')
                  //here we update the users in localStorage
                  const newArr = [...this.state.users]
                  const index = newArr.findIndex(user => user.user_id === item.user_id);
                  if (index > -1) {
                    newArr[index].user_first_name = item.user_first_name
                    newArr[index].user_last_name = item.user_last_name
                    this.setState({users: newArr})
                    localStorage.setItem('users', JSON.stringify(newArr));
                  }
                  //here we store the notification in localStorage
                  const newArr1 = [...this.state.notifications]
                  newArr1.push({
                    created: Date.now(),
                    message: 'Details updated for the user ' + item.user_first_name +' '+ item.user_last_name +'. Contact your admin if this is wrong.',
                    subject: 'User updated',
                    notification_type: 'update_user_completed',
                    read: false
                  })
                  localStorage.setItem('notifications', JSON.stringify(newArr1));
                  this.setState({notifications: newArr1})
              } else {
                  Utils.adderrorNotification('Error updating the user details: ' + responseJson.errorMessage)
              }
          })
          .catch((error) => {
              Utils.adderrorNotification('Error updating the user details: ' + error)
          });
      }
    }

    //User input onchange handler function to set state dynamically
    onChange = (key, value) => {
        this.setState({
            [key]: value
        })
    }
    //user role dropdown onchange handler function to update state
    roleChange(event) {
      this.setState({
          user_role: event.target.value,
          role_name: event.currentTarget.getAttribute("name")
      });
    }

    resetForm = () => {
      this.setState({
        user_role: '',
        user_fname:'',
        user_lname:'',
        user_email:'',
        role_name:'',
        addUser: !this.state.addUser
      });
    }

    deleteDialog = (rowData) => {
      this.setState({open: true, userDeleteData: rowData});
    };

    handleCloseDialog = () => {
      this.setState({open: false});
    };

    handleChange = () => {
      this.setState({checked: !this.state.checked})
    }
    //To remove an existing entry from the csv student preview table
    removeCsvEntry = (item) => {
      const index = this.state.filedata.indexOf(item);
      if (index > -1) {
        this.state.filedata.splice(index, 1);
        this.setState({filedata: this.state.filedata})
      }else {
        Utils.adderrorNotification('Error removing the entry, Item not found')
      }
    }
    resetfiledata = () => {
      this.setState({filedata: []});
    }
    //handle file input tyoe upon file select/change and assign state
    handleFileChange = (e) => {
      if (e.target.files[0]) {
        const file = e.target.files[0];
        var reader = new FileReader();
        reader.addEventListener("load", (e) => {
          // this.setState({logo_image: reader.result})
          var data = new Uint8Array(e.target.result);
          var workbook = XLSX.read(data, { type: "array" });
          var firstSheet = workbook.SheetNames[0];
          const elements = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);
          const fileArray = [...elements]
          this.setState({filedata: fileArray, fileload: true});
        })
        reader.readAsArrayBuffer(file);

      }else {
        Utils.adderrorNotification('Please choose a file and try uploading again.')
      }
    }

    addNewUser() {
      this.setState({addUser: !this.state.addUser})
    }

    render() {
      let appInsights = null;
      const theme = createTheme({
        palette: {
          primary: {
              main: this.state.primary_color,
          },
          secondary: {
              main: this.state.secondary_color,
          },
        },
      });
      const styles = StyleSheet.create({
        cardheader: {
          backgroundColor: 'white',
          color: this.state.primary_color,
        },
        button: {
          ':hover': {
              color: this.state.secondary_color,
          }
        }
      });
      if(this.state.role === 'biz_customer_admin')
        var grid = 'col-md-4'
      else grid = 'col-md-3'

      const { customerPlan } = this.state;
      return (
          <TelemetryProvider instrumentationKey="7696784d-3192-42a6-891e-1f8ca728cfae" after={() => {
              appInsights = getAppInsights()
          }}>
            <ThemeProvider theme={theme}>
              <div className="App">
                  {this.state.role === "admin" || (this.state.role === "customer_admin" && customerPlan.type !== 'individual')
                    || this.state.role === "biz_customer_admin" ?
                    <div className="row">
                        <div className="col-lg-12 grid-margin">
                            <div className="card">
                              <div className= {`${ 'card-header d-flex justify-content-between align-items-center' } ${ css(styles.cardheader) }`}>
                                <div>User Management</div>
                                <div>
                                  <Tooltip title="Add a new user">
                                    <Button variant="contained"
                                            size="small"
                                            startIcon={<AddIcon/>}
                                            style={{textTransform: 'none'}}
                                            onClick={() => this.addNewUser()}
                                            >
                                      Add New User
                                    </Button>
                                  </Tooltip>{' '}
                                  <Tooltip title="refresh user data">
                                    <Button variant="contained"
                                            size="small"
                                            startIcon={<CachedIcon/>}
                                            style={{textTransform: 'none'}}
                                            onClick={() => this.readUser()}
                                            >
                                            refresh
                                    </Button>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>

                            <div className="card">
                            {this.state.addUser ?
                              <div className="card-body">
                                {!this.state.checked ? <>
                                  <p className="d-flex justify-content-between card-description">(All fields marked with * are required)
                                  <Tooltip title="To upload user data using .csv file">
                                    <div>
                                     <Switch checked={this.state.checked} onChange={this.handleChange} inputProps={{ 'aria-label': 'controlled' }} />
                                     Import Users ?
                                    </div>
                                  </Tooltip>
                                  </p>
                                    <form onSubmit={this.createUser}>
                                      <div className="row">
                                        <div className={grid}>
                                          <Form.Group className="row">
                                            <div className="col-sm-12">
                                              <TextField
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                label="First Name"
                                                value={this.state.user_fname}
                                                type='text'
                                                required
                                                InputProps={{style: {fontSize: 13}}}
                                                onChange={evt => this.onChange('user_fname', evt.target.value.trim())}
                                              />
                                            </div>
                                          </Form.Group>
                                        </div>
                                        <div className={grid}>
                                          <Form.Group className="row">
                                            <div className="col-sm-12">
                                              <TextField
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                label="Last Name"
                                                value={this.state.user_lname}
                                                type='text'
                                                required
                                                InputProps={{style: {fontSize: 13}}}
                                                onChange={evt => this.onChange('user_lname', evt.target.value.trim())}
                                              />
                                            </div>
                                          </Form.Group>
                                        </div>
                                        <div className={grid}>
                                            <Form.Group className="row">
                                                <div className="col-sm-12">
                                                  <TextField
                                                    fullWidth
                                                    size="small"
                                                    variant="outlined"
                                                    label="User Email"
                                                    value={this.state.user_email}
                                                    type='email'
                                                    required
                                                    InputProps={{style: {fontSize: 13}}}
                                                    onChange={evt => this.onChange('user_email', evt.target.value.trim())}
                                                  />
                                                </div>
                                            </Form.Group>
                                        </div>
                                        {this.state.role === "biz_customer_admin" ? null :
                                          <div className={grid}>
                                              <Form.Group className="row">
                                                  <div className="col-sm-12">
                                                    <TextField
                                                      fullWidth
                                                      size="small"
                                                      select
                                                      label="User Role"
                                                      value={this.state.user_role}
                                                      onChange={this.roleChange}
                                                      helperText="Once assigned cannot be updated."
                                                      required
                                                      InputProps={{style: {fontSize: 13}}}
                                                      variant="outlined"
                                                    >
                                                      <MenuItem value="">Select a Role</MenuItem>
                                                      {this.state.loaded ?
                                                          this.state.roles.map((item) => {
                                                              return (<MenuItem key={item.role}
                                                                              name={item.role_name}
                                                                              value={item.role}>{item.role_name}</MenuItem>);
                                                          }) : null
                                                      }
                                                    </TextField>
                                                  </div>
                                              </Form.Group>
                                          </div>
                                        }
                                      </div>
                                      <Table striped bordered hover>
                                        <thead>
                                        <tr>
                                            <th>User Name</th>
                                            <th>User Email</th>
                                            {this.state.role === "biz_customer_admin" ? null :
                                              <th>User Role</th>
                                            }
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <td>{this.state.user_fname} {this.state.user_lname}</td>
                                            <td>{this.state.user_email}</td>
                                            {this.state.role === "biz_customer_admin" ? null :
                                              <td>{this.state.role_name}</td>
                                            }
                                        </tr>
                                        </tbody>
                                      </Table><br/>
                                      <Button variant="contained"
                                              onClick={this.createStudent}
                                              color="primary"
                                              disabled={this.state.disabled}
                                              type="submit"
                                      >
                                       ADD USER(S)
                                      </Button>{' '}
                                      <Button variant="contained"
                                              onClick={() => this.addNewUser()}
                                              color="primary"
                                              disabled={this.state.disabled}
                                              type="reset"
                                      >
                                       Cancel
                                      </Button>
                                </form>
                                </> :
                                <>
                                <p className="d-flex justify-content-between card-description">(All fields marked with * are required)
                                <Tooltip title="To upload user data using .csv file">
                                  <div>
                                  <IconButton
                                    onClick={this.handleChange}
                                    style={{height: '8px'}} >
                                    <CancelIcon/>
                                  </IconButton>
                                  </div>
                                </Tooltip>
                                </p>
                                <form onSubmit={this.createUserCsv}>
                                    <div className="row">
                                        <div className="col-md-6">
                                          <Tooltip placement="right" title="You are only allowed to upload .csv, .xls, .xlsx files at this moment. To have more details about file structure and format. Click here to download the sample file.">
                                            <a download href={sampleFile}>More Users?</a>
                                          </Tooltip>
                                            <Form.Group className="row">
                                                <div className="col-sm-6">
                                                    <Form.Control
                                                      ref={ref=> this.fileInput = ref}
                                                      type="file"
                                                      name="file"
                                                      placeholder="Choose a file"
                                                      onChange={this.handleFileChange}
                                                      required
                                                      accept=".csv, .xls, .xlsx"
                                                    />
                                                </div>
                                            </Form.Group>
                                        </div>
                                    </div>
                                    <Button variant="contained"
                                            type="submit"
                                            color="primary"
                                            disabled={this.state.disabled}
                                    >
                                     ADD USER(S)
                                    </Button>
                                </form>
                                <br />
                                <Table striped bordered hover>
                                    <thead>
                                      <tr>
                                        <th>User Name</th>
                                        <th>User Email</th>
                                        <th>User Role</th>
                                        <th>Remove</th>
                                      </tr>
                                    </thead>
                                    {this.state.filedata.length > 0 &&
                                      this.state.filedata.map((item, index) => {
                                          return (
                                              <tbody key={index}>
                                              <tr>
                                                  <td>{item.first_name} {item.last_name}</td>
                                                  <td>{item.email}</td>
                                                  <td>{item.role}</td>
                                                  <td>
                                                    <IconButton
                                                      onClick={() => this.removeCsvEntry(item)}
                                                      style={{height: '8px'}} >
                                                      <RemoveCircleIcon/>
                                                    </IconButton>
                                                  </td>
                                              </tr>
                                              </tbody>
                                          )
                                      })
                                    }
                                </Table>
                              </>
                            }
                          </div> :
                          <div className="card-body">
                              <MaterialTable
                                title="Existing Users"
                                localization={{ body:{ emptyDataSourceMessage:
                                  <>
                                    {this.state.loaded ? 'No records to display' :
                                      <div style={{color:this.state.primary_color}} className="d-flex justify-content-center">
                                        <Spinner  animation="border" role="status">
                                            <span className="sr-only">Loading...</span>
                                        </Spinner>
                                      </div>
                                     }
                                  </>
                                } }}
                                columns={[
                                    {title: 'User ID', field: 'user_id', hidden: true},
                                    {title: 'First Name', field: 'user_first_name'},
                                    {title: 'Last Name', field: 'user_last_name'},
                                    {title: 'Email', field: 'user_email', editable: 'never',
                                      render: rowData => {
                                        return(
                                          <a href = {`mailto: ${rowData.user_email}`}>{rowData.user_email}</a>
                                        )
                                      }
                                    },
                                    {
                                        title: 'Role', field: 'user_role', editable: 'never',
                                        editComponent: props => (
                                            <select className="form-control form-control-sm"
                                                    value={props.value}
                                                    onChange={e => props.onChange(e.target.value)}
                                            >
                                                <option value="select">Select a Role</option>
                                                {this.state.loaded ?
                                                    this.state.roles.map((item) => {
                                                        return (
                                                            <option key={item.role}
                                                                    data-key={item.role_name}
                                                                    value={item.role}>{item.role_name}</option>);
                                                    }) : null
                                                }
                                            </select>
                                        ),
                                        hidden: this.state.role === "biz_customer_admin" ? true : false
                                    },
                                    {title: 'Customer ID', field: 'customer_id', hidden: true},
                                    {
                                        title: 'Created',
                                        field: 'created_ts',
                                        editable: 'never',
                                        render: rowData => {
                                            const c_date = moment(rowData.created_ts * 1000).format('MMM-DD-YYYY HH:mm A');
                                            return c_date
                                        }
                                    },
                                    {
                                        title: 'Updated',
                                        field: 'updated_ts',
                                        editable: 'never',
                                        render: rowData => {
                                            const u_date = moment(rowData.updated_ts * 1000).format('MMM-DD-YYYY HH:mm A');
                                            return u_date
                                        }
                                    },
                                ]}
                                data={this.state.users}
                                actions={[
                                    rowData => ({
                                        icon: 'delete',
                                        tooltip: 'Delete User',
                                        onClick: (event, rowData) => this.deleteDialog(rowData)
                                    })
                                ]}
                                options={{
                                    headerStyle: {
                                        backgroundColor: this.state.secondary_color,
                                        color: '#FFF',
                                        fontSize: '12px'
                                    },
                                    rowStyle: {
                                      fontSize: '12px'
                                    },
                                    showTitle: false,
                                    selection: true,
                                    exportButton: true,
                                    // grouping: true,
                                    padding: "dense",
                                    pageSize: 10,
                                }}
                                editable={{
                                    onRowUpdate: (newData, oldData) =>
                                        new Promise((resolve, reject) => {
                                            setTimeout(() => {
                                                this.updateUser(newData, oldData);
                                                resolve();
                                            }, 2000)
                                        }),
                                }}
                              />
                              {/*A dialog box to warn the user before a user is deleted*/}
                              <DeleteDialog dashboard="user"
                                            open={this.state.open}
                                            data={this.state.userDeleteData}
                                            close={this.handleCloseDialog}
                                            delete={this.deleteUser}/>

                            </div>
                          }
                        </div>
                      </div>
                    </div> : "Access Denied"
                  }
              </div>

            </ThemeProvider>
          </TelemetryProvider>
      )
  }
}

export default UserManagement
