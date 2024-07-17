/* helper functions to avoid code rewriting */
import React from 'react';
import { toast } from 'react-toastify';
import { reactAPIURL, secret, stgName, backendAPIURL } from "./General.js";
import moment from 'moment';
var CryptoJS = require("crypto-js");

export default {

  /**
   * Get the user role and details of the logged in user
   * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
   * @param  {String} user logged in user's email
   * @return {JSON}  array of objects(role and customer_id) from the respective database
  */
  getRole(user, refresh_token) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'getuserrole', {
          method: 'post',
          headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
          },
          body: JSON.stringify({
            "user": user,
            "refresh_token": refresh_token,
          })
        })
        .then((response) => response.json())
        .then(responseJson => {
          // console.log(responseJson);
          if (responseJson !== null && responseJson !== undefined)
            resolve(responseJson);
          else reject(responseJson.errorMessage);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },
  /**
   * Get the appearance details of the logged in user
   * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
   * @param  {String} customer_id The unique customer ID of the current logged in user
   * @param  {String} role logged in user's role
   * @return {JSON}  array of objects(primary, secondary colors and logo) from the respective database
  */
  getAppearanceDetails(role, custid, refresh_token, id_token) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'readappearancedetails', {
          method: 'post',
          headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
            'Authorization': id_token
          },
          body: JSON.stringify({
            "refresh_token": refresh_token,
            "customer_id": custid,
            "role": role,
          })
        })
        .then((response) => response.json())
        .then(responseJson => {
          if (responseJson !== null && responseJson !== undefined)
            resolve(responseJson);
          else reject(responseJson.errorMessage);
        })
        .catch((error) => {
          reject(error);
        });
    })
  },
  /**
   * To calculate the time since an notification is posted
   * @param  {Object} date The date an announcement is posted/notification is created
   * @return {String}  the value corresponding to the time since notification posted
  */
  timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    var interval = seconds / 31536000;
    if (interval > 1) {
      return Math.floor(interval) + " year(s) ago";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " month(s) ago ";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " day(s) ago";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hour(s) ago";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minute(s) ago";
    }
    return Math.floor(seconds) + " second(s) ago";
  },

  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - Math.ceil(rating);

    const stars = [];

    // Render full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i className="fa fa-star" key={`full-${i}`}></i>);
    }

    // Render half star
    if (halfStar) {
      stars.push(<i className="fa fa-star-half" key="half"></i>);
    }

    // Render empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i className="fa fa-star-o" key={`empty-${i}`}></i>);
    }

    return stars;
  },

  //toast notification helpers
  addinfoNotification(message) {
    toast.info(message, {
      position: "bottom-right",
      hideProgressBar:false,
      newestOnTop: false,
      closeOnClick: false,
      rtl:false,
      pauseOnFocusLoss: true,
      draggable: true,
      pauseOnHover : true,
      autoClose: 10000,
      className: 'toast-message'
    });
  },
  adderrorNotification(message) {
    toast.error(message, {
      position: "bottom-right",
      hideProgressBar:false,
      newestOnTop: false,
      closeOnClick: false,
      rtl:false,
      pauseOnFocusLoss: true,
      draggable: true,
      pauseOnHover : true,
      autoClose: 10000,
      className: 'toast-message'
    });
  },
  addsuccessNotification(message) {
    toast.success(message, {
      position: "bottom-right",
      hideProgressBar:false,
      newestOnTop: false,
      closeOnClick: false,
      rtl:false,
      pauseOnFocusLoss: true,
      draggable: true,
      pauseOnHover : true,
      autoClose: 10000,
      className: 'toast-message'
    });
  },
