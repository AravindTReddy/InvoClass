import React, { useState, memo, useEffect, useRef } from 'react';
import {Spinner, Form} from 'react-bootstrap';
import { reactAPIURL } from "../../../shared/General.js";
import { toast } from 'react-toastify';
import Utils from '../../../shared/Utils';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import moment from 'moment';
import { StyleSheet, css } from 'aphrodite';
import parse from 'html-react-parser';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Slide from "@material-ui/core/Slide";
import { useParams, useHistory } from 'react-router-dom';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const Announcement = memo(function Announcement({step4Data, setStep4Data, stepData, newclass}) {

  const [primaryColor, setPrimaryColor] = useState('#F38A2C');
  const [refreshToken, setRefreshToken] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('#606060');
  const [user, setUser] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [role, setRole] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [show, setShow] = useState(false);
  const [announcementSubject, setAnnouncementSubject] = useState('');
  const [editorHtml, setEditorHtml] = useState('');
  const [theme] = useState('snow');

  useEffect(() => {
    refreshToken && readClass();
    refreshToken && readClassAnnouncement();
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    if(userDetails !== null){
      setCustomerId(JSON.parse(userDetails).customer_id);
      setRole(JSON.parse(userDetails).role);
      setUserLastName(JSON.parse(userDetails).user_last_name);
      setUserFirstName(JSON.parse(userDetails).user_first_name);
    }
    if(appearanceObject !== null){
      setPrimaryColor(JSON.parse(appearanceObject).primary_color);
      setSecondaryColor(JSON.parse(appearanceObject).secondary_color);
    }
    if(userAuthDetails !== null){
      setUser(JSON.parse(userAuthDetails).user);
      setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
    }
  }, [refreshToken]);

  const handleChange = (html) => {
  	setEditorHtml(html);
  }

  const readClass = () => {
    Utils.getCustomerClasses(user, role, customerId, refreshToken)
    .then((data) => {
      localStorage.setItem('classes', JSON.stringify(data));
    })
    .catch((error) => { throw error; })
  };

  /**
    * Get the list of all announcements and files posted under a class
  */
  const readClassAnnouncement = async() => {
    await Utils.getClassAnnouncements(stepData.classId, refreshToken)
    .then(data => {
      setStep4Data((prevData) => ({
        ...prevData,
        classAnnouncements: data.announcements,
      }));
    })
    .catch(err => { throw err; });
  }

  const handleClassAnnouncement = (e) => {
    e.preventDefault();
    if(!newclass){
      createClassAnnouncement();
    }
    const newAnnouncement = {
      //this is the unique id assigned to that specific announcement(used mainly to track the announcement when deleting/updating)
      id: Math.floor(100000 + Math.random() * 900000),
      subject: announcementSubject,
      posted: new Date(),
      message: editorHtml
    }
    setStep4Data((prevData) => ({
      ...prevData,
      classAnnouncements: [...prevData.classAnnouncements, newAnnouncement],
    }));
    //reset the fields
    setEditorHtml('');
    setAnnouncementSubject('');
  }

  const createClassAnnouncement = () => {
    Utils.addinfoNotification('Creating announcement...');
    const values_merged = [
      {
        id: Math.floor(100000 + Math.random() * 900000),
        subject: announcementSubject,
        posted: new Date(),
        message: editorHtml
      }
    ]
    fetch(reactAPIURL + 'createclassannouncement', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            "refresh_token": refreshToken,
            "customer_id": customerId,
            "class_id": stepData.classId,
            "class_announcement": values_merged,
            "user": user
        })
    })
    .then((response) => response.json())
    .then(responseJson => {
      // console.log(responseJson);
      toast.dismiss();
      if (responseJson.message === "success" && responseJson.statusCode === 200) {
          Utils.addsuccessNotification('Announcement posted successfully');
          readClassAnnouncement();
          readClass();
      } else {
          Utils.adderrorNotification('Error adding announcement: ' + responseJson.errorMessage,)
          // this.setState({disabled: false})
      }
    })
    .catch((error) => {
      toast.dismiss();
      Utils.adderrorNotification('Error adding announcement: ' + error)
      // this.setState({disabled: false,})
    });
  }

  const deleteClassAnnouncement = (item) => {
    if(!newclass){
      //call the delete API
      Utils.addinfoNotification('Deleting announcement...');
      fetch(reactAPIURL + 'deleteclassannouncement', {
        method: 'post',
        headers:{
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body:JSON.stringify({
          "refresh_token": refreshToken,
          "customer_id": customerId,
          "class_id": stepData.classId,
          "id": item.id
        })
      })
      .then((response) => response.json())
        .then(responseJson => {
        // console.log(responseJson);
        toast.dismiss();
        if (responseJson.message === "success" && responseJson.statusCode === 200) {
            readClassAnnouncement();
            readClass();
            Utils.addsuccessNotification('Announcement deleted successfully')
        } else {
            Utils.adderrorNotification('Error deleting the announcement: ' + responseJson.errorMessage)
        }
      })
      .catch((error)=>{
        toast.dismiss();
        Utils.adderrorNotification('Error deleting the announcement: ' + error )
      });
    }
    // Create a copy of the classAnnouncements array without the item to delete
    const updatedAnnouncements = [...step4Data.classAnnouncements];
    const indexToDelete = updatedAnnouncements.indexOf(item);
    updatedAnnouncements.splice(indexToDelete, 1);

    // Update the step4Data object with the modified classAnnouncements array
    setStep4Data((prevData) => ({
      ...prevData,
      classAnnouncements: updatedAnnouncements,
    }));
  }

  return (
    <div className="col-lg-12 grid-margin">
      {role !== 'student' ? (
        <form onSubmit={handleClassAnnouncement}>
          <div className="row">
            <div className="col-md-12">
              <Form.Group className="row">
                <div className="col-sm-12">
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    label="Subject"
                    value={announcementSubject}
                    type="text"
                    required
                    InputProps={{ style: { fontSize: 13 } }}
                    onChange={(evt) => setAnnouncementSubject(evt.target.value)}
                  />
                </div>
              </Form.Group>
            </div>
            <div className="col-md-12">
              <Form.Group className="row">
                <div className="col-sm-12">
                  <span>Message</span>
                  <ReactQuill
                    theme={theme}
                    onChange={handleChange}
                    value={editorHtml}
                    bounds={'.app'}
                    placeholder="message"
                  />
                </div>
              </Form.Group>
            </div>
          </div>
          <Button
            variant="contained"
            type="submit"
            size="small"
            color="primary"
            // disabled={this.state.disabled}
          >
            SUBMIT
          </Button>
        </form>
      ) : null}

      <div className="card-header">Announcements</div>
      <div className="card-body">
        <div className="fixed-height">
        {step4Data.classAnnouncements.length > 0 ? (
          step4Data.classAnnouncements
            .sort((a, b) => new Date(b.posted) - new Date(a.posted)) // Sort by posted timestamp in descending order
            .map((item, index) => {
              return (
                <div key={index}>
                  <Card className="rootcard" key={item.posted}>
                    <CardHeader
                      title={item.subject}
                      subheader={moment(item.posted).format('dddd, MMMM DD, YYYY HH:mm A') + ' EST'}
                      style={{ backgroundColor: primaryColor, color: 'white' }}
                      titleTypographyProps={{ variant: 'body1' }}
                      subheaderTypographyProps={{ variant: 'body2' }}
                    />
                    <CardContent>
                      <Typography>{parse(item.message)}</Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        variant="contained"
                        onClick={() => deleteClassAnnouncement(item, index)}
                        color="primary"
                        size="small"
                      >
                        Delete
                      </Button>
                    </CardActions>
                  </Card>
                </div>
              );
            })
          ) : (
          <span>No announcements to display at this time.</span>
          )}
        </div>
      </div>
    </div>
  );

});

export default Announcement;
