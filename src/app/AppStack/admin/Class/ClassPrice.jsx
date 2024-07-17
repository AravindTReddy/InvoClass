import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button, Tooltip,
  Typography, Grid, IconButton
} from '@mui/material';
import { toast } from 'react-toastify';
import Utils from '../../shared/Utils';
import { reactAPIURL } from "../../shared/General.js";
import moment from 'moment';
import DeleteIcon from '@material-ui/icons/Delete';
import CustomTooltip from '../../home/customTooltip';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import uniqid from 'uniqid';

const ClassPrice = ({ step3Data, setStep3Data, stepData, newclass }) => {

  const [percentOff, setPercentOff] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [user, setUser] = useState('');
  const [role, setRole] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState(null);
  const [redeemByDate, setRedeemByDate] = useState(null);
  const [classes, setClasses] = useState([]);
  // Maintain a list of used coupon names
  const [usedCouponNames, setUsedCouponNames] = useState([]);
  const [customerDetails, setCustomerDetails] = useState([]);

  const CustomInput = React.forwardRef(({ value, onClick, label }, ref) => {
    return (
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        value={value}
        label={label}
        helperText="Specifying the last time at which the coupon can be redeemed"
        onClick={onClick}
        ref={ref}
        InputLabelProps={{style: {fontSize: 14}}}
      />
    )
  })

  useEffect(() => {
    //read from localStorage here
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    var userClasses = JSON.parse(localStorage.getItem('classes'));
    userClasses!== null && setClasses(userClasses);
    var customerDetails = JSON.parse(localStorage.getItem('customerDetails'));
    customerDetails !== null && setCustomerDetails(customerDetails);
    if(userDetails !== null){
      // setCustomerId(JSON.parse(userDetails).customer_id);
      setRole(JSON.parse(userDetails).role);
    }
    if(userAuthDetails !== null){
      setUser(JSON.parse(userAuthDetails).user);
      setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
    }
  }, [refreshToken])

  useEffect(() => {
    // Populate usedCouponNames from existing coupons
    const couponNames = step3Data.classCoupons && step3Data.classCoupons.map(coupon => coupon.name);
    setUsedCouponNames(couponNames);
  }, [step3Data.classCoupons]);

  const handleClassPriceChange = (event) => {
    const { value } = event.target;
    setStep3Data((prevData) => ({
      ...prevData,
      ['classPrice']: value,
    }));
  };

  const handlePercentOff = (event) => {
    setPercentOff(event.target.value);
  }

  const createCoupon = async (e) => {
    e.preventDefault();
    //check if the coupon name starts with integer
    // if (/^\d/.test(couponCode)) {
    //     Utils.adderrorNotification('Coupon name cannot start with an integer.');
    //     return;
    // }
    // Check if the coupon name already exists
    if (usedCouponNames.includes(couponCode)) {
      Utils.adderrorNotification('Coupon name already exists. Please choose a different name.');
      return;
    }

    // Calculate the discounted price
    const discountedPrice = parseFloat(step3Data.classPrice) - (parseFloat(step3Data.classPrice) * parseFloat(percentOff) / 100);

    // Check if the discounted price falls below $10, unless the discount is 100%
    if (discountedPrice < 10 && parseFloat(percentOff) !== 100) {
      Utils.adderrorNotification('Price after discount cannot be less than $10 unless the discount is 100%.');
      return;
    }

    const randomID = uniqid();
    let coupon_object = {
        id: randomID,
        name: couponCode,
        created: Math.floor(new Date().getTime() / 1000.0),
        percent_off: percentOff,
        max_redemptions: maxRedemptions,
        redeemby_date: redeemByDate,
    }
    if(!newclass){
      Utils.addinfoNotification('Creating and saving class coupon...');
      fetch(reactAPIURL + 'create-coupon', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          percent_off: percentOff,
          name: couponCode,
          class_id: stepData.classId,
          max_redemptions: maxRedemptions,
          redeemby_date: redeemByDate,
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
          //also update class localStorage
          const newArr1 = [...classes];
          newArr1.find(temp => stepData.classId === temp.class_id).class_coupons.push(coupon_object)
          setClasses(newArr1)
          localStorage.setItem('classes', JSON.stringify(newArr1));
        }else {
          // console.log('error');
          Utils.adderrorNotification('Error creating coupon: ' + responseJson.errorMessage)
          return;
        }
      })
      .catch((error) => {
        Utils.adderrorNotification(error);
      });
    }
    // step3Data.classCoupons.push(coupon_object);
    setStep3Data((prevData) => ({
      ...prevData,
      classCoupons: [...prevData.classCoupons, coupon_object],
    }));
    setCouponCode(''); setPercentOff('');
    setMaxRedemptions(''); setRedeemByDate(null);
  };

  const deleteCoupon = async (item) => {
    if(!newclass){
      Utils.addinfoNotification('Deleting class coupon...');
      fetch(reactAPIURL + 'delete-coupon', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          item: item,
          class_id: stepData.classId,
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        toast.dismiss();
        // console.log(responseJson);
        if(responseJson.statusCode === 200) {
          Utils.addsuccessNotification('Coupon deleted successfully');
          //remove from localStorage
          const newArr1 = [...classes];
          newArr1.forEach(temp => {
            if (stepData.classId === temp.class_id) {
                temp.class_coupons = temp.class_coupons.filter(coupon => coupon.id !== item.id);
            }
          });
          setClasses(newArr1)
          localStorage.setItem('classes', JSON.stringify(newArr1));
        }else {
          Utils.adderrorNotification('Error deleting coupon: ' + responseJson.errorMessage)
          return;
        }
      })
      .catch((error) => {
        Utils.adderrorNotification(error);
      });
    }
    // Remove the coupon from step3Data.classCoupons
    // step3Data.classCoupons = step3Data.classCoupons.filter(coupon => coupon.id !== item.id);
    setStep3Data(prevData => ({
      ...prevData,
      classCoupons: prevData.classCoupons.filter(coupon => coupon.id !== item.id)
    }));
  };

  const handleCopyClick = (coupon_id) => {
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

  const handleCouponNameChange = (evt) => {
    const { value } = evt.target;
    // Check if the first character of the coupon name is an integer
    if (/^\d/.test(value)) {
        Utils.adderrorNotification('Coupon name cannot start with an integer.');
        return;
    }
    // Check if the entered coupon name already exists
    if (usedCouponNames.includes(value)) {
      Utils.adderrorNotification('Coupon name already exists. Please choose a different name.');
    }
    // Update the coupon code state
    setCouponCode(value.trim());
  };

  const handlePriceValidation = (event) => {
    const { value } = event.target;
    if (parseFloat(value) !== 0 && parseFloat(value) < 10) {
      Utils.adderrorNotification('Class price must be either $0 or at least $10');
    }
  };


  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h7" style={{marginBottom: '16px', fontSize: '20px'}}>
            Price
          </Typography>
          <Typography variant="subtitle2" style={{marginBottom: '16px'}}>
            Set a price for your class
            If you’d like to offer your class for free, You can leave the price as 0.
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <TextField
            fullWidth
            type="number"
            size="small"
            label="Class Price"
            value={step3Data.classPrice}
            onChange={handleClassPriceChange}
            onBlur={handlePriceValidation} // Add onBlur event handler
            variant="outlined"
            required
            InputLabelProps={{style: {fontSize: 14}}}
            InputProps={{
              startAdornment: <span>$</span>,
              inputProps: {
                min: 0, step: 0.1,
              },
            }}
            helperText="Please set a price for your class."
          >
          </TextField>
        </Grid>
      </Grid>
      <form onSubmit={createCoupon}>
        <Grid container spacing={2}>
          {role !== 'student' ? <>
            <Grid item xs={12}>
              <Typography variant="h7" style={{marginBottom: '16px', fontSize: '20px'}}>
                Coupons
              </Typography>
              <Typography variant="subtitle2" style={{marginBottom: '16px'}}>
                Create coupons for your class as part of your promotions and share them with the students.
              </Typography>
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                type="text"
                size="small"
                label="Coupon Name"
                value={couponCode}
                // onChange={handleCouponNameChange}
                onChange={evt => setCouponCode(evt.target.value.trim())}
                variant="outlined"
                required
                InputLabelProps={{style: {fontSize: 14}}}
                disabled={parseFloat(step3Data.classPrice) === 0 || step3Data.classPrice === ''}
                helperText={parseFloat(step3Data.classPrice) === 0 ?
                "You cannot create coupons for a free class" : "Please enter a name for your coupon."}
              >
              </TextField>
            </Grid>
            <Grid item xs={3}>
              <TextField
                fullWidth
                type="number"
                size="small"
                label="Percentage off"
                value={percentOff}
                // onChange={handlePercentOff}
                onChange={evt => setPercentOff(evt.target.value.trim())}
                variant="outlined"
                required
                InputLabelProps={{style: {fontSize: 14}}}
                disabled={parseFloat(step3Data.classPrice) === 0 || step3Data.classPrice === ''}
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
                value={maxRedemptions}
                // onChange={handlePercentOff}
                onChange={evt => setMaxRedemptions(evt.target.value.trim())}
                variant="outlined"
                InputLabelProps={{style: {fontSize: 14}}}
                disabled={parseFloat(step3Data.classPrice) === 0 || step3Data.classPrice === ''}
                helperText="Number of times the coupon can be redeemed before it’s no longer valid."
              >
              </TextField>
            </Grid>
            <Grid item xs={3}>
              <DatePicker
                showTimeSelect
                dateFormat="MMM d, yyyy h:mm aa"
                selected={redeemByDate}
                customInput={<CustomInput label="Redeem by"/>}
                onChange={(date) => setRedeemByDate(date)}
                popperPlacement="bottom-end"
              />
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="contained"
                color="primary"
                size="small"
                // onClick={createCoupon}
                type="submit"
                disabled={parseFloat(step3Data.classPrice) === 0 || step3Data.classPrice === ''}
              >
                Create Coupon
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h7" style={{marginBottom: '16px', fontSize: '20px'}}>
                Existing Coupons
              </Typography>
              <Typography variant="subtitle2" style={{marginBottom: '16px'}}>
                share these coupon codes as part of your class promotions.
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
                    {step3Data.classCoupons!== undefined && step3Data.classCoupons.length > 0 ? step3Data.classCoupons.map((item, index) => {
                      return (
                            <tbody key={item.id}>
                              <tr>
                                <td> {item.name}</td>
                                <td> {item.percent_off}{'%'} </td>
                                <td> {moment(item.created * 1000).format('MMMM DD, YYYY HH:mm:ss A')} </td>
                                <td> <CustomTooltip code="coupon" title="Coupon code copied to clipboard"
                                        onClick={() => handleCopyClick(item.name)}/>
                                </td>
                                <td>
                                  <Tooltip title="Delete coupon">
                                    <IconButton size="small" onClick={() => deleteCoupon(item)}>
                                      <DeleteIcon/>
                                    </IconButton>
                                  </Tooltip>
                                </td>
                              </tr>
                            </tbody>
                          )
                        }) : <p style={{margin: '16px'}}> No coupons to display at this time.</p> }
                    </table>
                  </div>
                </div>
              </Grid>
            </>: null
          }
        </Grid>
      </form>
    </>
  );
};

export default ClassPrice;
