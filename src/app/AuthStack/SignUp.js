import React from 'react'
import { css } from 'glamor'
import { withRouter } from 'react-router-dom'
import { Auth } from 'aws-amplify'
import {getAppInsights} from '../AppStack/shared/TelemetryService';
import TelemetryProvider from '../AppStack/shared/telemetry-provider.jsx';
import Logo from './Logo'
import Buttonmui from '@material-ui/core/Button';
import { TextField, Tooltip } from '@material-ui/core';
import {Button, Form} from 'react-bootstrap'
import SignIn from './SignIn'
import Utils from '../AppStack/shared/Utils';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormHelperText from '@mui/material/FormHelperText';
import CheckoutForm from './CheckoutForm';
import {loadStripe} from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import AttachMoneyIcon from "@mui/icons-material/AttachMoney"; // Dollar sign icon
import InfoIcon from "@mui/icons-material/Info";
import { reactAPIURL, publishableKey } from "../AppStack/shared/General.js";

const stripePromise = loadStripe(publishableKey);
let reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

class SignUp extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      organization: '',
      password: '',
      password1:'',
      email: '',
      userfname: '',
      userlname: '',
      accounttype: '',
      authCode: '',
      showConfirmation: false,
      showSignIn: false,
      showSignUp: true,
      primary_color: '#F38A2C',
      isPasswordShown: false,
      containsUL: false,// uppercase letter
      containsLL: false,// lowercase letter
      containsN: false,// number
      containsSC: false,// special character
      contains8C: false,// min 8 characters
      allValid: true,
      disabled: false,
      isPaymentPopupOpen: false,
      isPaymentDone: false,
      coupon_data:[]
    }
    this.togglePasswordVisibility = this.togglePasswordVisibility.bind(this);
    this.validatePassword = this.validatePassword.bind(this);
  }

  async componentDidMount() {
    fetch(reactAPIURL + 'read-coupon', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          "customer_id": "customer-brixon",
        })
    })
    .then((response) => response.json())
    .then(responseJson => {
      // console.log(responseJson);
      if (responseJson.statusCode === 200) {
        this.setState({coupon_data: responseJson.body})
      } else {
        console.log(responseJson.errorMessage);
      }
    })
    .catch((error) => {
      console.log(error);
    });
  }

  //to show/hide user input password
  togglePasswordVisibility = () => {
    const { isPasswordShown } = this.state;
    this.setState({ isPasswordShown: !isPasswordShown });
  }

  onChange = (key, value) => {
    this.setState({
      [key]: value
    })
  }

  handleAccountTypeChange = (event) => {
    // const price = event.currentTarget.getAttribute("data-price");
    this.setState({
      accounttype: event.target.value,
      //open payment popup here
      isPaymentPopupOpen: true
    });

  }


  signUp = (e) => {
    e.preventDefault();
    var {email, password, password1, organization, userfname, userlname,
          accounttype, subscription} = this.state
    email = email.toLowerCase();
    //regex expression to validate the user input email(doesn't allow any special characters)
    //eslint-disable-next-line
    if (email==="" && password==="" && password1===""){
      Utils.adderrorNotification('Please fill all the details and try again')
    }
    else if(reg.test(String(email).toLowerCase()) === false){
      Utils.adderrorNotification('Please enter a valid email address and try again')
      return false;
    }else if (password !== password1) {
      Utils.adderrorNotification('Passwords did not match. Please try again.')
      return false;
    }
    else {
      Auth.signUp({
            username: email,
            password: password,
            attributes: {
                // other custom attributes
                'custom:organization': organization,
                'custom:user_first_name': userfname,
                'custom:user_last_name': userlname,
                'custom:account_type': accounttype,
                // 'custom:subscription': JSON.stringify(subscription),
                'custom:subscription_id': subscription.id
            }
      })
      .then(user => {
        Utils.addsuccessNotification('Verification code sent to your email, Please use the code below to complete the registration process.')
        this.setState({ showConfirmation: true })
      })
      .catch(err => {
        this.setState({disabled: false})
        if (! err.message) {
          Utils.adderrorNotification('Error while signing up, Please try again later.')
        }else if (err.message === "Custom auth lambda trigger is not configured for the user pool.") {
          Utils.adderrorNotification('Password cannot be empty')
        } else {
          Utils.adderrorNotification(err.message)
        }
      })
    }
  }
  confirmSignUp = (e) => {
    e.preventDefault();
    this.setState({disabled: true});
    var {email, authCode} = this.state
    email = email.toLowerCase();
    //regex expression to validate the user input email
    //eslint-disable-next-line
    // let reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ ;
    if (email==="" && authCode===""){
      Utils.adderrorNotification('Please fill all the details and try again')
    }
    else if(reg.test(String(email).toLowerCase()) === false){
      Utils.adderrorNotification('Please enter a valid email address and try again')
      this.setState({disabled: false});
      return false;
    }
    else {
      toast.dismiss();
      Auth.confirmSignUp(email, authCode)
      .then(user => {
        Utils.addsuccessNotification('Sign up successful. Now you can login using your credentials.')
        this.props.history.push('/')
      })
      .catch(err => {
        this.setState({disabled: false});
        if (! err.message) {
          Utils.adderrorNotification('Error while confirming the signup, Please try again later.')
        } else {
          Utils.adderrorNotification(err.message)
        }
      })
    }
  }
  validatePassword = async() => {
    if (this.state.password.toLowerCase() !== this.state.password) {
        await this.setState({containsUL: true})
    } else
        await this.setState({containsUL: false})
    if (this.state.password.toUpperCase() !== this.state.password) {
        await this.setState({containsLL: true})
    } else
        await this.setState({containsLL: false})
    if (/\d/.test(this.state.password)) {
        await this.setState({containsN: true})
    } else
        await this.setState({containsN: false})
    if (/[~`!@#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(this.state.password)) {
        await this.setState({containsSC: true})
    } else
        await this.setState({containsSC: false})
    if (this.state.password.length >= 8) {
        await this.setState({contains8C: true})
    } else
        await this.setState({contains8C: false})
    if (this.state.containsUL && this.state.containsLL && this.state.containsN && this.state.containsSC && this.state.contains8C) {
        await this.setState({allValid: true})
    } else
        await this.setState({allValid: false})
  };

  toggleScreen = () => {
    this.setState({showSignIn: true, showSignUp: false})
  }

  paymentSuccess = (subscription) => {
    //once payment done disable radio buttons
    this.setState({isPaymentDone: true, subscription: subscription});
  }

  handleClose = () => {
    this.setState({ isPaymentPopupOpen: false})
    !this.state.isPaymentDone &&  this.setState({ accounttype: ''})
  }

  openTiers = () => {
  console.log('here');
    //opens the pricing page which has the tiers
  }

  render() {
    const mustContainData = [
        ["An uppercase letter (A-Z)", this.state.containsUL],
        ["A lowercase letter (a-z)", this.state.containsLL],
        ["A number (0-9)", this.state.containsN],
        ["A special character (&@!)", this.state.containsSC],
        ["At least 8 characters", this.state.contains8C],
    ];
    let appInsights = null;

    const { showConfirmation, showSignIn, showSignUp, allValid, isPaymentPopupOpen,
            password, password1, email, accounttype, isPaymentDone, coupon_data} = this.state
    return (
      <>
      {showSignUp ?
        <div {...css(styles.container)}>
          <div className="col-md-4">
            <div className="card">
              <div className="card-body">
              {/*<div class="row">
                <div class="col-sm">*/}
                <div className="col-md-12 d-flex justify-content-center">
                    <Form.Group className="row">
                        <div className="col-sm-12">
                          <Logo/>
                          {/*<span className="logo">InvoClass</span>*/}
                        </div>
                    </Form.Group>
                </div>
                <form onSubmit={this.signUp}>
                  <div className="col-md-12">
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
                  <div className="col-md-12">
                    <Form.Group className="row">
                      <div className="col-sm-6">
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          label="User First Name"
                          value={this.state.userfname}
                          type='text'
                          required
                          onChange={evt => this.onChange('userfname', evt.target.value)}
                        />
                      </div>
                      <div className="col-sm-6">
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          label="User Last Name"
                          value={this.state.userlname}
                          type='text'
                          required
                          onChange={evt => this.onChange('userlname', evt.target.value)}
                        />
                      </div>
                    </Form.Group>
                  </div>
                  <div className="col-md-12">
                    <Form.Group className="row">
                      <div className="col-sm-12">
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          label="Email"
                          required
                          value={email}
                          type='email'
                          onChange={evt => this.onChange('email', evt.target.value)}
                        />
                      </div>
                    </Form.Group>
                  </div>
                  <div className="col-md-12">
                    <Form.Group className="row">
                      <div className="col-sm-6">
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          label="Password"
                          required
                          value={password}
                          type={this.state.isPasswordShown ? 'text': 'password'}
                          onChange={evt => this.onChange('password', evt.target.value)}
                          onKeyUp={this.validatePassword}
                          data-lpignore="true"
                        />
                        <i className={`fa ${this.state.isPasswordShown ? "fa-eye-slash" : "fa-eye"} fa-lg password-icon`}
                           onClick={this.togglePasswordVisibility}/>
                      </div>
                      <div className="col-sm-6">
                        <TextField
                          fullWidth
                          size="small"
                          variant="outlined"
                          label="Confirm Password"
                          required
                          value={password1}
                          type={this.state.isPasswordShown ? 'text': 'password'}
                          onChange={evt => this.onChange('password1', evt.target.value)}
                          helperText={password!== '' && password === password1 ? 'Passwords match' : null}
                        />
                        <i className={`fa ${this.state.isPasswordShown ? "fa-eye-slash" : "fa-eye"} fa-lg password-icon`}
                           onClick={this.togglePasswordVisibility}/>
                      </div>
                    </Form.Group>
                  </div>
                  <div className="col-md-12">
                    <Form.Group className="row">
                      <div className="col-sm-12">
                        <FormControl>
                          <FormLabel id="demo-row-radio-buttons-group-label">Account Type
                            <Tooltip title={
                              <p>Select the membership tier most appropriate to your needs.
                              Not sure which Tier is right for you? Click icon to learn more.</p>
                            }>
                              <span style={{ verticalAlign: 'middle', cursor: 'pointer' }}>{' '}
                                <InfoIcon onClick={this.openTiers}/></span>
                            </Tooltip>
                          </FormLabel>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <RadioGroup
                              row
                              aria-labelledby="demo-row-radio-buttons-group-label"
                              name="row-radio-buttons-group"
                              value={accounttype}
                              onChange={this.handleAccountTypeChange}
                              required
                            >
                              <FormControlLabel value="starter"
                                                control={<Radio disabled={isPaymentDone || !reg.test(String(email).toLowerCase())} required/>}
                                                label="Starter" />
                              <FormControlLabel value="pro"
                                                control={<Radio disabled={isPaymentDone || !reg.test(String(email).toLowerCase())} required/>}
                                                label="Pro" />
                              <FormControlLabel value="enterprise"
                                                control={<Radio disabled={isPaymentDone || !reg.test(String(email).toLowerCase())} required/>}
                                                label="Enterprise" />
                            </RadioGroup>
                            {/*<AttachMoneyIcon />*/}
                            <FormHelperText>{isPaymentDone ? 'Payment done' : isPaymentPopupOpen ? 'Payment pending': null}</FormHelperText>
                          </div>
                        </FormControl>
                      </div>
                    </Form.Group>
                  </div>
                  {!allValid && (
                    <div className="col-md-12">
                      <Form.Group className="row">
                          <div className="must-container">
                              {/*The mustContainData array has requirements*/}
                              {mustContainData.map((data, index) => {
                                const label = data[0];
                                const meetsReq = data[1];
                                return (
                                    <div key={index} className="MustContain">
                                        <div className="must-item">
                                            <li className="must-text">
                                              {meetsReq ? <span style={{color: 'green'}}>&#10004;</span>
                                                        : <span style={{color: 'red'}}>&#10006;</span>
                                              }&nbsp;
                                              {label}
                                            </li>
                                        </div>
                                    </div>
                                );
                              })}
                          </div>
                        </Form.Group>
                      </div>
                  )}
                  <div className="col-md-12">
                    <Form.Group className="row">
                      <div className="col-sm-12">
                        {!showConfirmation && <Button type="submit" style={{background: this.state.primary_color}} block
                                disabled={!this.state.allValid || password !== password1 ||
                                  !isPaymentDone} value="signup"
                        >
                          SIGN UP
                        </Button>}
                        <Form.Text className="text-muted">
                        <Buttonmui
                          onClick={() => this.toggleScreen()}
                        >&larr; Back to Sign In</Buttonmui>
                        </Form.Text>
                      </div>
                    </Form.Group>
                  </div>
                </form>
                {
                  showConfirmation && (
                    <form onSubmit={this.confirmSignUp}>
                      <div className="col-md-12">
                        <Form.Group className="row">
                          <div className="col-sm-12">
                            <TextField
                              fullWidth
                              size="small"
                              variant="outlined"
                              label="Verification Code"
                              helperText="Received on the email address provided above."
                              type='number'
                              required
                              value={this.state.authCode}
                              onChange={evt => this.onChange('authCode', evt.target.value)}
                              autoFocus
                            />
                            </div>
                        </Form.Group>
                      </div>
                      <div className="col-md-12">
                        <Form.Group className="row">
                          <div className="col-sm-12">
                            <Button type="submit" style={{background: this.state.primary_color}}
                                    disabled={this.state.disabled} block>
                              Confirm Sign Up
                            </Button>
                          </div>
                        </Form.Group>
                      </div>
                    </form>
                  )
                }
                <div className="col-md-12 d-flex justify-content-center">
                  <Form.Group className="row">
                    <div className="col-sm-12">
                      By signing up, you agree to our&nbsp;
                      <a href="https://brixon.io/tos.html" rel="noopener noreferrer" target="_blank">terms of service</a>&nbsp;and&nbsp;
                      <a href="https://brixon.io/privacypolicy.html" rel="noopener noreferrer" target="_blank">privacy policy</a>
                    </div>
                  </Form.Group>
                </div>
                </div>
                {/*<div class="col-sm">*/}
                {this.state.isPaymentPopupOpen && (
                  <div>
                    {/*<div className="popup-arrow"></div>
                    <div className="payment-popup">*/}
                      <Elements stripe={stripePromise}>
                        <CheckoutForm
                          open={this.state.isPaymentPopupOpen}
                          coupon_data={coupon_data}
                          price={accounttype === 'starter' ? 50 : accounttype === 'pro' ? 99 : 5500}
                          selected={accounttype}
                          user={email}
                          success={this.paymentSuccess}
                          close={this.handleClose}
                        />
                      </Elements>
                    {/*</div>*/}
                  </div>
                )}
                {/*</div>*/}
              {/*</div>
              </div>*/}
            </div>
          </div>
        </div> : null }
        {showSignIn ? <SignIn/> : null}
      </>
    )
  }
}

const styles = {
  container: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      // padding: 50
  }
};

export default withRouter(SignUp)
