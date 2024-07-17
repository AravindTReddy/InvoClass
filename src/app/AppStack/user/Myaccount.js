import React, { Component }  from 'react';
import { Auth } from 'aws-amplify'
import { getAppInsights } from '../shared/TelemetryService';
import TelemetryProvider from '../shared/telemetry-provider.jsx';
import {toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Utils from '../shared/Utils';
import { Form, Spinner } from 'react-bootstrap';
import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { SketchPicker } from 'react-color'
import axios from 'axios'
import { s3BucketUrl, reactAPIURL } from "../shared/General.js";
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import Button from '@material-ui/core/Button';
import { StyleSheet, css } from 'aphrodite';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import Switch from '@material-ui/core/Switch';
import DeleteIcon from '@material-ui/icons/Delete';
import DownloadIcon from '@material-ui/icons/GetApp';
import UploadIcon from '@material-ui/icons/CloudUpload';
import TextField from '@material-ui/core/TextField';
import Checkbox from '@material-ui/core/Checkbox';
import {ThemeProvider, createTheme} from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import Tooltip from '@material-ui/core/Tooltip';
import Membership from './Membership';
import Security from './Security';
/* eslint-disable no-useless-escape */

class Myaccount extends Component {
  constructor(props) {
    super(props);
    this.state = {
        loaded: false,
        isActive: true,
        show: false,
        organization: '',
        role: '',
        firstname: '',
        lastname: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        country: '',
        zip: '',
        expanded: '',
        setExpanded: '',
        phone: '',
        checked: [],
        allNotifications: [],
        allowNotifications: false,
        pushNotifications: false,
        emailNotifications: false,
        disabled: false,
        open: false,
        logoName:'',
        minilogoName:'',
        bgimageName:'',
        primary_color: '#F38A2C',
        secondary_color: '#606060',
        plan: ''
    };
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
        loaded: true
      });
      if(JSON.parse(userDetails).user_notification_preferences!== undefined){
        this.setState({
          user_notification_preferences: JSON.parse(userDetails).user_notification_preferences,
          allowNotifications: JSON.parse(userDetails).user_notification_preferences.allowNotifications,
          pushNotifications: JSON.parse(userDetails).user_notification_preferences.pushNotifications,
          emailNotifications: JSON.parse(userDetails).user_notification_preferences.emailNotifications,
          allNotifications: JSON.parse(userDetails).user_notification_preferences.allNotifications !== undefined ? JSON.parse(userDetails).user_notification_preferences.allNotifications : [],
        })
      }
      if(this.state.role === 'customer_admin' || this.state.role === 'biz_customer_admin'){
        //call the Appearance API get values from DB and load to localStorage
        await Utils.getAppearanceDetails(this.state.role, this.state.customer_id, this.state.refresh_token, this.state.id_token)
          .then((res) => {
            if(res === undefined){
              Utils.adderrorNotification('Error retrieving user appearance details: Please logout and log back in!')
            }
            else if(res !== null && res.length>=1){
              res.map((item) => {
                appearanceObject = {
                  primary_color: item.primary_color,
                  secondary_color: item.secondary_color,
                  logo_image: item.logo,
                  minilogo_image: item.mini_logo,
                  bg_image: item.bg_image,
                }
                // Put the object into storage
                localStorage.setItem('appearanceObject', JSON.stringify(appearanceObject));
              })
            }
          })
          .catch((error) => {
            throw error;
          })
      }
    }
    this.readUserData();
  }

  /**
  * To get user details and preferences from DB table
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} role logged in user role
    * @param  {String} user user email address
    * @return {JSON}  response with user details
  */
  readUserData = async () => {
    Utils.getRole(this.state.user, this.state.refresh_token)
    .then(data => {
      data.map((item) => {
        this.setState({
          user_id: item.user_id,
          firstname: item.user_first_name,
          lastname: item.user_last_name
        });
        if(item.user_notification_preferences!== undefined){
          this.setState({
            allowNotifications: item.user_notification_preferences.allowNotifications,
            pushNotifications: item.user_notification_preferences.pushNotifications,
            emailNotifications: item.user_notification_preferences.emailNotifications
          })
        }
      });
    })
    .catch(error => { throw error; })
    /*This reads customer table*/
    if (this.state.role === 'customer_admin' || this.state.role === 'biz_customer_admin') {
      Utils.getCustomerDetails(this.state.refresh_token,
                this.state.customer_id, this.state.role)
      .then(data => {
        data.map((item) => {
            this.setState({
              phone: item.customer_primary_poc_contact,
              organization: item.customer_org_name,
              address1: item.org_address_line_1,
              address2: item.org_address_line_2,
              city: item.org_city,
              state: item.org_state,
              country: item.org_country,
              zip: item.org_zip,
              plan: item.customer_plan
            });
        });
      })
      .catch(error => { throw error; })
    }
  };

  /**
    * To update user notification Preferences
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {Array} rowData Array of users(email)
    * @return {JSON}  response with a success custom message and statusCode
  */
  updateUserPreferences = async () => {
    await this.setState({disabled: true})
    Utils.addinfoNotification('Updating your preferences...');
    fetch(reactAPIURL + 'updateusernotificationpreferences', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
        'Authorization': this.state.id_token
      },
      body: JSON.stringify({
        "user_id": this.state.user_id,
        "user": this.state.user,
        "refresh_token": this.state.refresh_token,
        "customer_id": this.state.customer_id,
        "customer_notification_preferences": {
          "allowNotifications" : this.state.allowNotifications,
          "pushNotifications": this.state.pushNotifications,
          "emailNotifications": this.state.emailNotifications,
          "allNotifications": this.state.allNotifications
        }
      })
    })
    .then((response) => response.json())
    .then(responseJson => {
        // console.log(responseJson);
      toast.dismiss();
      this.setState({disabled: false});
      if (responseJson.message === "success" && responseJson.statusCode === 200) {
          Utils.addsuccessNotification('User notification preferences updated successfully.')
          this.readUserData();
      } else {
          Utils.adderrorNotification('Error updating preferences: ' + responseJson.errorMessage)
      }
    })
    .catch((error) => {
      toast.dismiss();
      Utils.adderrorNotification('Error updating preferences: ' + error)
      this.setState({disabled: false})
    });
  }

  /**
  * To update the user/company details
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
  updateUserDetails = async (event) => {
    event.preventDefault();
    await this.setState({disabled: true});
    Utils.addinfoNotification('Updating user details...');
    fetch(reactAPIURL + 'updateuser', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
        'Authorization': this.state.id_token
      },
      body: JSON.stringify({
        "user_id": this.state.user_id,
        "user": this.state.user,
        "refresh_token": this.state.refresh_token,
        "customer_id": this.state.customer_id,
        "user_role": this.state.role,
        "customer_first_name": this.state.firstname,
        "customer_last_name": this.state.lastname
      })
    })
    .then((response) => response.json())
    .then(responseJson => {
      // console.log(responseJson);
      if (responseJson.message === "success" && responseJson.statusCode === 200) {
        if (this.state.role === 'customer_admin' || this.state.role === 'biz_customer_admin') {
            fetch(reactAPIURL + 'updatecustomer', {
              body: JSON.stringify({
                "customer_id": this.state.customer_id,
                "customer_org_name": this.state.organization,
                "customer_plan": this.state.plan,
                "org_address_line_1": this.state.address1,
                "org_address_line_2": this.state.address2,
                "customer_primary_poc_email": this.state.user,
                "customer_poc_phone": this.state.phone,
                "org_state": this.state.state,
                "org_city": this.state.city,
                "org_zip": this.state.zip,
                "org_country": this.state.country,
                "refresh_token": this.state.refresh_token,
              }),
              method: 'post',
              headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json',
                'Authorization': this.state.id_token
              }
            })
            .then((response) => response.json())
            .then(responseJson => {
              toast.dismiss();
              this.setState({disabled: false})
              if (responseJson.message === "success" && responseJson.statusCode === 200) {
                Utils.addsuccessNotification('Details updated successfully');
                this.readUserData();
              } else {
                Utils.adderrorNotification('Error updating the customer details: ' + responseJson.errorMessage)
              }
            })
            .catch((error) => {
              toast.dismiss();
              Utils.adderrorNotification('Error updating the customer details: ' + error)
              this.setState({disabled: false})
            });
          }else{
            toast.dismiss();
            Utils.addsuccessNotification('Details updated successfully');
            this.readUserData();
            this.setState({disabled: false})
          }
        }else{
          toast.dismiss();
          Utils.adderrorNotification('Error updating the user details: ' + responseJson.errorMessage)
          this.setState({disabled: false})
        }
      })
      .catch((error) => {
        toast.dismiss();
        Utils.adderrorNotification('Error updating the user details: ' + error)
        this.setState({disabled: false})
      });
  };

  /**
   * To get the pre signedURL(putObject) of the object from S3 bucket
  */
  saveAppearance = async(event) => {
    event.preventDefault();
    if(this.state.logoFile && this.state.logoFile.size > 2097152){ // 2 MiB for bytes.
      Utils.adderrorNotification('File size exceeded, Logo cannot be more than 2MB. Your file size is: ' + Math.round((this.state.logoFile.size/1024)/1024) + ' MiB');
    }else if (this.state.bgimageFile && this.state.bgimageFile.size > 2097152) {
      Utils.adderrorNotification('File size exceeded, Background image cannot be more than 2MB. Your file size is: ' + Math.round((this.state.bgimageFile.size/1024)/1024) + ' MiB');
    }
    else {
      if(this.state.logoName === '')
        var logo_image = this.state.logo
      else logo_image = this.state.logo_image;

      if(this.state.minilogoName === '')
        var minilogo_image = this.state.mini_logo
      else minilogo_image =  this.state.minilogo_image;

      if(this.state.bgimageName === '')
        var bg_image = this.state.bg_image
      else bg_image = this.state.bglogo_image;
      // Object to store details in localStorage for lightening fast responses
      var appearanceObject = {
        'user': this.state.user,
        'primary_color': this.state.primary_color,
        'secondary_color': this.state.secondary_color,
        'logo_image': logo_image,
        'minilogo_image': minilogo_image,
        'bg_image': bg_image
      }
      // clear the old objects from storage
      localStorage.removeItem('appearanceObject');
      // Put the object into storage
      localStorage.setItem('appearanceObject', JSON.stringify(appearanceObject));
      await this.setState({disabled: true})
      Utils.addinfoNotification('Saving your appearance settings...');
      const directory = this.state.customer_id + "/appearance/";
      const key = [this.state.logoName, this.state.minilogoName, this.state.bgimageName];
      await Utils.putS3SignedUrl(this.state.refresh_token, key,
                                  this.state.fileType, directory)
      .then(data => {
        var i = 1;
        data.map(async (item) =>{
          this.appearanceContentToS3(item.url, i);
          i++;
        })
      })
      .catch(err => { throw err });
    }
  };
  /**
  * To upload the object to S3 bucket using the above generated pre-signed URL
  * @param  {String} Content-Type the file type
  * @param  {String} item1 pre signed url that is generated above to putObject into the bucket
  * @param  {Object} type the file type
  * @param  {Object} file the file name
  * @return {JSON}  response with a statusText, request readyState and statusCode
  */
  appearanceContentToS3 = async(item1, item2) => {
    var file, type;
    if(item2 === 1){
      file = this.state.logoFile;
      type = this.state.logoType;
    }else if(item2 === 2){
      file = this.state.minilogoFile;
      type = this.state.minilogoType;
    }
    else{
      file = this.state.bgimageFile;
      type = this.state.bgimageType;
    }
    const options = { headers: { 'Content-Type': type } };
    const res = await axios.put(item1, file, options);
    if(res.status === 200 && res.statusText === "OK" && res.request.readyState === 4 ){
      if(item2 === 3){
        this.appearanceContentToDb();
      }
    }
    else{
        toast.dismiss();
        Utils.adderrorNotification('Error uploading the file. Please try again!');
        this.setState({disabled: false})
    }
  };
  /**
  * To insert the appearance details along with above uploaded object details into DynamoDb table
  * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
  * @param  {String} customer_id The unique customer ID of the current logged in user
  * @param  {String} primary_color primary color selected by the user
  * @param  {String} secondary_color secondary color selected by the user
  * @param  {String} logo S3 relative path of the logo along with name
  * @param  {String} bg_image S3 relative path of the bg image along with the name
  * @return {JSON}  response with a success custom message and statusCode
  */
  appearanceContentToDb = async() => {
    if(this.state.logoName === ''){
      if(this.state.logo === undefined)
        var logo_image = s3BucketUrl + this.state.customer_id + "/appearance/"
      else logo_image = this.state.logo
    }
    else logo_image = this.state.logo_image;

    if(this.state.minilogoName === ''){
      if(this.state.mini_logo === undefined)
        var minilogo_image = s3BucketUrl + this.state.customer_id + "/appearance/"
      else minilogo_image = this.state.mini_logo
    }
    else minilogo_image =  this.state.minilogo_image;

    if(this.state.bgimageName === ''){
      if(this.state.bg_image === undefined)
        var bg_image = s3BucketUrl + this.state.customer_id + "/appearance/"
      else bg_image = this.state.bg_image
    }
    else bg_image = this.state.bglogo_image;

    fetch(reactAPIURL + 'appearancecontenttodb', {
      method: 'post',
      headers:{
        'Content-type': this.state.logoType,
      },
      body:JSON.stringify({
        "refresh_token": this.state.refresh_token,
        "customer_id": this.state.customer_id,
        "primary_color": this.state.primary_color,
        "secondary_color": this.state.secondary_color,
        "logo": logo_image,
        "mini_logo": minilogo_image,
        "bg_image": bg_image
      })
    })
    .then((response) => response.json())
      .then(responseJson => {
        //console.log(responseJson);
        toast.dismiss();
        this.setState({disabled: false})
        if(responseJson.message === "success" && responseJson.statusCode === 200){
          Utils.addsuccessNotification('Appearance settings saved successfully.');
          this.logoFileInput.value = "";
          this.minilogoFileInput.value = "";
          this.bgFileInput.value = "";
          window.location.reload();
        }else{
          Utils.adderrorNotification('Error uploading the File: ' + responseJson.errorMessage)
        }
      })
    .catch((error)=>{
      toast.dismiss();
      Utils.adderrorNotification('Error uploading the file: ' + error)
      this.setState({disabled: false})
    });
  };

  /**
    * To revert the appearance details back to default
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
  * @return {JSON}  response with a success custom message and statusCode
  */
  resetAppearance = async() => {
    // clear the old objects from storage
    localStorage.removeItem('appearanceObject');
    await this.setState({disabled: true, open: false})
    Utils.addinfoNotification('Reverting back to default settings...');
    fetch(reactAPIURL + 'resetappearance', {
      method: 'post',
      headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
          'Authorization': this.state.id_token
      },
      body:JSON.stringify({
        "refresh_token": this.state.refresh_token,
        "customer_id": this.state.customer_id,
      })
    })
    .then((response) => response.json())
      .then(responseJson => {
        //console.log(responseJson);
        toast.dismiss();
        this.setState({disabled: false})
        if(responseJson.message === "AppearanceresetSuccess" && responseJson.statusCode === 200){
          Utils.addsuccessNotification('Appearance settings reverted to default.');
          window.location.reload();
        }else{
          Utils.adderrorNotification('Error reverting the changes: ' + responseJson.errorMessage)
        }
      })
    .catch((error)=>{
      toast.dismiss();
      Utils.adderrorNotification('Error reverting the changes: ' + error)
      this.setState({disabled: false})
    });
  };

  handlePanelChange = (panel) => (event, newExpanded) => {
    if(newExpanded === true){
      this.setState({expanded: panel})
    }
    else{
      this.setState({expanded: false})
    }
  }

  handleLogoChange = async(event) => {
    if(event.target.files[0]){
      //remove spaces from the uploaded image name
      const imgName = event.target.files[0].name.replace(/\s/g, "");
      //read image file to base64 encoded string
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        // this.setState({logo_image: reader.result})
      })
      reader.readAsDataURL(event.target.files[0])
      //validate dimensions(heightxwidth)
      let img = new Image()
        img.src = window.URL.createObjectURL(event.target.files[0])
        img.onload = () => {
           // alert(img.width + " " + img.height);
        }
      await this.setState({
        logoFile: event.target.files[0],
        logoName: imgName,
        logoType: event.target.files[0].type,
        logo_image: s3BucketUrl + this.state.customer_id + "/appearance/" + imgName
      });
    }else{
      this.setState({logoFile: '',logoName: '',logoType: ''});
    }
  };

  handleMiniLogoChange = async(event) => {
    if(event.target.files[0]){
      //remove spaces from the uploaded image name
      const imgName = event.target.files[0].name.replace(/\s/g, "");
      //read image file to base64 encoded string
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        // this.setState({minilogo_image: reader.result})
      })
      reader.readAsDataURL(event.target.files[0])
      //validate dimensions(heightxwidth)
      let img = new Image()
        img.src = window.URL.createObjectURL(event.target.files[0])
        img.onload = () => {
           // alert(img.width + " " + img.height);
        }
      await this.setState({
        minilogoFile: event.target.files[0],
        minilogoName: imgName,
        minilogoType: event.target.files[0].type,
        minilogo_image: s3BucketUrl + this.state.customer_id + "/appearance/" + imgName
      });
    }else{
      this.setState({minilogoFile: '',minilogoName: '',minilogoType: ''});
    }
  };

  handleBgChange = async(event) => {
    if(event.target.files[0]){
      //remove spaces from the uploaded image name
      const imgName = event.target.files[0].name.replace(/\s/g, "");
      //read image file to base64 encoded string
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        // this.setState({bglogo_image: reader.result})
      })
      reader.readAsDataURL(event.target.files[0])

      await this.setState({
        bgimageFile: event.target.files[0],
        bgimageName: imgName,
        bgimageType: event.target.files[0].type,
        bglogo_image: s3BucketUrl + this.state.customer_id + "/appearance/" + imgName
      });
    }else{
      this.setState({bgimageFile: '',bgimageName: '',bgimageType: ''});
    }
  };

  handlePrimaryChange = (color) => {
    if(color.hex === "#ffffff")
    Utils.adderrorNotification('Error: You are not allowed to have white(#ffffff) as your primary or secondary color. Please try again!')
    else
    this.setState({ primary_color: color.hex });
  };

  handleSecondaryChange = (color) => {
    if(color.hex === "#ffffff")
    Utils.adderrorNotification('Error: You are not allowed to have white(#ffffff) as your primary or secondary color. Please try again!')
    else
    this.setState({ secondary_color: color.hex });
  };

  onChange = (key, value) => {
      this.setState({
          [key]: value
      })
  };

  handleAllowNotificationsChange = (event) => {
      this.setState({
        allowNotifications: event.target.checked,
        pushNotifications: event.target.checked,
      })
    this.updateUserPreferences();
    //update user details table
  };

  handlePushNotificationsChange = (event) => {
    this.setState({pushNotifications: event.target.checked})
    this.updateUserPreferences();
    //update user details table
  };

  handleEmailNotificationsChange = (event) => {
    this.setState({emailNotifications: event.target.checked})
    this.updateUserPreferences();
    //update user details table
  };

  handleAllNotificationsChange = (value) => () => {
    const currentIndex = this.state.allNotifications.indexOf(value);
    const newChecked = [...this.state.allNotifications];
    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }
    this.setState({allNotifications: newChecked})
    this.updateUserPreferences();
    //update user details table
  }

  handleClickOpenAlert = async() => {
    await this.setState({open: true});
  };

  handleCloseAlert = () => {
    this.setState({open: false});
  };

  render () {
    let appInsights = null;
    const expanded = this.state.expanded;
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
    const theme = createTheme({
      palette: {
        primary: {
            main: this.state.primary_color,
        },
        secondary: {
            main: this.state.secondary_color,
        },
      },
    });
    return (
      <TelemetryProvider instrumentationKey="7696784d-3192-42a6-891e-1f8ca728cfae" after={() => { appInsights = getAppInsights() }}>
        <ThemeProvider theme={theme}>
          <div className="App">
            <div className="card">
              <div className= {`${ 'card-header' } ${ css(styles.cardheader) }`}>InvoClass User Account</div>
                <div className="card-body">
                {this.state.loaded ?
                  <div>
                    <Accordion expanded={expanded === 'panel1'} onChange={this.handlePanelChange('panel1')}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}
                            aria-controls="panel1d-content"
                            id="panel1d-header"
                          >
                            <Typography style={{color: this.state.primary_color, fontSize: '14px', fontWeight: '550'}}>
                              <i className="fa fa-user"/> Profile
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <div className="row">
                              <div className="col-lg-12 grid-margin">
                                <div className="accountheading">Edit Profile</div>
                                   <p className="card-description">(All fields marked with * are required)</p>
                                      <form onSubmit={this.updateUserDetails}>
                                        {/*check if the role is not admin change name only. Otherwise change address,company etc*/}
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <Form.Group className="row">
                                                      <div className="col-sm-12">
                                                        <TextField
                                                          fullWidth
                                                          size="small"
                                                          variant="outlined"
                                                          label="First Name"
                                                          value={this.state.firstname}
                                                          type='text'
                                                          required
                                                          name="firstname"
                                                          onChange={evt => this.onChange('firstname', evt.target.value.trim())}
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
                                                          label="Last Name"
                                                          value={this.state.lastname}
                                                          type='text'
                                                          required
                                                          name="lastname"
                                                          onChange={evt => this.onChange('lastname', evt.target.value.trim())}
                                                        />
                                                      </div>
                                                    </Form.Group>
                                                  </div>
                                                </div>
                                                {this.state.role === 'customer_admin' || this.state.role === 'biz_customer_admin' ?
                                                <div>
                                                <div className="row">
                                                    <div className="col-md-3">
                                                        <Form.Group className="row">
                                                            <div className="col-sm-12">
                                                              <TextField
                                                                fullWidth
                                                                size="small"
                                                                variant="outlined"
                                                                label="Company"
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
                                                                variant="outlined"
                                                                label="Address 1"
                                                                required
                                                                type="text"
                                                                value={this.state.address1}
                                                                onChange={event => this.setState({address1: event.target.value})}
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
                                                                  label="Address 2"
                                                                  type="text"
                                                                  value={this.state.address2}
                                                                  onChange={event => this.setState({address2: event.target.value})}
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
                                                                type="tel"
                                                                value={this.state.phone}
                                                                pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                                                                onChange={evt => this.onChange('phone', (evt.target.value).replace(/(\d{3}(?!\d?$))\-?/g, '$1-'))}
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
                                                                required
                                                                type="text"
                                                                value={this.state.city}
                                                                onChange={event => this.setState({city: event.target.value})}
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
                                                                required
                                                                type="text"
                                                                value={this.state.state}
                                                                onChange={event => this.setState({state: event.target.value})}
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
                                                                required
                                                                type="text"
                                                                value={this.state.country}
                                                                onChange={event => this.setState({country: event.target.value})}
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
                                                                required
                                                                type="number"
                                                                value={this.state.zip}
                                                                onChange={event => this.setState({zip: event.target.value})}
                                                              />
                                                            </div>
                                                        </Form.Group>
                                                    </div>
                                                </div>
                                            </div> : null
                                        }
                                    <button disabled={this.state.disabled} className="button" type="submit">
                                      Update Profile
                                    </button>{' '}
                                    <button disabled={this.state.disabled} type="reset" className="button">
                                      Reset
                                    </button>
                                 </form>
                               </div>
                            </div>
                      </AccordionDetails>
                    </Accordion>

                    <Accordion expanded={expanded === 'panel2'} onChange={this.handlePanelChange('panel2')}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}
                            aria-controls="panel1d-content"
                            id="panel1d-header"
                        >
                            <Typography style={{color: this.state.primary_color, fontSize: '14px', fontWeight: '550'}}>
                              <i className="fa fa-lock"/> Security
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Security />
                        </AccordionDetails>
                    </Accordion>

                    {this.state.role === "customer_admin" || this.state.role === 'biz_customer_admin' ?
                      <Accordion expanded={expanded === 'panel3'} onChange={this.handlePanelChange('panel3')}>
                          <AccordionSummary
                              expandIcon={<ExpandMoreIcon/>}
                              aria-controls="panel1d-content"
                              id="panel1d-header"
                          >
                              <Typography style={{color: this.state.primary_color, fontSize: '14px', fontWeight: '550'}}>
                              <i className="fa fa-eye"/> Appearance
                                  </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <div className="row">
                              <div className="col-lg-12 grid-margin">
                                  <div className="accountheading">Appearance settings</div>
                                      <p className="card-description">(All fields
                                          marked with * are required)</p>
                                            <form onSubmit={this.saveAppearance}>
                                              <div className="row">
                                                  <div className="col-md-8">
                                                      <Form.Group className="row">
                                                          <div className="col-sm-6">
                                                            <span>Primary color&#42;</span>
                                                              <SketchPicker
                                                                color={ this.state.primary_color }
                                                                onChangeComplete={ this.handlePrimaryChange }
                                                                disableAlpha={true}
                                                              />
                                                              <i>Default: #F38A2C</i>
                                                          </div>
                                                          <div className="col-sm-6">
                                                            <span>Secondary color&#42;</span>
                                                              <SketchPicker
                                                                color={ this.state.secondary_color }
                                                                onChangeComplete={ this.handleSecondaryChange }
                                                                disableAlpha={true}
                                                              />
                                                              <i>Default: #606060</i>
                                                          </div>
                                                      </Form.Group>
                                                  </div>
                                                  <div className="col-md-12">
                                                      <Form.Group className="row">
                                                        <div className="col-sm-6">
                                                          <span>Logo&#42;</span> &nbsp;
                                                          <span data-toggle="tooltip" data-placement="top"
                                                             title="This is the main logo used in the sidebar menu. Max allowed size: 1MB">
                                                              <i className="fa fa-question-circle"></i>
                                                          </span>
                                                          <Form.Control
                                                              ref={ref=> this.logoFileInput = ref}
                                                              type="file"
                                                              placeholder="Select a file to upload"
                                                              onChange={this.handleLogoChange}
                                                              accept="image/*"
                                                              className="choose"
                                                          />
                                                          <i>We recommend uploading an logo picture size of 400x400 pixels.</i>{' '}
                                                          <i>Default: null</i>
                                                        </div>
                                                      </Form.Group>
                                                  </div>
                                                  <div className="col-md-12">
                                                      <Form.Group className="row">
                                                        <div className="col-sm-6">
                                                          <span>Mini Logo&#42;</span> &nbsp;
                                                          <span data-toggle="tooltip" data-placement="top"
                                                             title="This is the logo used when the sidebar menu is collapsed. Max allowed size: 100kb">
                                                              <i className="fa fa-question-circle"></i>
                                                          </span>
                                                          <Form.Control
                                                              ref={ref=> this.minilogoFileInput = ref}
                                                              type="file"
                                                              placeholder="Select a file to upload"
                                                              onChange={this.handleMiniLogoChange}
                                                              accept="image/*"
                                                              className="choose"
                                                          />
                                                          <i>We recommend uploading an picture size of 70 x 70 pixels.</i>{' '}
                                                          <i>Default: null</i>
                                                        </div>
                                                      </Form.Group>
                                                  </div>
                                                  <div className="col-md-12">
                                                      <Form.Group className="row">
                                                        <div className="col-sm-6">
                                                          <span>background Image&#42;</span> &nbsp;
                                                          <span data-toggle="tooltip" data-placement="top"
                                                             title="This is the background image used in the main panel. Max size allowed: 2MB">
                                                              <i className="fa fa-question-circle"></i>
                                                          </span>
                                                          <Form.Control
                                                              ref={ref=> this.bgFileInput = ref}
                                                              type="file"
                                                              placeholder="Select a file to upload"
                                                              onChange={this.handleBgChange}
                                                              accept="image/*"
                                                              className="choose"
                                                          />
                                                          <i>We recommend uploading an picture size of 1125 x 630 pixels.</i>{' '}
                                                          <i>Default: null</i>
                                                        </div>
                                                      </Form.Group>
                                                  </div>
                                              </div>
                                            <button disabled={this.state.disabled} type="submit" className="button">
                                              Save changes
                                            </button>{' '}
                                            <button disabled={this.state.disabled} onClick={this.handleClickOpenAlert}
                                                    type="reset" className="button">Revert
                                            </button>
                                        </form>
                                    </div>
                                </div>
                                <Dialog
                                    open={this.state.open}
                                    keepMounted
                                    onClose={this.handleCloseAlert}
                                    aria-labelledby="alert-dialog-slide-title"
                                    aria-describedby="alert-dialog-slide-description"
                                >
                                    <DialogTitle
                                        id="alert-dialog-slide-title">{"Revert theme?"}</DialogTitle>
                                    <DialogContent>
                                        <DialogContentText id="alert-dialog-slide-description">
                                            Are you sure this action
                                            can not be undone?
                                        </DialogContentText>
                                    </DialogContent>
                                    <DialogActions>
                                        <Button onClick={this.handleCloseAlert} color="primary">
                                            No
                                        </Button>
                                        <Button onClick={() => this.resetAppearance()}
                                                color="primary">
                                            Yes
                                        </Button>
                                    </DialogActions>
                                </Dialog>
                          </AccordionDetails>
                      </Accordion>
                      : null
                    }
                    <Accordion expanded={expanded === 'panel4'} onChange={this.handlePanelChange('panel4')}>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon/>}
                            aria-controls="panel1d-content"
                            id="panel1d-header"
                        >
                            <Typography style={{color: this.state.primary_color, fontSize: '14px', fontWeight: '550'}}>
                            <i className="fa fa-bell"/> Preferences
                                </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <div className="row">
                            <div className="col-lg-12 grid-margin">
                                <div className="accountheading">Notification settings</div>
                                    <form className="form-sample">
                                        <div className="row">
                                            <div className="col-md-12">
                                              <FormGroup aria-label="position" row>
                                                <FormControlLabel
                                                  value="start"
                                                  control={
                                                    <Switch
                                                      checked={this.state.allowNotifications}
                                                      onChange={this.handleAllowNotificationsChange}
                                                      color="primary"
                                                      inputProps={{ 'aria-label': 'primary' }}
                                                      edge="end"
                                                    />
                                                  }
                                                  label="Allow Notifications"
                                                />
                                              </FormGroup>
                                            </div>
                                            {this.state.allowNotifications ?
                                            <div className="col-md-12">
                                            <FormGroup row>
                                            <FormControlLabel
                                              control={
                                                <Checkbox
                                                  checked={this.state.pushNotifications}
                                                  onChange={this.handlePushNotificationsChange}
                                                  name="checkedA"
                                                  color="primary"
                                                />
                                              }
                                              label="Push Notifications"
                                            />
                                            <FormControlLabel
                                              control={
                                                <Checkbox
                                                  checked={this.state.emailNotifications}
                                                  onChange={this.handleEmailNotificationsChange}
                                                  name="checkedB"
                                                  color="primary"
                                                />
                                              }
                                              label="Email Notifications"
                                            />
                                            </FormGroup>
                                            <List component="nav"
                                                aria-labelledby="nested-list-subheader"
                                                subheader={
                                                  <ListSubheader component="div" id="nested-list-subheader">
                                                    Notify me when an entity{' '}
                                                    <Tooltip placement="right-start" title="Entities include Users, Images, Courses, Classes, Students, Announcements, Files, Messages, Calendar Events, VideoChat Requests, Preferences, etc..">
                                                      <i className="fa fa-question-circle"></i>
                                                    </Tooltip> is:
                                                  </ListSubheader>
                                                }
                                            >
                                              <ListItem>
                                                <ListItemIcon>
                                                  <AddIcon />
                                                </ListItemIcon>
                                                <ListItemText id="switch-list-label-uploaded" primary="Created" />
                                                <ListItemSecondaryAction>
                                                  <Switch
                                                    edge="end"
                                                    onChange={this.handleAllNotificationsChange('create')}
                                                    checked={this.state.allNotifications.indexOf('create') !== -1}
                                                    inputProps={{ 'aria-labelledby': 'switch-list-label-created' }}
                                                  />
                                                </ListItemSecondaryAction>
                                              </ListItem>
                                              <ListItem>
                                                <ListItemIcon>
                                                  <EditIcon />
                                                </ListItemIcon>
                                                <ListItemText id="switch-list-label-updated" primary="Updated" />
                                                <ListItemSecondaryAction>
                                                  <Switch
                                                    edge="end"
                                                    onChange={this.handleAllNotificationsChange('update')}
                                                    checked={this.state.allNotifications.indexOf('update') !== -1}
                                                    inputProps={{ 'aria-labelledby': 'switch-list-label-updated' }}
                                                  />
                                                </ListItemSecondaryAction>
                                              </ListItem>
                                              <ListItem>
                                                <ListItemIcon>
                                                  <DeleteIcon />
                                                </ListItemIcon>
                                                <ListItemText id="switch-list-label-deleted" primary="Deleted" />
                                                <ListItemSecondaryAction>
                                                  <Switch
                                                    edge="end"
                                                    onChange={this.handleAllNotificationsChange('delete')}
                                                    checked={this.state.allNotifications.indexOf('delete') !== -1}
                                                    inputProps={{ 'aria-labelledby': 'switch-list-label-deleted' }}
                                                  />
                                                </ListItemSecondaryAction>
                                              </ListItem>
                                            </List>
                                            </div> : null }
                                        </div>
                                     </form>
                                  </div>
                              </div>

                        </AccordionDetails>
                    </Accordion>
                    {this.state.role === "customer_admin" || this.state.role === 'biz_customer_admin' ?
                      <Accordion expanded={expanded === 'panel5'} onChange={this.handlePanelChange('panel5')}>
                          <AccordionSummary
                              expandIcon={<ExpandMoreIcon/>}
                              aria-controls="panel1d-content"
                              id="panel1d-header"
                          >
                              <Typography style={{color: this.state.primary_color, fontSize: '14px', fontWeight: '550'}}>
                              <i className="fa fa-credit-card"/> Membership
                                  </Typography>
                          </AccordionSummary>
                          <AccordionDetails style={{ width: '100%' }}>
                              <Membership />
                          </AccordionDetails>
                      </Accordion> : null
                    }


                  </div> : <div className="d-flex justify-content-center">
                        <Spinner animation="border" role="status">
                            <span className="sr-only">Loading...</span>
                        </Spinner>
                      </div>
                }
              </div>
            </div>
          </div>
        </ThemeProvider>
      </TelemetryProvider>
    );
  }
}

export default Myaccount;
