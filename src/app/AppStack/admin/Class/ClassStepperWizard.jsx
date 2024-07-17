import React, { useState, useEffect } from 'react';
import {
  Stepper, Step, StepLabel, Button, Paper, Typography, Tooltip
} from '@mui/material';
import { Spinner } from 'react-bootstrap';
import ClassOverview from './ClassOverview';
import ClassSchedule from './ClassSchedule';
import ClassPrice from './ClassPrice';
import ClassWork from './ClassWork';
import ClassReview from './ClassReview';
import ClassStudents from './Students';
import { styled as styled1 } from '@mui/material/styles';
import StepConnector, {
  stepConnectorClasses,
} from '@mui/material/StepConnector';
import PropTypes from 'prop-types';
import FeedIcon from '@mui/icons-material/Feed';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import PreviewIcon from '@mui/icons-material/Preview';
import empty_class from '../../../../assets/images/empty-class.jpg';
import { classSteps as steps , reactAPIURL, requiredFields, step1DefaultData,
        step2DefaultData, step3DefaultData, step4DefaultData,
        enrollURL, studentSteps, url } from '../../shared/General';
import { makeStyles } from '@mui/styles';
import CheckIcon from '@mui/icons-material/Check';
import SparkMD5 from 'spark-md5';
import CachedIcon from '@material-ui/icons/Cached';
import { useParams } from 'react-router-dom';
import StudentMachines from '../../student/StudentMachines'
import empty_image from "../../../../assets/images/dude_empty.png";
import Utils from '../../shared/Utils';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API, Storage } from 'aws-amplify';
import axios from 'axios'
import PolicyDialog from '../../shared/DialogBox/PolicyDialog'
import uniqid from 'uniqid';

