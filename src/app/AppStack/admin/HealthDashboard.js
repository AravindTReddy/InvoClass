import React, {Component} from 'react';
import {Form, Container, Row, Col, Spinner} from 'react-bootstrap';
import {getAppInsights} from '../shared/TelemetryService';
import TelemetryProvider from '../shared/telemetry-provider.jsx';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import ReactSpeedometer from "react-d3-speedometer"
import MaterialTable from 'material-table';
import moment from 'moment';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
    Label
} from 'recharts';
import BackspaceIcon from '@material-ui/icons/Backspace';
import DatePicker from "react-datepicker";
import CachedIcon from '@material-ui/icons/Cached';
import "react-datepicker/dist/react-datepicker.css";
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Utils from '../shared/Utils';
import {ReactComponent as MemoryIcon} from '../../../assets/images/memory-solid.svg';
import { StyleSheet, css } from 'aphrodite';
import { reactAPIURL, backendAPIURL, card_media, card_media_pointer } from "../shared/General.js";

class HealthDashboard extends Component {
    constructor(props) {
        super(props);
        this.state = {
            time: '30m',
            default: true,
            page1: false,
            page2: false,
            page3: false,
            show: false,
            start_date: new Date(new Date().setDate(new Date().getDate() - 1)),
            end_date: new Date(),
            s_date:'',
            data: [],
            dataA_labs: [],
            clickedItem: [],
            cpu_data: [],
            ram_data: [],
            storage_data: [],
            loaded: false,
            Heartbeat_color: 'red',
            cpu_chart_data: [],
            loaded_chart: false,
            loaded_chart_ram: false,
            ram_chart_data: [],
            customerData: [],
            loadedCustomerData: false,
            customerSelected: ''
        };
        this.handlecpuShow = this.handlecpuShow.bind(this);
        this.change_customer_details = this.change_customer_details.bind(this);
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
          loaded: true,
        });
      }
      this.readHeartBeatData();
      //Read customer data only for Brixon Admin and Brixon developer
      if (this.state.role === 'admin' || this.state.role === 'brixon_developer') {
          await Utils.getCustomerDetails(this.state.refresh_token,
                this.state.customer_id, this.state.role)
          .then((data) => {
            this.setState({ customerData: data, loadedCustomerData: true });
          })
          .catch((error) => { throw error; });
      }
    }

    /**
     * If drop down is changed update the Data
     * @param event
     * @returns {void}
     */
    async change_customer_details(event) {
      await this.setState({ customerSelected: event.target.value });
      this.readHeartBeatData();
    }

    /**
    * To read the active VM heartbeat data respect to specific customer and brixon admin based on the role
      * @param  {String} api_secret A custom hex secret code used for authenticating the api call
      * @param  {String} customer_id The unique customer ID of the current logged in user
      * @param  {String} role logged in user role
      * @param  {String} user logged in user email id
      * @return {JSON}  response with heartbeat data of the active machines
    */
    readHeartBeatData = async () => {
      await this.setState({loaded: false, data: []})
      let customer_id = "all";
      //If role is brixon admin or developer they can see all VM's
      //Else the user will see VMs associated with their customer id
      if (this.state.role !== 'admin' && this.state.role !== 'brixon_developer') {
          customer_id = this.state.customer_id;
      }
      //If drop down is changed customer selected will get customer id. Default it will show all customers VM
      if (this.state.customerSelected.length > 0) {
          customer_id = this.state.customerSelected;
      }
      var data;
      fetch(reactAPIURL + 'heartbeat', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
          'x-api-key': 'kA6tmf4dkA8YaM3a7X9To7Iac2KkfTJl1YHzBHFh'
        },
        body: JSON.stringify({
          "user": this.state.user,
          "computer": "all",
          "customer_id": customer_id
        })
      })
      // fetch(backendAPIURL + 'vm_status', {
      //   method: 'post',
      //   headers: {
      //     'Accept': 'application/json',
      //     'Content-type': 'application/json',
      //     'x-api-key': 'kA6tmf4dkA8YaM3a7X9To7Iac2KkfTJl1YHzBHFh'
      //   },
      //   body: JSON.stringify({
      //     // "user": this.state.user,
      //     // "computer": "all",
      //     // "customer_id": customer_id
      //     "status_password": "status_password_br1x0N42069",
      //     "vm_name": "gs-91837",
      //     "start_time": "2023-03-10T12:07:59",
      //     "end_time": "2023-03-31T13:07:59",
      //     "metrics": "ram"
      //   })
      // })
      .then((response) => response.json())
      .then(async responseJson => {
         // console.log(responseJson);
        if(responseJson.statusCode === 200 && responseJson.body.length >= 1){
          const res = JSON.parse(responseJson.body)
          await res.sort(function(a, b) {
              var c = new Date(a.TimeGenerated);
              var d = new Date(b.TimeGenerated);
              return d-c;
          });
          data = res.map((item, index) => {
              let currentTime = new Date();
              let heartbeatTime = new Date(item.TimeGenerated);
              //heartbeatTime = heartbeatTime.toUTCString();
              const n = moment(heartbeatTime).format('MMM-DD-YYYY HH:mm:ss');
              let minutes = Math.floor((currentTime - heartbeatTime) / (1000 * 60));
              if (minutes <= 5) var status = 'Online'
              else status = 'Offline'
              var machine_type, type;
              type = item.Computer.split("-")[0];
              if(type === "gs")
                machine_type = 'Class_Server'
              else if(type === 'gsc')
                machine_type = 'Customer_Server'
              else if(type === 'template')
                machine_type = 'Customer_Template'
              else if(type === 'lab')
               machine_type = 'Student_Lab'
              //video chat yet to come
              return ({
                  machine_type: machine_type,
                  machine_ip: item.ComputerIP,
                  machine_name: item.Computer,
                  machine_os: item.OSType,
                  machine_resource: item.ResourceType,
                  machine_heartbeat: item.TimeGenerated,
                  heartbeat_readable: n,
                  status: status
              })
          })
        }
        this.setState({ data: data, loaded: true });
      })
      .catch((error) => {
        throw error;
      });
    }
    /**
    * To read the cpu utilization of a selected active VM
    * @param  {String} api_secret A custom hex secret code used for authenticating the api call
    * @param  {String} computer_name The name of the VM that is selected
    * @return {JSON}  response with cpu_utilization of the selected VM
    */
    readCpuData = async (item) => {
      var cpu_data = [];
      fetch(reactAPIURL + 'cpu-usage', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
          'x-api-key': 'kA6tmf4dkA8YaM3a7X9To7Iac2KkfTJl1YHzBHFh'
        },
        body: JSON.stringify({
          "computer_name": item.machine_name,
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200 && responseJson.body.length >= 1){
          const res = JSON.parse(responseJson.body)
          cpu_data = res.map((item, index) => {
              return ({
                  machine_cpu: Math.ceil(item.avg_Val),
                  time_generated: item.TimeGenerated,
              })
          })
        }
        this.setState({ cpu_data: cpu_data });
      })
      .catch((error) => {
          throw error;
      });
    }
    /**
    * To read the RAM utilization of a selected active VM
    * @param  {String} api_secret A custom hex secret code used for authenticating the api call
    * @param  {String} computer_name The name of the VM that is selected
    * @return {JSON}  response with ram_utilization of the selected VM
    */
    readRamData = async (item) => {
      var ram_data = [];
      fetch(reactAPIURL + 'ram-usage', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
            'x-api-key': 'kA6tmf4dkA8YaM3a7X9To7Iac2KkfTJl1YHzBHFh'
        },
        body: JSON.stringify({
            "computer_name": item.machine_name,
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200 && responseJson.body.length >= 1){
          const res = JSON.parse(responseJson.body);
          ram_data = res.map((item, index) => {
              return ({
                  machine_ram: (parseFloat(item.UsedRAM) / 1024).toFixed(2),
                  total__ram: (parseFloat(item.TotalRAM) / 1024).toFixed(2),
                  time_generated: item.TimeGenerated,
              })
          })
        }
        this.setState({ ram_data: ram_data });
      })
      .catch((error) => {
          throw error;
      });
    }
    /**
    * To read the storage utilization of a selected active VM
    * @param  {String} api_secret A custom hex secret code used for authenticating the api call
    * @param  {String} computer_name The name of the VM that is selected
    * @return {JSON}  response with storage utilization of the selected VM
    */
    readStorageData = async (item) => {
      var storage_data = [];
      fetch(reactAPIURL + 'storage-usage', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
            'x-api-key': 'kA6tmf4dkA8YaM3a7X9To7Iac2KkfTJl1YHzBHFh'
        },
        body: JSON.stringify({
            "computer_name": item.machine_name,
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200 && responseJson.body.length >= 1){
          const res = JSON.parse(responseJson.body)
          storage_data = res.map((item, index) => {
              return ({
                  machine_storage: Math.floor(item.Val / 1024),
                  machine_drive: item.mountId,
                  time_generated: item.TimeGenerated,
              })
          })
        }
        this.setState({ storage_data: storage_data });
      })
      .catch((error) => {
          throw error;
      });
    };

    /**
     * When VM is on and CPU data is available
     * @returns {Speedometer React component}
     */
    cpuSpinner() {
        let cpuValue = 0;
        this.state.cpu_data.map((item, index) => {
            cpuValue = item.machine_cpu;
        });
        return (
            <ReactSpeedometer
                segments={3}
                value={cpuValue}
                segmentColors={['green', 'yellow', 'red']}
                needleColor="white"
                width={200}
                height={150}
                maxValue={100}
                currentValueText={'${value}%'}
                textColor={'white'}
            />
        )
    }

    /**
     * If VM is offline it will show off icon else it will show data
     * @returns {Component based on VM status}
     */
    getSpinner_or_offline() {
        if (this.state.clickedItem.status === "Online") {

            return (
                <div className="d-flex justify-content-center">
                    <Spinner animation="border" role="status">
                        <span className="sr-only">Loading...</span>
                    </Spinner>
                </div>
            );

        }
        return (
            <div>
                <div className="fa fa-power-off"
                     style={{fontSize: '120px'}}/>
                <h4 className="text-center"> Offline</h4>
            </div>
        )

    }

    /**
     * Render component based on RAM data
     * @returns {Component that is colored icon with RAM data}
     */
    ramSizeColor() {
        let used = 0;
        let total = 0;
        this.state.ram_data.map((item, index) => {
            used = item.machine_ram;
            total = item.total__ram;
        });
        let cl = 'red';
        if ((used / total) < 0.67) {
            cl = 'green';
        } else if (used / total >= 0.67 && used / total <= 0.85) {
            cl = 'yellow';
        }
        return (
            <div>
                <MemoryIcon style={{fontSize: '120px', color: cl}}/>
                {used}/{total} GB
            </div>
        )
    }

    /**
      * To read the cpu utilization of a selected VM based on specific timespan and to visualize the same
      * @param  {String} api_secret A custom hex secret code used for authenticating the api call
      * @param  {String} computer_name The name of the VM that is selected
      * @param  {String} start The start time value used in the timespan
      * @param  {String} end The end time value used in the timespan
      * @param  {String} time The default time interval used between the data points(30m)
      * @return {JSON}  response with cpu_utilization of the selected VM
    */
    readCpuChartData = async (item) => {
      var iso_start_date = this.state.start_date.toISOString();
      var iso_end_date = this.state.end_date.toISOString();
      if (iso_end_date > iso_start_date) {
          Utils.addinfoNotification('Processing your request');
          var cpu_chart_data = [];
          fetch(reactAPIURL + 'cpu-usage', {
            method: 'post',
            headers: {
              'Accept': 'application/json',
              'Content-type': 'application/json',
              'x-api-key': 'kA6tmf4dkA8YaM3a7X9To7Iac2KkfTJl1YHzBHFh'
            },
            body: JSON.stringify({
              "computer_name": this.state.clickedItem.machine_name,
              "start": iso_start_date,
              "end": iso_end_date,
              "time": item,
              "all_computers": "",
            })
          })
          .then((response) => response.json())
          .then(responseJson => {
            toast.dismiss();
            if(responseJson.statusCode === 200 && responseJson.body.length >= 1){
              const res = JSON.parse(responseJson.body)
              cpu_chart_data = res.map((item, index) => {
                return ({
                  machine_name: this.state.clickedItem.machine_name,
                  cpu_utilization: item.avg_Val,
                  time_generated: item.TimeGenerated
                })
              })
            }
            this.setState({
              cpu_chart_data: cpu_chart_data,
              loaded_chart: true,
              time: item
            });
          })
          .catch((error) => {
            toast.dismiss();
            throw error;
          });
      } else {
          Utils.adderrorNotification('End date cannot be less than start date! Please try again');
      }
    }
    /**
      * To read the ram utilization of a selected VM based on specific timespan and to visualize the same
      * @param  {String} api_secret A custom hex secret code used for authenticating the api call
      * @param  {String} computer_name The name of the VM that is selected
      * @param  {String} start The start time value used in the timespan
      * @param  {String} end The end time value used in the timespan
      * @param  {String} time The default time interval used between the data points(30m)
      * @return {JSON}  response with ram_utilization of the selected VM
    */
    readRamChartData = async (item) => {
      var iso_start_date = this.state.start_date.toISOString();
      var iso_end_date = this.state.end_date.toISOString();
      if (iso_end_date > iso_start_date) {
          Utils.addinfoNotification('Processing your request');
          var ram_chart_data = [];
          fetch(reactAPIURL + 'ram-usage', {
            method: 'post',
            headers: {
              'Accept': 'application/json',
              'Content-type': 'application/json',
              'x-api-key': 'kA6tmf4dkA8YaM3a7X9To7Iac2KkfTJl1YHzBHFh'
            },
            body: JSON.stringify({
              "computer_name": this.state.clickedItem.machine_name,
              "start": iso_start_date,
              "end": iso_end_date,
              "time": item,
              "all_computers": "",
            })
          })
          .then((response) => response.json())
          .then(responseJson => {
            toast.dismiss();
            if(responseJson.statusCode === 200 && responseJson.body.length >= 1){
              const res = JSON.parse(responseJson.body)
              ram_chart_data = res.map((item, index) => {
                return ({
                  machine_name: this.state.clickedItem.machine_name,
                  ram_utilization: item.avg_Val,
                  time_generated: item.TimeGenerated
                })
              })
            }
            this.setState({
              ram_chart_data: ram_chart_data,
              loaded_chart_ram: true,
              time: item
            });
          })
          .catch((error) => {
            toast.dismiss();
            throw error;
          });
      } else {
          Utils.adderrorNotification('End date cannot be less than start date! Please try again');
      }
    }
    //User start date selection onchange handler function to set state dynamically
    async setStartDate(date) {
        if (date !== null) {
            await this.setState({start_date: date})
            if(this.state.page2)
            this.readCpuChartData(this.state.time);
            else
            this.readRamChartData(this.state.time);
        }
    }
    //User end date selection onchange handler function to set state dynamically
    async setEndDate(date) {
        if (date !== null) {
            await this.setState({end_date: date})
            if(this.state.page2)
            this.readCpuChartData(this.state.time);
            else
            this.readRamChartData(this.state.time);
        }
    }

    handleramShow = async () => {
        await this.setState({default: false, page1: false, page3: true})
        this.readRamChartData(this.state.time);
    }
    handlecpuShow = async () => {
        await this.setState({default: false, page1: false, page2: true})
        this.readCpuChartData(this.state.time);
    }
    //User onclick handler function to set state dynamically(to select a specific VM)
    machineDetails = async (event, rowData) => {
        await this.setState({default: false, page1: true, clickedItem: rowData})
        this.readCpuData(rowData);
        this.readRamData(rowData);
        this.readStorageData(rowData);
    }

    goBackone() {
        this.setState({default: true, page1: false, clickedItem: ''})
    }

    goBacktwo() {
        this.setState({default: false, page1: true, page2: false})
    }

    goBackthree() {
        this.setState({default: false, page1: true, page3: false})
    }

    render() {
      let appInsights = null;
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

      const formatXAxis = tickItem => {
          return moment(tickItem).format('MM/DD h:mma');
      }
      return (
          <TelemetryProvider instrumentationKey="7696784d-3192-42a6-891e-1f8ca728cfae" after={() => {
              appInsights = getAppInsights()
          }}>
              <div className="App">
                  {this.state.role === "admin" || this.state.role === "customer_admin"
                    || this.state.role === "biz_default_user" || this.state.role === "biz_customer_admin" ?
                    <div className="row">
                        <div className="col-md-12 grid-margin">
                          {this.state.default &&
                            <div>
                            <div className="card">
                            {(this.state.role === 'admin' || this.state.role === 'brixon_developer') ?
                                <div className="showFilterCustomer">
                                    <div className= {`${ 'card-header' } ${ css(styles.cardheader) }`}>Filter Labs by Customer</div>
                                    <div className="card-body">
                                        {this.state.loadedCustomerData ?
                                            <form className="form-sample">
                                              <div className="row">
                                                <div className="col-md-12">
                                                    <Form.Group className="row">
                                                        <div className="col-sm-12">
                                                          <span>Customer Name&#42;</span>
                                                            <select className="form-control form-control-sm col-6"
                                                                    value={this.state.customerSelected}
                                                                    onChange={this.change_customer_details}
                                                            >
                                                                <option key="all" value="all">All Customers</option>
                                                                {this.state.loadedCustomerData ?
                                                                    this.state.customerData.map((item) => {
                                                                        return (
                                                                            <option key={item.customer_id}
                                                                                    value={item.customer_id}
                                                                            >
                                                                                {item.customer_org_name}
                                                                            </option>);
                                                                    })
                                                                    : null
                                                                }
                                                            </select>
                                                        </div>
                                                    </Form.Group>
                                                </div>
                                              </div>
                                            </form>
                                            :
                                            <div className="d-flex justify-content-center">
                                                <Spinner animation="border" role="status">
                                                    <span className="sr-only">Loading...</span>
                                                </Spinner>
                                            </div>
                                        }
                                    </div>
                                </div>
                                :
                                null
                            }

                            </div>
                             <div className="card">
                                <div className= {`${ 'card-header d-flex justify-content-between align-items-center' } ${ css(styles.cardheader) }`}>Virtual Assets currently deployed
                                  <span data-toggle="tooltip" data-placement="top"
                                   title="refresh table data">
                                    <CachedIcon className="refresh" onClick={() => {
                                        this.readHeartBeatData();
                                    }}/>
                                  </span>
                                </div>
                                <div className="card-body">
                                  <MaterialTable
                                      onRowClick={this.machineDetails}
                                      title="Virtual Machine Overview"
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
                                      },
                                      header: {
                                          actions: 'Details'
                                      }
                                      }}
                                      columns={[
                                          {
                                              title: 'Machine Type', field: 'machine_type',
                                              lookup: {
                                                Class_Server: 'Class Server',
                                                Customer_Server: 'Customer Server',
                                                Customer_Template: 'Customer Template',
                                                Student_Lab: 'Student Lab'
                                              }
                                          },
                                          {title: 'Machine Name', field: 'machine_name'},
                                          {title: 'Machine IP', field: 'machine_ip'},
                                          {
                                              title: 'OS Type', field: 'machine_os',
                                              lookup: {Windows: 'Windows', Linux: 'Linux'},
                                          },
                                          {
                                              title: 'Last HeartBeat',
                                              field: 'machine_heartbeat',
                                              hidden: true
                                          },
                                          {
                                              title: 'HeartBeat Readable',
                                              field: 'heartbeat_readable',
                                              hidden: true
                                          },
                                          {
                                              field: 'status',
                                              title: 'Status',
                                              lookup: {Online: 'Online', Offline: 'Offline'},
                                              render: rowData => {
                                                  return (
                                                      <span
                                                          className={rowData.status === 'Online' ? 'badge badge-success' : 'badge badge-danger'}
                                                      >
                                                              {rowData.status}
                                                          </span>
                                                  )
                                              },
                                          },
                                      ]}
                                      data={this.state.data}
                                      options={{
                                          toolbar: false,
                                          headerStyle: {
                                              backgroundColor: this.state.secondary_color,
                                              color: '#FFF',
                                              fontSize: '12px'
                                          },
                                          rowStyle: {
                                            fontSize: '12px'
                                          },
                                          exportButton: true,
                                          filtering: true,
                                          grouping: true,
                                          //actionsColumnIndex: -1
                                      }}
                                      actions={[
                                        rowData => ({
                                            icon: 'info',
                                            tooltip: 'VM Details',
                                            onClick: (event, rowData) => this.machineDetails(event, rowData)
                                        })
                                      ]}
                                  />
                                </div>
                            </div>
                            </div>
                            }

                            {this.state.page1 &&
                            <div className="card">
                                <div className= {`${ 'card-header' } ${ css(styles.cardheader) }`}>
                                    <BackspaceIcon style={{cursor: 'pointer'}}
                                                   onClick={this.goBackone.bind(this)}/>&nbsp;
                                    Virtual Machine Overview
                                </div>
                                <div className="card-body">
                                    <div className="col-lg-12 grid-margin stretch-card">
                                        <Container>
                                            <Row>
                                                <Col md="4">
                                                    <Card style={card_media}>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                textAlign: 'center'
                                                            }}>
                                                            <CardContent>
                                                                <Typography
                                                                    style={{
                                                                        color: 'white',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                    gutterBottom>
                                                                    Machine Name: <span style={{
                                                                        fontWeight: 'normal',
                                                                    }}> {this.state.clickedItem.machine_name}</span>
                                                                </Typography>
                                                                <Typography style={{color: 'white'}}>
                                                                    {this.state.clickedItem.machine_os === 'Windows' ?
                                                                        <i className="fa fa-windows"
                                                                                aria-hidden="true"
                                                                                style={{fontSize: '120px',}}/>
                                                                         :
                                                                        <i className="fa fa-linux"
                                                                                aria-hidden="true"
                                                                                style={{fontSize: '120px',}}/>
                                                                    }
                                                                </Typography>
                                                                <Typography style={{
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                }}> OS Type:
                                                                    {this.state.clickedItem.machine_os === 'Windows' ?
                                                                        <span style={{
                                                                            fontWeight: 'normal',
                                                                        }}> Windows</span> :
                                                                        <span style={{
                                                                            fontWeight: 'normal',
                                                                        }}> Linux</span>
                                                                    }
                                                                </Typography>
                                                            </CardContent>

                                                        </div>
                                                    </Card>
                                                </Col>


                                                <Col md="4">
                                                    <Card style={card_media}>
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                                textAlign: 'center'
                                                            }}>
                                                            <CardContent>
                                                                <Typography
                                                                    style={{
                                                                        color: 'white',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                    gutterBottom>
                                                                    Machine IP
                                                                </Typography>
                                                                <Typography
                                                                            style={{color: 'white'}}>
                                                                    <div>
                                                                        <i className="fa fa-terminal"
                                                                           style={{fontSize: '120px'}}/>
                                                                    </div>
                                                                    {this.state.clickedItem.machine_ip}
                                                                </Typography>
                                                            </CardContent>
                                                        </div>
                                                    </Card>
                                                </Col>

                                                <Col md="4">
                                                    <Card style={card_media}>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            textAlign: 'center'
                                                        }}>
                                                            <CardContent>
                                                                <Typography
                                                                    style={{
                                                                        color: 'white',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                    gutterBottom>
                                                                    Status
                                                                    : {this.state.clickedItem.status === 'Online' ?
                                                                    <span style={{
                                                                        fontWeight: 'normal',
                                                                    }}>Online</span>
                                                                    :
                                                                    <span style={{
                                                                        fontWeight: 'normal'
                                                                    }}>Offline</span>
                                                                }
                                                                </Typography>
                                                                <Typography variant="h6" style={{color: 'white'}}>
                                                                    {this.state.clickedItem.status === 'Online' ?
                                                                        <div>
                                                                            <i className="fa fa-server"
                                                                               style={{
                                                                                   fontSize: '120px',
                                                                                   color: 'green',
                                                                               }}/>
                                                                        </div> :
                                                                        <div>
                                                                        <i className="fa fa-server"
                                                                           style={{
                                                                               fontSize: '120px',
                                                                               color: 'red',
                                                                           }}/>
                                                                        </div>
                                                                    }
                                                                </Typography>
                                                                <Typography
                                                                    style={{
                                                                        color: 'white',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                    gutterBottom>
                                                                    Last Active: <span style={{
                                                                        fontWeight: 'normal',
                                                                    }}>{this.state.clickedItem.heartbeat_readable}</span>
                                                                </Typography>
                                                            </CardContent>
                                                        </div>
                                                    </Card>
                                                </Col>

                                            </Row>
                                            <br/>
                                            <Row>
                                                <Col md="4">
                                                    <Card style={card_media}>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            textAlign: 'center'
                                                        }}>
                                                            <CardContent>
                                                                <Typography
                                                                    style={{
                                                                        color: 'white',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                    gutterBottom>
                                                                    Free Storage
                                                                </Typography>
                                                                <Typography style={{color: 'white'}}>
                                                                    {
                                                                      this.state.storage_data.length > 0 ?
                                                                          this.state.storage_data.map((item, index) => {
                                                                              return (
                                                                                  <div key={index}>
                                                                                      <span>({item.machine_drive}) {item.machine_storage}GB</span>
                                                                                  </div>
                                                                              )
                                                                          })
                                                                      :
                                                                      this.getSpinner_or_offline()
                                                                    }
                                                                </Typography>
                                                            </CardContent>
                                                        </div>
                                                    </Card>
                                                </Col>
                                                <Col md="4">
                                                    <Card style={card_media_pointer}
                                                          onClick={this.handlecpuShow}>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            textAlign: 'center'
                                                        }}>
                                                            <CardContent>
                                                                <Typography style={{
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                }} gutterBottom>
                                                                    CPU Usage
                                                                </Typography>
                                                                <Typography variant="h6" style={{color: 'white'}}>
                                                                    {this.state.cpu_data.length > 0 ?

                                                                        this.cpuSpinner()
                                                                        :
                                                                        this.getSpinner_or_offline()
                                                                    }
                                                                </Typography>
                                                            </CardContent>
                                                        </div>
                                                    </Card>
                                                </Col>
                                                <Col md="4">
                                                    <Card style={card_media_pointer}
                                                          onClick={this.handleramShow}>
                                                        <div style={{
                                                            display: 'flex',
                                                            justifyContent: 'center',
                                                            textAlign: 'center'
                                                        }}>
                                                            <CardContent>
                                                                <Typography style={{
                                                                    color: 'white',
                                                                    fontWeight: 'bold',
                                                                }} gutterBottom>
                                                                    RAM
                                                                </Typography>
                                                                <Typography variant="h6"
                                                                            style={{color: 'white'}}>
                                                                    {this.state.ram_data.length > 0 ?
                                                                        this.ramSizeColor()
                                                                        :
                                                                        this.getSpinner_or_offline()
                                                                    }
                                                                </Typography>
                                                            </CardContent>
                                                        </div>
                                                    </Card>
                                                </Col>

                                            </Row>
                                        </Container>
                                    </div>
                                </div>
                            </div>
                            }
                            {this.state.page2 &&
                            <div className="card">
                                <div className= {`${ 'card-header' } ${ css(styles.cardheader) }`}>
                                    <BackspaceIcon style={{cursor: 'pointer'}}
                                                   onClick={this.goBacktwo.bind(this)}/>&nbsp;
                                    CPU utilization (%)
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-md-8">
                                            <Form.Group className="row">
                                                <div className="col-sm-12">
                                                  <span>Start Date&#42;</span>
                                                  <div>
                                                    <DatePicker selected={this.state.start_date}
                                                                onChange={date => this.setStartDate(date)}
                                                                placeholderText="Start Date"
                                                                dateFormat="MMMM d, yyyy h:mm aa"
                                                                showTimeSelect
                                                                peekNextMonth
                                                                showMonthDropdown
                                                                showYearDropdown
                                                                dropdownMode="select"
                                                    />
                                                  </div>
                                                </div>
                                                <div className="col-sm-12">
                                                  <span>End Date&#42;</span>
                                                  <div>
                                                    <DatePicker selected={this.state.end_date}
                                                                onChange={date => this.setEndDate(date)}
                                                                placeholderText="End Date"
                                                                dateFormat="MMMM d, yyyy h:mm aa"
                                                                showTimeSelect
                                                                peekNextMonth
                                                                showMonthDropdown
                                                                showYearDropdown
                                                                dropdownMode="select"
                                                    />
                                                  </div>
                                                </div>
                                            </Form.Group>
                                        </div>
                                        <div className="col-md-4">
                                            <Form.Group className="row">
                                              <div className="col-sm-12">
                                                <span>Interval</span>
                                                <div className="filters">
                                                    <li>
                                                        <label
                                                            className={this.state.time === '5m' ? 'active' : null}
                                                            onClick={() => this.readCpuChartData('5m')}>5m</label>
                                                    </li>
                                                    <li>
                                                        <label
                                                            className={this.state.time === '30m' ? 'active' : null}
                                                            onClick={() => this.readCpuChartData('30m')}>30m</label>
                                                    </li>
                                                    <li>
                                                        <label
                                                            className={this.state.time === '60m' ? 'active' : null}
                                                            onClick={() => this.readCpuChartData('60m')}>1h</label>
                                                    </li>
                                                    <li>
                                                        <label
                                                            className={this.state.time === '180m' ? 'active' : null}
                                                            onClick={() => this.readCpuChartData('180m')}>3h</label>
                                                    </li>
                                                    <li>
                                                        <label
                                                            className={this.state.time === '360m' ? 'active' : null}
                                                            onClick={() => this.readCpuChartData('360m')}>6h</label>
                                                    </li>
                                                    <li>
                                                        <label
                                                            className={this.state.time === '720m' ? 'active' : null}
                                                            onClick={() => this.readCpuChartData('720m')}>12h</label>
                                                    </li>&nbsp;
                                                    <li>
                                                      <label
                                                          onClick={() => this.readCpuChartData(this.state.time)}><CachedIcon/>
                                                      </label>
                                                    </li>
                                                </div>
                                              </div>
                                            </Form.Group>
                                        </div>
                                        <ResponsiveContainer width='100%' height={400}>
                                            {this.state.loaded_chart && this.state.cpu_chart_data.length > 0?
                                                <AreaChart
                                                    data={this.state.cpu_chart_data}
                                                    margin={{top: 5, right: 25, left: 10, bottom: 5}}
                                                >
                                                    <CartesianGrid strokeDasharray="2 2"/>
                                                    <XAxis dataKey="time_generated"
                                                           domain={[this.state.start_date, this.state.end_date]}
                                                           tickFormatter={formatXAxis}/>
                                                    <YAxis dataKey="cpu_utilization">
                                                      <Label
                                                          value="CPU Utilization(%)"
                                                          position="insideLeft"
                                                          angle={-90}
                                                          style={{ textAnchor: 'middle' }}
                                                      />
                                                    </YAxis>
                                                    <Tooltip/>
                                                    <Legend/>
                                                    <Area type="monotone" fill="#2e2bd9"
                                                          name={this.state.clickedItem.machine_name}
                                                          dataKey="cpu_utilization" stroke="#2e2bd9"
                                                          dot={false}
                                                          activeDot={{r: 8}}/>
                                                </AreaChart>
                                                : <div className="d-flex justify-content-center">
                                                    <p>No data to display.</p>
                                                </div>
                                            }
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                            }
                            {this.state.page3 &&
                            <div className="card">
                                <div className= {`${ 'card-header' } ${ css(styles.cardheader) }`}>
                                    <BackspaceIcon style={{cursor: 'pointer'}}
                                                   onClick={this.goBackthree.bind(this)}/>&nbsp;
                                    Available RAM in MB:
                                </div>
                                <div className="card-body">
                                  <div className="row">
                                    <div className="col-md-8">
                                        <Form.Group className="row">
                                            <div className="col-sm-12">
                                              <span>Start Date&#42;</span>
                                              <div>
                                                <DatePicker selected={this.state.start_date}
                                                            onChange={date => this.setStartDate(date)}
                                                            placeholderText="Start Date"
                                                            dateFormat="MMMM d, yyyy h:mm aa"
                                                            showTimeSelect
                                                            peekNextMonth
                                                            showMonthDropdown
                                                            showYearDropdown
                                                            dropdownMode="select"
                                                />
                                              </div>
                                            </div>
                                            <div className="col-sm-12">
                                              <span>End Date&#42;</span>
                                              <div>
                                                <DatePicker selected={this.state.end_date}
                                                            onChange={date => this.setEndDate(date)}
                                                            placeholderText="End Date"
                                                            dateFormat="MMMM d, yyyy h:mm aa"
                                                            showTimeSelect
                                                            peekNextMonth
                                                            showMonthDropdown
                                                            showYearDropdown
                                                            dropdownMode="select"
                                                />
                                              </div>
                                            </div>
                                        </Form.Group>
                                    </div>
                                    <div className="col-md-4">
                                        <Form.Group className="row">
                                          <div className="col-sm-12">
                                            <span>Interval</span>
                                            <div className="filters">
                                                <li>
                                                    <label
                                                        className={this.state.time === '5m' ? 'active' : null}
                                                        onClick={() => this.readRamChartData('5m')}>5m</label>
                                                </li>
                                                <li>
                                                    <label
                                                        className={this.state.time === '30m' ? 'active' : null}
                                                        onClick={() => this.readRamChartData('30m')}>30m</label>
                                                </li>
                                                <li>
                                                    <label
                                                        className={this.state.time === '60m' ? 'active' : null}
                                                        onClick={() => this.readRamChartData('60m')}>1h</label>
                                                </li>
                                                <li>
                                                    <label
                                                        className={this.state.time === '180m' ? 'active' : null}
                                                        onClick={() => this.readRamChartData('180m')}>3h</label>
                                                </li>
                                                <li>
                                                    <label
                                                        className={this.state.time === '360m' ? 'active' : null}
                                                        onClick={() => this.readRamChartData('360m')}>6h</label>
                                                </li>
                                                <li>
                                                    <label
                                                        className={this.state.time === '720m' ? 'active' : null}
                                                        onClick={() => this.readRamChartData('720m')}>12h</label>
                                                </li>
                                                <li>
                                                  <label
                                                      onClick={() => this.readRamChartData(this.state.time)}><CachedIcon/>
                                                  </label>
                                                </li>
                                            </div>
                                          </div>
                                        </Form.Group>
                                    </div>

                                        <ResponsiveContainer width='100%' height={400}>
                                            {this.state.loaded_chart_ram && this.state.ram_chart_data.length > 0 ?
                                                <LineChart
                                                    data={this.state.ram_chart_data}
                                                    margin={{top: 5, right: 25, left: 10, bottom: 5}}
                                                >
                                                    <CartesianGrid strokeDasharray="2 2"/>
                                                    <XAxis dataKey="time_generated"
                                                           domain={[this.state.start_date, this.state.end_date]}
                                                           tickFormatter={formatXAxis}/>
                                                    <YAxis dataKey="ram_utilization">
                                                      <Label
                                                          value="RAM Utilization(MB)"
                                                          position="insideLeft"
                                                          angle={-90}
                                                          style={{ textAnchor: 'middle' }}
                                                      />
                                                    </YAxis>
                                                    <Tooltip/>
                                                    <Legend/>
                                                    <Line type="monotone" fill="#2cc941"
                                                          name={this.state.clickedItem.machine_name}
                                                          dataKey="ram_utilization" stroke="#2cc941"
                                                          dot={false}
                                                          activeDot={{r: 8}}/>
                                                </LineChart>
                                                : <div className="d-flex justify-content-center">
                                                    <p>No data to display.</p>
                                                </div>
                                            }
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                             </div>
                            }
                        </div>
                    </div> : "Access Denied"
                  }
              </div>
          </TelemetryProvider>
      );
    }
}

export default HealthDashboard;
