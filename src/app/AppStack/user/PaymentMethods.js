import React, {useState} from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Typography, Button } from "@mui/material";
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { reactAPIURL } from '../shared/General';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import Utils from '../shared/Utils';

const PaymentMethods = ({ paymentMethods, subscription, defaultMethod, reload }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [isAddPaymentMethodOpen, setIsAddPaymentMethodOpen] = useState(false);

  const handleCloseAddPaymentMethod = () => {
    setIsAddPaymentMethodOpen(false);
  };

  const handleDefaultPaymentMethod = (paymentMethod) => {
    // Implement logic to make the payment method default
    fetch(reactAPIURL + 'payment', {
      method: 'post',
      headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
      },
      body: JSON.stringify({
        'type': 'setdefaultpaymentmethod',
        'subscription': subscription,
        'paymentmethodId': paymentMethod.id
      })
    })
    .then((response) => response.json())
    .then(async responseJson => {
      // console.log(responseJson);
      if(responseJson.result!== undefined && responseJson.statusCode === 200){
        Utils.addsuccessNotification('Payment method updated successfully.')
        reload({sub_id: subscription.id});
      }else {
        Utils.adderrorNotification(responseJson.errorMessage)
      }
    })
    .catch((error) => {
      console.error('Error updating payment method:', error);
    });
  };

  const handleAdd = () => {
    // Implement logic to add a new payment method
    setIsAddPaymentMethodOpen(true);
  };

  const handleAddPaymentMethod = async (event) => {
    //Create a payment method & Attach a PaymentMethod to a Customer
    event.preventDefault();
    if (!stripe || !elements) {
      // Stripe.js has not loaded yet. Make sure to disable
      // form submission until Stripe.js has loaded.
      return;
    }
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement)
    });
    if (error) {
      setError(error.message);
    } else {
      // Payment method created successfully
      // console.log('[PaymentMethod]', paymentMethod);
      // Attach payment method to both customer & subscription
      fetch(reactAPIURL + 'payment', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
          'type': 'attachpaymentmethod',
          'customer': subscription.customer,
          'paymentmethod': paymentMethod
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        // console.log(responseJson);
        if(responseJson.result!== undefined && responseJson.statusCode === 200){
          // setSubscription(responseJson.result);
          Utils.addsuccessNotification('Payment method added successfully.')
          reload({sub_id: subscription.id});
        }else {
          Utils.adderrorNotification(responseJson.errorMessage)
        }
      })
      .catch((error) => {
        console.error('Error adding payment method:', error);
      });
      handleCloseAddPaymentMethod();
    }
  };

  const handleDeletePaymentMethod = (paymentMethod) => {
    fetch(reactAPIURL + 'payment', {
      method: 'post',
      headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
      },
      body: JSON.stringify({
        'type': 'deletepaymentmethod',
        'paymentmethod': paymentMethod
      })
    })
    .then((response) => response.json())
    .then(async responseJson => {
      if(responseJson.result !== undefined && responseJson.statusCode === 200){
        // Update your UI or state to reflect the deletion
        Utils.addsuccessNotification('Payment method deleted successfully.');
        reload({sub_id: subscription.id});
      } else {
        Utils.adderrorNotification(responseJson.errorMessage);
      }
    })
    .catch((error) => {
      console.error('Error deleting payment method:', error);
    });
  };

  return (
    <div>
      <Typography style={{fontSize: '14px', fontWeight: '550'}}> Payment Methods </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Brand</TableCell>
              <TableCell>Last 4 Digits</TableCell>
              <TableCell>Exp Month</TableCell>
              <TableCell>Exp Year</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paymentMethods.map((paymentMethod) => (
              <TableRow key={paymentMethod.id}>
                <TableCell>
                  {paymentMethod.card.brand}
                  {paymentMethod.id === defaultMethod && <span className="default_card">Default</span>}
                </TableCell>
                <TableCell>{paymentMethod.card.last4}</TableCell>
                <TableCell>{paymentMethod.card.exp_month}</TableCell>
                <TableCell>{paymentMethod.card.exp_year}</TableCell>
                <TableCell>{paymentMethod.card.country}</TableCell>
                <TableCell>
                  {paymentMethod.id !== defaultMethod && (
                    <button onClick={() => handleDefaultPaymentMethod(paymentMethod)}>Make Default</button>
                  )}
                  {/*<button onClick={() => handleEdit(paymentMethod)}>Edit</button>*/}
                  <button onClick={() => handleDeletePaymentMethod(paymentMethod)}>Delete</button>
                </TableCell>
              </TableRow>
            ))}
            {/*{paymentMethods.length === 0 && (*/}
              <TableRow>
                <TableCell colSpan={7}>
                  <button onClick={handleAdd}>Add Payment Method</button>
                </TableCell>
              </TableRow>
            {/*)}*/}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Popup for adding a payment method */}
      {isAddPaymentMethodOpen && (
          <Dialog open={isAddPaymentMethodOpen} onClose={handleCloseAddPaymentMethod}
            fullWidth
            maxWidth="sm">
          <form onSubmit={handleAddPaymentMethod}>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogContent>
                <CardElement />
                {error && <div>{error}</div>}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAddPaymentMethod} color="primary">Cancel</Button>
              {/* Button to save the payment method */}
              <Button type="submit" disabled={!stripe} color="primary">Save</Button>
            </DialogActions>
            </form>
          </Dialog>
      )}
    </div>
  );
};

export default PaymentMethods;
