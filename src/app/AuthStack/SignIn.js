import React from 'react'
import {css} from 'glamor'
import {Auth} from 'aws-amplify'
import {Button, Form} from 'react-bootstrap'
import {withRouter} from 'react-router-dom'
import {getAppInsights} from '../AppStack/shared/TelemetryService';
import TelemetryProvider from '../AppStack/shared/telemetry-provider.jsx';
import 'react-toastify/dist/ReactToastify.css';
import './UpdatePasswordContainer.css';
import Logo from './Logo'
import Buttonmui from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import {ThemeProvider, createTheme} from '@material-ui/core/styles';
import Utils from '../AppStack/shared/Utils';
import ForgotPassword from './ForgotPassword';
import SignUp from './SignUp'
import {toast} from 'react-toastify';
import { reactAPIURL } from '../AppStack/shared/General';


/* eslint-disable no-useless-escape */
class SignIn extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        email: '',
        user: '',
        authCode: '',
        completeNewPassword: false,
        completeConfirmation: false,
        newPassword: '',
        role: '',
        organization: '',
        eula_read_date: '',
        tos_read_date: '',
        password: '',
        allValid: true,
        containsUL: false,// uppercase letter
        containsLL: false,// lowercase letter
        containsN: false,// number
        containsSC: false,// special character
        contains8C: false,// min 8 characters
        rememberMe: false,
        isPasswordShown: false,
        primary_color: '#F38A2C',
        secondary_color: '#606060',
        userEmail: '',
        disabled: false,
        showSignIn: true,
        showForgot: false,
        showSignUp: false
      };
      this.signIn = this.signIn.bind(this);
      this.onChange = this.onChange.bind(this);
      this.validatePassword = this.validatePassword.bind(this);
      this.rememberMeChange = this.rememberMeChange.bind(this);
      this.togglePasswordVisibility = this.togglePasswordVisibility.bind(this);
      this.toggleScreen = this.toggleScreen.bind(this);
    }

    async componentDidMount() {
      var authObject = localStorage.getItem('authObject');
      if(authObject !== null){
        this.setState({
          email: JSON.parse(authObject).email,
          rememberMe: true
        })
      }
    }

    rememberMeChange(event){
      const target = event.target;
      const value = target.type === 'checkbox' ? target.checked : target.value;
      const name = target.name;
      this.setState({ [name]: value });
      var authObject = {
        'email': this.state.email,
      }
      if(value){
        // Put the object into storage
        localStorage.setItem('authObject', JSON.stringify(authObject));
      }else {
        // Remove the object from storage
        localStorage.removeItem('authObject');
      }

    }
    //User input onchange handler function to set state dynamically
    onChange = (key, value) => {
      this.setState({
          [key]: value
      })
    }
    //to show/hide user input password
    togglePasswordVisibility = () => {
      const { isPasswordShown } = this.state;
      this.setState({ isPasswordShown: !isPasswordShown });
    }

    toggleScreen = (value) => {
      this.setState({
        showSignIn: false,
        showForgot: false,
        showSignUp: false,
        [value]: true
      })
    }

    /**
      * To authorize the user login using amplify auth
      * @param  {String} email email id of the user
      * @param  {String} password password of the user
      * @return {JSON}  response with a success
    */
    signIn = async(e) => {
      !this.state.completeConfirmation && e.preventDefault();
      await this.setState({allValid: false});
      const {history} = this.props
      var {email, password, newPassword} = this.state
      email = email.toLowerCase();
      //regex expression to validate the user input email
      //eslint-disable-next-line
      let reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (reg.test(String(email).toLowerCase()) === false) {
          Utils.adderrorNotification('Please enter a valid email address and try again')
          await this.setState({allValid: true});
          return false;
      } else {
        Auth.signIn(email, password)
        .then(async user => {
          // console.log(user);
          this.setState({disabled: false});
          if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
            await this.setState({completeNewPassword: true});
            if (newPassword === "") {
                Utils.addinfoNotification('Please create a new password and sign in')
                await this.setState({allValid: false})
            } else {
                //const { requiredAttributes } = user.challengeParam; // the array of required attributes, e.g ['email', 'phone_number']
                Auth.completeNewPassword(user, newPassword)
                    .then(user => {
                        history.push('/home')
                    }).catch(e => {
                    Utils.adderrorNotification('Error when creating new password: ' + e.message)
                });
            }
          } else {
            //normal case
            await this.setState({allValid: true});
            history.push('/home');
          }
        })
        .catch(async err => {
          await this.setState({allValid: true});
          if (!err.message) {
              Utils.adderrorNotification('Error when signing in, Please try again later.')
          } else if(err.code === "UserNotConfirmedException"){
              Utils.adderrorNotification(err.message)
              this.setState({completeConfirmation: true})
          }
          // else if(err.code === 'NotAuthorizedException'){
          //   console.log('here here ');
          //   //here i call resend invitation code
          //   fetch(reactAPIURL + 'createuser', {
          //       method: 'post',
          //       headers: {
          //         'Accept': 'application/json',
          //         'Content-type': 'application/json',
          //       },
          //       body: JSON.stringify({
          //         "user": "self-reset",
          //         "user_email": email,
          //       })
          //   })
          //   .then((response) => response.json())
          //   .then(responseJson => {
          //     console.log(responseJson);
          //     toast.dismiss();
          //     // this.setState({disabled: false})
          //     if (responseJson.message === "success" && responseJson.statusCode === 200) {
          //       Utils.addsuccessNotification('Current temporary password expired. A new temporary password has been sent to your email, Please use that and try signin again.')
          //       //here we store the notification in localStorage
          //     } else {
          //       Utils.adderrorNotification('Error resetting the password: ' + responseJson.errorType + ': ' + responseJson.errorMessage)
          //     }
          //   })
          //   .catch((error) => {
          //     toast.dismiss();
          //     Utils.adderrorNotification('Error resetting the password: ' + error)
          //   });
          // }
          else {
            Utils.adderrorNotification(err.message)
          }
        })
      }
    };

    resendConfirmationCode = async() => {
      var {email} = this.state
        try {
            await Auth.resendSignUp(email);
            Utils.addsuccessNotification('Verification code sent to your email, Please use the code to verify your account and login.')
        } catch (err) {
            Utils.adderrorNotification(err.message)
        }
    }

    confirmSignUp = (e) => {
      e.preventDefault();
      this.setState({disabled: true});
      var {email, authCode} = this.state
      email = email.toLowerCase();
      //regex expression to validate the user input email
      //eslint-disable-next-line
      let reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ ;
      if (email==="" && authCode===""){
        Utils.adderrorNotification('Please fill all the details and try again')
      }
      else if(reg.test(String(email).toLowerCase()) === false){
        Utils.adderrorNotification('Please enter a valid email address and try again')
        this.setState({disabled: false});
        return false;
      }
      else {
        Auth.confirmSignUp(email, authCode)
        .then(user => {
          this.signIn();
        })
        .catch(err => {
          this.setState({disabled: false});
          if (! err.message) {
            Utils.adderrorNotification('Error while verifying the user, Please try again later.')
          } else {
            Utils.adderrorNotification(err.message)
          }
        })
      }
    }

    validatePassword = async() => {
        // has uppercase letter
        if (this.state.newPassword.toLowerCase() !== this.state.newPassword) {
            await this.setState({containsUL: true})
        } else {
            await this.setState({containsUL: false})
        }
        // has lowercase letter
        if (this.state.newPassword.toUpperCase() !== this.state.newPassword) {
            await this.setState({containsLL: true})
        } else {
            await this.setState({containsLL: false})
        }
        // has number
        if (/\d/.test(this.state.newPassword)) {
            await this.setState({containsN: true})
        } else {
            await this.setState({containsN: false})
        }
        // has special character
        if (/[~`!@#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(this.state.newPassword)) {
            await this.setState({containsSC: true})
        } else {
            await this.setState({containsSC: false})
        }
        // has 8 characters
        if (this.state.newPassword.length >= 8) {
            await this.setState({contains8C: true})
        } else {
            await this.setState({contains8C: false})
        }
        // all validations passed
        if (this.state.containsUL && this.state.containsLL && this.state.containsN && this.state.containsSC && this.state.contains8C) {
            await this.setState({allValid: true})
        } else {
            await this.setState({allValid: false})
        }
    };

    handleLoginClick = () => {
      // Replace these values with your actual client ID and redirect URI
      const clientId = 'eb417d75-cf9d-4b91-9c78-707b396d7ff7';
      const redirectUri = 'https://react-api.omnifsi.com/dev/redirect_uri';
      // Redirect the user to the D2L authorization endpoint
      const d2lAuthorizationUrl = `https://auth.brightspace.com/oauth2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=core:*:*`;
      window.location.href = d2lAuthorizationUrl;
    };

    render() {
      /**
       * Create array containing string and boolean to see if the password follows
       * all requirement.
       * @type {(string|boolean)[][]}
       */
      const mustContainData = [
          ["An uppercase letter (A-Z)", this.state.containsUL],
          ["A lowercase letter (a-z)", this.state.containsLL],
          ["A number (0-9)", this.state.containsN],
          ["A special character (&@!)", this.state.containsSC],
          ["At least 8 characters", this.state.contains8C],
      ];
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
        typography: {
          button: {
            textTransform: 'none',

          }
        }
      });
      const { showSignIn, showForgot, showSignUp, authCode } = this.state
      return (
          <TelemetryProvider instrumentationKey="7696784d-3192-42a6-891e-1f8ca728cfae" after={() => {
              appInsights = getAppInsights()
          }}>
            <ThemeProvider theme={theme}>
            {showSignIn ?
              <div {...css(styles.container)}>
                <div className="col-md-4">
                    <div className="card">
                        <div className="card-body">
                            <div className="col-md-12 d-flex justify-content-center">
                                <Form.Group className="row">
                                    <div className="col-sm-12">
                                      <Logo/>
                                      {/*<span className="logo">InvoClass</span>*/}
                                    </div>
                                </Form.Group>
                            </div>
                            <form ref={el => this.myFormRef = el} onSubmit={this.state.completeConfirmation ? this.confirmSignUp : this.signIn}>
                            <div className="col-md-12">
                              <Form.Group className="row">
                                  <div className="col-sm-12">
                                    <TextField
                                      fullWidth
                                      size="small"
                                      variant="outlined"
                                      label="Email"
                                      required
                                      type='email'
                                      value={this.state.email}
                                      onChange={evt => this.onChange('email', evt.target.value)}
                                      autoFocus
                                    />
                                    <Form.Text className="text-muted">
                                      <input type="checkbox" onChange={this.rememberMeChange}
                                             style={{top: '2px', position: 'relative'}}
                                             checked={this.state.rememberMe} name="rememberMe"/>
                                        <span>Remember email</span>
                                    </Form.Text>
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
                                     label="Password"
                                     required
                                     value={this.state.password}
                                     type={this.state.isPasswordShown ? 'text': 'password'}
                                     onChange={evt => this.onChange('password', evt.target.value)}
                                   />
                                    <i className={`fa ${this.state.isPasswordShown ? "fa-eye-slash" : "fa-eye"} fa-lg password-icon`}
                                       onClick={this.togglePasswordVisibility}/>
                                 </div>
                              </Form.Group>
                            </div>
                            {this.state.completeConfirmation ?
                              <>
                                <div className="col-md-12">
                                  <Form.Group className="row">
                                    <div className="col-sm-12">
                                      <TextField
                                        fullWidth
                                        size="small"
                                        variant="outlined"
                                        label="Verification Code"
                                        helperText="Received on the email provided above when signing up(valid for 24hours)."
                                        required
                                        value={authCode}
                                        type='number'
                                        onChange={evt => this.onChange('authCode', evt.target.value)}
                                      />
                                    </div>
                                  </Form.Group>
                                </div>
                                <div className="col-md-12">
                                  <Form.Group className="row">
                                    <div className="col-sm-12">
                                      <Button onClick={() => this.resendConfirmationCode()} style={{background: this.state.primary_color}} block>
                                        Or Request a new code
                                      </Button>
                                    </div>
                                  </Form.Group>
                                </div>
                              </> : null
                            }
                            {this.state.completeNewPassword ?
                                <div className="col-md-12">
                                  <Form.Group className="row">
                                      <div className="col-sm-12">
                                        <TextField
                                          fullWidth
                                          size="small"
                                          variant="outlined"
                                          label="New Password"
                                          required
                                          type={this.state.isPasswordShown ? 'text': 'password'}
                                          value={this.state.newPassword}
                                          onChange={evt => this.onChange('newPassword', evt.target.value)}
                                          onKeyUp={this.validatePassword}
                                        />
                                        <i className={`fa ${this.state.isPasswordShown ? "fa-eye-slash" : "fa-eye"} fa-lg password-icon`}
                                           onClick={this.togglePasswordVisibility}/>
                                      </div>
                                  </Form.Group>
                                </div> : null
                            }

                            <div className="col-md-12">
                              <Form.Group className="row">
                                <div className="col-sm-12">
                                  {this.state.completeConfirmation ?
                                    <Button style={{background: this.state.primary_color}} block
                                          type="submit" value="signin"
                                          disabled={!this.state.authCode || this.state.disabled}
                                    >
                                        VERIFY AND SIGN IN
                                    </Button> :
                                    <Button style={{background: this.state.primary_color}} block
                                          type="submit" disabled={!this.state.allValid} value="signin"
                                    >
                                        SIGN IN
                                    </Button>
                                  }
                                  <Form.Text className="text-muted">
                                    <div className="d-flex justify-content-between">
                                      <Buttonmui
                                        onClick={() => this.toggleScreen('showForgot')}
                                      >Forgot Password?</Buttonmui>

                                      {/*<a href="https://www.omnifsi.co/contact-us" rel="noopener noreferrer" target="_blank">*/}
                                      <Buttonmui onClick={() => this.toggleScreen('showSignUp')}
                                      >New? Sign up here!!</Buttonmui>
                                      {/*<button onClick={this.handleLoginClick}>Login D2L</button>*/}
                                    </div>
                                  </Form.Text>
                                </div>
                              </Form.Group>
                            </div>
                            </form>
                            {this.state.completeNewPassword ?
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
                                </div> : null
                              }
                              <div className="col-md-12 d-flex justify-content-center">
                                <Form.Group className="row">
                                  <div className="col-sm-12">
                                    By signing in, you agree to our&nbsp;
                                    <a href="https://brixon.io/tos.html" rel="noopener noreferrer" target="_blank">terms of service</a>&nbsp;and&nbsp;
                                    <a href="https://brixon.io/privacypolicy.html" rel="noopener noreferrer" target="_blank">privacy policy</a>
                                  </div>
                                </Form.Group>
                              </div>
                            </div>
                          </div>
                      </div>
                   </div> : null }
                   {showForgot ?
                    <ForgotPassword /> : null }
                  {showSignUp ?
                   <SignUp /> : null }
                </ThemeProvider>
            </TelemetryProvider>
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
      padding: 50
  }
};

export default withRouter(SignIn)
