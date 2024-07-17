import React, { memo, useEffect, useState } from 'react';
import moment from 'moment';
import MenuItem from '@material-ui/core/MenuItem';
import TextField from '@material-ui/core/TextField';
import { Form } from 'react-bootstrap';
import Announcement from './Classwork/Announcement'
import Material from './Classwork/Material'
import Chapter from './Classwork/Chapter'
import AnnouncementIcon from '@material-ui/icons/Announcement';
import AssignmentIcon from '@material-ui/icons/Assignment';

const ClassWork = memo(function ClassWork({ step4Data, setStep4Data, stepData, newclass }) {
  const [classes, setClasses] = useState([]);
  const [openMenu, setOpenMenu] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [primaryColor, setPrimaryColor] = useState('#F38A2C');
  const [refreshToken, setRefreshToken] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('#606060');
  const [user, setUser] = useState('');
  const [role, setRole] = useState('');
  const [customerId, setCustomerId] = useState('');
  const storedCurriculumType = localStorage.getItem('curriculumType');
  const defaultCurriculumType = ''; // Set your default value here if needed

  const [curriculumType, setCurriculumType] = useState(
    storedCurriculumType ? JSON.parse(storedCurriculumType) : defaultCurriculumType
  );

  useEffect(() => {
    //read from localStorage here
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    var userInstructors = JSON.parse(localStorage.getItem('instructors'));
        // console.log(userInstructors);
    var userClasses = JSON.parse(localStorage.getItem('classes'));
    var notifications = JSON.parse(localStorage.getItem('notifications'));
    var userTemplates = JSON.parse(localStorage.getItem('templates'));

    if(userDetails !== null){
      setCustomerId(JSON.parse(userDetails).customer_id);
      setRole(JSON.parse(userDetails).role);
    }
    if(appearanceObject !== null){
      setPrimaryColor(JSON.parse(appearanceObject).primary_color);
      setSecondaryColor(JSON.parse(appearanceObject).secondary_color);
    }
    if(userAuthDetails !== null){
      setUser(JSON.parse(userAuthDetails).user);
      setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
    }
    var userClasses = JSON.parse(localStorage.getItem('classes'));
    userClasses.length > 0 && setClasses(userClasses);
  }, [])

  //curriculum_type dropdown onchange handler function to update state
  const handleCurriculumChange = (event) => {
    setCurriculumType(event.target.value);
    localStorage.setItem('curriculumType', JSON.stringify(event.target.value));
  }


  return (
    <div className="d-flex justify-content-center">
      <div className="col-lg-12 grid-margin">
        {/*<div className='card-header'>Manage your class content here</div>*/}
        <div className="row">
            <div className="col-md-6">
              <Form.Group className="row">
                <div className="col-sm-12">
                  <TextField
                    fullWidth
                    size="small"
                    select
                    label={role === 'student' ? "View" : "Create/View"}
                    value={curriculumType}
                    onChange={handleCurriculumChange}
                    required
                    helperText="please select an option"
                    InputProps={{style: {fontSize: 12}}}
                    variant="outlined"
                  >
                    <MenuItem value="">Select</MenuItem>
                    <MenuItem value="announcement">Announcement</MenuItem>
                    <MenuItem value="chapter">Chapter</MenuItem>
                    <MenuItem value="material">Material</MenuItem>
                  </TextField>
                </div>
              </Form.Group>
            </div>
          </div>
          <div className="row">
            {curriculumType === '' ?
              <>
                <div className="col-lg-6 grid-margin"></div>
                <div className="col-lg-4 grid-margin">
                  <div className="card">
                    <div className="card-body">
                      <div className="col-md-12">
                        <Form.Group className="row">
                          <div className="col-sm-12">
                            <AnnouncementIcon/><p>{role === 'student' ? 'View and follow up with announcements'
                            : 'Communicate with your class by posting announcements' }</p>
                          </div>
                          <div className="col-sm-12">
                            <AssignmentIcon/><p>{role === 'student' ? 'View chapters and materials'
                            : 'Create chapters and materials' }</p>
                          </div>
                        </Form.Group>
                      </div>
                    </div>
                  </div>
                </div>
              </> : null
            }
            {curriculumType === "announcement" ?
               <Announcement
                step4Data={step4Data}
                setStep4Data={setStep4Data}
                stepData={stepData}
                newclass={newclass}/> : null
            }
            {curriculumType === "material" ?
               <Material
                step4Data={step4Data}
                setStep4Data={setStep4Data}
                stepData={stepData}
                newclass={newclass} /> : null
            }
            {curriculumType === "chapter" ?
               <Chapter
                step4Data={step4Data}
                setStep4Data={setStep4Data}
                stepData={stepData}
                newclass={newclass}/> : null
            }
        </div>
      </div>
    </div>
  );
});
export default ClassWork