/**
 * To create video conference meeting
 * @param  {String} meetingID A unique meeting ID for the meeting(id)
 * @param  {String} name A name for the meeting(title)
 * @param  {String} moderatorPW password used by the moderator to join the meeting
 * @param  {String} attendeePW password used by the attendee to join the meeting
 * @param  {String} secret An unique hex string used to calculate the checksum
 * @param  {String} checksum This is sha1 hex of apimethodname+parameters+secret
 * @return {XML} Tags with appropriate return values
*/
createMeeting(id, title, user_fname, user_lname) {
    this.addinfoNotification('Joining the video call...');
    const meetingID = id;
    const name = (title).replace(/ /g, "+");
    const moderatorPW = '333444';
    const attendeePW = '111222';
    const parameters = 'meetingID=' + meetingID + '&password=' + moderatorPW + '';
    const hashString = 'getMeetingInfo' + parameters + secret;
    var hash = CryptoJS.SHA1(hashString);
    hash = hash.toString(CryptoJS.enc.Hex);
    const checksum = hash;
    var parser = new DOMParser();
    fetch('https://bbb.invoclass.com/bigbluebutton/api/getMeetingInfo?' + parameters + '&checksum=' + checksum + '')
      .then(response => response.text())
      .then(bodyText => {
        var xmlDoc, status;
        xmlDoc = parser.parseFromString(bodyText, "text/xml");
        status = xmlDoc.getElementsByTagName("returncode")[0].childNodes[0].nodeValue;
        if (status === 'SUCCESS') {
          toast.dismiss();
          const meetingName = xmlDoc.getElementsByTagName("meetingName")[0].childNodes[0].nodeValue;
          this.adderrorNotification('Meeting ' + meetingName + ' exist: The meeting ID that you supplied already exists. Go ahead and join!')
        } else if (status === 'FAILED') {
          const parameters = 'name=' + name + '+&meetingID=' + meetingID + '&attendeePW=' + attendeePW + '&moderatorPW=' + moderatorPW + '&record=true';
          const hashString = 'create' + parameters + secret;
          var hash = CryptoJS.SHA1(hashString);
          hash = hash.toString(CryptoJS.enc.Hex);
          const checksum = hash;
          fetch('https://bbb.invoclass.com/bigbluebutton/api/create?' + parameters + '&checksum=' + checksum + '')
            .then((response) => response.text())
            .then(async bodyText => {
              var xmlDoc, status;
              xmlDoc = parser.parseFromString(bodyText, "text/xml");
              status = xmlDoc.getElementsByTagName("returncode")[0].childNodes[0].nodeValue;
              if (status === 'SUCCESS') {
                toast.dismiss();
                await this.joinMeetingModerator(id, title, user_fname, user_lname);
              }
            })
            .catch((error) => {
              this.adderrorNotification('Error creating meeting: ' + error)
            });
        }
      });
  },
  /**
   * To join video conference meeting(as moderator)
   * @param  {String} meetingID A unique meeting ID for the meeting(id)
   * @param  {String} username name of the moderator(user_fname and user_lname)
   * @param  {String} moderatorPW password used by the moderator to join the meeting
   * @param  {String} secret An unique hex string used to calculate the checksum
   * @param  {String} checksum This is sha1 hex of apimethodname+parameters+secret
   * @return {XML} Tags with appropriate return values
  */
  joinMeetingModerator(id, title, user_fname, user_lname) {
    if(user_fname === '' && user_lname === '')
      var userName = ('Moderator' ).replace(/ /g, "+");
    else
      userName = (user_fname + ' ' + user_lname).replace(/ /g, "+");
    //validate if meeting exists before proceeding
    const meetingID = id;
    const moderatorPW = '333444';
    const parameters = 'meetingID=' + meetingID + '&password=' + moderatorPW + '';
    const hashString = 'getMeetingInfo' + parameters + secret;
    var hash = CryptoJS.SHA1(hashString);
    hash = hash.toString(CryptoJS.enc.Hex);
    const checksum = hash;
    var parser = new DOMParser();
    fetch('https://bbb.invoclass.com/bigbluebutton/api/getMeetingInfo?' + parameters + '&checksum=' + checksum + '')
      .then(response => response.text())
      .then(bodyText => {
        var xmlDoc, status;
        xmlDoc = parser.parseFromString(bodyText, "text/xml");
        status = xmlDoc.getElementsByTagName("returncode")[0].childNodes[0].nodeValue;
        if (status === 'SUCCESS') {
          const parameters = 'fullName=' + userName + '+&meetingID=' + meetingID + '&password=' + moderatorPW + '&redirect=false';
          const hashString = 'join' + parameters + secret;
          var hash = CryptoJS.SHA1(hashString);
          hash = hash.toString(CryptoJS.enc.Hex);
          const checksum = hash;
          fetch('https://bbb.invoclass.com/bigbluebutton/api/join?' + parameters + '&checksum=' + checksum + '')
            .then((response) => response.text())
            .then(bodyText => {
              toast.dismiss();
              var xmlDoc, url;
              xmlDoc = parser.parseFromString(bodyText, "text/xml");
              url = xmlDoc.getElementsByTagName("url")[0].childNodes[0].nodeValue;
              window.open(url, "_blank")
            })
            .catch((error) => {
              this.adderrorNotification('Error joining the meeting: ' + error)
            });
        } else if (status === 'FAILED') {
          //if meeting doesn't exist go ahead and create one
          this.createMeeting(id, title, user_fname, user_lname);
        }
      });
  },
  /**
   * To join video conference meeting(as attendee)
   * @param  {String} meetingID A unique meeting ID for the meeting(id)
   * @param  {String} username name of the attendee(user_fname and user_lname)
   * @param  {String} attendeePW password used by the attendee to join the meeting
   * @param  {String} secret An unique hex string used to calculate the checksum
   * @param  {String} checksum This is sha1 hex of apimethodname+parameters+secret
   * @return {XML} Tags with appropriate return values
  */
  joinMeetingAttendee(id, title, user_fname, user_lname) {
    // validate if meeting exist before proceeding
    const meetingID = id;
    if(user_fname === '' && user_lname === '')
      var userName = ('Attendee' ).replace(/ /g, "+");
    else
      userName = (user_fname + ' ' + user_lname).replace(/ /g, "+");
    const moderatorPW = '333444';
    const attendeePW = '111222';
    const parameters = 'meetingID=' + meetingID + '&password=' + moderatorPW + '';
    const hashString = 'getMeetingInfo' + parameters + secret;
    var hash = CryptoJS.SHA1(hashString);
    hash = hash.toString(CryptoJS.enc.Hex);
    const checksum = hash;
    var parser = new DOMParser();
    fetch('https://bbb.invoclass.com/bigbluebutton/api/getMeetingInfo?' + parameters + '&checksum=' + checksum + '')
      .then(response => response.text())
      .then(bodyText => {
        var xmlDoc, status;
        xmlDoc = parser.parseFromString(bodyText, "text/xml");
        status = xmlDoc.getElementsByTagName("returncode")[0].childNodes[0].nodeValue;
        if (status === 'SUCCESS') {
          const parameters = 'fullName=' + userName + '+&meetingID=' + meetingID + '&password=' + attendeePW + '&redirect=false';
          const hashString = 'join' + parameters + secret;
          var hash = CryptoJS.SHA1(hashString);
          hash = hash.toString(CryptoJS.enc.Hex);
          const checksum = hash;
          fetch('https://bbb.invoclass.com/bigbluebutton/api/join?' + parameters + '&checksum=' + checksum + '')
            .then((response) => response.text())
            .then(bodyText => {
              toast.dismiss();
              var xmlDoc, url;
              xmlDoc = parser.parseFromString(bodyText, "text/xml");
              url = xmlDoc.getElementsByTagName("url")[0].childNodes[0].nodeValue;
              window.open(url, "_blank")
            })
            .catch((error) => {
              this.adderrorNotification('Error joining the meeting: ' + error)
            });
        } else if (status === 'FAILED') {
          toast.dismiss();
          var messageKey, message;
          messageKey = xmlDoc.getElementsByTagName("messageKey")[0].childNodes[0].nodeValue;
          message = xmlDoc.getElementsByTagName("message")[0].childNodes[0].nodeValue;
          this.adderrorNotification('Meeting ' + messageKey + ': ' + message)
        }
      });
  },
  /**
    * To get the list of customers available under Brixon Inc
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param {String} role user role of the logged in user
    * @param {String} customer_id The unique customer ID of the current logged in user
    * @return {JSON}  response with a success and list of customers
  */
  getCustomerDetails(refresh_token, customer_id, role) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'readcustomer', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            "refresh_token": refresh_token,
            "role": role,
            "customer_id": customer_id
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body !== null && responseJson.body !== undefined){
            await responseJson.body.sort(function(a, b) {
              var c = new Date(a.created_ts);
              var d = new Date(b.created_ts);
              return d - c;
            });
            resolve(responseJson.body);
          }
        }else{
          reject(responseJson.errorMessage)
        }
      })
      .catch((error) => {
        throw error;
      });
    })
  },
  /**
   * To get the list of users available under a specific customer
   * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
   * @param  {String} customer_id The unique customer ID of the current logged in user
   * @param  {String} role logged in user role
   * @param  {String} user logged in user email id
   * @return {JSON}  response with a success and list of users
 */
  getCustomerUsers(user, role, customer_id, refresh_token, dashboard) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'readuser', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          "customer_id": customer_id,
          "refresh_token": refresh_token,
          "role": role,
          "user": user,
          "dashboard": dashboard
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        // console.log(responseJson);
        if (responseJson.statusCode === 200) {
          if (responseJson.body !== null && responseJson.body !== undefined) {
            await responseJson.body.sort(function(a, b) {
              var c = new Date(a.created_ts);
              var d = new Date(b.created_ts);
              return d - c;
            });
            resolve(responseJson.body);
          }
        } else {
            reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
    * To get the list of classes available under a specific customer
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} role logged in user role
    * @param  {String} user logged in user email id
    * @return {JSON}  response with a success and list of classes
  */
  getCustomerClasses(user, role, customer_id, refresh_token) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'readclass', {
          method: 'post',
          headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
          },
          body: JSON.stringify({
            "customer_id": customer_id,
            "refresh_token": refresh_token,
            "role": role,
            "user": user
          })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body !== null && responseJson.body !== undefined){
            await responseJson.body.sort(function(a, b) {
                var c = new Date(a.created_ts);
                var d = new Date(b.created_ts);
                return d-c;
            });
            resolve(responseJson.body);
          }
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
  * To get the list of templates available under a specific customer
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} role logged in user role
    * @return {JSON}  response with a success and list of images
  */
  getCustomerTemplates(refresh_token, user, customer_id, role) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'readtemplate', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            "customer_id": customer_id,
            "role": role,
            "refresh_token": refresh_token,
            "user": user
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body !== null && responseJson.body !== undefined){
            await responseJson.body.sort(function(a, b) {
                var c = new Date(a.created_ts);
                var d = new Date(b.created_ts);
                return d-c;
            });
            resolve(responseJson.body);
          }
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
  * To get the list of machines available under a specific customer
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} role logged in user role
    * @return {JSON}  response with a success and list of images
  */
  getCustomerMachines(refresh_token, user, customer_id, role) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'readmachine', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            "customer_id": customer_id,
            "role": role,
            "refresh_token": refresh_token,
            "user": user
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body !== null && responseJson.body !== undefined){
            await responseJson.body.sort(function(a, b) {
                var c = new Date(a.created_ts);
                var d = new Date(b.created_ts);
                return d-c;
            });
            resolve(responseJson.body);
          }
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
  * To get the list of instructors available under a specific customer
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} role logged in user role
    * @return {JSON}  response with a success and list of images
  */
  getCustomerInstructors(refresh_token, customer_id, role) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'getcustomerinstructors', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            "customer_id": customer_id,
            "role": role,
            "refresh_token": refresh_token
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body !== null && responseJson.body !== undefined){
            await responseJson.body.sort(function(a, b) {
                var c = new Date(a.created_ts);
                var d = new Date(b.created_ts);
                return d-c;
            });
            resolve(responseJson.body);
          }
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
  * Get the list of all students with an online/offline lab under the logged in user
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} role logged in user role
    * @param  {String} user logged in user email id
    * @return {JSON}  response with a success and list of images
  */
  getCustomerActiveStudents(refresh_token, customer_id, role, user, class_id) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'readactivestudent', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            "customer_id": customer_id,
            "role": role,
            "refresh_token": refresh_token,
            "user": user,
            "class_id": class_id
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body !== null && responseJson.body !== undefined){
            await responseJson.body.sort(function(a, b) {
                var c = new Date(a.created_ts);
                var d = new Date(b.created_ts);
                return d-c;
            });
            resolve(responseJson.body);
          }
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
  * Get the list of all students with an online/offline lab under the logged in user
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} role logged in user role
    * @param  {String} user logged in user email id
    * @return {JSON}  response with a success and list of images
  */
  getCustomerStudents(refresh_token, customer_id, role, user, class_id) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'readstudent', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            "customer_id": customer_id,
            "role": role,
            "refresh_token": refresh_token,
            "user": user,
            "class_id": class_id
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body !== null && responseJson.body !== undefined){
            await responseJson.body.sort(function(a, b) {
                var c = new Date(a.created_ts);
                var d = new Date(b.created_ts);
                return d-c;
            });
            resolve(responseJson.body);
          }
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
  * Get the list of all students with an online/offline lab under the logged in user
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} role logged in user role
    * @param  {String} user logged in user email id
    * @return {JSON}  response with a success and list of images
  */
  getCustomerNotifications(refresh_token, user, customer_id, role) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'readcustomernotifications', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            "customer_id": customer_id,
            "role": role,
            "refresh_token": refresh_token,
            "user": user
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        // console.log(responseJson);
        if(responseJson !== null && responseJson !== undefined){
           //sorting notifications based on updated date
           await responseJson.sort(function(a, b) {
              var c = new Date(a.updated);
              var d = new Date(b.updated);
              return d-c;
           });
           //sorting notifications based on status(To display ongoing one's at top)
           await responseJson.sort(function(a, b) {
             let fa = a.notification_type.split("_")[2].toLowerCase(),
                 fb = b.notification_type.split("_")[2].toLowerCase();
             if (fa < fb)
                return 1;
             if (fa > fb)
                return -1;
             return 0;
           });
           resolve(responseJson);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
    * To get the list of stock images available
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @return {JSON}  response with a success and list of stock images
  */
  getStockImages(refresh_token) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'getstockimages', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          "refresh_token": refresh_token
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body !== null && responseJson.body !== undefined){
            await responseJson.body.sort(function(a, b) {
              let fa = a.codename;
              let fb = b.codename;
              if (fa > fb)
                 return 1;
              if (fa < fb)
                 return -1;
              return 0;
            });
            resolve(responseJson.body);
          }
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        throw error
      });
    })
  },
  /**
    * To get the list of classes that are using a specific image
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {Object} item An object with image/lab details (lab_id)
    * @return {JSON}  response is an array of classes along with statusCode
  */
  getClassesUnderImage(item, refresh_token) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'getclassesunderimage', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          "refresh_token": refresh_token,
          "template_id": item.template_id
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body !== null && responseJson.body !== undefined){
            resolve(responseJson.body);
          }
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
    * Get the list of all announcements/content posted under the respective class
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} class_id class ID
    * @return {JSON}  array of announcements from the respective database
  */
  getClassAnnouncements(class_id, refresh_token) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'readclassannouncement', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          "refresh_token": refresh_token,
          "class_id": class_id
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body !== null && responseJson.body !== undefined){
            resolve(responseJson.body);
          }
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
    * To get guacamole token of the connection(image VM)
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {Object} item An object with image/lab details (lab_id, customer_id)
    * @return {JSON}  response is an array of classes along with statusCode
  */
  getImageGuacToken(item, refresh_token, role) {
    if(role === 'network')
      var id = item.template_id
    else {
      id = 'none'
    }
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'getcustimgtoken', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          "id": id,
          "lab_url": role === 'network' ? item.connection_url : item.lab_access_url,
          "customer_id": item.customer_id,
          "template_id": item.template_id,
          "refresh_token": refresh_token
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body){
            resolve(responseJson.body);
          }
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
    * To get guacamole token of the connection(student/instructor VM)
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {Object} item An object with image/lab details (lab_id, customer_id)
    * @return {JSON}  response is an array of classes along with statusCode
  */
  getGuacToken(item, refresh_token, role) {
    if(role === 'student'){
      var username = item.student_email
      var id = item.student_id
    }
    else if (role === 'machine') {
      username = item.instructor_email
      id = item.machine_id
    }else if (role === 'admin') {
      username = 'oldevops@brixon.io'
      id = item.class_id
    }
    else {
      username = item.instructor_email ? item.instructor_email : item.student_email
      id = item.student_id
    }
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'getguactoken', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          "student_id": id,
          "class_id": item.class_id,
          "username": username,
          "lab_url": item.connection_url,
          "refresh_token": refresh_token
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body){
            resolve(responseJson.body);
          }
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
    * To get the pre signedURL(putObject) of the object from S3 bucket
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} directory path to the file in S3 bucket
    * @param  {Array} key name of the file(s) that are being uploaded
    * @param  {String} type type of the file
    * @return {JSON}  response is a presigned url
  */
  putS3SignedUrl(refresh_token, key, type, directory) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'puts3signedurl', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body:JSON.stringify({
          "refresh_token": refresh_token,
          "key": key,
          "type": type,
          "directory": directory
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
            resolve(responseJson.body);
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
    * To get the pre signedURL(getObject) of the object from S3 bucket
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} directory path to the file in S3 bucket
    * @return {JSON}  response is a presigned url
  */
  getS3SignedUrl(item, refresh_token) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'gets3signedurl', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body:JSON.stringify({
          "refresh_token": refresh_token,
          "directory": item.file
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body){
            resolve(responseJson.body);
          }else if (responseJson.errorType === "NotFound" && responseJson.errorMessage === null) {
            reject(responseJson.errorType);
          }
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
    * To delete an object from S3 bucket and delete the same entry from DynamoDb table
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} class_id class ID
    * @param  {Object} item the item that needs to be removed from the table(Object with id, posted, file, type)
    * @return {JSON}  response with a success custom message and statusCode
  */
  deleteS3Object(item, refresh_token, class_id, type) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'deletes3object', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body:JSON.stringify({
          "refresh_token": refresh_token,
          "class_id": class_id,
          "item": item,
          "type": type
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          resolve(responseJson);
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
    * To start a VM on demand
    * @param  {String} start_lab_password custom password which serves as a layer of security
    * @param  {String} vm_name_param Name of the vm which user wants to start
    * @param  {String} id unique id(customer_id or lab_id or student_id or class_id)
    * @param  {String} user optional in this case
    * @return {JSON}  response with a success custom message
  */
  startVM(items) {
    return new Promise((resolve, reject) => {
      fetch(backendAPIURL + 'start_vm', {
      // fetch('http://areddy-cloud9.omnifsi.com:5000/start_vm', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            "start_lab_password": "start_all_azure_machines",
            "vms": items
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        toast.dismiss();
        if (responseJson.message === "success") {
          resolve(responseJson)
        } else {
            reject(responseJson)
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
   * [To restart azure VM/s]
   * @type {String}
   */
   restartVM(items) {
     return new Promise((resolve, reject) => {
       fetch(backendAPIURL + 'restart_vm', {
       // fetch('http://areddy-cloud9.omnifsi.com:5000/restart_vm', {
         method: 'post',
         headers: {
             'Accept': 'application/json',
             'Content-type': 'application/json',
         },
         body: JSON.stringify({
             "restart_lab_password": "restart_all_azure_machines",
             "vms": items
         })
       })
       .then((response) => response.json())
       .then(responseJson => {
         // console.log(responseJson);
         toast.dismiss();
         if (responseJson.message === "success") {
           resolve(responseJson)
         } else {
             reject(responseJson)
         }
       })
       .catch((error) => {
         reject(error);
       });
     })
   },

  /**
    * To stop a VM on demand
    * @param  {String} stop_lab_password custom password which serves as a layer of security
    * @param  {String} vm_name_param Name of the vm which user wants to start
    * @param  {String} id unique id(customer_id or lab_id or student_id or class_id)
    * @param  {String} user optional in this case
    * @return {JSON}  response with a success custom message
  */
  stopVM(items) {
    return new Promise((resolve, reject) => {
      fetch(backendAPIURL + 'stop_vm', {
      // fetch('http://areddy-cloud9.omnifsi.com:5000/stop_vm', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            "stop_lab_password": "stop_all_azure_machines",
            "vms": items
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        toast.dismiss();
        if (responseJson.message === "success") {
          resolve(responseJson)
        } else {
            reject(responseJson)
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
  * To read the active VM heartbeat data respect to specific customer and brixon admin based on the role
    * @param  {String} api_secret A custom hex secret code used for authenticating the api call
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} role logged in user role
    * @param  {String} user logged in user email id
    * @return {JSON}  response with heartbeat data of the active machines
  */
  readHeartBeatData(customer_id, role, user) {
    return new Promise((resolve, reject) => {
      // let customer_id = "all";
      //If role is brixon admin or developer they can see all VM's
      //Else the user will see VMs associated with their customer id
      // if (role !== 'admin' && role !== 'brixon_developer') {
      //     const c_id = customer_id;
      // }
      // //If drop down is changed customer selected will get customer id. Default it will show all customers VM
      // if (this.state.customerSelected.length > 0) {
      //     customer_id = this.state.customerSelected;
      // }
      var data;
      fetch(reactAPIURL + 'heartbeat', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
          'x-api-key': 'kA6tmf4dkA8YaM3a7X9To7Iac2KkfTJl1YHzBHFh'
        },
        body: JSON.stringify({
          "user": user,
          "computer": "all",
          "customer_id": customer_id
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
         // console.log(responseJson);
        if(responseJson.statusCode === 200 && responseJson.body.length >= 1){
          const res = JSON.parse(responseJson.body)
          await res.sort(function(a, b) {
              var c = new Date(a.TimeGenerated);
              var d = new Date(b.TimeGenerated);
              return d-c;
          });
          data = res.map((item, index) => {
              let currentTime = new Date();
              let heartbeatTime = new Date(item.TimeGenerated);
              //heartbeatTime = heartbeatTime.toUTCString();
              const n = moment(heartbeatTime).format('MMM-DD-YYYY HH:mm:ss');
              let minutes = Math.floor((currentTime - heartbeatTime) / (1000 * 60));
              if (minutes <= 5) var status = 'Online'
              else status = 'Offline'
              var machine_type, type;
              type = item.Computer.split("-")[0];
              if(type === "gs")
                machine_type = 'Class_Server'
              else if(type === 'gsc')
                machine_type = 'Customer_Server'
              else if(type === 'env')
                machine_type = 'Customer_Image_Environment'
              else if(type === 'lab')
               machine_type = 'Student_Lab'
              //video chat yet to come
              return ({
                  machine_type: machine_type,
                  machine_ip: item.ComputerIP,
                  machine_name: item.Computer,
                  machine_os: item.OSType,
                  machine_resource: item.ResourceType,
                  machine_heartbeat: item.TimeGenerated,
                  heartbeat_readable: n,
                  status: status
              })
          })
        }
        resolve(data);
        // this.setState({ data: data, loaded: true });
      })
      .catch((error) => {
        throw error;
      });
    })
  },


  //more to go
}
