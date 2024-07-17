import React from 'react';
import {Spinner, Table, Form} from "react-bootstrap";
import { getAppInsights } from '../shared/TelemetryService';
import TelemetryProvider from '../shared/telemetry-provider.jsx';
import {ThemeProvider, createMuiTheme} from '@material-ui/core/styles';
import { StyleSheet, css } from 'aphrodite';
import CachedIcon from '@material-ui/icons/Cached';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Utils from '../shared/Utils';
import { reactAPIURL, backendAPIURL, stgName } from "../shared/General.js";
import {toast} from 'react-toastify';
import MaterialTable from 'material-table';
import moment from 'moment';
import CustomToast from '../shared/CustomToast.js'
import AddIcon from '@material-ui/icons/Add';
import StopIcon from '@material-ui/icons/Stop';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PowerSettingsNewIcon from '@material-ui/icons/PowerSettingsNew';
/* eslint-disable no-useless-escape */

class MachineManagement extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userIcon: '',
      primary_color: '#F38A2C',
      secondary_color: '#606060',
      machines: [],
      loaded_images: false,
      loaded_machines: false,
    }
    this.imageChange = this.imageChange.bind(this);
    this.createMachine = this.createMachine.bind(this);
    this.readMachine = this.readMachine.bind(this);
  }

  async componentDidMount() {
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
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
        user_notification_preferences: JSON.parse(userDetails).user_notification_preferences,
        loaded: true,
      });
    }
    this.readMachine();
    Utils.getCustomerImages(this.state.refresh_token, this.state.user,
                            this.state.customer_id, this.state.role)
    .then((data) => {
      var images = [];
      data.forEach((item) => {
        if (item.converted === true) {
          images.push(item);
        }
      });
      this.setState({images: images, loaded_images: true });
    })
  }

  imageChange(event) {
    this.setState({
      lab_id: event.target.value,
      image_name: event.currentTarget.getAttribute("name")
    });
  }

  resetData = () => {
    this.setState({machine_name: '', lab_id: '', image_name:''});
  }

  /**
    * To get the list of machines available under a specific customer
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} role logged in user role
    * @return {JSON}  response with a success and list of courses
  */
  readMachine = async () => {
    await this.setState({loaded_machines: false, machines: []})
    Utils.getCustomerMachines(this.state.refresh_token, this.state.user,
          this.state.customer_id, this.state.role)
    .then((data) => {
      this.setState({machines: data, loaded_machines: true});
    })
    .catch((error) => {
      throw error
    });
  }

  /**
    * To add a new machine
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} lab_id Lab ID associated for the course
    * @param  {String} machine_name Name of the machine
    * @return {JSON}  response with a success and statusCode
  */
  createMachine = async (e) => {
    e.preventDefault();
    Utils.addinfoNotification('Adding machine...');
    fetch(reactAPIURL + 'createmachine', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            "refresh_token": this.state.refresh_token,
            "customer_id": this.state.customer_id,
            "user": this.state.user,
            "role": this.state.role,
            "lab_id": this.state.lab_id,
            "machine_name": this.state.machine_name
        })
    })
    .then((response) => response.json())
    .then(responseJson => {
      //console.log(responseJson);
      toast.dismiss();
      if (responseJson.message === "success" && responseJson.statusCode === 200) {
          Utils.addsuccessNotification('Machine added successfully')
          this.resetData();
          this.readMachine();
      } else {
          Utils.adderrorNotification('Error adding the machine: ' + responseJson.errorMessage)
      }
    })
    .catch((error) => {
      toast.dismiss();
      Utils.adderrorNotification('Error adding the machine: ' + error)
    });
  }
  /**
  * To delete a specific machine that the user wishes
  * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
  * @param  {Object} entry Object with machine details(machine_id)
  * @return {JSON}  response with a success custom message and statusCode
  */
  deleteMachine = async (item) => {
    Utils.addinfoNotification('Deleting machine...');
    fetch(reactAPIURL + 'deletemachine', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        "refresh_token": this.state.refresh_token,
        "user": this.state.user,
        "entry": item[0]
      })
    })
    .then((response) => response.json())
    .then(responseJson => {
      //console.log(responseJson);
      toast.dismiss();
      if (responseJson.message === "success" && responseJson.statusCode === 200) {
          Utils.addsuccessNotification('Machine deleted successfully')
          this.readMachine();
      } else {
          Utils.adderrorNotification('Error deleting the machine: ' + responseJson.errorMessage)
      }
    })
    .catch((error) => {
      toast.dismiss();
      Utils.adderrorNotification('Error deleting the machine: ' + error)
    });
  }
  /**
  * To edit the machine details
  * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
  * @param  {String} customer_id The unique customer ID of the current logged in user
  * @param  {Object} item1 An Object with new/edited machine details
  * @param  {Object} item2 An Object with old machine details
  * @return {JSON}  response with a success custom message and statusCode
  */
  updateMachine = (item1, item2) => {
    if (item1.image_name === '') {
        Utils.adderrorNotification('Please select a image and submit again')
    } else {
      var image_name;
      if(item1.image_name === item2.image_name)
        image_name = item1.lab_id;
      else image_name = item1.image_name;
      fetch(reactAPIURL + 'updatemachine', {
          method: 'post',
          headers: {
              'Accept': 'application/json',
              'Content-type': 'application/json'
          },
          body: JSON.stringify({
              "machine_id": item1.machine_id,
              "machine_name": item1.machine_name,
              "lab_id": image_name,
              "refresh_token": this.state.refresh_token,
              "user": this.state.user,
              "customer_id": this.state.customer_id
          })
      })
      .then((response) => response.json())
      .then(responseJson => {
          // console.log(responseJson);
          if (responseJson.message === "success" && responseJson.statusCode === 200) {
              Utils.addsuccessNotification('Machine details updated successfully')
              this.readMachine();
          } else {
              Utils.adderrorNotification('Error updating the machine details: ' + responseJson.errorMessage)
          }
      })
      .catch((error) => {
          Utils.adderrorNotification('Error updating the machine details: ' + error)
      });
    }
  }
  /**
    * To create the machine VM on demand
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {Array} rowData An array with student details(class_id, course_id, customer_id, lab_id, student_email)
    * @return {JSON}  response with a success custom message and statusCode
  */
  createMachineVM = async (rowData) => {
    Utils.addinfoNotification(<CustomToast
      message = "Initiating VM(s) deployement"
      type = "request"
    />)
    rowData.forEach(entry => {
      fetch(backendAPIURL + 'deploy_student_vm', {
          method: 'post',
          headers: {
              'Accept': 'application/json',
              'Content-type': 'application/json'
          },
          body: JSON.stringify({
              "secret_password": "start_student_server_qw3$t&YWS",
              'student_id': entry.machine_id,
              'lab_id': entry.lab_id,
              'customer_id': entry.customer_id,
              'class_id': entry.class_id,
              'student_email': this.state.user,
              'stg': stgName,
              'user': this.state.user,
              'request': 'default'
          })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        toast.dismiss();
        if (responseJson.statusCode === 500) {
            Utils.adderrorNotification(responseJson.message);
        } else if (responseJson.statusCode === 200) {
            Utils.addsuccessNotification(<CustomToast
              message = "VM deployed successfully"
              type = "response"
            />)
            this.readMachine();
        } else if (responseJson.statusCode === 300) {
            Utils.adderrorNotification(responseJson.message);
        } else if (responseJson.message === "Endpoint request timed out") {
            Utils.addsuccessNotification('Hang tight, the machine will be up soon!')
        } else {
            Utils.adderrorNotification('Error deploying the machine: ' + responseJson.errorMessage)
        }
      })
      .catch((error) => {
          throw error;
      });
    })
    .then((response) => response.json())
    .then(responseJson => {
      // console.log(responseJson);
      toast.dismiss();
      if (responseJson.statusCode === 500) {
          Utils.adderrorNotification(responseJson.message);
      } else if (responseJson.statusCode === 200) {
          Utils.addsuccessNotification(<CustomToast
            message = "VM deployed successfully"
            type = "response"
          />)
          this.readMachine();
      } else if (responseJson.statusCode === 300) {
          Utils.adderrorNotification(responseJson.message);
      } else if (responseJson.message === "Endpoint request timed out") {
          Utils.addsuccessNotification('Hang tight, the machine will be up soon!')
      } else {
          Utils.adderrorNotification('Error deploying the machine: ' + responseJson.errorMessage)
      }
    })
    .catch((error) => {
        throw error;
    });
  }

  /**
  * To launch the machine VM on demand
  */
  launchMachineVM = async (item) => {
    if (item[0].vm_status !== 'online' || item[0].class_vm_status !== 'online') {
        Utils.adderrorNotification('Make sure the VM is in running state, Please create or start the VM and try again later!')
    } else {
      Utils.addinfoNotification(<CustomToast
        message = "Launching VM in a new tab"
        type = "request"
      />)
      await Utils.getGuacToken(item[0], this.state.refresh_token, 'machine')
      .then(data => {
        toast.dismiss();
        window.open(data, "_blank")
      })
      .catch(err => { throw err });
    }
  }
  /**
    * To start the machine VM on demand
    * @param  {Object} item VM details object
    * @return {JSON}  response with a success custom message
  */
  startMachineVM = async (item) => {
    Utils.addinfoNotification(<CustomToast
      message = "Starting machine"
      type = "request"
    />)
    item.forEach(entry => {
      Utils.startVM(entry.machine_id, entry.vm_name)
      .then(data => {
        if(data.message === 'success'){
          this.readMachine();
          Utils.addsuccessNotification(<CustomToast
            message = "Successfully started machine"
            type = "response"
          />)
        }
      })
      .catch(err => { throw err });
    })
    .catch(err => { throw err });
  };
  /**
    * To stop the machine VM on demand
    * @param  {Object} item VM details object
    * @return {JSON}  response with a success custom message
  */
  stopMachineVM = async (item) => {
    Utils.addinfoNotification(<CustomToast
      message = "Stopping machine"
      type = "request"
    />)
    item.forEach(entry => {
      Utils.stopVM(entry.machine_id, entry.vm_name)
      .then(data => {
        if(data.message === 'success'){
          this.readMachine();
          Utils.addsuccessNotification(<CustomToast
            message = "Successfully stopped machine"
            type = "response"
          />)
        }
      })
      .catch(err => { throw err });
    })
    .catch(err => { throw err });
  };

  /**
    * To start the class server VM on demand
    * @param  {Object} item VM details object
    * @return {JSON}  response with a success custom message
  */
  startClassVM = async (item) => {
    Utils.addinfoNotification(<CustomToast
      message = "Starting server machine"
      type = "request"
    />)
    await Utils.startVM(item[0].class_id, item[0].class_vm_name)
    .then(data => {
      if(data.message === 'success'){
        this.readMachine();
        Utils.addsuccessNotification(<CustomToast
          message = "Successfully started server machine."
          type = "response"
        />)
      }
    })
    .catch(err => { throw err });
  };

  /**
    * To stop the class server VM on demand
    * @param  {Object} item VM details object
    * @return {JSON}  response with a success custom message
  */
  stopClassVM = async (item) => {
    Utils.addinfoNotification(<CustomToast
      message = "Stopping server machine"
      type = "request"
    />)
    await Utils.stopVM(item[0].class_id, item[0].class_vm_name)
    .then(data => {
      if(data.message === 'success'){
        this.readMachine();
        Utils.addsuccessNotification(<CustomToast
          message = "Successfully stopped server machine."
          type = "response"
        />)
      }
    })
    .catch(err => { throw err });
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
      }
    });
    const theme = createMuiTheme({
      palette: {
        primary: {
            main: this.state.primary_color,
        },
        secondary: {
            main: this.state.secondary_color,
        },
      },
    });
    let appInsights = null;
    return (
      <TelemetryProvider instrumentationKey="7696784d-3192-42a6-891e-1f8ca728cfae" after={() => { appInsights = getAppInsights() }}>
        <ThemeProvider theme={theme}>
          <div className="App">
            <div className="row">
              <div className="col-md-12 grid-margin">
                <div className="card">
                  <div className= {`${ 'card-header d-flex justify-content-between align-items-center' } ${ css(styles.cardheader) }`}>
                    Available Machines
                    <span data-toggle="tooltip" data-placement="top"
                     title="refresh desktop data">
                      <CachedIcon className="refresh" onClick={() => {
                          this.readMachine();
                      }}/>
                    </span>
                  </div>
                  <div className="card-body">
                    <MaterialTable
                        title="Existing Machines"
                        localization={{ body:{ emptyDataSourceMessage:
                          <>
                            {this.state.loaded_machines ? 'No records to display' :
                              <div style={{color:this.state.primary_color}} className="d-flex justify-content-center">
                                <Spinner  animation="border" role="status">
                                    <span className="sr-only">Loading...</span>
                                </Spinner>
                              </div>
                             }
                          </>
                        } }}
                        columns={[
                            {title: 'Customer ID', field: 'customer_id', hidden: true},
                            {title: 'Machine ID', field: 'machine_id', hidden: true},
                            {title: 'Lab ID', field: 'lab_id', hidden: true},
                            {title: 'Machine Name', field: 'machine_name'},
                            {title: 'Image Name', field: 'image_name',
                              editComponent: props => (
                                  <select className="form-control form-control-sm"
                                          value={props.value}
                                          onChange={e => props.onChange(e.target.value)}
                                          required
                                  >
                                    <option value="">Select</option>
                                    {this.state.loaded_images ?
                                        this.state.images.map((item, index) => {
                                            return (<option key={index}
                                                            data-key={item.image_name}
                                                            value={item.lab_id}>{item.image_name}</option>);
                                        })
                                        : null
                                    }
                                  </select>
                              )
                            },
                            {title: 'Class', field: 'class_id', hidden: true},
                            {title: 'Instructor Email', field: 'instructor_email', hidden: true},
                            {title: 'Server', field: 'class_vm_status',
                              render: rowData => {
                                return (
                                  <span className={rowData.class_vm_status === 'online' ? "badge badge-pill badge-success" :
                                                    "badge badge-pill badge-danger"}>
                                     {rowData.class_vm_status !== undefined && rowData.class_vm_status!== "" ?
                                       rowData.class_vm_status === 'online' ? 'Power On' : 'Power Off' : "Not available"}
                                  </span>
                                )
                              }
                            },
                            {title: 'Lab Name', field: 'vm_name', hidden: true},
                            {title: 'VM State', field: 'vm_status', editable: 'never',
                              render: rowData => {
                                return (
                                  <span className={rowData.vm_status === 'online' ? "badge badge-pill badge-success" :
                                                   rowData.vm_status === 'offline' && rowData.connection_url === 'pending' ?
                                                   "badge badge-pill badge-warning" : "badge badge-pill badge-danger"}>
                                     {rowData.vm_status !== undefined && rowData.vm_status!== "" ?
                                       rowData.vm_status === 'online' ? 'Running' :
                                       rowData.vm_status === 'offline' && rowData.connection_url === 'pending' ?
                                       'Creating...' : 'Stopped' : "Not available"}
                                  </span>
                                )
                              }
                            },
                            {title: 'Connection URL', field: 'connection_url', hidden: true},
                            {
                                title: 'Created',
                                field: 'created_ts',
                                editable: 'never',
                                render: rowData => {
                                    const c_date = moment(rowData.created_ts * 1000).format('MMM-DD-YYYY HH:mm A');
                                    return c_date
                                },
                                hidden: true
                            },
                            {
                                title: 'Last Updated',
                                field: 'updated_ts',
                                editable: 'never',
                                render: rowData => {
                                    const u_date = moment(rowData.updated_ts * 1000).format('MMM-DD-YYYY HH:mm A');
                                    return u_date
                                }
                            },
                        ]}
                        data={this.state.machines}
                        actions={[
                          rowData => ({
                              icon: () => <PowerSettingsNewIcon/>,
                              tooltip: rowData[0].class_vm_status === 'online' ? 'Stop Server' : 'Start Server',
                              onClick: (event, rowData) => rowData[0].class_vm_status === 'online' ? this.stopClassVM(rowData) :
                                                            this.startClassVM(rowData),
                              disabled: rowData.length > 1
                          }),
                          rowData => ({
                              icon: () => <AddIcon/>,
                              tooltip: 'Deploy VM for this machine(s)',
                              onClick: (event, rowData) => this.createMachineVM(rowData)
                          }),
                          rowData => ({
                              icon: () => <PlayArrowIcon/>,
                              tooltip: 'Start Machine',
                              onClick: (event, rowData) => this.startMachineVM(rowData),
                              position: 'row',
                              disabled: rowData[0].connection_url === 'pending' || rowData[0].class_vm_status !== 'online'
                          }),
                          rowData => ({
                              icon: () => <StopIcon/>,
                              tooltip: 'Stop Machine',
                              onClick: (event, rowData) => this.stopMachineVM(rowData),
                              position: 'row',
                              disabled: rowData[0].connection_url === 'pending'
                          }),
                          rowData => ({
                              icon: 'launch',
                              tooltip: 'Launch Machine',
                              onClick: (event, rowData) => this.launchMachineVM(rowData),
                              disabled: rowData.length > 1
                          }),
                          rowData => ({
                              icon: 'delete',
                              tooltip: 'Delete Machine',
                              onClick: (event, rowData) => this.deleteMachine(rowData),
                              disabled: rowData.length > 1
                          }),
                        ]}
                        options={{
                            headerStyle: {
                                backgroundColor: this.state.secondary_color,
                                color: '#FFF',
                            },
                            showTitle: false,
                            exportButton: true,
                            grouping: true,
                            selection: true
                        }}
                        editable={{
                          onRowUpdate: (newData, oldData) =>
                            new Promise((resolve, reject) => {
                                setTimeout(() => {
                                    this.updateMachine(newData, oldData);
                                    resolve();
                                }, 2000)
                            })
                        }}
                    />
                  </div>
                </div>
              </div>
              <div className="col-lg-12 grid-margin">
                  <div className="card">
                      <div className= {`${ 'card-header' } ${ css(styles.cardheader) }`}>Add New Machine</div>
                        <div className="card-body">
                          <p className="card-description">(All fields marked with * are required)</p>
                            <form onSubmit={this.createMachine}>
                              <div className="row">
                                  <div className="col-md-6">
                                      <Form.Group className="row">
                                          <div className="col-sm-12">
                                            <TextField
                                              fullWidth
                                              size="small"
                                              variant="outlined"
                                              label="Machine Name"
                                              value={this.state.machine_name}
                                              type='text'
                                              required
                                              onChange={evt => this.setState({machine_name: evt.target.value})}
                                            />
                                          </div>
                                      </Form.Group>
                                  </div>
                                  <div className="col-md-6">
                                      <Form.Group className="row">
                                          <div className="col-sm-12">
                                            <TextField
                                              fullWidth
                                              size="small"
                                              select
                                              label="Image Name"
                                              value={this.state.lab_id}
                                              onChange={this.imageChange}
                                              helperText="Please select an image"
                                              variant="outlined"
                                              required
                                            >
                                              <MenuItem value="">Select</MenuItem>
                                              {this.state.loaded_images ?
                                                  this.state.images.map((item, index) => {
                                                      return (<MenuItem key={index}
                                                                      name={item.image_name}
                                                                      value={item.lab_id}>{item.image_name}</MenuItem>);
                                                  })
                                                  : null
                                              }
                                            </TextField>
                                          </div>
                                      </Form.Group>
                                  </div>
                              </div>

                              <Table striped bordered size="sm" responsive>
                                  <thead>
                                  <tr>
                                      <th>Machine Name</th>
                                      <th>Image Name</th>
                                  </tr>
                                  </thead>
                                  <tbody>
                                  <tr>
                                      <td>{this.state.machine_name}</td>
                                      <td>{this.state.image_name}</td>
                                  </tr>
                                  </tbody>
                              </Table><br />
                              <button disabled={this.state.disabled} type="submit" className="button">
                                Add machine
                              </button>{' '}
                              <button disabled={this.state.disabled} onClick={this.resetData}
                                      type="reset" className="button">RESET
                              </button>
                          </form>
                      </div>
                  </div>
              </div>
            </div>
        </div>
      </ThemeProvider>
     </TelemetryProvider>
    );
  }
}

export default MachineManagement
