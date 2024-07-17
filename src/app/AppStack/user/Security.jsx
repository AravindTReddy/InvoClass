import React, { useState, useEffect } from "react";
import Button from '@material-ui/core/Button';
import { Auth } from 'aws-amplify'
import TextField from '@material-ui/core/TextField';
import {toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Utils from '../shared/Utils';
import { Form } from 'react-bootstrap';

export default function Security() {

  const [primaryColor, setPrimaryColor] = useState('#F38A2C');
  const [refreshToken, setRefreshToken] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('#606060');
  const [user, setUser] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [role, setRole] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [customerDetails, setCustomerDetails] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    //read from localStorage here
    var appearanceObject = JSON.parse(localStorage.getItem('appearanceObject'));
    var userAuthDetails = JSON.parse(localStorage.getItem('userAuthDetails'));
    var userDetails = JSON.parse(localStorage.getItem('userDetails'));
    var customerDetails = JSON.parse(localStorage.getItem('customerDetails'));
    // var notifications = JSON.parse(localStorage.getItem('notifications'));
    // notifications !== null && setNotifications(notifications);
    customerDetails !== null && setCustomerDetails(customerDetails);
    // setLoadedCustomerDetails(true);
    if(userDetails !== null){
      setCustomerId(userDetails.customer_id);
      setRole(userDetails.role);
      setUserLastName(userDetails.user_last_name);
      setUserFirstName(userDetails.user_first_name);
    }
    if(appearanceObject !== null){
      setPrimaryColor(appearanceObject.primary_color);
      setSecondaryColor(appearanceObject.secondary_color);
    }
    if(userAuthDetails !== null){
      setUser(userAuthDetails.user);
      setRefreshToken(userAuthDetails.refresh_token);
    }
  }, [refreshToken, user]);

  /**
  * To change the user password
  * @param  {String} oldPassword existing password of the user
  * @param  {String} newPassword new password entered by the user
  * @return {JSON}  response with a success custom message
  */
  const changePassword = (event) => {
    event.preventDefault();
    setDisabled(true);
    Utils.addinfoNotification('Processing your request');
    Auth.currentAuthenticatedUser().then(
      getuser => {
        Auth.changePassword(getuser, oldPassword, newPassword)
          .then(data => {
              toast.dismiss();
              Utils.addsuccessNotification('Password changed successfully.');
              setNewPassword(''); setOldPassword(''); setDisabled(false);
          })
          .catch(err => {
              setDisabled(false);
              toast.dismiss();
              if (!err.message) {
                  Utils.adderrorNotification('Error while setting up the new password: ' + err)
              } else {
                  Utils.adderrorNotification('Error while setting up the new password: ' + err.message)
              }
          })
       }
    )
  }

  return (
    <div>
      <div className="row">
        <div className="col-lg-12 grid-margin">
          <div className="accountheading">Change your password</div>
              <p className="card-description">(All fields marked with * are required)</p>
                  <form onSubmit={changePassword}>
                      <div className="row">
                          <div className="col-md-6">
                              <Form.Group className="row">
                                  <div className="col-sm-12">
                                    <TextField
                                      fullWidth
                                      size="small"
                                      variant="outlined"
                                      label="Current password"
                                      value={oldPassword}
                                      type='password'
                                      required
                                      onChange={evt => setOldPassword(evt.target.value)}
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
                                      variant="outlined"
                                      label="New password"
                                      value={newPassword}
                                      type='password'
                                      required
                                      name="new password"
                                      onChange={evt => setNewPassword(evt.target.value)}
                                    />
                                  </div>
                              </Form.Group>
                          </div>
                      </div>
                    <button disabled={disabled} type="submit" className="button">
                      Update
                    </button>{' '}
                    <button disabled={disabled} type="reset" className="button">
                      Reset
                    </button>
                </form>
            </div>
            <div className="col-lg-12 grid-margin">
              <div className="accountheading">Two-step verification</div>
                <p className="card-description">(Coming soon)</p>

            </div>
        </div>
    </div>
  );
}
