import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Slide, Button } from '@material-ui/core';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const ExportToD2LDialog = ({ open, data, cls, token, close }) => {

    const clientId = 'eb417d75-cf9d-4b91-9c78-707b396d7ff7';
    const redirectUri = 'https://react-api.omnifsi.com/dev/redirect_uri'; // Fixed URI registered with D2L

    const baseUrl = window.location.href;

    const handleAuthorize = () => {
        const d2lAuthorizationUrl = `https://auth.brightspace.com/oauth2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=core:*:*&state=${baseUrl}`;
        window.location.href = d2lAuthorizationUrl;
    };

    const handleClose = () => {
        // Remove the access token from the URL
        const url = new URL(window.location);
        url.searchParams.delete('access_token');
        window.history.replaceState({}, document.title, url.toString());

        close();
    };

    const handleExport = async () => {
        const exportResults = [];

        for (const student of data) {
            try {
              const [firstName, ...lastNameParts] = student.student_name.split(' ');
              const lastName = lastNameParts.join(' ');
              // Step 1: Check if the user already exists
              const userExistsUrl = `https://invoclass.d2l-partners.brightspace.com/d2l/api/lp/1.10/users/?search=${student.student_email}`;
              const userExistsResponse = await fetch(userExistsUrl, {
                  method: 'GET',
                  headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                  }
              });

              if (!userExistsResponse.ok) {
                  throw new Error('Failed to check if user exists');
              }

              const responseJson = await userExistsResponse.json();
              const users = responseJson.Items; // Extract Items array from the response

              let userId;

              const existingUser = users.find(user => user.ExternalEmail === student.student_email);
              if (existingUser) {
                  // User exists, get the userId
                  userId = existingUser.UserId;
                  exportResults.push(`User ${student.student_email} already exists. Skipping user creation.`);
              } else {
                  // Generate a unique OrgDefinedId using UUID
                  const orgDefinedId = uuidv4();
                  // Step 2: Create the user if not exists
                  const createUserUrl = `https://invoclass.d2l-partners.brightspace.com/d2l/api/lp/1.10/users/`;
                  const userData = {
                      OrgDefinedId: orgDefinedId,  // Unique identifier for your organization
                      FirstName: firstName,
                      MiddleName: '',
                      LastName: lastName,
                      ExternalEmail: student.student_email,
                      UserName: student.student_email.split('@')[0],
                      RoleId: 110,  // Correct Role ID for a student
                      IsActive: true,
                      SendCreationEmail: true  // Send an email with the login credentials
                  };

                  const createUserResponse = await fetch(createUserUrl, {
                      method: 'POST',
                      headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(userData)
                  });

                  if (!createUserResponse.ok) {
                      throw new Error('Failed to create user');
                  }

                  const createdUser = await createUserResponse.json();
                  userId = createdUser.UserId;

                  exportResults.push(`User ${student.student_email} created successfully.`);
              }

              // Step 3: Check if the user is already enrolled in the course
              const checkEnrollmentUrl = `https://invoclass.d2l-partners.brightspace.com/d2l/api/lp/1.10/enrollments/users/${userId}/orgUnits/${cls.class_d2l.data.Identifier}`;
              const checkEnrollmentResponse = await fetch(checkEnrollmentUrl, {
                  method: 'GET',
                  headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                  }
              });

              if (checkEnrollmentResponse.ok) {
                  const enrollmentInfo = await checkEnrollmentResponse.json();
                  if (enrollmentInfo.RoleId) {
                      exportResults.push(`User ${student.student_email} is already enrolled in the course. Skipping enrollment.`);
                      continue;
                  }
              }

              // Step 4: Enroll the user in the course
              const enrollUserUrl = `https://invoclass.d2l-partners.brightspace.com/d2l/api/lp/1.10/enrollments/`;
              const enrollmentData = {
                  OrgUnitId: cls.class_d2l.data.Identifier,
                  UserId: userId,
                  RoleId: 110  // Correct Role ID for a student
              };

              const enrollUserResponse = await fetch(enrollUserUrl, {
                  method: 'POST',
                  headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(enrollmentData)
              });

              if (!enrollUserResponse.ok) {
                  throw new Error('Failed to enroll user');
              }

              exportResults.push(`User ${student.student_email} enrolled successfully.`);
          } catch (error) {
              exportResults.push(`Error processing student ${student.student_email}: ${error.message}`);
              console.error('Error:', error);
          }
        }
        // Display a single toast notification summarizing the results
        const summary = exportResults.join('\n');
        toast.info(summary, { autoClose: false, closeOnClick: false });

        // Remove the selectedStudents item from localStorage after processing
        localStorage.removeItem("selectedStudents");
        handleClose();
    };

    return (
      <Dialog
          open={open}
          TransitionComponent={Transition}
          keepMounted
          onClose={handleClose}
          aria-labelledby="alert-dialog-slide-title"
          aria-describedby="alert-dialog-slide-description"
      >
          <DialogTitle id="alert-dialog-slide-title">Export Students to D2L</DialogTitle>
          <DialogContent>
              <DialogContentText id="alert-dialog-slide-description">
                {token === undefined ?
                  "Please authorize to export the selected student(s)" :
                  cls.class_d2l.isClassD2l ? "Are you sure you want to export the selected students to D2L?" :
                  "Export to D2L is not allowed as the class is not a D2L class."
                }
              </DialogContentText>
          </DialogContent>
          <DialogActions>
              <Button onClick={handleClose} color="primary">
                  Cancel
              </Button>
              {token === undefined ?
                <Button onClick={handleAuthorize} color="primary">
                    Authorize
                </Button> :
                cls.class_d2l.isClassD2l && (
                  <Button onClick={handleExport} color="primary">
                      Export
                  </Button>
                )
              }
          </DialogActions>
      </Dialog>
    );
};

export default ExportToD2LDialog;
