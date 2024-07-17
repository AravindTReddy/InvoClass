import React, { useState, memo, useEffect } from 'react';
import { Button, Slide, Dialog, DialogTitle, DialogActions,
  DialogContent, DialogContentText, TextField, Grid, IconButton } from '@mui/material';
import Rating from '@mui/material/Rating';
import Box from '@mui/material/Box';
import StarIcon from '@mui/icons-material/Star';
import Typography from '@mui/material/Typography';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Utils from '../Utils'
import {reactAPIURL} from '../General';
import CloseIcon from '@mui/icons-material/Close';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const labels = {
  0.5: 'Useless',
  1: 'Useless+',
  1.5: 'Poor',
  2: 'Poor+',
  2.5: 'Ok',
  3: 'Ok+',
  3.5: 'Good',
  4: 'Good+',
  4.5: 'Excellent',
  5: 'Excellent+',
};

function getLabelText(value) {
  return `${value} Star${value !== 1 ? 's' : ''}, ${labels[value]}`;
}

const RatingDialog = ({ open, data, close, rated}) => {

  const [rating, setRating] = useState(0);
  const [hover, setHover] = React.useState(-1);
  const [ratingPublicComments, setRatingPublicComments] = useState('');
  const [ratingPrivateComments, setRatingPrivateComments] = useState('');
  const [currentScreen, setCurrentScreen] = useState(0);
  const [explanationsClear, setExplanationsClear] = useState('');
  const [instructorsDelivery, setInstructorsDelivery] = useState('');
  const [courseExpectations, setCourseExpectations] = useState('');
  const [instructorKnowledge, setInstructorKnowledge] = useState('');
  const [studentId, setStudentId] = useState('');
  const [user, setUser] = useState('');
  const [role, setRole] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  useEffect(() => {
    if(rated)
      setCurrentScreen(9);
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    if(userDetails !== null){
      setCustomerId(JSON.parse(userDetails).customer_id);
      setRole(JSON.parse(userDetails).role);
    }
    if(userAuthDetails !== null){
      setUser(JSON.parse(userAuthDetails).user);
      setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
    }
    if(data !== null && data !== undefined){
      setStudentId(data.student_id);
      if(data.student_rating !== undefined){
        const studentRating = data.student_rating;
        setRatingPublicComments(studentRating.public_comment);
        setRatingPrivateComments(studentRating.private_comment);
        setRating(studentRating.rating);
        setExplanationsClear(studentRating.additonal_comments.course_expectations);
        setInstructorsDelivery(studentRating.additonal_comments.explanations_clear);
        setCourseExpectations(studentRating.additonal_comments.instructors_delivery);
        setInstructorKnowledge(studentRating.additonal_comments.instructor_knowledge);
      }
    }
  }, [refreshToken])

  const handleRatingChange = (newValue) => {
    setRating(newValue);
    setCurrentScreen(1);
  };

  const handleRatingHover = (newValue) => {
    setHover(newValue);
  };

  const handleRatingLeave = () => {
    setHover(-1);
  };

  const submitRating = () => {
    // Here you can submit the rating to your backend or take any other action
    console.log('Submitted Rating:', rating);
  };

  const handleClose = () => {
    if(rated){
      //Do nothing
    }else {
      setRating(0);
      setRatingPublicComments('');
      setRatingPrivateComments('');
    }
    setCurrentScreen(0);
    close();
  }

  const handleSaveContinue = () => {
    if(rating > 0){
      if(currentScreen === 3){
        //handle save review to db
        //build a new rating object for student side of things
        const student_rating = {
          rating: rating,
          public_comment: ratingPublicComments,
          private_comment: ratingPrivateComments,
          additonal_comments: {
            explanations_clear: explanationsClear,
            instructors_delivery: instructorsDelivery,
            course_expectations: courseExpectations,
            instructor_knowledge: instructorKnowledge
          }
        }
        //fetch call to post this to student-details-table
        fetch(reactAPIURL + 'updatestudent', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json',
            },
            body: JSON.stringify({
                "refresh_token": refreshToken,
                "student_id": studentId,
                "request": "rating",
                "student_rating": student_rating,
            })
        })
        .then((response) => response.json())
        .then(responseJson => {
          // console.log(responseJson);
          if (responseJson.message === "success" && responseJson.statusCode === 200) {
              Utils.addsuccessNotification('Student rating posted and will be live in 24 hours')
              //assignedStudents
          } else {
              Utils.adderrorNotification('Error posting student rating: ' + responseJson.errorMessage)
          }
        })
        .catch((error) => {
          Utils.adderrorNotification('Error posting student rating: ' + error);
        });
        close();
        // we have to update the class-details table as well
        fetch(reactAPIURL + 'updateclass', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json',
            },
            body: JSON.stringify({
                "refresh_token": refreshToken,
                "class_id": data.class_id,
                "request": "updateClassRating",
                "student_rating": student_rating
            })
        })
        .then((response) => response.json())
        .then(responseJson => {
          // console.log(responseJson);
          if (responseJson.message === "success" && responseJson.statusCode === 200) {
            //here we can put class in localStorage and redirect to classes page
            // Utils.addsuccessNotification("Class updated successfully");
          } else {
              Utils.adderrorNotification('Error updating the class: ' + responseJson.errorType + ': ' + responseJson.errorMessage)
          }
        })
        .catch((error) => {
          // toast.dismiss();
          Utils.adderrorNotification('Error updating the class: ' + error)
        });
      }else {
        setCurrentScreen(currentScreen + 1);
      }
    }else {
      alert('Please select a rating to proceed.')
    }

  }

  const handleBack = () => {
    setCurrentScreen(currentScreen - 1);
  }

  const handlePublicCommentsChange = (event) => {
    const inputText = event.target.value;
    // Limit the input to 40 words
    const limitedText = inputText.split(/\s+/).slice(0, 40).join(' ');
    setRatingPublicComments(limitedText);
  };

  const handlePrivateCommentsChange = (event) => {
    const inputText = event.target.value;
    // Limit the input to 40 words
    const limitedText = inputText.split(/\s+/).slice(0, 40).join(' ');
    setRatingPrivateComments(limitedText);
  };

  const handleExplanationsClearChange = (event) => {
    setExplanationsClear(event.target.value);
    // Add any other logic you need for this specific RadioGroup
  };

  const handleInstructorsDeliveryChange = (event) => {
    setInstructorsDelivery(event.target.value);
    // Add any other logic you need for this specific RadioGroup
  };

  const handleCourseExpectationsChange = (event) => {
    setCourseExpectations(event.target.value);
    // Add any other logic you need for this specific RadioGroup
  };

  const handleInstructorKnowledgeChange = (event) => {
    setInstructorKnowledge(event.target.value);
    // Add any other logic you need for this specific RadioGroup
  };

  const editReview = () => {
    setCurrentScreen(0);
  }

  const deleteReview = () => {
    //handle delete review
    Utils.addinfoNotification('Removing the rating...');
    fetch(reactAPIURL + 'updatestudent', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            "refresh_token": refreshToken,
            "student_id": studentId,
            "request": "deleteRating"
        })
    })
    .then((response) => response.json())
    .then(responseJson => {
        // console.log(responseJson);
        if (responseJson.message === "success" && responseJson.statusCode === 200) {
          Utils.addsuccessNotification("Rating deleted successfully");
        } else {
            Utils.adderrorNotification('Error deleting the rating: ' + responseJson.errorType + ': ' + responseJson.errorMessage)
        }
    })
    .catch((error) => {
      Utils.adderrorNotification('Error deleting the rating: ' + error)
    });
    close();
    fetch(reactAPIURL + 'updateclass', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            "refresh_token": refreshToken,
            "class_id": data.class_id,
            "request": "deleteClassRating",
            "student_rating":  {
              rating: rating,
              public_comment: ratingPublicComments,
              private_comment: ratingPrivateComments,
              additonal_comments: {
                explanations_clear: explanationsClear,
                instructors_delivery: instructorsDelivery,
                course_expectations: courseExpectations,
                instructor_knowledge: instructorKnowledge
              }
            }
        })
    })
    .then((response) => response.json())
    .then(responseJson => {
      // console.log(responseJson);
      if (responseJson.message === "success" && responseJson.statusCode === 200) {
        //here we can put class in localStorage and redirect to classes page
        // Utils.addsuccessNotification("Class updated successfully");
      } else {
          Utils.adderrorNotification('Error updating the class: ' + responseJson.errorType + ': ' + responseJson.errorMessage)
      }
    })
    .catch((error) => {
      // toast.dismiss();
      Utils.adderrorNotification('Error updating the class: ' + error)
    });
  }

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClose}
      aria-labelledby="alert-dialog-slide-title"
      aria-describedby="alert-dialog-slide-description"
      style={{zIndex: 100000}}
      PaperProps={{ style: { width: '100%', textAlign: 'center' } }}
      maxWidth="sm"
    >
      <Box
        display="flex"
        flexDirection="column"
      >
        <DialogTitle id="alert-dialog-slide-title">
          {(currentScreen > 1 && currentScreen != 9) ?
            <div className="back-button">
              <Button onClick={() => handleBack()}>&larr; Back {' '}</Button><br/>
            </div> : null
          }
          {currentScreen === 9 ? (
            <Typography variant="h6" fontWeight="bold">
              Your review
            </Typography>
          ) : currentScreen <= 1 ? (
            <Typography variant="h6" fontWeight="bold">
              How would you rate this class?
            </Typography>
          ) : currentScreen === 2 ? (
            <Typography variant="h6" fontWeight="bold">
              Please tell us more (Optional)
            </Typography>
          ) :
            <Typography variant="h6" fontWeight="bold">
              Once submitted your review will be public within 24 hours.
                <Typography variant="body1" fontWeight="bold">
                  Thanks for taking the time and ating the class
                </Typography>
            </Typography>
          }
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            style={{ position: 'absolute', top: 0, right: 12 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
          <DialogContent>
            {currentScreen === 9 && (
              <div style={{ width: '100%' }}>
                {Utils.renderStars(rating)}<br />
                {ratingPublicComments !== '' ? ratingPublicComments : "There are no written comments for your review."}
              </div>
            )}
            {currentScreen <= 1 && (<>
              <DialogContentText id="alert-dialog-slide-description">
                <Typography variant="body1" style={{ fontSize: '14px' }}>
                  Select Rating
                </Typography>
              </DialogContentText>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Rating
                      name="hover-feedback"
                      value={rating}
                      precision={0.5}
                      getLabelText={getLabelText}
                      onChange={(event, newValue) => handleRatingChange(newValue)}
                      onChangeActive={(event, newHover) => handleRatingHover(newHover)}
                      onMouseLeave={handleRatingLeave}
                      emptyIcon={<StarIcon style={{ fontSize: 36, opacity: 0.55 }} />}
                      icon={<StarIcon style={{ fontSize: 36 }} />}
                      style={{ width: 'auto', display: 'inline-block' }}
                    />
                    {rating !== null && (
                      <Box><Typography variant="h6" fontWeight="bold">
                        {labels[hover !== -1 ? hover : rating]}
                      </Typography></Box>
                    )}
                  </Grid>
                  <Grid item xs={12}>
                    {(currentScreen === 1 || rated) && (
                      <TextField
                        // label="Tell us about your own experience taking this class. Was it a good match?"
                        label="(Optional)If you would like to leave a public comment about your experience taking this class, leave it here!"
                        multiline
                        margin="normal"
                        InputLabelProps={{style: {fontSize: 14}}}
                        rows={4}
                        fullWidth
                        value={ratingPublicComments}
                        onChange={handlePublicCommentsChange}
                        helperText={`${ratingPublicComments && ratingPublicComments.split(/\s+/).length} word(s) out of 40`}
                      />
                    )}
                  </Grid>
                </Grid>
                </>)}
                <Grid container spacing={2}>
                 <Grid item xs={12}>
                  {currentScreen === 2 && (
                    <>
                    <div style={{ textAlign: 'left' }}>
                      <TextField
                        // label="Tell us about your own experience taking this class. Was it a good match?"
                        label="If you would like to leave a private comment for your instructor about your experience taking this class, leave it here!"
                        multiline
                        margin="normal"
                        InputLabelProps={{style: {fontSize: 14}}}
                        rows={4}
                        fullWidth
                        value={ratingPrivateComments}
                        onChange={handlePrivateCommentsChange}
                        helperText={`${ratingPrivateComments && ratingPrivateComments.split(/\s+/).length} word(s) out of 40`}
                      />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <FormControl>
                        <FormLabel id="demo-row-radio-buttons-group-label">Are the explanations of concepts clear? {' '}</FormLabel>
                        <RadioGroup
                          row
                          aria-labelledby="demo-row-radio-buttons-group-label"
                          name="row-radio-buttons-group"
                          value={explanationsClear}
                          onChange={handleExplanationsClearChange}
                        >
                          <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                          <FormControlLabel value="no" control={<Radio />} label="No" />
                          <FormControlLabel value="notsure" control={<Radio />} label="Not sure" />
                        </RadioGroup>
                      </FormControl>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <FormControl>
                        <FormLabel id="demo-row-radio-buttons-group-label">Is the instructor's delivery engaging?</FormLabel>
                        <RadioGroup
                          row
                          aria-labelledby="demo-row-radio-buttons-group-label"
                          name="row-radio-buttons-group"
                          value={instructorsDelivery}
                          onChange={handleInstructorsDeliveryChange}
                        >
                          <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                          <FormControlLabel value="no" control={<Radio />} label="No" />
                          <FormControlLabel value="notsure" control={<Radio />} label="Not sure" />
                        </RadioGroup>
                      </FormControl>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <FormControl>
                        <FormLabel id="demo-row-radio-buttons-group-label">Is the course delivering on your expectations?</FormLabel>
                        <RadioGroup
                          row
                          aria-labelledby="demo-row-radio-buttons-group-label"
                          name="row-radio-buttons-group"
                          value={courseExpectations}
                          onChange={handleCourseExpectationsChange}
                        >
                          <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                          <FormControlLabel value="no" control={<Radio />} label="No" />
                          <FormControlLabel value="notsure" control={<Radio />} label="Not sure" />
                        </RadioGroup>
                      </FormControl>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <FormControl>
                        <FormLabel id="demo-row-radio-buttons-group-label">Is the instructor knowledgeable about the topic?</FormLabel>
                        <RadioGroup
                          row
                          aria-labelledby="demo-row-radio-buttons-group-label"
                          name="row-radio-buttons-group"
                          value={instructorKnowledge}
                          onChange={handleInstructorKnowledgeChange}
                        >
                          <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                          <FormControlLabel value="no" control={<Radio />} label="No" />
                          <FormControlLabel value="notsure" control={<Radio />} label="Not sure" />
                        </RadioGroup>
                      </FormControl>
                    </div>
                  </>
                )}
                </Grid>
              </Grid>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  {currentScreen === 3 && (
                    <>
                      <hr />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <div style={{ width: '30%' }}>
                          {user}
                        </div>
                        <div style={{ width: '70%' }}>
                          {Utils.renderStars(rating)}<br />
                          {ratingPublicComments !== '' ? ratingPublicComments : "There are no written comments for your review."}
                        </div>
                      </div>
                    </>
                  )}
                </Grid>
              </Grid>
          </DialogContent>
        </Box>
        <DialogActions>
          {currentScreen === 9 && (
            <Button size="small" variant="contained" onClick={deleteReview}>
                Delete
            </Button>
          )}
          <Button size="small" variant="contained" onClick={currentScreen === 9 ? editReview : handleSaveContinue}>
              {currentScreen >= 0 && currentScreen <= 2 ? "Continue" :
                currentScreen === 9 ? "Edit review" : "Submit and Exit"}
          </Button>
        </DialogActions>
    </Dialog>
  )
};
export default RatingDialog;
