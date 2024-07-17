import React, { useState, memo, useEffect, useRef } from 'react';
import {Spinner, Form} from 'react-bootstrap';
import { reactAPIURL } from "../../../shared/General.js";
import { toast } from 'react-toastify';
import Utils from '../../../shared/Utils';
import moment from 'moment';
import { StyleSheet, css } from 'aphrodite';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import CustomToast from '../../../shared/CustomToast.js'
import axios from 'axios'


const Material = memo(function Material({step4Data, setStep4Data, stepData, newclass}) {

  const [primaryColor, setPrimaryColor] = useState('#F38A2C');
  const [refreshToken, setRefreshToken] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('#606060');
  const [user, setUser] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [role, setRole] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [show, setShow] = useState(false);
  const [fileMain, setFileMain] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [materialType, setMaterialType] = useState('');
  const fileInputRef = useRef(null);


  useEffect(() => {
    readClass();
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

  const readClass = () => {
    Utils.getCustomerClasses(user, role, customerId, refreshToken)
    .then((data) => {
      localStorage.setItem('classes', JSON.stringify(data));
    })
    .catch((error) => { throw error; })
  };

  const handleChange = (event) => {
    if(event.target.files[0]){
      setFileName(event.target.files[0].name);
      setFileType(event.target.files[0].type);
      setFileMain(event.target.files[0]);
    }else{
      setFileName('');
      setFileType('');
      setFileMain('');
    }
  }

  const resetFileData = () => {
    setFileName('');
    setFileType('');
    setFileMain('');
    setMaterialType('');
  }

  const getS3SignedUrl = async(item) => {
    Utils.addinfoNotification("Opening material in a new tab...");
    await Utils.getS3SignedUrl(item, refreshToken)
    .then(data => {
      toast.dismiss();
      window.open(data);
    })
    .catch(err => { throw err });
  }

  const putS3SignedUrl = (e) => {
    e.preventDefault();
    if(!newclass){
      const directory = customerId + "/classes/" + stepData.classId + "/materials/";
      Utils.putS3SignedUrl(refreshToken, [fileName], fileType, directory)
      .then(data => {
        data.map(async (item) =>{
          await classMaterialToS3(item.url);
        })
      })
      .catch(err => { throw err });
    }
    const newMaterial = {
      //this is the unique id assigned to that specific announcement(used mainly to track the file when deleting)
      id: Math.floor(100000 + Math.random() * 900000),
      type: materialType,
      posted: new Date(),
      file: customerId + "/classes/" + stepData.classId + "/materials/" + fileName,
      filename: fileName,
      filemain: fileMain,
      filetype: fileType
    }
    setStep4Data((prevData) => ({
      ...prevData,
      classMaterials: [...prevData.classMaterials, newMaterial],
    }));
    //reset the fields
    setFileMain('');
    setMaterialType('');
    fileInputRef.current.value = "";
  }

  const classMaterialToS3 = async(item) => {
    const options = { headers: { 'Content-Type': fileType } };
    const res = await axios.put(item ,fileMain ,options);
    if(res.status === 200 && res.statusText === "OK" && res.request.readyState === 4 ){
        classMaterialToDb();
    }
    else{
      toast.dismiss();
      Utils.adderrorNotification('Error uploading the file. Please try again!');
    }
  }

  const classMaterialToDb = async(item) => {
    const newMaterial = [{
      //this is the unique id assigned to that specific announcement(used mainly to track the file when deleting)
      id: Math.floor(100000 + Math.random() * 900000),
      type: materialType,
      posted: new Date(),
      file: customerId + "/classes/" + stepData.classId + "/materials/" + fileName
    }]
    fetch(reactAPIURL + 'classcontenttodb', {
      method: 'post',
      headers:{
        'Content-type': fileType,
      },
      body:JSON.stringify({
        "refresh_token": refreshToken,
        "customer_id": customerId,
        "class_id": stepData.classId,
        "class_material": newMaterial,
        "user": user
      })
    })
    .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        toast.dismiss();
        if(responseJson.message === "success" && responseJson.statusCode === 200){
          Utils.addsuccessNotification(<CustomToast
            message = "Material uploaded successfully"
            type = "response"
          />)
          readClass();
          resetFileData();
        }else{
          Utils.adderrorNotification('Error uploading the File: ' + responseJson.errorMessage)
          // this.setState({disabled: false})
        }
      })
    .catch((error)=>{
      toast.dismiss();
      Utils.adderrorNotification('Error uploading the file: ' + error)
      // this.setState({disabled: false})
    });
  }

  const deleteClassMaterial = async(item) => {
    if(!newclass){
      Utils.addinfoNotification("Deleting the material...");
      await Utils.deleteS3Object(item, refreshToken, stepData.classId, 'material')
      .then(data => {
        toast.dismiss();
        if(data.message === 'success' && data.statusCode === 200){
          Utils.addsuccessNotification(<CustomToast
            message = "File Deleted successfully"
            type = "response"
          />)
          readClass();
        }
      })
      .catch(err => { throw err });
    }
    const updatedMaterials = [...step4Data.classMaterials];
    const indexToDelete = updatedMaterials.indexOf(item);
    updatedMaterials.splice(indexToDelete, 1);
    // Update the step4Data object with the modified classMaterials array
    setStep4Data((prevData) => ({
      ...prevData,
      classMaterials: updatedMaterials,
    }));
  }

  return (
    <div className="col-lg-12 grid-margin">
    {role !== 'student' ?
      <form onSubmit = {putS3SignedUrl}>
        <div className="row">
          <div className="col-md-12">
            <Form.Group className="row">
              <div className="col-sm-12">
                <TextField
                  fullWidth
                  size="small"
                  select
                  label="Material Type"
                  value={materialType}
                  onChange={evt => setMaterialType(evt.target.value)}
                  required
                  variant="outlined"
                  InputProps={{style: {fontSize: 13}}}
                >
                  <MenuItem value="">Select</MenuItem>
                  <MenuItem value="curriculum">Curriculum</MenuItem>
                  <MenuItem value="instructions">Instructions</MenuItem>
                  <MenuItem value="syllabus">Syllabus</MenuItem>
                  {/*<MenuItem value="question">Question</MenuItem>
                  <MenuItem value="assignment">Assignment</MenuItem>*/}
                </TextField>
              </div>
            </Form.Group>
          </div>
          <div className="col-md-12">
              <Form.Group className="row">
                <div className="col-sm-12">
                  <Form.Control
                    type="file"
                    placeholder="Select a file to upload"
                    onChange={handleChange}
                    required
                    accept=".pdf"
                    className="choose"
                    ref={fileInputRef}
                  />
                </div>
              </Form.Group>
            </div>
          </div>
          <Button variant="contained"
                  type="submit"
                  color="primary"
                  size="small"
                  // disabled={this.state.disabled}
          >
           <i className="fa fa-upload"></i>{' '}UPLOAD
          </Button>
          {' '}
          <Button variant="contained"
                  type="reset"
                  color="primary"
                  size="small"
                  // disabled={this.state.disabled}
                  onClick={resetFileData}
          >
           RESET
        </Button>
        </form> : null
       }
        <div className= "card-header">Material</div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th> Name </th>
                    <th> Type </th>
                    <th> Download</th>
                    <th> Date</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                {step4Data.classMaterials.length > 0 ? step4Data.classMaterials.map((item, index) => {
                  var splitFilename = item.file.split('/');
                  return (
                        <tbody key={item.posted}>
                          <tr>
                            <td> {splitFilename[splitFilename.length - 1]}</td>
                            <td> {item.type.toUpperCase()} </td>
                            <td> <button onClick={() => getS3SignedUrl(item)}> Download </button></td>
                            <td> {moment(item.posted).format('MMMM DD, YYYY HH:mm:ss A')} </td>
                            <td> <button onClick={() => deleteClassMaterial(item)}> Delete </button> </td>
                          </tr>
                        </tbody>
                      )
                    }) : <p>No material to display at this time.</p> }
                </table>
              </div>
          </div>
    </div>
  );
});

export default Material;