const ClassStepperWizard = ({ data, success, newclass, active_step, token }) => {
  let { id } = useParams();
  var tmp, selectedTemp;
  if(id === 'create'){
    id = id
    tmp = null
    selectedTemp= {}
  }else {
    id = "class-" + id;
    var userClasses = JSON.parse(localStorage.getItem('classes') || "[]");
    userClasses.forEach((cls) => {
      if(cls.class_id === id)
        tmp = {...cls}
    })
    if(tmp === undefined)
      window.location.href = url + '/admin/classes/';
    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    userTemplates!== null && userTemplates.forEach((item, i) => {
      if(tmp.template.id === item.template_id)
        selectedTemp = {...item}
    });
  }

  const [classSel, setClassSel] = useState(tmp);
  const [activeStep, setActiveStep] = useState(active_step);
  const [skipped, setSkipped] = useState(new Set());
  const [step1Data, setStep1Data] = useState(step1DefaultData);
  const [step2Data, setStep2Data] = useState(step2DefaultData); // State to hold data for Step 2
  const [step3Data, setStep3Data] = useState(step3DefaultData); // State to hold data for Step 3
  const [step4Data, setStep4Data] = useState(step4DefaultData); // State to hold data for Step 4
  const [step5Data, setStep5Data] = useState({});
  const [canNavigate, setCanNavigate] = useState(true);
  const [refreshToken, setRefreshToken] = useState('');
  const [user, setUser] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [role, setRole] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [code] = useState(SparkMD5.hash('student-class-invite'));
  const [dataS, setDataS] = useState([]);
  const [loadedS, setLoadedS] = useState(true);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [openPolicy, setOpenPolicy] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  const useStyles = makeStyles((theme) => ({
    completedStep: {
      display: 'flex',
      alignItems: 'center',
    },
    checkIcon: {
      color: 'green',
    },
  }));

  const classes = useStyles();

  useEffect(() => {
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    if(userDetails !== null){
      setCustomerId(JSON.parse(userDetails).customer_id);
      setRole(JSON.parse(userDetails).role);
      setUserLastName(JSON.parse(userDetails).user_last_name);
      setUserFirstName(JSON.parse(userDetails).user_first_name);
    }
    if(userAuthDetails !== null){
      setUser(JSON.parse(userAuthDetails).user);
      setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
    }
    (!newclass && refreshToken) && readStudent();
  }, [refreshToken])


  useEffect(() => {
    if (!newclass && data!==null && data!==undefined) {
      setStep1Data({
        classId: data.class_id ,
        classBanner: data.class_banner,
        classLanguage: 'en-us',
        classTitle: data.class_name,
        classDescription: data.description,
        classTags: data.class_tags,
        classLevel: data.class_level,
        previewImage: null
      });
      setStep2Data({
        classType: data.class_type,
        classExclusive: data.class_exclusive,
        templateId: data.template.id,
        templateVersion: data.template.version,
        templateResource: data.template.resource_id,
        classEducators: data.class_educators,
        classStartDate: data.start_date,
        classEndDate: data.end_date,
        templateDetails: selectedTemp,
        classVideoConference: data.class_video,
        classActiveDays: data.class_days,
        classBuilds: data.class_builds,
        classPublish: data.class_publish,
        classRecurring: data.class_recurring,
        classD2l: data.class_d2l
      })
      setStep3Data({
        classPrice: data.class_price,
        classCoupons: data.class_coupons
      })
      setStep4Data({
        classAnnouncements: data.class_announcements,
        classMaterials: data.class_materials,
        classChapters: data.class_chapters
      })
      setStep5Data({
        env_vms: data.env_vms
      })
    }else {
      setStep1Data((prevData) => ({
        ...prevData,
        ['classId']: uniqid.time('class-'),
        ['classBanner']: null,
        ['previewImage']: null
      }));
      setStep2Data((prevData) => ({
        ...prevData,
        ['templateDetails']: {name: ''},
        ['classActiveDays']: [0, 1, 2, 3, 4, 5, 6],
        ['classRecurring']: {
          recurring: false,
          type: 'daily',
          startDayOfWeek: 0,
          repeatEventTypeValue: 1,
        }
      }));
      setStep3Data((prevData) => ({
        ...prevData,
        ['classPrice']: '',
        ['classCoupons']: []
      }));
      //for some reason not loading empty image
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      // Cancel the event
      event.preventDefault();
      // Chrome requires returnValue to be set
      event.returnValue = '';
      // Return the message to display in the confirmation dialog
      return 'you sure want to leave?';
    };

    if (newclass) {
      // Add the event listener when creating a new class
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    // Remove the event listener when the component unmounts
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []); // Empty dependency array to run the effect only once

  const readStudent = async() => {
    setLoadedS(false);
    await Utils.getCustomerStudents(refreshToken, customerId, role, user, step1Data.classId)
    .then(data => {
      // console.log(data);
      // var filteredStudents = data.filter((student) => student.class_id === step1Data.classId)
      setDataS(data); setLoadedS(true);
      // Put the array into storage
      localStorage.setItem('assignedStudents', JSON.stringify(data));
    })
    .catch(err => { throw err; });
  }

  const ColorlibStepIconRoot = styled1('div')(({ theme, ownerState }) => ({
    backgroundColor:
      theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
    zIndex: 1,
    color: '#fff',
    width: 30,
    height: 30,
    display: 'flex',
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
    ...(ownerState.active && {
      backgroundImage:
        'linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)',
        boxShadow: '0 2px 14px rgba(0, 0, 0, 0.6), 0 6px 16px rgba(0, 0, 0, 0.7)',
    }),
    ...(ownerState.completed && {
      backgroundImage:
        'linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)',
    }),
  }));

  function ColorlibStepIcon(props) {
    const { active, completed, className } = props;

    const icons = {
      1: <FeedIcon />,
      2: <ScheduleIcon />,
      3: <AttachMoneyIcon />,
      4: <ContentPasteIcon />,
      5: <PreviewIcon />,
    };

    return (
      <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
        {icons[String(props.icon)]}
      </ColorlibStepIconRoot>
    );
  }

  ColorlibStepIcon.propTypes = {
    active: PropTypes.bool,
    className: PropTypes.string,
    completed: PropTypes.bool,
    icon: PropTypes.node,
  };

  const isStepOptional = (step) => {
    return step === 1 || 2 || 3;
  };

  const isStepSkipped = (step) => {
    return skipped.has(step);
  };

  const handleNext = (e) => {
    e.preventDefault();

    const updatedSteps = [...steps];
    updatedSteps[activeStep].isCompleted = true;

    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }
    setActiveStep(activeStep + 1);
    localStorage.setItem('stepValue', JSON.stringify(activeStep + 1));
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
    localStorage.setItem('stepValue', JSON.stringify(activeStep - 1));
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      throw new Error("You can't skip a step that isn't optional.");
    }
    setActiveStep(activeStep + 1);
    localStorage.setItem('stepValue', JSON.stringify(activeStep + 1));
    const newSkipped = new Set(skipped.values());
    newSkipped.add(activeStep);
    setSkipped(newSkipped);
  };

  const isStepCompleted = (stepIndex) => {
    if (stepIndex === 0) {
      return requiredFields[0].every((field) => !!step1Data[field]);
    } else if (stepIndex === 1) {
      return requiredFields[1].every((field) => !!step2Data[field]);
    } else if (stepIndex === 2) {
      return requiredFields[2].every((field) => !!step3Data[field]);
    } else if (stepIndex === 3) {
      return requiredFields[3].every((field) => !!step4Data[field]);
    }
    return false;
  };

  const handleStepLabelClick = (stepIndex) => {
    const updatedSteps = [...steps];
    updatedSteps[stepIndex].isCompleted = true;
    setActiveStep(stepIndex);
    localStorage.setItem('stepValue', JSON.stringify(stepIndex));
  };

  const closePolicyDialog = () => {
    setOpenPolicy(false);
  }

  const handleFinish = () => {
    let missingFields = [];
    // Check if all required fields are completed for the current step and all previous steps
    const areAllStepsValid = Array.from({ length: 3 }).every((_, stepIndex) => {
        switch (stepIndex) {
            case 0:
                missingFields = requiredFields[0].filter((field) => !step1Data[field]);
                return missingFields.length === 0;
            case 1:
                missingFields = requiredFields[1].filter((field) => !step2Data[field]);
                return missingFields.length === 0;
            case 2:
                // Validate additional fields specific to step 3
                missingFields = requiredFields[2].filter((field) => !step3Data[field]);
                const isClassPriceValid =
                    parseFloat(step3Data['classPrice']) === 0 || parseFloat(step3Data['classPrice']) >= 10;
                return missingFields.length === 0 && isClassPriceValid;
        }
    });
    if (areAllStepsValid) {
        setOpenPolicy(true);
        // Perform final actions for finishing the process
        console.log('All required fields are completed for visited steps.');
        // class policy object with the read/agree status, time & user agreed
    } else {
        // Construct error message with missing fields
        const errorMessage =
            `The following fields are required: ${missingFields.join(', ')}. Please fill in and try again.`;
        // Display error message or perform any other action here
        Utils.adderrorNotification(errorMessage);
    }
  };


  const createClass = (publish) => {
    step2Data.classPublish = publish;
    const class_policy = {
      readStatus: true,
      user: user,
      time: new Date()
    };
    const stepData = {...step1Data, ...step2Data, ...step3Data, ...step4Data};
    Utils.addinfoNotification('Creating class...');
    setOpenPolicy(false);
    fetch(reactAPIURL + 'createclass', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            "user": user,
            "refresh_token": refreshToken,
            "entries": stepData,
            "class_policy": class_policy,
            "customer_id": customerId,
            "access_token": token
        })
    })
    .then((response) => response.json())
    .then(responseJson => {
        // console.log(responseJson);
        toast.dismiss();
        if (responseJson.message === "success" && responseJson.statusCode === 200) {
          //here we can put class in localStorage and redirect to classes page
          Utils.addsuccessNotification("Class created successfully, Initiating class server deployment.");
          // here lets upload banner image to s3 for now if exists
          step1Data.classBanner!== null && bannerImageToS3(stepData.classId);
          stepData.classMaterials.length > 0 && classMaterialToS3(stepData);
          stepData.classChapters.length > 0 && classChapterToS3(stepData);
          stepData.classCoupons.length > 0 && classCouponsToStripe(stepData);
          success();
        } else {
            Utils.adderrorNotification('Error creating the class: ' + responseJson.errorType + ': ' + responseJson.errorMessage)
        }
    })
    .catch((error) => {
      toast.dismiss();
      Utils.adderrorNotification('Error creating the class: ' + error)
    });
  }

  const bannerImageToS3 = async(class_id) => {
    const directory = customerId + "/" + 'classes' + "/" + class_id + "/";
    const key = [step1Data.imageName];
    await Utils.putS3SignedUrl(refreshToken, key, step1Data.imageType, directory)
    .then(data => {
      var i = 1;
      data.map(async (item) =>{
        const options = { headers: { 'Content-Type': step1Data.imageType } };
        const res = await axios.put(item.url, step1Data.imageFile, options);
        if(res.status === 200 && res.statusText === "OK" && res.request.readyState === 4 ){
          console.log('uploaded banner success');
        }
        else{
            Utils.adderrorNotification('Error uploading the banner. Please try again!');
        }
      })
    })
    .catch(err => { throw err });
  }

  const classMaterialToS3 = async(data) => {
    const directory = customerId + "/classes/" + data.classId + "/materials/";
    data.classMaterials.length> 0 && data.classMaterials.map(async (material) => {
      await Utils.putS3SignedUrl(refreshToken, [material.filename], material.filetype, directory)
      .then(data => {
        var i = 1;
        data.map(async (item) =>{
          const options = { headers: { 'Content-Type': material.filetype } };
          const res = await axios.put(item.url, material.filemain, options);
          if(res.status === 200 && res.statusText === "OK" && res.request.readyState === 4 ){
            console.log('material uploaded success');
          }
          else{
              Utils.adderrorNotification('Error uploading the material. Please try again!');
          }
        })
      })
      .catch(err => { throw err });
    })
  }

  const classChapterToS3 = async(data) => {
    const directory = customerId + "/classes/" + data.classId + "/chapters/";
    data.classChapters.length> 0 && data.classChapters.map(async (chapter) => {
      await Utils.putS3SignedUrl(refreshToken, [chapter.filename], chapter.filetype, directory)
      .then(data => {
        var i = 1;
        data.map(async (item) =>{
          const options = { headers: { 'Content-Type': chapter.filetype } };
          const res = await axios.put(item.url, chapter.filemain, options);
          if(res.status === 200 && res.statusText === "OK" && res.request.readyState === 4 ){
            console.log('chapter uploaded success');
          }
          else{
              Utils.adderrorNotification('Error uploading the chapter. Please try again!');
          }
        })
      })
      .catch(err => { throw err });
    })
  }

  const classCouponsToStripe = async(data) => {
    data.classCoupons.length> 0 && data.classCoupons.map(async (coupon) => {
      fetch(reactAPIURL + 'create-coupon', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          percent_off: coupon.percent_off,
          name: coupon.name,
          class_id: data.classId,
          max_redemptions: coupon.max_redemptions,
          redeemby_date: coupon.redeemby_date,
          id: coupon.id,
          type: newclass
        })
      })
      .then((response) => response.json())
      .then(async responseJson => {
        toast.dismiss();
        // console.log(responseJson);
        if(responseJson.statusCode === 200) {
          //lets store this coupons to class_coupons:
          console.log('Coupon created successfully');
        }else {
          console.log(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        console.log(error);
      });
    })
  }

  const handleUpdate = () => {
    const stepData = {...step1Data, ...step2Data, ...step3Data, ...step4Data};
    Utils.addinfoNotification('Updating class details...');
    fetch(reactAPIURL + 'updateclass', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            "user": user,
            "refresh_token": refreshToken,
            "entries": stepData,
            "customer_id": customerId
        })
    })
    .then((response) => response.json())
    .then(responseJson => {
        // console.log(responseJson);
        toast.dismiss();
        if (responseJson.message === "success" && responseJson.statusCode === 200) {
          //here we can put class in localStorage and redirect to classes page
          Utils.addsuccessNotification("Class updated successfully");
          // here lets upload banner image to s3 for now if exists
          step1Data.classBanner!== null && bannerImageToS3(step1Data.classId);
          // success();
        } else {
            Utils.adderrorNotification('Error updating the class: ' + responseJson.errorType + ': ' + responseJson.errorMessage)
        }
    })
    .catch((error) => {
      toast.dismiss();
      Utils.adderrorNotification('Error updating the class: ' + error)
    });
  }

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ flex: '0.5' }}>
        {/*{role !== 'student' && (<>*/}
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => {
              const stepProps = {};
              const labelProps = {};
              if (isStepOptional(index)) {
                labelProps.optional = <Typography variant="caption"></Typography>;
              }
              if (isStepSkipped(index)) {
                stepProps.completed = false;
              }

              const areRequiredFieldsFilled = isStepCompleted(index);

              const stepLabel =
                index !== 4 ? step.label : newclass ? step.label
                  : 'Students'  // Change this to your dynamic label text
              return (
                <Step key={index} {...stepProps} completed={areRequiredFieldsFilled}>
                  <StepLabel
                    StepIconComponent={ColorlibStepIcon}
                    // onClick={() => setActiveStep(index)}
                    onClick={() => handleStepLabelClick(index)} // Attach click handler
                    style={{ cursor: 'pointer', padding: '8px' }}
                    {...labelProps}
                  >
                    {step.isCompleted ? (
                      <div className={classes.completedStep}>
                        {stepLabel}
                        {areRequiredFieldsFilled ? (
                          <CheckIcon className={classes.checkIcon} />
                        ) : (
                          <div style={{ width: '24px' }} />
                        )}
                      </div>
                    ) : (
                      stepLabel
                    )}
                    {index === 3 && <span style={{ marginLeft: '0.5em', color: 'gray' }}>(Optional)</span>}
                  </StepLabel>
                </Step>
              );
            })}
          </Stepper>
          {role !== 'student' && (<>
          <div style={{ margin: '1rem' }}>
            {activeStep > 0 && (
              <Button disabled={activeStep === 0} onClick={handleBack}>
                Back
              </Button>
            )}
            {activeStep < steps.length - 1 && (
              <Button color="primary" onClick={handleNext}>
                Next
              </Button>
            )}
            {newclass ? <>
              {activeStep === steps.length - 1 && (
                <Button variant="contained" color="primary"
                  onClick={handleFinish}>
                  Finish
                </Button>
              )}</> :
              <Button variant="contained" color="primary"
                onClick={handleUpdate}>
                Update
              </Button>
            }
          </div> </>)}
      </div>
      {/*{role !== 'student' && (*/}
        <div style={{ flex: '3', padding: '1rem' }}>
          <Paper elevation={3} className="custom-paper" style={{ padding: '1rem' }}>
            {activeStep === 0 && (
              <ClassOverview
                step1Data={step1Data}
                setStep1Data={setStep1Data}
                newclass={newclass}
              />
            )}
            {activeStep === 1 && (
              <ClassSchedule
                step2Data={step2Data}
                setStep2Data={setStep2Data}
                newclass={newclass}
              />
            )}
            {activeStep === 2 && (
              <ClassPrice
                step3Data={step3Data}
                setStep3Data={setStep3Data}
                stepData={{ ...step1Data, ...step2Data, ...step3Data, ...step4Data }}
                newclass={newclass}
              />
            )}
            {activeStep === 3 && (
              <ClassWork
                step4Data={step4Data}
                setStep4Data={setStep4Data}
                stepData={{ ...step1Data, ...step2Data, ...step3Data, ...step4Data }}
                newclass={newclass}

              />
            )}
            {activeStep === 4 ? newclass ?
              <ClassReview
                step1Data={step1Data}
                step2Data={step2Data}
                step3Data={step3Data}
                step4Data={step4Data}
                stepData={{ ...step1Data, ...step2Data, ...step3Data, ...step4Data }}
                setStep5Data={setStep5Data}
                handleNext={handleNext}
              />
            : role !== 'student' ? <ClassStudents
                step5Data={step5Data}
                setStep5Data={setStep5Data}
                class={{ ...step1Data, ...step2Data, ...step3Data, ...step4Data, ...step5Data }}
              /> :
              <StudentMachines
               items={dataS}
               read={readStudent}
              /> : null
            }
          </Paper>
          {/*A dialog box to display the policies when a class is created*/}
          {openPolicy && (
            <PolicyDialog dashboard="class"
              open={openPolicy}
              close={closePolicyDialog}
              create={createClass}
              data={{ ...step1Data, ...step2Data, ...step3Data, ...step4Data }}
            />
          )}
        </div>
      {/*)}*/}
    </div>
  );
};

export default ClassStepperWizard;
