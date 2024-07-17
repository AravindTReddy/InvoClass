import React, { useState, useRef, useEffect } from 'react'
import {
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import './CheckoutForm.scss'
import { toast } from 'react-toastify';
import Utils from '../AppStack/shared/Utils';
import { Button, Tooltip, TextField, IconButton, Slide } from '@mui/material';
import { reactAPIURL } from "../AppStack/shared/General.js";
import CloseIcon from '@mui/icons-material/Close';
import { Typography, Dialog, DialogTitle, DialogContent,
          DialogContentText} from '@mui/material';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const CheckoutForm = ({ open, coupon_data, price,
                        selected, user, success, close }) => {

  const [isPaymentDone, setPaymentDone] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState(null);
  const [locked, setLocked] = useState(false);
  const [errorType, setErrorType] = useState();
  const [couponId, setCouponId] = useState('');
  const [discountedPrice, setDiscountedPrice] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(selected); // Initialize with the default selected plan
  const [selectedPrice, setSelectedPrice] = useState(price);

  useEffect(() => {
    // Check if coupon code is valid when it changes
    if (couponCode) {
      const id = verifyCouponCode(couponCode);
      if (id) {
        setCouponId(id);
        setErrorMessage('');
        setLocked(true);
        setDiscountedPrice(calculateDiscountedPrice());
      } else {
        setErrorType('error');
        setErrorMessage('Invalid coupon code. Please try again.');
        setCouponId(null);
        setLocked(false);
      }
    }
  }, [couponCode, coupon_data]);

  const handleSubmit = async (event) => {
    setErrorMessage(null);
    //using payment Intents API
    event.preventDefault();
    if(couponId === null){
      setErrorMessage('Invalid coupon code. Please remove or re enter the coupon.');
      return false
    }
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet
      return;
    }
    try {
      // Create a PaymentMethod
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });
      if (error) {
        // Payment method creation failed
        setErrorType('error');
        setErrorMessage('Error processing the payment method: ' + error.message)
      } else {
        setErrorType('info');
        setErrorMessage('Please wait while we process your payment...')
        // var numericAmount = parseFloat(price);
        // var formattedAmount = numericAmount.toFixed(2);
        const amountToPay = discountedPrice || selectedPrice;
        const processingFee = calculateProcessingFee(selectedPrice);
        // const totalAmount = parseFloat(amountToPay) + parseFloat(processingFee);
        const totalAmount = parseFloat(amountToPay);
        // if(totalAmount === 0){
        //   //when customer signup is bipassed by providing 100% off
        //   setPaymentDone(!isPaymentDone);
        //   setErrorMessage('Payment processed successfully, Please complete signup process.')
        //   success();
        //   close();
        // }
        // else {
          // Payment method created successfully // Create a PaymentIntent -
          fetch(reactAPIURL + 'payment', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json',
            },
            body: JSON.stringify({
              'amount': totalAmount,
              'paymentMethod': paymentMethod,
              'email': user,
              // 'type': 'createpaymentintent',
              'type': 'createsubscription',
              'couponCode': couponId, // Pass coupon code to the backend
            })
          })
          .then((response) => response.json())
          .then(async responseJson => {
            toast.dismiss();
            // console.log(responseJson);
            if(responseJson.statusCode === 200) {
                setPaymentDone(!isPaymentDone);
                setErrorMessage('Payment processed successfully, Please complete signup process.')
                success(responseJson.result);
                close();
              // const { error: paymentIntentError, paymentIntent } = await stripe.confirmCardPayment(
              //   responseJson.result.client_secret, { payment_method: paymentMethod.id, }
              // );
              // if (paymentIntentError) {
              //   // PaymentIntent confirmation failed
              //   Utils.adderrorNotification('Error confirming the payment: ' + paymentIntentError.message)
              // } else {
              //   // PaymentIntent confirmed successfully
              //   // console.log(paymentIntent);
              //   setPaymentDone(!isPaymentDone);
              //   setErrorMessage('Payment processed successfully, Please complete signup process.')
              //   success();
              //   close();
              //   //update customer-details table customer_plan value accordingly here
              // }
            }else {
              setErrorType('error');
              setErrorMessage('An error occurred while processing your payment:' + responseJson.errorMessage);
            }
          })
          .catch((error) => {
            setErrorType('error');
            setErrorMessage('An error occurred while processing your payment:' + error);
          });
        // }
      }
    } catch (error) {
      setErrorType('error');
      setErrorMessage('An error occurred while processing your payment:' + error);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setLocked(false);
    setCouponId('');
    setDiscountedPrice(null); // Reset the discounted price
  };

  const verifyCouponCode = (code) => {
    const foundCoupon = coupon_data && coupon_data.find(coupon => coupon.name === code);
    return foundCoupon ? foundCoupon.id : null;
  };

  const handleApplyCoupon = () => {
    const id = verifyCouponCode(couponCode); // Verify the coupon code
    if (id) {
      // Coupon code is valid, set the associated coupon ID
      setCouponId(id);
      setErrorMessage(''); // Clear any previous error message
      setLocked(true); // Lock the coupon code input field
      setDiscountedPrice(calculateDiscountedPrice());
    } else {
      // Coupon code is not valid
      setErrorType('error');
      setErrorMessage('Invalid coupon code. Please try again.');
      setCouponId(null); // Reset the coupon ID
      setLocked(false); // Unlock the coupon code input field
    }
  };

  // Function to retrieve the percent-off value associated with the applied coupon
  const getCouponPercentOff = () => {
    const appliedCoupon = coupon_data.find(coupon => coupon.name === couponCode);
    return appliedCoupon ? parseFloat(appliedCoupon.percent_off) : 0;
  };

  // Calculate the discounted price based on the percent-off value
  const calculateDiscountedPrice = () => {
    const percentOff = getCouponPercentOff();
    const numericPrice = parseFloat(selectedPrice);
    const discountedAmount = (percentOff / 100) * numericPrice;
    const discountedPrice = numericPrice - discountedAmount;
    return discountedPrice.toFixed(2); // Return the discounted price as a string with two decimal places
  };

  const calculateProcessingFee = (originalPrice) => {
    const processingFeePercent = 2.5 / 100;
    const processingFee = processingFeePercent * originalPrice;
    return processingFee;
  };

  const handleSelectedPlan = (plan) => {
    setSelectedPlan(plan);
    switch (plan) {
      case 'starter':
        setSelectedPrice(50);
        break;
      case 'pro':
        setSelectedPrice(99);
        break;
      case 'enterprise':
        setSelectedPrice(5000);
        break;
    }
  }

  return  (
    <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={close}
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
        style={{zIndex: 100000}}
        hideBackdrop // Disable the backdrop color/image
        disableEnforceFocus // Let the user focus on elements outside the dialog
        // disableBackdropClick // Remove the backdrop click (just to be sure)
        fullScreen={true}
    >
      <DialogTitle className="dialogTitle" id="alert-dialog-slide-title">Our Plans
        <IconButton onClick={close}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
      <div>
        <DialogContentText id="alert-dialog-slide-description">
          Ready to become the educator you used to wish you had? Start your own virtual lab in minutes{' '}
          <a href="https://www.invoclass.com/educators" target="_blank">learn more</a>.
        </DialogContentText>
        <div className={`columns ${selectedPlan === 'starter' ? 'selected' : ''}`}
              onClick={() => handleSelectedPlan('starter')}>
          <ul className="price">
            <li className="header">STARTER</li>
            <li className="grey">$ 50 / month</li>
            <li>1 no-fee class per year</li>
            <li>20 students per class</li>
            <li>1 class offerable per month</li>
            <li>10 Virtual Computers included* </li>
            <li>1 Educator login per account</li>
            <li>1 version of snapshots per Lab</li>
          </ul>
        </div>

        <div className={`columns ${selectedPlan === 'pro' ? 'selected' : ''}`}
              onClick={() => handleSelectedPlan('pro')}>
          <ul className="price">
            <li className="header">PRO</li>
            <li className="grey">$ 99 / month</li>
            <li>1 no-fee class per month</li>
            <li>Unlimited students per class</li>
            <li>Unlimited classes offerable per month</li>
            <li>20 Virtual Computers included* </li>
            <li>1 Educator login per account</li>
            <li>3 versions of snapshots per Lab</li>
          </ul>
        </div>

        <div className={`columns ${selectedPlan === 'enterprise' ? 'selected' : ''}`}
              onClick={() => handleSelectedPlan('enterprise')}>
          <ul className="price">
            <li className="header">ENTERPRISE</li>
            <li className="grey">$ 5000 / month</li>
            <li>Unlimited no-fee class per month</li>
            <li>Unlimited students per class</li>
            <li>Unlimited classes offerable per month</li>
            <li>100 Virtual Computers included*</li>
            <li>10 Educator login per account</li>
            <li>5 versions of snapshots per Lab</li>
          </ul>
        </div>

        <div className="payment-form">
          <p>Amount: ${selectedPrice}</p>
          {/* Payment Form */}
          <form onSubmit={handleSubmit}>
            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
              Please enter your card details and pay
            </Typography>
            <div className="card-element">
              <CardElement />
            </div>
            {/* Coupon code input field with Apply button */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                label="Coupon Code (optional)"
                fullWidth
                value={couponCode}
                onChange={evt => setCouponCode(evt.target.value.trim())}
                InputLabelProps={{style: {fontSize: 11}}}
                inputProps={{
                  sx: {
                    height: "11px"
                  },
                }}
                disabled={locked}
                InputProps={{
                  endAdornment: locked && (
                    <IconButton onClick={handleRemoveCoupon}>
                      <CloseIcon />
                    </IconButton>
                  )
                }}
              />
              {!locked && (
                <Button
                  onClick={handleApplyCoupon}
                  variant="contained"
                  size="small"
                  color="primary"
                  style={{ marginLeft: '10px' }}
                  margin="dense"
                >
                  Apply
                </Button>
              )}
            </div>
            <div className="amount-container">
              <div>
                <p className="amount-text">Enrollment fee:</p>
                <p className="amount-value">${selectedPrice}</p>
              </div>
              {discountedPrice && (
                <div>
                  <p className="amount-text">Discount:</p>
                  <p className="amount-value">${(parseFloat(selectedPrice) - parseFloat(discountedPrice)).toFixed(2)}</p>
                </div>
              )}
              <div>
                <p className="amount-text">Total:</p>
                <p className="amount-value">${parseFloat(discountedPrice || selectedPrice)}</p>
              </div>
            </div>
            <Button
              type="submit"
              variant="contained"
              disabled={isPaymentDone}
              size="small"
              color="primary">
                Pay
            </Button>{' '}
            <Button
              variant="contained"
              size="small"
              color="primary"
              onClick={close}>Close
            </Button>
          </form>
        </div>
        {errorMessage && (
          <div className="error-box">
            <span className={errorType === 'error' ? "error-message-red" : "error-message-green"}>{errorMessage}</span>
          </div>
        )}
      </div>
    </DialogContent>
  </Dialog>
  )
}

export default CheckoutForm
