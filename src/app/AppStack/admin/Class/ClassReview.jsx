import React from 'react';
import { Grid, Paper, Typography, Button, CardMedia } from '@mui/material';
import empty_class from "../../../../assets/images/empty-class.jpg";

const ClassReview = ({ step1Data, step2Data, step3Data, step4Data }) => {
  // console.log({ ...step1Data, ...step2Data, ...step3Data, ...step4Data });  
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h5">Review Your Class Information</Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h6">Step 1: Class Overview</Typography>
          <Typography variant="body2">
            <strong>Title:</strong> {step1Data.classTitle}
          </Typography>
          <Typography variant="body2">
            <strong>Description:</strong> {step1Data.classDescription}
          </Typography>
          <Typography variant="body2">
            <strong>Language:</strong> {step1Data.classLanguage}
          </Typography>
          <Typography variant="body2">
            <strong>Class Description:</strong> {step1Data.classTags && step1Data.classTags.map((tag, index) => {
                return(
                  <li key={index}>{tag}</li>
                )
            })}
          </Typography>
          <Typography variant="body2">
            <strong>Class Level:</strong> {step1Data.classLevel}
          </Typography>
          <Typography variant="body2">
            <strong>Class Banner:</strong> <CardMedia
              height={80}
              component="img"
              alt="Preview"
              image={step1Data.previewImage!== null ? step1Data.previewImage : empty_class}
            />
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h6">Step 2: Class Schedule</Typography>
          <Typography variant="body2">
            <strong>Lab Template:</strong> {step2Data.templateDetails.name}
          </Typography>
          <Typography variant="body2">
            <strong>Type:</strong> {step2Data.classType}
          </Typography>
          <Typography variant="body2">
            <strong>Educators:</strong> {step2Data.classEducators.length >0 && step2Data.classEducators.map((item, index) => {
                return(
                  <li key={index}>{item}</li>
                )
            })}
          </Typography>
          <Typography variant="body2">
            <strong>Dates:</strong> {step2Data.classStartDate.toLocaleString()} { ' - ' } {step2Data.classEndDate.toLocaleString()}
          </Typography>
          <Typography variant="body2">
            <strong>Time:</strong> {step2Data.classStartDate.toLocaleString()} { ' - ' } {step2Data.classEndDate.toLocaleString()}
          </Typography>
          <Typography variant="body2">
            <strong>Days:</strong> {step2Data.classActiveDays.length >0 && step2Data.classActiveDays.map((item, index) => {
                return(
                  <li key={index}>{item}</li>
                )
            })}
          </Typography>
          <Typography variant="body2">
            <strong>Video Conference:</strong> {step2Data.classVideoConference}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h6">Step 3: Class Price</Typography>
          <Typography variant="body2">
            <strong>Price:</strong> {step3Data.classPrice}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper elevation={3} style={{ padding: '20px' }}>
          <Typography variant="h6">Step 4: Additional Information</Typography>
          {/* Add step 4 data here */}
        </Paper>
      </Grid>


    </Grid>
  );
};

export default ClassReview;
