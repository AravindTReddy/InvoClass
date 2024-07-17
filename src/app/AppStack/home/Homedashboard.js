import React, { useState, useEffect } from 'react';
import { getAppInsights } from '../shared/TelemetryService';
import TelemetryProvider from '../shared/telemetry-provider.jsx';
import {ThemeProvider, createTheme} from '@material-ui/core/styles';
import Utils from '../shared/Utils';
import {Spinner} from "react-bootstrap";
import MaterialTable from 'material-table';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { socketUrl, homeTableOptions, enrollURL, reactAPIURL } from "../shared/General.js";
import { w3cwebsocket as W3CWebSocket } from "websocket";
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import SparkMD5 from 'spark-md5';
import Tooltip from '@material-ui/core/Tooltip';
import CustomTooltip from './customTooltip';

/* eslint-disable no-useless-escape */

const Homedashboard = () => {
  const [primaryColor, setPrimaryColor] = useState('#F38A2C');
  const [secondaryColor, setSecondaryColor] = useState('#606060')
  const [refreshToken, setRefreshToken] = useState('');
  const [user, setUser] = useState(null);
  const [customerId, setCustomerId] = useState('');
  const [role, setRole] = useState('');
  const [templates, setTemplates] = useState([]);
  const [loadedTemplates, setLoadedTemplates] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loadedClasses, setLoadedClasses] = useState(false);
  const [students, setStudents] = useState([]);
  const [loadedStudents, setLoadedStudents] = useState(false);
  const [users, setUsers] = useState([]);
  const [studentUsers, setStudentUsers] = useState([]);
  const [loadedUsers, setLoadedUsers] = useState(false);
  const [customerDetails, setCustomerDetails] = useState([]);
  const [loadedCustomerDetails, setLoadedCustomerDetails] = useState(false);
  const [tooltipOpenArray, setTooltipOpenArray] = useState(Array().fill(false));
  const [code] = useState(SparkMD5.hash('student-class-invite'));
  const [instructors, setInstructors] = useState();
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  useEffect(() => {
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    var userClasses = JSON.parse(localStorage.getItem('classes'));
    var customerDetails = JSON.parse(localStorage.getItem('customerDetails'));
    var userInstructors = JSON.parse(localStorage.getItem('instructors'));
    var students = JSON.parse(localStorage.getItem('assignedStudents'));
    var studentUsers = JSON.parse(localStorage.getItem('students'));
    var subStatus = JSON.parse(localStorage.getItem('subscriptionStatus'));
    subStatus !== null && setSubscriptionStatus(subStatus);
    userAuthDetails !== null && setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
    appearanceObject !== null && setPrimaryColor(JSON.parse(appearanceObject).primary_color);
    appearanceObject !== null && setSecondaryColor(JSON.parse(appearanceObject).secondary_color);
    userAuthDetails !== null && setUser(JSON.parse(userAuthDetails).user);
    if(userDetails !== null){
      setCustomerId(JSON.parse(userDetails).customer_id);
      setRole(JSON.parse(userDetails).role);
      setUserLastName(JSON.parse(userDetails).user_last_name);
      setUserFirstName(JSON.parse(userDetails).user_first_name);
    }
    userTemplates !== null && setTemplates(userTemplates)
    setLoadedTemplates(true);
    userClasses !== null && setClasses(userClasses);
    setLoadedClasses(true);
    refreshToken && userClasses !== null && setTooltipOpenArray(Array(userClasses.length).fill(false));
    customerDetails !== null && setCustomerDetails(customerDetails);
    setLoadedCustomerDetails(true);
    studentUsers !== null && setStudentUsers(studentUsers);
    students !== null && setStudents(students);
    userInstructors !== null && setInstructors(userInstructors);
    setLoadedStudents(true);
    refreshToken && readCustomer();
    refreshToken && readTemplate();
    refreshToken && readClass();
    refreshToken && readUser();
    refreshToken && readStudent();
    // / Check if the customerDetails array is not empty before iterating
    if (customerDetails && customerDetails.length > 0) {
      // Iterate through the array and call the function for each customer
      (refreshToken && role === 'customer_admin') && customerDetails.forEach(turnOnServerIfDefinedAndOffline);
      if(customerDetails.length === 1 && customerDetails[0].customer_plan && customerDetails[0].customer_plan.sub_id){
        readCustomerSubscription(customerDetails[0].customer_plan);
      }else {
        //when there is no subscription id associated - make the value null
        localStorage.setItem('subscriptionStatus', JSON.stringify(null));
      }
    } else {
      console.log("The customerDetails array is empty.");
    }
    triggerInvo();

  }, [user, refreshToken]);

  const triggerInvo = () => {
    console.log('inside trigger invo');
    fetch('https://azure-api.invoclass.com/stop_vm', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
          'stop_lab_password': "stop_all_azure_machines",
          // 'start_lab_password': "start_all_azure_machines",
          'vm_name': "gsc-22237",
        })
    })
    .then((response) => response.json())
    .then(responseJson => {
      console.log(responseJson);
      if(responseJson.message === "success" && responseJson.statusCode === 200){
        console.log('successfully started');
      }else{
        console.log('error starting');
      }
    })
    .catch((error) => {
      console.log('error starting' + error);
    });
  }

  // Function to turn on the server if vm_status is defined and offline
  const turnOnServerIfDefinedAndOffline = (customer) => {
    if (customer && customer.vm_status !== undefined && customer.vm_status === "offline") {
      // Turn on the server logic goes here
      const newObj = {
        'vm_name': customer.vm_name,
        'customer_id': customer.customer_id
      }
      Utils.startVM([newObj])
      .then(data => {
        if(data.message === 'success'){
          readCustomer();
          //here we update the customer details in localStorage
          const newArr = [...customerDetails]
          newArr.find(v => v.customer_id === customer.customer_id).vm_status = 'online';
          setCustomerDetails(newArr);
          localStorage.setItem('customerDetails', JSON.stringify(newArr));
        }
      })
      .catch(err => { throw err });
      // console.log(`Server for customer ${customer.customer_id} is turned on.`);
    }
  }

  const readCustomerSubscription = (plan) => {
    fetch(reactAPIURL + 'payment', {
      method: 'post',
      headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json',
      },
      body: JSON.stringify({
        'type': 'readsubscription',
        'subscription_id': plan.sub_id, // Pass coupon code to the backend
      })
    })
    .then((response) => response.json())
    .then(async responseJson => {
      // console.log(responseJson.result);
      const subscriptionData = responseJson.result;
      if(subscriptionData!== undefined && !(Object.keys(subscriptionData).length === 0)){
        const { status } = subscriptionData;
        localStorage.setItem('subscriptionStatus', JSON.stringify(status));
        setSubscriptionStatus(status);
      }
    })
    .catch((error) => {
      console.error('Error fetching trial status:', error);
    });
  }

  const readCustomer = () => {
    Utils.getCustomerDetails(refreshToken, customerId, role)
    .then(data => {
      setCustomerDetails(data);
      setLoadedCustomerDetails(true);
      localStorage.setItem('customerDetails', JSON.stringify(data));
    })
    .catch(err => { throw err; });
  }

  const readTemplate = () => {
    setLoadedTemplates(false);
    Utils.getCustomerTemplates(refreshToken, user, customerId, role)
    .then(data => {
      setTemplates(data);
      setLoadedTemplates(true);
      localStorage.setItem('templates', JSON.stringify(data));
    })
    .catch(err => { throw err; });
  }

  const readClass = () => {
    setLoadedClasses(false);
    Utils.getCustomerClasses(user, role, customerId, refreshToken)
    .then((data) => {
      setClasses(data);
      setLoadedClasses(true);
      localStorage.setItem('classes', JSON.stringify(data));
    })
    .catch((error) => { throw error; })
  };

  const readUser = () => {
    setLoadedUsers(false);
    Utils.getCustomerUsers(user, role, customerId, refreshToken)
    .then(data => {
      setUsers(data);
      setLoadedUsers(true);
      localStorage.setItem('users', JSON.stringify(data));
    })
    .catch(err => { throw err; });
  }

  const readStudent = () => {
    setLoadedStudents(false);
    Utils.getCustomerStudents(refreshToken, customerId, role, user, 'default')
    .then(data => {
      var dataS = [];
      data.map((item) => {
        if(item.instructor_email !== item.student_email){
          dataS.push(item);
        }
      });
      setStudents(dataS);
      setLoadedStudents(true);
      localStorage.setItem('assignedStudents', JSON.stringify(dataS));
    })
    .catch(err => { throw err; });
  }

  useEffect(() => {
    if(user){
      const client = new W3CWebSocket(socketUrl +'?email=' + user);
      client.onopen = () => {
          // console.log('WebSocket Client Connected');
      };
      client.onmessage = (message) => {
          Utils.addsuccessNotification(message.data);
          if(message.data){
            //need class_id or related to update localStorage
            //or with a flag indicating which deployment might work here
            //based on that will call the readClass or readStudent and this will
            //automatically update localStorage
          }
      };
    }
  }, [user])

  const theme = createTheme({
    palette: {
      // type: "dark",
      primary: {
          main: primaryColor,
      },
      secondary: {
          main: secondaryColor,
      },
    },
  });
  const Item = styled(Paper)(({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }));

  const handleCopyClick = (class_id) => {
    // Perform the copy action here (e.g., using document.execCommand or Clipboard API)
    const copyText = `${enrollURL}?id=${class_id}&&tkn=${code}`;
    // Use the Clipboard API to copy the text to the clipboard
    navigator.clipboard.writeText(copyText)
      .then(() => {
        // The text has been successfully copied
        // console.log('Text copied to clipboard:', copyText);
      })
      .catch((err) => {
        // Handle any errors that may occur while copying
        console.error('Error copying text to clipboard:', err);
      });
  };

  let appInsights = null;

  // Update email key to email_address for each instructor
  const updatedInstructors = instructors && instructors.map(instructor => {
      // Destructure the instructor object and rename the email key to email_address
      const { email: email_address, ...rest } = instructor;
      return { ...rest, email_address };
  });

  const allUsers = studentUsers.concat(instructors || []);

  return (
    <TelemetryProvider instrumentationKey="7696784d-3192-42a6-891e-1f8ca728cfae" after={() => { appInsights = getAppInsights() }}>
      <ThemeProvider theme={theme}>
        {subscriptionStatus === 'trialing' || subscriptionStatus === 'active' || subscriptionStatus === null ? (
        <>
          {role!== "student" ?
            <Box sx={{ flexGrow: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Item>
                  {/*Table 1*/}
                  <MaterialTable
                    title={
                      <div className="custom-table-title">Classes</div> /* Use the custom CSS class for the table title */
                    }
                    localization={{ body:{ emptyDataSourceMessage:
                      <>
                        {loadedClasses ? 'No records to display' :
                          <div style={{color:primaryColor}} className="d-flex justify-content-center">
                            <Spinner  animation="border" role="status">
                                <span className="sr-only">Loading...</span>
                            </Spinner>
                          </div>
                         }
                      </>
                    } }}
                    columns={[
                        {title: 'Name', field: 'class_name',
                          render: rowData => {
                            const id = rowData.class_id.split('-')[1]
                            const newTo = {
                              pathname: `/admin/classes/class/${id}`,
                              state: { data: rowData }
                            };
                            return(<>
                              <Link to={newTo}>{rowData.class_name}</Link>
                            </>)
                          }
                        },
                        {title: 'Educator(s)', field: 'class_educators',
                          render: rowData => (
                            rowData.class_educators.map((educatorEmail, index) => {
                              const matchingInstructor = instructors && instructors.find(
                                (instructor) => instructor.email === educatorEmail
                              );

                              return matchingInstructor ? (
                                <span key={index}>
                                  {/*<a href={`mailto:${matchingInstructor.email}`}>*/}
                                    {matchingInstructor.name}
                                  {/*</a>*/}
                                  {index < rowData.class_educators.length - 1 && ", "}
                                </span>
                              ) : null;
                            })
                          )
                        },
                        {title: 'Students', field: 'student_count',
                          render: rowData => {
                            return(<>
                              {rowData.student_count}{' '}
                              <CustomTooltip
                                title="Link Copied To Clipboard"
                                onClick={() => handleCopyClick(rowData.class_id)}
                              />
                            </>)
                          }
                        },
                        {
                            title: 'Dates',
                            field: 'start_date',
                            render: rowData => {
                                const s_date = moment(rowData.start_date).format('DD/MM/YYYY');
                                const e_date = moment(rowData.end_date).format('DD/MM/YYYY');
                                return s_date + ' - ' + e_date
                            },
                        },
                        {
                            title: 'Hours',
                            field: 'end_date',
                            render: rowData => {
                                const s_date = moment(rowData.start_date).format('HH:mma');
                                const e_date = moment(rowData.end_date).format('HH:mma');
                                return s_date + ' - ' + e_date
                            },
                        },
                        {title: 'Server', field: 'vm_status', hidden: true,
                          render: rowData => {
                            return(
                              <span className={rowData.vm_status === 'online' ? "badge badge-pill badge-success" :
                                               rowData.vm_status === 'offline' && rowData.guac_server_url === 'pending' ?
                                               "badge badge-pill badge-warning" : "badge badge-pill badge-danger"}>
                                 {rowData.vm_status !== undefined ? rowData.vm_status === 'online' ? 'Running' :
                                   rowData.vm_status === 'offline' && rowData.guac_server_url === 'pending' ?
                                   'Creating...' : 'Stopped' : "Not available"}
                              </span>
                            )
                          }
                        },
                        {
                            title: 'Created',
                            field: 'vm_created_time',
                            hidden:true,
                            render: rowData => {
                                const c_date = moment(rowData.created_ts * 1000).format('MMMM DD, YYYY');
                                return c_date
                            },
                        }
                    ]}
                    data={classes}
                    options={homeTableOptions}
                  />
                  </Item>
                </Grid>
                <Grid item xs={6}>
                  <Item>
                  {/*Table 2*/}
                  <MaterialTable
                    title={
                      <div className="custom-table-title">Lab Templates</div> /* Use the custom CSS class for the table title */
                    }
                    localization={{ body:{ emptyDataSourceMessage:
                      <>
                        {loadedTemplates ? 'No records to display' :
                          <div style={{color:primaryColor}} className="d-flex justify-content-center">
                            <Spinner  animation="border" role="status">
                                <span className="sr-only">Loading...</span>
                            </Spinner>
                          </div>
                         }
                      </>
                    } }}
                    columns={[
                        {title: 'Name', field: 'name',
                          render: rowData => {
                            const id = rowData.template_id.split('-')[1]
                            const newTo = {
                              pathname: `/admin/templates/${id}`,
                              state: { customer: customerDetails }
                            };
                            return(
                              <Link to={newTo}>{rowData.name}</Link>
                            )
                          }
                        },
                        {title: 'Type', field: 'type'},
                        {title: 'Sub Networks', field: 'subnets',
                          render: rowData => {
                            return(
                              rowData.type === 'network' ? rowData.network.length : 'N/A'
                            )
                          }
                        },
                        {title: 'Machines', field: 'machines',
                          render: rowData => {
                            let i = 0;
                            rowData.type === 'network' && rowData.network.map(item=>{
                            	i+=item.machines.length
                            })
                            return i
                          }
                        },
                        {
                            title: 'Created',
                            field: 'vm_created_time',
                            editable: 'never',
                            render: rowData => {
                                const c_date = moment(rowData.created_ts * 1000).format('MMM-DD-YYYY HH:mm A');
                                return c_date
                            },
                        }
                    ]}
                    data={templates}
                    options={homeTableOptions}
                  />
                  </Item>
                </Grid>
                <Grid item xs={6}>
                  <Item>
                  {/*Table 3*/}
                  <MaterialTable
                    title={
                      <div className="custom-table-title">Enrolled Students</div> /* Use the custom CSS class for the table title */
                    }
                    localization={{ body:{ emptyDataSourceMessage:
                      <>
                        {loadedStudents ? 'No records to display' :
                          <div style={{color:primaryColor}} className="d-flex justify-content-center">
                            <Spinner  animation="border" role="status">
                                <span className="sr-only">Loading...</span>
                            </Spinner>
                          </div>
                         }
                      </>
                    } }}
                    columns={[
                      {title: 'Name', field: 'student_name',
                        render: rowData => {
                          const matchingStudent = allUsers && allUsers.find(
                            (student) => {
                              return (student.email_address || student.email) === rowData.student_email;
                            }
                          );

                          return (
                            <span>
                              {matchingStudent && (
                                <Tooltip title="Class educator">
                                  <span style={{color: 'green'}}>
                                    {matchingStudent.name ? matchingStudent.name :
                                      (matchingStudent.student_fname && matchingStudent.student_lname) ?
                                        matchingStudent.student_fname + matchingStudent.student_lname : 'Name not found'}
                                  </span>
                                </Tooltip>
                              )}
                            </span>
                          );
                        }
                      },
                      {title: 'Email', field: 'student_email'},
                      // {title: 'Class', field: 'class_name'},
                      {title: 'Class', field: 'class_name',
                        render: rowData => {
                          const matchingClass = classes && classes.find(
                            (cls) => cls.class_id === rowData.class_id
                          );
                            return (
                              <span>
                              {matchingClass ? matchingClass.class_name : null}
                              </span>
                            )
                        }
                      },
                      {
                          title: 'Enrolled on',
                          field: 'updated_ts',
                          render: rowData => {
                              const c_date = moment(rowData.updated_ts * 1000).format('MMM-DD-YYYY HH:mm A');
                              return c_date
                          },
                      }
                    ]}
                    data={students}
                    options={homeTableOptions}
                  />
                  </Item>
                </Grid>
                <Grid item xs={6}>
                  <Item>
                  {/*Table 4*/}
                  <MaterialTable
                    title={
                      <div className="custom-table-title">Business Synopsis</div> /* Use the custom CSS class for the table title */
                    }
                    localization={{ body:{ emptyDataSourceMessage:
                      <>
                        {loadedClasses ? 'No records to display' :
                          <div style={{color:primaryColor}} className="d-flex justify-content-center">
                            <Spinner  animation="border" role="status">
                                <span className="sr-only">Loading...</span>
                            </Spinner>
                          </div>
                         }
                      </>
                    } }}
                    columns={[
                      {title: 'Name', field: 'name',
                        render: rowData => {
                          return(
                            rowData.user_first_name + ' ' + rowData.user_last_name
                          )
                        }
                      },
                      {title: 'Email', field: 'user_email'},
                      {title: 'Role', field: 'user_role'}
                    ]}
                    data={[]}
                    options={homeTableOptions}
                  />
                  </Item>
                </Grid>
              </Grid>
            </Box> : "Access Denied" }
          </>
        ) : (
          <>
            <p>You do not have an active subscription. Please subscribe to continue using InvoClass.</p>
            <Link
              to={{
                pathname: '/user/my-account',
              }}
              style={{textDecoration: 'none'}}
            >
            <button>Membership</button>
            </Link>
          </>
        )}
      </ThemeProvider>
    </TelemetryProvider>
  );
}
export default Homedashboard
