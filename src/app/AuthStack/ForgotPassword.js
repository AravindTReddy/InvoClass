import React, {memo, useState, useEffect} from 'react'
import Utils from '../AppStack/shared/Utils';
import CustomToast from '../AppStack/shared/CustomToast';
import Logo from './Logo'
import {css} from 'glamor'
import {Auth} from 'aws-amplify'
import {Button, Form} from 'react-bootstrap'
import Buttonmui from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import SignIn from './SignIn';
import SignUp from './SignUp';
import {toast} from 'react-toastify';
import { reactAPIURL } from '../AppStack/shared/General';

const ForgotPassword = memo(function ForgotPassword() {

  const [userEmail, setUserEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [primaryColor] = useState('#F38A2C');
  const [showSignIn, setShowSignIn] = useState(false);
  const [showForgot, setShowForgot] = useState(true);
  const [showSignUp, setShowSignUp] = useState(false);

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

  /**
    * To request confirmation code to reset password
    * @param  {String} userEmail email id of the user
    * @return {JSON}  response with a success custom message and code to email
  */
  const forgotPassword = (e) => {
    e.preventDefault();
    const email = userEmail.toLowerCase();
    //regex expression to validate the user input email
    //eslint-disable-next-line
    let reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ ;
    if(reg.test(String(email).toLowerCase()) === false){
      Utils.adderrorNotification('Please enter a valid email address and try again')
      return false;
    }
    else {
      Auth.forgotPassword(email)
      .then(data => {
        Utils.addsuccessNotification('Confirmation code sent to your email, Please use the code below to create a new password')
      })
      .catch(err => {
        if (! err.message) {
          Utils.adderrorNotification('Error while resetting password, Please try again later')
        } else if(err.code === 'UserNotFoundException'){
            const msg = 'This email address does not yet have an account. Sign up'
            Utils.adderrorNotification(<CustomToast type="link" message={msg} onClick={handleClick} />);
        }else if(err.code === 'NotAuthorizedException'){
          //here i call resend invitation code
          fetch(reactAPIURL + 'createuser', {
              method: 'post',
              headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json',
              },
              body: JSON.stringify({
                "user": "self-reset",
                "user_email": email,
              })
          })
          .then((response) => response.json())
          .then(responseJson => {
            // console.log(responseJson);
            toast.dismiss();
            // this.setState({disabled: false})
            if (responseJson.message === "success" && responseJson.statusCode === 200) {
              Utils.addsuccessNotification('Current temporary password expired. A new temporary password has been sent to your email, Please use that and try signin again.')
              //here we store the notification in localStorage
            } else {
              Utils.adderrorNotification('Error resetting the password: ' + responseJson.errorType + ': ' + responseJson.errorMessage)
            }
          })
          .catch((error) => {
            toast.dismiss();
            Utils.adderrorNotification('Error resetting the password: ' + error)
          });
        }else {
          Utils.adderrorNotification(err.message)
        }
      })
    }
  }

  /**
  * To reset user account password
  * @param  {String} userEmail email id of the user
  * @param  {String} newPassword new password entered by the user
  * @param  {Number} authCode confirmation code received to email from above request
  * @return {JSON}  response with a success custom message and code to email
  */
  // Upon confirmation redirect the user to the Sign In page
  const forgotPasswordSubmit = (e) => {
    e.preventDefault();
    const email = userEmail.toLowerCase();
    //regex expression to validate the user input email
    //eslint-disable-next-line
    let reg = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ ;
    if (userEmail==="" && newPassword==="" && authCode===""){
      Utils.adderrorNotification('Please fill all the details and try again')
    }
    else if(reg.test(String(email).toLowerCase()) === false){
      Utils.adderrorNotification('Please enter a valid email address and try again')
      return false;
    }
    else {
      Auth.forgotPasswordSubmit(email, authCode, newPassword)
      .then(user => {
        Utils.addsuccessNotification('New password submitted successfully, Now you can login using the new password')
        window.open('/',"_self");
      })
      .catch(err => {

        if (! err.message) {
          Utils.adderrorNotification('Error while resetting password, Please try again later')
        } else if(err.code === 'UserNotFoundException'){
          const msg = 'This email address does not yet have an account. Sign up'
          Utils.adderrorNotification(<CustomToast type="link" message={msg} onClick={handleClick} />);
        }else if (err.code === 'InvalidPasswordException') {
          const msg = 'Passwords must be at least 8 characters long and contain a special character'
          Utils.adderrorNotification(<CustomToast type="error" message={msg} onClick={handleClick} />);
        }else {
          console.log(err);
          Utils.adderrorNotification(err.message)
        }
      })
    }
  }

  const toggleScreen = (value) => {
    setShowSignIn(true);
    setShowForgot(false);
  }

  const handleClick = () => {
    // Handle the click action here, we just show signup screen
    setShowSignIn(false);
    setShowForgot(false);
    setShowSignUp(true);
  };

  return (
    <>
    {showForgot ?
      <div {...css(styles.container)}>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <div className="col-md-12">
                  <Form.Group className="row">
                      <div className="col-sm-12">
                        <Logo/>
                      </div>
                  </Form.Group>
              </div>
              <form onSubmit={forgotPassword}>
                <div className="col-md-12">
                  <Form.Group className="row">
                    <div className="col-sm-12">
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        label="Email"
                        type='email'
                        required
                        value={userEmail}
                        onChange={evt => setUserEmail(evt.target.value)}
                        autoFocus
                      />
                      </div>
                  </Form.Group>
                </div>
                <div className="col-md-12">
                  <Form.Group className="row">
                    <div className="col-sm-12">
                      <Button type="submit" style={{background: primaryColor}} block>
                        Send Code
                      </Button>
                    </div>
                  </Form.Group>
                </div>
              </form>
              <form onSubmit={forgotPasswordSubmit}>
                <div className="col-md-12">
                  <Form.Group className="row">
                    <div className="col-sm-12">
                      <TextField
                        fullWidth
                        size="small"
                        variant="outlined"
                        label="Confirmation Code"
                        helperText="Received on the email address provided above."
                        required
                        value={authCode}
                        type='number'
                        onChange={evt => setAuthCode(evt.target.value)}
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
                        label="New Password"
                        required
                        value={newPassword}
                        type='password'
                        onChange={evt => setNewPassword(evt.target.value)}
                      />
                    </div>
                  </Form.Group>
                </div>
                <div className="col-md-12">
                  <Form.Group className="row">
                    <div className="col-sm-12">
                      <Button type="submit" style={{background: primaryColor}} block>
                        Confirm new password
                      </Button>
                      <Form.Text className="text-muted">
                      <Buttonmui
                        onClick={() => toggleScreen('signin')}
                      >&larr; Back to Sign In</Buttonmui>
                      </Form.Text>
                    </div>
                  </Form.Group>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div> : null }
      {showSignIn ? <SignIn/> : showSignUp ? <SignUp/> : null}
    </>
  );
});
export default ForgotPassword
