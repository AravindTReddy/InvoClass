import React, { Component, useState, useEffect, useRef } from "react";
import TextField from '@material-ui/core/TextField';
import {Spinner, Form} from 'react-bootstrap';
import Button from '@material-ui/core/Button';
import { toast } from 'react-toastify';
import Utils from '../../../shared/Utils';
import axios from 'axios';
import CustomToast from '../../../shared/CustomToast.js'
import { reactAPIURL } from "../../../shared/General.js";
import Typography from '@material-ui/core/Typography';
import { pdfjs } from 'react-pdf';
import SinglePagePDFViewer from "../../../shared/pdf/single-page";
import MenuItem from '@material-ui/core/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
// import FileViewer from "react-file-viewer";
import VisibilityIcon from '@mui/icons-material/Visibility';

const Chapter = (function Chapter({step4Data, setStep4Data, stepData, newclass}) {
  const [chapterName, setChapterName] = useState('');
  const [fileName, setFileName] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [fileMain, setFileMain] = useState('');
  const [fileType, setFileType] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#F38A2C');
  const [refreshToken, setRefreshToken] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('#606060');
  const [user, setUser] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [role, setRole] = useState('');
  const [classId, setClassId] = useState();
  const [chapters, setChapters] = useState();
  const [chapterContentType, setChapterContentType] = useState('doc')
  const inputRef = useRef(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const url = pdfUrl
  pdfjs.GlobalWorkerOptions.workerSrc =
    `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

  useEffect(() => {
    //this is like our componentDidMount
    refreshToken && readClass();
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    var notifications = JSON.parse(localStorage.getItem('notifications'));
    if(userAuthDetails !== null && userDetails !== null){
      setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
      setUser(JSON.parse(userAuthDetails).user);
      setCustomerId(JSON.parse(userDetails).customer_id);
      setRole(JSON.parse(userDetails).role)
    }
    if(appearanceObject !== null){
      setPrimaryColor(JSON.parse(appearanceObject).primary_color);
      setSecondaryColor(JSON.parse(appearanceObject).secondary_color);
    }
  }, [refreshToken, user]);

  const readClass = () => {
    Utils.getCustomerClasses(user, role, customerId, refreshToken)
    .then((data) => {
      localStorage.setItem('classes', JSON.stringify(data));
    })
    .catch((error) => { throw error; })
  };

  /**
    * To get the pre signedURL(getObject) of the object from S3 bucket
  */
  const getS3SignedUrl = async(item, flag) => {
    // Utils.addinfoNotification("Opening material in a new tab...")
    if(flag === 'video')
      setPdfUrl('');
    else
      setVideoUrl('')
    await Utils.getS3SignedUrl(item, refreshToken)
    .then(data => {
      toast.dismiss();
      if(flag === 'doc')
        setPdfUrl(data);
      else if (flag === 'video')
        setVideoUrl(data);
      else
        window.open(data);
    })
    .catch(err => { throw err });
  };

  const handleAdd = async(e) => {
    e.preventDefault();
    if(!newclass){
      Utils.addinfoNotification("Uploading your material...")
      const directory = customerId + "/classes/" + stepData.classId + "/chapters/";
      Utils.putS3SignedUrl(refreshToken, [fileName], fileType, directory)
      .then(data => {
        data.map(async (item) =>{
          await classChapterToS3(item.url);
        })
      })
      .catch(err => { throw err });
    }
    const obj = {
      name: chapterName,
      id: Math.floor(100000 + Math.random() * 900000),
      posted: new Date(),
      file: customerId + "/classes/" + stepData.classId + "/chapters/" + fileName,
      type: chapterContentType,
      filename: fileName,
      filemain: fileMain,
      filetype: fileType
    };
    setStep4Data((prevData) => ({
      ...prevData,
      classChapters: [...prevData.classChapters, obj],
    }));
    setChapterName('');
    inputRef.current.value = null;
  }

  const classChapterToS3 = async(item) => {
    const options = { headers: { 'Content-Type': fileType } };
    const res = await axios.put(item ,fileMain ,options);
    if(res.status === 200 && res.statusText === "OK" && res.request.readyState === 4 ){
        classChapterToDb();
    }
    else{
      toast.dismiss();
      Utils.adderrorNotification('Error uploading the file. Please try again!');
      // this.setState({disabled: false})
    }
  };

  const classChapterToDb = () => {
    const values_merged = [
      {
        name: chapterName,
        id: Math.floor(100000 + Math.random() * 900000),
        posted: new Date(),
        file: customerId + "/classes/" + stepData.classId + "/chapters/" + fileName,
        type: chapterContentType
      }
    ]
    fetch(reactAPIURL + 'classcontenttodb', {
      method: 'post',
      headers:{
        'Content-type': fileType,
      },
      body:JSON.stringify({
        "refresh_token": refreshToken,
        "customer_id": customerId,
        "class_id": stepData.classId,
        "class_chapter": values_merged,
        "user": user,
        "type": "chapter"
      })
    })
    .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        toast.dismiss();
        if(responseJson.message === "success" && responseJson.statusCode === 200){
          Utils.addsuccessNotification(<CustomToast
            message = "Chapter added successfully"
            type = "response"
          />)
          readClass();
          setFileMain('')
        }else{
          Utils.adderrorNotification('Error creating chapter: ' + responseJson.errorMessage)
        }
      })
    .catch((error)=>{
      toast.dismiss();
      Utils.adderrorNotification('Error creating chapter: ' + error)
    });
  }

  const deleteClassChapter = async(item) => {
    if(!newclass){
      Utils.addinfoNotification("Deleting the chapter...");
      await Utils.deleteS3Object(item, refreshToken, stepData.classId, 'chapter')
      .then(data => {
        // console.log(data);
        toast.dismiss();
        if(data.message === 'success' && data.statusCode === 200){
          Utils.addsuccessNotification(<CustomToast
            message = "Chapter Deleted successfully"
            type = "response"
          />)
          readClass();
        }
      })
      .catch(err => { throw err });
    }
    setPdfUrl('');
    setVideoUrl('');
    const updatedChapters = [...step4Data.classChapters];
    const indexToDelete = updatedChapters.indexOf(item);
    updatedChapters.splice(indexToDelete, 1);
    // Update the step4Data object with the modified classChapters array
    setStep4Data((prevData) => ({
      ...prevData,
      classChapters: updatedChapters,
    }));
  }

  //file item onchange handler and assigns/sets the state accordingly
  const handleChange = (event) => {
    //here validation to accept only .docx and .pdf files
    if(event.target.files[0]){
      setFileName(event.target.files[0].name);
      setFileMain(event.target.files[0]);
      setFileType(event.target.files[0].type);
    }else{
      setFileName(''); setFileMain(''); setFileType('');
    }
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <div className="col-lg-12 grid-margin">
      {/*<div className='card-header'>Manage your class content here</div>*/}
      {role !== 'student' ?
        <form onSubmit = {handleAdd}>
          <div className="row">
            <div className="col-md-3">
              <Form.Group className="row">
                <div className="col-sm-12">
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    label="Chapter Name"
                    value={chapterName}
                    type='text'
                    required
                    onChange={evt => setChapterName(evt.target.value)}
                    autoFocus
                    inputRef={input => input && input.focus()}
                    InputProps={{style: {fontSize: 13}}}
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
                    select
                    label="Content Type"
                    value={chapterContentType}
                    onChange={evt => setChapterContentType(evt.target.value)}
                    required
                    variant="outlined"
                    InputProps={{style: {fontSize: 13}}}
                  >
                    <MenuItem value="doc">Document(Pdf, docx)</MenuItem>
                    <MenuItem value="video">Video(.mp4)</MenuItem>
                    <MenuItem value="audio">Audio</MenuItem>
                  </TextField>
                </div>
              </Form.Group>
            </div>
            <div className="col-md-6">
              <Form.Group className="row">
                <div className="col-sm-12">
                  <Form.Control
                    ref={inputRef}
                    type="file"
                    placeholder="Select a file to upload"
                    onChange={handleChange}
                    required
                    accept={chapterContentType === 'doc' ? ".pdf" : chapterContentType === 'video' ? ".mp4" : ".mp3" }
                    className="choose"
                  />
                </div>
              </Form.Group>
            </div>
          </div>
          <Button variant="contained"
                  type="submit"
                  color="primary"
                  size="small"
          >
            Add
          </Button>
        </form> : null
      }
      <div className="row">

          <div className="col-md-9">
            <div className="preview-block" style={{ height: '500px', overflow: 'auto' }}>
              {/*{url && <SinglePagePDFViewer pdf={url} style={{ width: '100%', height: '100%' }}/>}*/}
              {url && (
                <div style={{ maxHeight: '100%', overflow: 'auto' }}>
                  <SinglePagePDFViewer pdf={url} style={{ width: '100%' }} />
                </div>
              )}
              {videoUrl && (
                <video className="video-player" controls style={{ maxWidth: '100%', maxHeight: '100%' }}>
                  <source src={videoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>

          <div className="col-3">
             <div className="card-body" style={{ height: '500px', overflow: 'auto' }}>
               <div className="mb-3">
                  <h6 className="font-weight-bold">Class Content</h6>
               </div>
               <List>
                {
                  step4Data.classChapters.length > 0 ? step4Data.classChapters.map((chapter, index) => {
                    return(
                      <div key={index}>
                        <ListItem>
                          <ListItemText primary={chapter.name} />
                            <ListItemIcon>
                              <Tooltip title="View chapter">
                                <IconButton onClick={() => chapter.type=== 'doc' ? getS3SignedUrl(chapter, 'doc') : getS3SignedUrl(chapter , 'video')}>
                                  <VisibilityIcon/>
                               </IconButton>
                              </Tooltip>
                              <Tooltip title="Download chapter">
                               <IconButton onClick={() => getS3SignedUrl(chapter, 'download')}>
                                 <DownloadIcon/>
                               </IconButton>
                              </Tooltip>
                             {role !== 'student' ?
                               <Tooltip title="Delete chapter">
                                <IconButton onClick={() => deleteClassChapter(chapter)}>
                                 <DeleteIcon/>
                                </IconButton>
                               </Tooltip> : null
                             }
                            </ListItemIcon>
                        </ListItem>
                        <Divider/>
                      </div>
                    )
                  }) : <p> No chapters available to display.</p>
                }
                </List>
            </div>
        </div>

      </div>
    </div>
  );
});

export default Chapter;
