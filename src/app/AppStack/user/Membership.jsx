import React, { useState, useEffect } from "react";
import DialogContentText from "@material-ui/core/DialogContentText";
import CheckoutForm from '../../AuthStack/CheckoutForm'
import { createBrowserHistory } from 'history'
import Grid from '@material-ui/core/Grid';
import { publishableKey, reactAPIURL } from '../shared/General'
import Utils from '../shared/Utils';
import {loadStripe} from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentMethods from './PaymentMethods';

const stripePromise = loadStripe(publishableKey);

export default function Membership() {

  const [primaryColor, setPrimaryColor] = useState('#F38A2C');
  const [refreshToken, setRefreshToken] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('#606060');
  const [user, setUser] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [role, setRole] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [customerDetails, setCustomerDetails] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [trialEndDate, setTrialEndDate] = useState(null);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(null);
  const [isPaymentPopupOpen, setIsPaymentPopupOpen] = useState(false);
  const [couponData, setCouponData] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState(null);

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
    if(customerDetails !== null && customerDetails[0].customer_plan){
      setCurrentPlan(customerDetails[0].customer_plan)
      readCustomerSubscription(customerDetails[0].customer_plan);
    }
    readCustomerCoupons();
    readCustomer();
  }, [refreshToken, user]);

  const readCustomerSubscription = (plan) => {
    fetch(reactAPIURL + 'payment', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        'type': 'readsubscription',
        'subscription_id': plan.sub_id, // Pass subscription ID to the backend
      })
    })
    .then((response) => response.json())
    .then(async responseJson => {
      // console.log(responseJson);
      const subscriptionData = responseJson.result;
      if (subscriptionData !== undefined && !(Object.keys(subscriptionData).length === 0)) {
        // Set subscription data
        setSubscription(subscriptionData);
        // Set trial end date
        const trialEnd = new Date(subscriptionData.trial_end * 1000); // Convert UNIX timestamp to JavaScript Date object
        setTrialEndDate(trialEnd);
        // Calculate trial days remaining
        const current = new Date();
        const millisecondsPerDay = 1000 * 60 * 60 * 24;
        const daysRemaining = Math.ceil((trialEnd - current) / millisecondsPerDay);
        setTrialDaysRemaining(daysRemaining);
        // Set default payment method
        if (subscriptionData.default_payment_method) {
          setDefaultPaymentMethod(subscriptionData.default_payment_method);
        }
        // Fetch payment methods
        if (subscriptionData.customer) {
          fetchPaymentMethods(subscriptionData.customer);
        }
      }
    })
    .catch((error) => {
      console.error('Error fetching subscription status:', error);
    });
  }

  const fetchPaymentMethods = async (customer) => {
    fetch(reactAPIURL + 'payment', {
      method: 'post',
      headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
      },
      body: JSON.stringify({
        'type': 'readpaymentmethods',
        'customer': customer,
      })
    })
    .then((response) => response.json())
    .then(async responseJson => {
      // console.log(responseJson);
      if(responseJson.result!== undefined && responseJson.statusCode === 200){
        setPaymentMethods(responseJson.result.data);
      }else {
        Utils.adderrorNotification(responseJson.errorMessage)
      }
    })
    .catch((error) => {
      console.error('Error fetching payment methods:', error);
    });
  };

  const readCustomerCoupons = () => {
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
        setCouponData(responseJson.body);
      } else {
        Utils.adderrorNotification(responseJson.errorMessage);
      }
    })
    .catch((error) => {
      Utils.adderrorNotification(error);
    });
  }

  const readCustomer = () => {
    Utils.getCustomerDetails(refreshToken, customerId, role)
    .then(data => {
      setCustomerDetails(data);
      localStorage.setItem('customerDetails', JSON.stringify(data));
      if(customerDetails !== null && customerDetails[0].customer_plan){
        setCurrentPlan(customerDetails[0].customer_plan);
        readCustomerSubscription(customerDetails[0].customer_plan);
      }
    })
    .catch(err => { throw err; });
  }

  const handleSuccess = async(subscription) => {
    //here update the customer_plan
    await updateCustomer(subscription);
    await readCustomer();
    customerDetails !== null && setCurrentPlan(customerDetails[0].customer_plan);
    readCustomerSubscription(customerDetails[0].customer_plan);
  }

  const updateCustomer = (subscription) => {
    if(customerDetails.length === 1){
      let item = customerDetails[0];
      let newPlan = {
        ...item.customer_plan,
        sub_id: subscription.id
      };
      fetch(reactAPIURL + 'updatecustomer', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
        },
        body: JSON.stringify({
          "customer_id": item.customer_id,
          "customer_org_name": item.customer_org_name,
          "customer_plan": newPlan,
          "org_address_line_1": item.org_address_line_1,
          "org_address_line_2": item.org_address_line_2,
          "customer_primary_poc_email": item.customer_primary_poc_email.toLowerCase(),
          "customer_poc_phone": item.customer_primary_poc_contact,
          "org_state": item.org_state,
          "org_city": item.org_city,
          "org_zip": item.org_zip,
          "org_country": item.org_country,
          "refresh_token": refreshToken,
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        //console.log(responseJson);
        if (responseJson.message === "success" && responseJson.statusCode === 200) {
            Utils.addsuccessNotification('Customer details updated successfully');
        } else {
            Utils.adderrorNotification('Error updating the customer details: ' + responseJson.errorMessage)
        }
      })
      .catch((error) => {
          Utils.adderrorNotification('Error updating the customer details: ' + error)
      });
    }
  }

  const handleClose = () => {
    setIsPaymentPopupOpen(false);
  }

  const changeAccountPlan = () => {
    setIsPaymentPopupOpen(true);
  }

  const cancelSubscription = () => {
    fetch(reactAPIURL + 'payment', {
      method: 'post',
      headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
      },
      body: JSON.stringify({
        'type': 'cancelsubscription',
        'subscription_id': currentPlan.sub_id,
      })
    })
    .then((response) => response.json())
    .then(async responseJson => {
      // console.log(responseJson);
      if(responseJson.result!== undefined){
        setSubscription(responseJson.result);
        Utils.addsuccessNotification('Subscription cancelled successfully, You can still access the platform till the end of your trial period.')
      }else {
        Utils.adderrorNotification(responseJson.errorMessage)
      }
    })
    .catch((error) => {
      console.error('Error cancelling subscription:', error);
    });
  }

  const resumeSubscription = () => {
    fetch(reactAPIURL + 'payment', {
      method: 'post',
      headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
      },
      body: JSON.stringify({
        'type': 'resumesubscription',
        'subscription_id': currentPlan.sub_id, // Pass coupon code to the backend
      })
    })
    .then((response) => response.json())
    .then(async responseJson => {
      // console.log(responseJson.result);
      if(responseJson.result!== undefined){
        setSubscription(responseJson.result);
        Utils.addsuccessNotification('Subscription resumed successfully, Your default card on file will be charged at the end of the trial period.')
      }else {
        Utils.adderrorNotification(responseJson.errorMessage)
      }
    })
    .catch((error) => {
      console.error('Error resuming subscription:', error);
    });
  }

  return (
    <div>
        <p><button onClick={changeAccountPlan}>Change subscription</button></p>
        {currentPlan !== null && subscription !== null && (
          <DialogContentText id="alert-dialog-slide-description">
          <p>You are currently using the "{currentPlan.type}" plan.</p>
          {trialEndDate && (
            <p>
              {trialEndDate < new Date() ? (
                `Your trial period ended on: ${trialEndDate.toDateString()}.`
              ) : (
                `Your trial period ends on: ${trialEndDate.toDateString()}.`
              )}
              {subscription && subscription.status !== 'trialing' && subscription.status !== 'active' && !subscription.default_payment_method && (
                ' Please add a payment method to continue using the platform.'
              )}
            </p>
          )}
          {/*{trialEndDate && (
            <p>
              {trialEndDate < new Date() ? `Your trial period ended on: ${trialEndDate.toDateString()}.` : `Your trial period ends on: ${trialEndDate.toDateString()}.`}
              {trialEndDate < new Date() && ' Please consider subscribing to continue using the platform.'}
              {subscription && subscription.status !== 'trialing' && subscription.default_payment_method === null && ' Please add a payment method to continue using the platform.'}
            </p>
          )}*/}

          {subscription.status === 'trialing' && (
            <p>{`Remaining trial days: ${trialDaysRemaining}`}</p>
          )}
          {subscription.status === 'trialing' && !subscription.cancel_at_period_end && (
            <p>Your default payment preferred card on file will be charged at the end of the trial period.</p>
          )}
          {subscription.status === 'trialing' && subscription.cancel_at_period_end && (
            <p>You have cancelled your subscription, but you can still access the platform till the end of your trial period.</p>
          )}
          {subscription.cancel_at_period_end ? (
            <p>
              <button disabled={true} onClick={cancelSubscription}>Cancel subscription</button>
              <button onClick={resumeSubscription}>Resume subscription</button>
            </p>
          ) : (
            <p><button onClick={cancelSubscription}>Cancel subscription</button></p>
          )}
          </DialogContentText>
        )}

        {/* Render PaymentMethods component */}
        <Elements stripe={stripePromise}>
          <PaymentMethods
            paymentMethods={paymentMethods}
            subscription={subscription}
            defaultMethod={defaultPaymentMethod}
            reload={readCustomerSubscription}
          />
        </Elements>
         <Grid
             container
             spacing={2}
             direction="row"
             justifyContent="flex-start"
             alignItems="flex-start"
         >
         <Grid item xs={12}>
         {isPaymentPopupOpen && (
           <Elements stripe={stripePromise}>
             <CheckoutForm
               open={isPaymentPopupOpen}
               coupon_data={couponData}
               price={currentPlan.type === 'starter' ? 50 : currentPlan.type === 'pro' ? 99 : 5500}
               selected={currentPlan.type}
               user={user}
               success={handleSuccess}
               close={handleClose}
             />
           </Elements>
         )}
        </Grid>
     </Grid>

    </div>
  );
}
