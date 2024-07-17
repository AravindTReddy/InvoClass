import React, {Component} from 'react'
import {Spinner, Table, Form} from "react-bootstrap";
import MaterialTable from 'material-table';
import {getAppInsights} from '../shared/TelemetryService';
import TelemetryProvider from '../shared/telemetry-provider.jsx';
import {ThemeProvider, createMuiTheme} from '@material-ui/core/styles';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Utils from '../shared/Utils';
import moment from 'moment';
import { StyleSheet, css } from 'aphrodite';
import CachedIcon from '@material-ui/icons/Cached';
import { reactAPIURL, backendAPIURL, stgName } from "../shared/General.js";
import {
  TextField, Button, InputLabel, MenuItem, Typography, Grid, IconButton
} from '@mui/material';
import DeleteDialog from '../shared/DialogBox/DeleteDialog'
import PolicyDialog from '../shared/DialogBox/PolicyDialog'
import CustomToast from '../shared/CustomToast.js'
import DeleteIcon from '@material-ui/icons/Delete';
import CustomTooltip from '../home/customTooltip';
var uniqid = require('uniqid');
const google = window.google;

class CustomerManagement extends Component {
    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            data: [],
            disabled: false,
            organization: '', org_type: '', address1: '', address2: '',
            city: '', state: '', zip: '', country: '',
            poc_email: '', poc_fname: '', poc_lname: '', poc_phone: '',
            open: false, open_policy: false, serverStatus: false,
            customerDeleteData: '',
            coupon_code: '', percent_off: '', max_redemptions: null,
        };

        this.createCustomer = this.createCustomer.bind(this);
        this.updateCustomer = this.updateCustomer.bind(this);
        this.readCustomer = this.readCustomer.bind(this);
        this.deleteCustomer = this.deleteCustomer.bind(this);
        this.autocomplete = null;
        this.handlePlaceSelect = this.handlePlaceSelect.bind(this)
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
      this.readCustomer();
      this.autocomplete = new google.maps.places.Autocomplete(document.getElementById('autocomplete'), {})
      this.autocomplete.addListener("place_changed", this.handlePlaceSelect)
    }

    /**
    * To get the list of customers available under Brixon Inc
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param {String} role user role of the logged in user
    * @return {JSON}  response with a success and list of customers
    */
    readCustomer = async () => {
      await this.setState({loaded: false, data: []})
      Utils.getCustomerDetails(this.state.refresh_token,
            this.state.customer_id, this.state.role)
      .then((data) => {
        this.setState({data: data, loaded: true});
      })
      .catch((error) => {
          throw error;
      });
    }
    /**
    * To insert a new customer/company details
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} email email of the user/company
    * @param  {String} firstname firstname of the user
    * @param  {String} lastname lastname of the user
    * @param  {String} organization organization/company of the user
    * @param  {String} address address of the user/company
    * @param  {number} phone phone number of the user/company
    * @param  {String} city city of the user/company
    * @param  {String} state state of the user/company
    * @param  {String} county country of the user/company
    * @param  {number} zip zip code of the user/company
    * @return {JSON}  response with a success custom message and statusCode
    */
    createCustomer = async () => {
      await this.setState({disabled: true, open_policy: false});
      const poc_email = this.state.poc_email.toLowerCase();
      const poc_phone = this.state.poc_phone;
      //regex expression to validate the user input email and phone number
      let reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      let phoneno = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
      let customer_id = uniqid.time('customer-');
      if (reg.test(String(poc_email).toLowerCase()) === false) {
          Utils.adderrorNotification('Please enter a valid email address and try again')
          this.setState({disabled: false})
          return false;
      } else if (phoneno.test(poc_phone) === false) {
          Utils.adderrorNotification('Please enter a valid phone number format and try again')
          this.setState({disabled: false})
          return false;
      } else {
          Utils.addinfoNotification('Creating customer...');
          fetch(reactAPIURL + 'createcustomer', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json',
                'Authorization': this.state.id_token
            },
            body: JSON.stringify({
                "customer_id": customer_id,
                "customer_org_name": this.state.organization,
                "org_type": this.state.org_type,
                "org_address_line_1": this.state.address1,
                "org_address_line_2": this.state.address2,
                "org_state": this.state.state,
                "org_city": this.state.city,
                "org_zip": this.state.zip,
                "org_country": this.state.country,
                "customer_poc_first_name": this.state.poc_fname,
                "customer_poc_last_name": this.state.poc_lname,
                "customer_primary_poc_email": poc_email,
                "customer_poc_phone": this.state.poc_phone,
                "refresh_token": this.state.refresh_token
            })
          })
          .then((response) => response.json())
          .then(responseJson => {
            toast.dismiss();
            this.setState({disabled: false})
            if (responseJson.message === "success" && responseJson.statusCode === 200) {
              this.createCustomerServerVM(customer_id);
              if(this.state.org_type === 'biz'){
                this.createClassServerVM('class' + '-' + customer_id.split("-")[1],
                                  'course' + '-' + customer_id.split("-")[1], true)
              }
              Utils.addsuccessNotification('Customer created successfully')
              this.resetForm();
              this.readCustomer();
            }else {
              Utils.adderrorNotification('Error creating the customer: ' + responseJson.errorType + ': ' + responseJson.errorMessage)
            }
          })
          .catch((error) => {
            toast.dismiss();
            Utils.adderrorNotification('Error creating the customer: ' + error)
            this.setState({disabled: false})
          });
      }
    }

    /**
    * To activate the customer server on demand
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} item The unique customer ID of the current logged in user
    * @return {JSON}  response with a success and list of courses
    */
    createCustomerServerVM = async (item) => {
      fetch(backendAPIURL + 'deploy_customer_server_vm', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
            'Authorization': this.state.id_token
        },
        body: JSON.stringify({
            "secret_password": "start_customer_server_qw3$t&YWS",
            "customer_id": item,
            "stg": stgName,
            "rebuild": this.state.serverStatus, //rebuild
            "user": this.state.user
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        this.setState({serverStatus: false})
        if (responseJson.statusCode === 200) {
            Utils.addsuccessNotification('Customer server deployed!')
        } else if (responseJson.statusCode === 300) {
            Utils.adderrorNotification(responseJson.message)
        } else if (responseJson.statusCode === 500) {
            Utils.adderrorNotification(responseJson.message);
        } else if (responseJson.message === "Endpoint request timed out") {
            Utils.addsuccessNotification('Hang tight, the server will be up soon!')
        } else {
            Utils.adderrorNotification('Error creating the customer server VM: ' + responseJson.errorMessage)
        }
      })
      .catch((error) => {
        Utils.addsuccessNotification('Hang tight, the customer server will be up soon!')
        // Utils.adderrorNotification('Error activating the customer server: ' + error)
      });
    };

    /**
    * To create the class server VM on demand
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {Array} rowData An array with class details(class_id, course_id, customer_id)
    * @return {JSON}  response with a success custom message and statusCode
    */
    createClassServerVM = async (class_id, course_id, serverStatus) => {
      var bearer = this.state.id_token;
      fetch(backendAPIURL + 'deploy_class_server_vm', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
            'Authorization': bearer
        },
        body: JSON.stringify({
            "secret_password": "start_class_server_qw3$t&YWS",
            'customer_id': this.state.customer_id,
            'course_id': course_id,
            'class_id': class_id,
            'stg': stgName,
            "server_status": serverStatus,
            'user': this.state.user
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
      })
      .catch((error) => {
        throw error;
      });
    };

    /**
    * To delete a specific customer
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {Array} rowData Array of customer details(customer_id)
    * @return {JSON}  response with a success custom message and statusCode
    */
    deleteCustomer = async (rowData) => {
      await this.setState({disabled: true, open: false})
      Utils.addinfoNotification('Deleting customer...');
      fetch(reactAPIURL + 'deletecustomer', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
            'Authorization': this.state.id_token
        },
        body: JSON.stringify({
            "refresh_token": this.state.refresh_token,
            "customer_id": rowData.customer_id
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        //console.log(responseJson);
        toast.dismiss();
        this.setState({disabled: false})
        if (responseJson.message === "success" && responseJson.statusCode === 200) {
            this.readCustomer();
            Utils.addsuccessNotification('Customer deleted successfully')
        } else {
            Utils.adderrorNotification('Error deleting the customer: ' + responseJson.errorType + ': ' + responseJson.errorMessage)
        }
      })
      .catch((error) => {
        toast.dismiss();
        Utils.adderrorNotification('Error deleting the customer: ' + error)
        this.setState({disabled: false})
      });
    }
    /**
    * To update the customer details
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} firstname firstname of the user
    * @param  {String} lastname lastname of the user
    * @param  {String} organization organization/company of the user
    * @param  {String} address address of the user/company
    * @param  {number} phone phone number of the user/company
    * @param  {String} city city of the user/company
    * @param  {String} state state of the user/company
    * @param  {String} county country of the user/company
    * @param  {number} zip zip code of the user/company
    * @return {JSON}  response with a success custom message and statusCode
    */
    updateCustomer = (item) => {
      fetch(reactAPIURL + 'updatecustomer', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
          'Authorization': this.state.id_token
        },
        body: JSON.stringify({
          "customer_id": item.customer_id,
          "customer_org_name": item.customer_org_name,
          "customer_plan": item.customer_plan,
          "org_address_line_1": item.org_address_line_1,
          "org_address_line_2": item.org_address_line_2,
          "customer_primary_poc_email": item.customer_primary_poc_email.toLowerCase(),
          "customer_poc_phone": item.customer_primary_poc_contact,
          "org_state": item.org_state,
          "org_city": item.org_city,
          "org_zip": item.org_zip,
          "org_country": item.org_country,
          "refresh_token": this.state.refresh_token,
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        //console.log(responseJson);
        if (responseJson.message === "success" && responseJson.statusCode === 200) {
            Utils.addsuccessNotification('Customer details updated successfully')
            this.readCustomer();
        } else {
            Utils.adderrorNotification('Error updating the customer details: ' + responseJson.errorMessage)
        }
      })
      .catch((error) => {
          Utils.adderrorNotification('Error updating the customer details: ' + error)
      });
    }

    //User input onchange handler function to set state dynamically
    onChange = (key, value) => {
        this.setState({
            [key]: value
        })
    }

    //User address input onselect handler function to set state dynamically
    handlePlaceSelect() {
        let addressObject = this.autocomplete.getPlace()
        let address = addressObject.address_components
        this.setState({
            address1: this.getStreet(address) + ' ' + this.getRoute(address),
            city: this.getCity(address),
            state: this.getState(address),
            country: this.getCountry(address),
            zip: this.getZip(address),
        })
    }
    getStreet = (addressArray) => {
        let street_number = '';
        for (let i = 0; i < addressArray.length; i++) {
            for (let i = 0; i < addressArray.length; i++) {
                if (addressArray[i].types[0] && 'street_number' === addressArray[i].types[0]) {
                    street_number = addressArray[i].long_name;
                    return street_number;
                }
            }
        }
    };
    getRoute = (addressArray) => {
        let route = '';
        for (let i = 0; i < addressArray.length; i++) {
            for (let i = 0; i < addressArray.length; i++) {
                if (addressArray[i].types[0] && 'route' === addressArray[i].types[0]) {
                    route = addressArray[i].long_name;
                    return route;
                }
            }
        }
    };
    getZip = (addressArray) => {
        let zip = '';
        for (let i = 0; i < addressArray.length; i++) {
            if (addressArray[i].types[0] && 'postal_code' === addressArray[i].types[0]) {
                zip = addressArray[i].long_name;
                return zip;
            }
        }
    };
    getCountry = (addressArray) => {
        let country = '';
        for (let i = 0; i < addressArray.length; i++) {
            if (addressArray[i].types[0] && 'country' === addressArray[i].types[0]) {
                country = addressArray[i].long_name;
                return country;
            }
        }
    };
    getCity = (addressArray) => {
        let city = '';
        for (let i = 0; i < addressArray.length; i++) {
            if (addressArray[i].types[0] && 'locality' === addressArray[i].types[0]) {
                city = addressArray[i].long_name;
                return city;
            }
        }
    };
    getState = (addressArray) => {
        let state = '';
        for (let i = 0; i < addressArray.length; i++) {
            for (let i = 0; i < addressArray.length; i++) {
                if (addressArray[i].types[0] && 'administrative_area_level_1' === addressArray[i].types[0]) {
                    state = addressArray[i].long_name;
                    return state;
                }
            }
        }
    };

    resetForm = () => {
      this.setState({
        organization:'',
        org_type: '',
        address1:'',
        address2:'',
        city:'',
        state:'',
        zip:'',
        country:'',
        poc_email:'',
        poc_fname:'',
        poc_lname:'',
        poc_phone:''
      })
    }

    deleteDialog = async(rowData) => {
      await this.setState({open: true, customerDeleteData: rowData});
    };

    handleCloseDialog = () => {
      this.setState({open: false, open_policy: false});
    };

    handlePolicyAlert = async(e) => {
      e.preventDefault();
      await this.setState({open_policy: true});
    };

    createCoupon = async(e) => {
      e.preventDefault();
      const randomID = uniqid();
      Utils.addinfoNotification('Creating and saving class coupon...');
      fetch(reactAPIURL + 'create-coupon', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.state.refresh_token,
          percent_off: this.state.percent_off,
          name: this.state.coupon_code,
          customer_id: 'customer-brixon',
          max_redemptions: this.state.max_redemptions,
          redeemby_date: null,
          id: randomID
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        toast.dismiss();
        // console.log(responseJson);
        if(responseJson.statusCode === 200) {
          //lets store this coupons to class_coupons:
          Utils.addsuccessNotification('Coupon created successfully');
          this.setState({
            coupon_code: '',
            percent_off: '',
            max_redemptions: null
          })
        }else {
          Utils.adderrorNotification('Error creating coupon: ' + responseJson.errorMessage)
          return;
        }
      })
      .catch((error) => {
        Utils.adderrorNotification(error);
      });
    };

    deleteCoupon = async (item) => {
      Utils.addinfoNotification('Deleting class coupon...');
      fetch(reactAPIURL + 'delete-coupon', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.state.refresh_token,
          item: item,
          customer_id: 'customer-brixon',
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        toast.dismiss();
        // console.log(responseJson);
        if(responseJson.statusCode === 200) {
          Utils.addsuccessNotification('Coupon deleted successfully');
        }else {
          Utils.adderrorNotification('Error deleting coupon: ' + responseJson.errorMessage)
          return;
        }
      })
      .catch((error) => {
        Utils.adderrorNotification(error);
      });
    };

    handleCopyClick = (coupon_id) => {
      // Use the Clipboard API to copy the text to the clipboard
      navigator.clipboard.writeText(coupon_id)
        .then(() => {
          // The text has been successfully copied
        })
        .catch((err) => {
          // Handle any errors that may occur while copying
          console.error('Error copying text to clipboard:', err);
        });
    };

    render() {
      const theme = createMuiTheme({
          palette: {
              primary: {
                  main: '#F38A2C',
              },
              secondary: {
                  main: '#F38A2C',
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
      let appInsights = null;

      return (
          <TelemetryProvider instrumentationKey="7696784d-3192-42a6-891e-1f8ca728cfae" after={() => {
              appInsights = getAppInsights()
          }}>
            <ThemeProvider theme={theme}>
              <div className="App">
                {this.state.role === "admin" ?
                    <div className="row">
                      <div className="col-lg-12 grid-margin">
                          <div className="card">
                              <div className= {`${ 'card-header' } ${ css(styles.cardheader) }`}>Add New Customer</div>
                                <div className="card-body">
                                  <p className="card-description">(All fields marked with * are required)</p>
                                    <form onSubmit={this.handlePolicyAlert}>
                                      <div className="row">
                                        <div className="col-md-3">
                                          <Form.Group className="row">
                                            <div className="col-sm-12">
                                              <TextField
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                label="Organization Name"
                                                value={this.state.organization}
                                                type='text'
                                                required
                                                onChange={evt => this.onChange('organization', evt.target.value)}
                                              />
                                            </div>
                                          </Form.Group>
                                        </div>
                                        <div className="col-md-3">
                                          <Form.Group className="row">
                                            <div className="col-sm-12">
                                              <TextField
                                                fullWidth
                                                size="small"
                                                select
                                                label="Organization Category"
                                                value={this.state.org_type}
                                                onChange={evt => this.setState({org_type: evt.target.value})}
                                                variant="outlined"
                                                required
                                              >
                                                <MenuItem value="">Select a Category</MenuItem>
                                                <MenuItem value="biz">Business and Professional</MenuItem>
                                                <MenuItem value="edu">Educational institution</MenuItem>
                                              </TextField>
                                            </div>
                                          </Form.Group>
                                        </div>
                                        <div className="col-md-3">
                                          <Form.Group className="row">
                                            <div className="col-sm-12">
                                              <TextField
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                label="Address"
                                                id="autocomplete"
                                                required
                                                type='text'
                                              />
                                            </div>
                                          </Form.Group>
                                        </div>
                                        <div className="col-md-3">
                                          <Form.Group className="row">
                                            <div className="col-sm-12">
                                              <TextField
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                label="Address Line 2"
                                                type='text'
                                                value={this.state.address2}
                                                onChange={evt => this.onChange('address2', evt.target.value)}
                                              />
                                            </div>
                                          </Form.Group>
                                        </div>
                                      </div>
                                      <div className="row">
                                        <div className="col-md-3">
                                          <Form.Group className="row">
                                            <div className="col-sm-12">
                                              <TextField
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                label="City"
                                                type='text'
                                                required
                                                value={this.state.city}
                                                onChange={evt => this.onChange('city', evt.target.value)}
                                              />
                                            </div>
                                          </Form.Group>
                                        </div>
                                        <div className="col-md-3">
                                          <Form.Group className="row">
                                            <div className="col-sm-12">
                                              <TextField
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                label="State"
                                                type='text'
                                                required
                                                value={this.state.state}
                                                onChange={event => this.setState({'state': event.target.value})}
                                              />
                                            </div>
                                          </Form.Group>
                                        </div>
                                        <div className="col-md-3">
                                          <Form.Group className="row">
                                            <div className="col-sm-12">
                                              <TextField
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                label="Zip"
                                                type='text'
                                                required
                                                value={this.state.zip}
                                                onChange={event => this.setState({'zip': event.target.value})}
                                              />
                                            </div>
                                          </Form.Group>
                                        </div>
                                        <div className="col-md-3">
                                          <Form.Group className="row">
                                            <div className="col-sm-12">
                                              <TextField
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                label="Country"
                                                type='text'
                                                required
                                                value={this.state.country}
                                                onChange={evt => this.onChange('country', evt.target.value)}
                                              />
                                            </div>
                                          </Form.Group>
                                        </div>
                                      </div>
                                      <div className="row">
                                          <div className="col-md-3">
                                            <Form.Group className="row">
                                              <div className="col-sm-12">
                                                <TextField
                                                  fullWidth
                                                  size="small"
                                                  variant="outlined"
                                                  label="First Name"
                                                  type='text'
                                                  required
                                                  value={this.state.poc_fname}
                                                  onChange={evt => this.onChange('poc_fname', evt.target.value.trim())}
                                                  helperText='Point of Contact First Name'
                                                />
                                              </div>
                                            </Form.Group>
                                          </div>
                                          <div className="col-md-3">
                                            <Form.Group className="row">
                                              <div className="col-sm-12">
                                                <TextField
                                                  fullWidth
                                                  size="small"
                                                  variant="outlined"
                                                  label="Last Name"
                                                  type='text'
                                                  required
                                                  value={this.state.poc_lname}
                                                  onChange={evt => this.onChange('poc_lname', evt.target.value.trim())}
                                                  helperText='Point of Contact Last Name'
                                                />
                                              </div>
                                            </Form.Group>
                                          </div>
                                          <div className="col-md-3">
                                            <Form.Group className="row">
                                              <div className="col-sm-12">
                                                <TextField
                                                  fullWidth
                                                  size="small"
                                                  variant="outlined"
                                                  label="Email"
                                                  required
                                                  type='email'
                                                  value={this.state.poc_email}
                                                  onChange={event => this.onChange('poc_email', event.target.value)}
                                                  helperText='Point of Contact Email'
                                                />
                                              </div>
                                            </Form.Group>
                                          </div>
                                          <div className="col-md-3">
                                            <Form.Group className="row">
                                              <div className="col-sm-12">
                                                <TextField
                                                  fullWidth
                                                  size="small"
                                                  variant="outlined"
                                                  label="Phone number"
                                                  inputProps={{
                                                    maxLength: 12,
                                                    minLength: 12
                                                  }}
                                                  required
                                                  value={this.state.poc_phone}
                                                  type="tel"
                                                  pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                                                  onChange={evt => this.onChange('poc_phone', (evt.target.value).replace(/(\d{3}(?!\d?$))\-?/g, '$1-'))}
                                                  helperText='Point of Contact Phone Number'
                                                />
                                              </div>
                                            </Form.Group>
                                          </div>
                                      </div>

                                      <Table striped bordered size="sm" responsive>
                                          <thead>
                                            <tr>
                                                <th>Customer</th>
                                                <th>Address</th>
                                                <th>City</th>
                                                <th>State</th>
                                                <th>Zip</th>
                                                <th>Country</th>
                                                <th>POC Email</th>
                                                <th>POC Name</th>
                                                <th>POC Phone</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr>
                                                <td>{this.state.organization}</td>
                                                <td>{this.state.address1} {this.state.address2}</td>
                                                <td>{this.state.city}</td>
                                                <td>{this.state.state}</td>
                                                <td>{this.state.zip}</td>
                                                <td>{this.state.country}</td>
                                                <td>{this.state.poc_email}</td>
                                                <td>{this.state.poc_fname} {this.state.poc_lname}</td>
                                                <td>{this.state.poc_phone}</td>
                                            </tr>
                                          </tbody>
                                      </Table><br/>
                                      <button type="submit" disabled={this.state.disabled} className="button">
                                        ADD CUSTOMER
                                      </button>{' '}
                                      <button disabled={this.state.disabled} onClick={this.resetForm}
                                              type="reset" className="button">RESET
                                      </button>
                                  </form>
                              </div>
                          </div>
                      </div>
                      <div className="col-lg-12 grid-margin">
                          <div className="card">
                            <div className= {`${ 'card-header d-flex justify-content-between align-items-center' } ${ css(styles.cardheader) }`}>Existing Customers
                              <span data-toggle="tooltip" data-placement="top"
                               title="refresh table data">
                                <CachedIcon className="refresh" onClick={() => {
                                    this.readCustomer();
                                }}/>
                              </span>
                            </div>
                              <div className="card-body">
                                <MaterialTable
                                    title="Existing Customers"
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
                                        {title: 'Customer ID', field: 'customer_id', hidden: true},
                                        {title: 'Customer', field: 'customer_org_name'},
                                        {title: 'POC Email',field: 'customer_primary_poc_email', editable: 'never'},
                                        {title: 'POC Phone', field: 'customer_primary_poc_contact'},
                                        {title: 'Address', field: 'org_address_line_1'},
                                        {title: 'Address Line 2', field: 'org_address_line_2'},
                                        {title: 'City', field: 'org_city'},
                                        {title: 'State', field: 'org_state'},
                                        {title: 'Country', field: 'org_country'},
                                        {title: 'Zip', field: 'org_zip'},
                                        {
                                            title: 'Created',
                                            field: 'created_ts',
                                            editable: 'never',
                                            render: rowData => {
                                                const c_date = moment(rowData.created_ts * 1000).format('MMM-DD-YYYY HH:mm:ss');
                                                return c_date
                                            }
                                        },
                                        {
                                            title: 'Updated',
                                            field: 'updated_ts',
                                            editable: 'never',
                                            render: rowData => {
                                                const u_date = moment(rowData.updated_ts * 1000).format('MMM-DD-YYYY HH:mm:ss');
                                                return u_date
                                            }
                                        },
                                    ]}
                                    data={this.state.data}
                                    actions={[
                                        rowData => ({
                                            icon: 'delete',
                                            tooltip: 'Delete Customer',
                                            onClick: (event, rowData) => this.deleteDialog(rowData)
                                        })
                                    ]}
                                    options={{
                                        headerStyle: {
                                            backgroundColor: this.state.secondary_color,
                                            color: '#FFF',
                                        },
                                        exportButton: true,
                                        showTitle: false,
                                        grouping: true
                                    }}
                                    editable={{
                                      onRowUpdate: (newData, oldData) =>
                                          new Promise((resolve, reject) => {
                                              setTimeout(() => {
                                                  this.updateCustomer(newData);
                                                  resolve();
                                              }, 2000)
                                          }),
                                    }}
                                />
                                {/*A dialog box to warn the user before a customer is deleted*/}
                                <DeleteDialog dashboard="customer"
                                              open={this.state.open}
                                              data={this.state.customerDeleteData}
                                              close={this.handleCloseDialog}
                                              delete={this.deleteCustomer}/>

                                {/*A dialog box to display the policies when a customer is created*/}
                                <PolicyDialog dashboard="customer"
                                              open={this.state.open_policy}
                                              close={this.handleCloseDialog}
                                              create={this.createCustomer}/>

                              </div>
                          </div>
                      </div>
                      <div className="col-lg-12 grid-margin">
                        <div className="card">
                          <div className="card-body">
                            <form onSubmit={this.createCoupon}>
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <Typography variant="h7" style={{marginBottom: '16px', fontSize: '20px'}}>
                                    Create coupons
                                  </Typography>
                                </Grid>
                                <Grid item xs={3}>
                                  <TextField
                                    fullWidth
                                    type="text"
                                    size="small"
                                    label="Coupon Code"
                                    value={this.state.coupon_code}
                                    onChange={event => this.onChange('coupon_code', event.target.value.trim())}
                                    // onChange={evt => setCouponCode(evt.target.value.trim())}
                                    variant="outlined"
                                    required
                                    InputLabelProps={{style: {fontSize: 14}}}
                                    helperText="Please enter a name for your coupon."
                                  >
                                  </TextField>
                                </Grid>
                                <Grid item xs={3}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    size="small"
                                    label="Percentage off"
                                    value={this.state.percent_off}
                                    onChange={event => this.onChange('percent_off', event.target.value.trim())}
                                    // onChange={evt => setPercentOff(evt.target.value.trim())}
                                    variant="outlined"
                                    required
                                    InputLabelProps={{style: {fontSize: 14}}}
                                    helperText="Please set a percentage off from class price."
                                  >
                                  </TextField>
                                </Grid>
                                <Grid item xs={3}>
                                  <TextField
                                    fullWidth
                                    type="number"
                                    size="small"
                                    label="Max redemptions"
                                    value={this.state.max_redemptions}
                                    onChange={event => this.onChange('max_redemptions', event.target.value.trim())}
                                    // onChange={evt => setMaxRedemptions(evt.target.value.trim())}
                                    variant="outlined"
                                    InputLabelProps={{style: {fontSize: 14}}}
                                    helperText="Number of times the coupon can be redeemed before it’s no longer valid."
                                  >
                                  </TextField>
                                </Grid>
                                {/*<Grid item xs={3}>
                                  <DatePicker
                                    showTimeSelect
                                    dateFormat="MMM d, yyyy h:mm aa"
                                    selected={redeemByDate}
                                    customInput={<CustomInput label="Redeem by"/>}
                                    onChange={(date) => setRedeemByDate(date)}
                                    popperPlacement="bottom-end"
                                  />
                                </Grid>*/}
                                <Grid item xs={6}>
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    type="submit"
                                  >
                                    Create Coupon
                                  </Button>
                               </Grid>
                              <Grid item xs={12}>
                              <Typography variant="h7" style={{marginBottom: '16px', fontSize: '20px'}}>
                                Existing coupons
                              </Typography>
                              <Typography variant="subtitle2" style={{marginBottom: '16px'}}>
                                share these coupon codes as part of your customer promotions.
                              </Typography>
                                <div className="card-body">
                                  <div className="table-responsive">
                                    <table className="table table-striped">
                                      <thead>
                                        <tr>
                                          <th> Name </th>
                                          <th> Percentage Off </th>
                                          <th> Created</th>
                                          <th> Copy</th>
                                          <th> Delete</th>
                                        </tr>
                                      </thead>
                                      {this.state.data !== undefined && this.state.data.length > 0 ? (
                                        <tbody>
                                            {this.state.data
                                                .filter(customer => customer.customer_id === "customer-brixon")
                                                .map((customer, index) => {
                                                    return customer.customer_coupons !== undefined && customer.customer_coupons.length > 0 ? (
                                                        customer.customer_coupons.map((item) => {
                                                            return (
                                                                <tr key={item.id}>
                                                                    <td> {item.name}</td>
                                                                    <td> {item.percent_off}{'%'} </td>
                                                                    <td> {moment(item.created * 1000).format('MMMM DD, YYYY HH:mm:ss A')} </td>
                                                                    <td> <CustomTooltip code="coupon" title="Coupon code copied to clipboard"
                                                                            onClick={() => this.handleCopyClick(item.name)}/>
                                                                    </td>
                                                                    <td>
                                                                        <IconButton size="small" onClick={() => this.deleteCoupon(item)}>
                                                                            <DeleteIcon/>
                                                                        </IconButton>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr key={index}>
                                                            <td colSpan="5" style={{ margin: '16px' }}> No coupons to display at this time.</td>
                                                        </tr>
                                                    );
                                                })
                                            }
                                        </tbody>
                                      ) : (
                                          <p style={{ margin: '16px' }}> No customers to display at this time.</p>
                                      )}
                                      </table>
                                    </div>
                                  </div>
                                </Grid>
                            </Grid>
                            </form>
                          </div>
                        </div>
                      </div>
                  </div> : null
              }
            </div>
          </ThemeProvider>
        </TelemetryProvider>
      )
  }
}

export default CustomerManagement
