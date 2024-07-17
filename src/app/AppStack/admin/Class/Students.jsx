import React, { useState, useEffect } from "react";
import {
  Grid,
  IconButton, Slide,
  Tooltip, DialogContentText,
  Button, DialogActions, DialogContent,
  Switch, Dialog, DialogTitle,
  FormControlLabel
} from "@mui/material";
import {Spinner} from 'react-bootstrap';
import Utils from '../../shared/Utils';
import { reactAPIURL, backendAPIURL, stgName, socketUrl, url } from "../../shared/General.js";
import { toast } from 'react-toastify';
import AddIcon from "@material-ui/icons/Add";
import LaunchIcon from "@material-ui/icons/Launch";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@material-ui/icons/Replay";
import StopIcon from "@material-ui/icons/Stop";
import DeleteIcon from "@mui/icons-material/Delete";
import ScreenSearchDesktopIcon from "@mui/icons-material/ScreenSearchDesktop";
import CustomToast from "../../shared/CustomToast.js";
import MaterialTable, {MTableToolbar} from 'material-table';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import moment from "moment";
import SparkMD5 from "spark-md5";
import Environment from "./Environment";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import CachedIcon from '@material-ui/icons/Cached';
import { useParams, useLocation } from 'react-router-dom';
import MailIcon from '@mui/icons-material/Mail';
import EmailDialog from '../../shared/DialogBox/EmailDialog';
import ImportExportIcon from '@mui/icons-material/ImportExport';
import ExportToD2LDialog from '../../shared/DialogBox/ExportToD2LDialog';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Utility function to get query parameters from URL
const getQueryParams = (queryString) => {
  const params = new URLSearchParams(queryString);
  let queryParams = {};
  for (let [key, value] of params.entries()) {
    queryParams[key] = value;
  }
  return queryParams;
};

const Students = (props) => {
  const location = useLocation();
  let { id } = useParams();
  var tmp;
  if(id === 'create'){
    id = id
    tmp = {}
  }else {
    id = "class-" + id;
    var userClasses = JSON.parse(localStorage.getItem('classes') || "[]");
    userClasses.forEach((cls) => {
      if(cls.class_id === id)
        tmp = {...cls}
    })
  }
  if(tmp === undefined)
    window.location.href = url + '/admin/classes/';
  const [classId, setClassId] = useState(id);
  const [class_name, setClassName] = useState(
    props.class !== undefined ? props.class.classTitle : ""
  );

  var selectedStudents = JSON.parse(localStorage.getItem("selectedStudents")) || [];
  const [classSel, setClassSel] = useState(tmp);
  const [students, setStudents] = useState([]);
  const [loadedStudents, setLoadedStudents] = useState(false);
  const [csvload, setCsvLoad] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#F38A2C");
  const [secondaryColor, setSecondaryColor] = useState("#606060");
  const [key, setKey] = useState(false);
  const [scheduled_students, setScheduledStudents] = useState(true);
  const [studentList, setStudentList] = useState([]);
  const [selectedStudentRows, setSelectedStudentRows] = useState(selectedStudents);
  const [type, setType] = useState(
    tmp.template_type
  );
  const [deleteType, setDeleteType] = useState("");
  const [dataS, setDataS] = useState([]);
  const [loadedS, setLoadedS] = useState(false);
  const [loadedClasses, setLoadedClasses] = useState(false);
  const [code, setCode] = useState(SparkMD5.hash("student-class-invite"));
  const [openIframe, setOpenIframe] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");
  const [editorVisible, setEditorVisible] = useState(false);
  // const [templateType, setTemplateType] = useState(
  //   props.class !== undefined ? props.class.templateDetails.type : "network"
  // );

  const [refreshToken, setRefreshToken] = useState('');
  const [user, setUser] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [role, setRole] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [openExportDialog, setOpenExportDialog] = useState(false);

  useEffect(() => {
    var appearanceObject = localStorage.getItem("appearanceObject");
    var userAuthDetails = localStorage.getItem("userAuthDetails");
    var userDetails = localStorage.getItem("userDetails");
    refreshToken && readStudent();
    var userClasses = JSON.parse(localStorage.getItem('classes'));
    // var students = JSON.parse(localStorage.getItem("students"));
    var assignedStudents = JSON.parse(localStorage.getItem("assignedStudents"));

    if (
      appearanceObject !== null &&
      userAuthDetails !== null &&
      userDetails !== null
    ) {
      setPrimaryColor(JSON.parse(appearanceObject).primary_color);
      setLoadedStudents(true);

      const appearance = JSON.parse(appearanceObject);
      const authDetails = JSON.parse(userAuthDetails);
      userDetails = JSON.parse(userDetails);

      setPrimaryColor(appearance.primary_color);
      setUser(authDetails.user);
      setRefreshToken(authDetails.refresh_token);
      // setIdToken(authDetails.id_token);
      setRole(userDetails.role);
      setCustomerId(userDetails.customer_id);
      setUserFirstName(userDetails.user_first_name);
      setUserLastName(userDetails.user_last_name);
      setDataS(assignedStudents !== null && assignedStudents);
      setLoadedS(true);
    }
  }, [refreshToken, user, openExportDialog]);

  useEffect(() => {
    if(user){
      const client = new W3CWebSocket(socketUrl + '?email=' + user);
      client.onopen = () => {
          // console.log('WebSocket Client Connected');
      };
      client.onmessage = (message) => {
          toast.dismiss();
          readStudent();
          if(message.data){
            // readStudent();
          }
      };
      // returned function will be called on component unmount
    }
  }, [user])

  useEffect(() => {
        // Trigger re-render when URL changes
        setOpenExportDialog(!shouldShowCreateClassDialog);
    }, [location.search]);

  const readStudent = async () => {
    // setLoadedS(false); setDataS([]);
    var dataS = [];
    await Utils.getCustomerStudents(refreshToken, customerId, role, user, classId)
    .then(data => {
      // console.log(data);
      setDataS(data); setLoadedS(true);
      setSelectedStudentRows([]);
      // Put the array into storage
      localStorage.setItem('assignedStudents', JSON.stringify(data));
    })
    .catch(err => { throw err; });
  }

  const createStudent = async (e) => {
    e.preventDefault();
    // await this.setState({disabled: true});
    const items = await studentList.map((item) => {
      item.class_name = class_name;
      item.class_id = classId;
      return item;
    });
    Utils.addinfoNotification('Adding student...');
    fetch(reactAPIURL + 'createstudent', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
            // 'Authorization': id_token
        },
        body: JSON.stringify({
            "refresh_token": refreshToken,
            "entries": items,
            "user": user,
            "customer_id": customerId,
            "class_name": class_name
        })
    })
    .then((response) => response.json())
    .then(responseJson => {
      // console.log(responseJson);
      toast.dismiss();
      setStudentList([]); setSelectedStudentRows([]);
      setKey(!key);

      if (responseJson.message === "success" && responseJson.statusCode === 200) {
          Utils.addsuccessNotification('Student data added successfully');
          readStudent();
          // add student into students array. automatic assignedStudents will be generated
      }else if (responseJson.statusCode === 300) {
          Utils.adderrorNotification('Error adding the student data: ' + responseJson.message);
          // this.readStudent();
      }else {
          Utils.adderrorNotification('Error adding the student data: ' + responseJson.errorMessage)
      }
    })
    .catch((error) => {
      toast.dismiss();
      Utils.adderrorNotification('Error adding the student data: ' + error)
      // this.setState({disabled: false})
    });
  }

  const deleteStudent = async (rowData) => {
    setOpen(false);
    // const filteredStudents = rowData.filter(student => {
    //   const role = student.student_role.toLowerCase();
    //   return role !== "customer_admin" && role !== "instructor";
    // });
    // await this.setState({disabled: true, open: false});
    Utils.addinfoNotification('Deleting student(s)...');
    fetch(reactAPIURL + 'deletestudent', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
            // 'Authorization': id_token
        },
        body: JSON.stringify({
            "user": user,
            "refresh_token": refreshToken,
            "entries": rowData
        })
    })
    .then((response) => response.json())
    .then(responseJson => {
      toast.dismiss();
      setSelectedStudentRows([]);
      // this.setState({disabled: false, selectedStudentRows: []});
      if (responseJson.message === "success" && responseJson.statusCode === 200) {
          Utils.addsuccessNotification('Student data deleted successfully');
          readStudent();
          // delete only from assignedStudents
      } else {
          Utils.adderrorNotification('Error deleting student data: ' + responseJson.errorMessage);
      }
    })
    .catch((error) => {
      toast.dismiss();
      // this.setState({disabled: false});
      Utils.adderrorNotification('Error deleting student data: ' + error)
    });
  };

  const deleteStudentVM = async (rowData) => {
    setOpen(false);
    Utils.addinfoNotification('Deleting student(s) VM...');
    fetch(reactAPIURL + 'deleteactivestudent', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            "user": user,
            "refresh_token": refreshToken,
            "entries": rowData //array
        })
    })
    .then((response) => response.json())
    .then(responseJson => {
      // console.log(responseJson);
      toast.dismiss();
      setSelectedStudentRows([]);
      readStudent();
      if (responseJson.message === "success" && responseJson.statusCode === 200) {
          Utils.addsuccessNotification('Student(s) VM deleted successfully');
      } else if(responseJson.message === "Endpoint request timed out"){
          Utils.addsuccessNotification('Student(s) VM will be deleted soon');
      }else {
        throw responseJson.errorMessage;
      }
    })
    .catch((error) => {
      toast.dismiss();
      // this.setState({disabled: false});
      Utils.adderrorNotification('Error deleting students VM: ' + error)
    });
    setTimeout(() => {
      readStudent();
    }, 3000)
  };

  const updateStudent = async (item1, item2) => {
    fetch(reactAPIURL + 'updatestudent', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
            // 'Authorization': id_token
        },
        body: JSON.stringify({
            "student_id": item1.student_id,
            "customer_id": item1.customer_id,
            "refresh_token": refreshToken,
            "student_email_new": item1.student_email.toLowerCase(),
            "student_email_old": item2.student_email.toLowerCase(),
        })
    })
    .then((response) => response.json())
    .then(responseJson => {
      // console.log(responseJson);
      if (responseJson.message === "success" && responseJson.statusCode === 200) {
          Utils.addsuccessNotification('Student data updated successfully')
          readStudent();
          //assignedStudents
      } else {
          Utils.adderrorNotification('Error updating the student data: ' + responseJson.errorMessage)
      }
    })
    .catch((error) => {
      Utils.adderrorNotification('Error editing student data: ' + error)
    });
  }

  const createStudentVM = async (rowData) => {
    // Class server status validation
    const items = rowData.filter(function (obj) {
      return obj.class_vm_status === 'offline'
    })
    if(items.length === 0){
      //here we validate students with already deployed VM
      const studentsWithVM = rowData.filter(student => 'vm_status' in student && 'vm_name' in student);
      const studentsWithoutVM = rowData.filter(student => !('vm_status' in student) || !('vm_name' in student));
      Utils.addinfoNotification(<CustomToast
        message = "Deploying student VM(s)"
        type = "request"
      />)
      studentsWithoutVM.length > 0 && studentsWithoutVM.forEach(entry => {
        fetch(backendAPIURL + 'deploy_student_vm', {
        // fetch('http://areddy-cloud9.omnifsi.com:5000/deploy_student_vm', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json',
                // 'Authorization': id_token
            },
            body: JSON.stringify({
                "secret_password": "start_student_server_qw3$t&YWS",
                'student_id': entry.student_id,
                'stg': stgName,
                'user': user,
                'request': 'default',
                'resource_id': 'not applicable here'
            })
        })
        .then((response) => response.json())
        .then(responseJson => {
          // console.log(responseJson);
          toast.dismiss();
          // this.setState({disabled: false});
          readStudent();
          if (responseJson.statusCode === 500) {
              Utils.adderrorNotification(responseJson.message);
          } else if (responseJson.statusCode === 200) {
              Utils.addsuccessNotification(<CustomToast
                message = "Successfully created VM"
                type = "response"
              />)
          } else if (responseJson.statusCode === 300) {
              Utils.adderrorNotification(responseJson.message);
          } else if (responseJson.message === "Endpoint request timed out") {
              Utils.addsuccessNotification('Hang tight, the student VM will be up soon!')
          } else {
              Utils.adderrorNotification('Error activating the lab: ' + responseJson.errorMessage)
          }
        })
        .catch((error) => {
          toast.dismiss();
          Utils.addsuccessNotification('Hang tight, the student lab will be up soon!')
          // Utils.adderrorNotification('Error activating student lab: ' + error)
          // this.setState({disabled: false})
        });
      })
    }else {
      Utils.adderrorNotification('Looks like the class server is in stopped state. Please start the class server and try again.');
    }
    setTimeout(() => {
      readStudent();
    }, 2000)
  }

  const launchStudentVM = async (item) => {
    // if (item[0].vm_status !== 'online' || item[0].class_vm_status !== 'online') {
    // bring this validation back after Phil's class
    if (item[0].vm_status !== 'online') {
        toast.dismiss();
        Utils.adderrorNotification('VM is in stopped state, Please start the VM and try again later!')
    } else {
      Utils.addinfoNotification(<CustomToast
        message = "Launching student VM"
        type = "request"
      />)
      await Utils.getGuacToken(item[0], refreshToken, 'instructor')
      .then(data => {
        // console.log(data);
        toast.dismiss();
        window.open(data, "_blank")
      })
      .catch(err => {
        // console.log(err);
        Utils.adderrorNotification('Error launching the machine, Please try again.');
      });
    }
  }

  const getGuacDetails = async (item) => {
    // this.setState({openIframe: true});
    Utils.addinfoNotification('processing the request...')
    fetch(reactAPIURL + 'getguacdetails', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        "details": item,
      })
    })
    .then((response) => response.json())
    .then(responseJson => {
      // console.log(responseJson);
      toast.dismiss();
      if(responseJson.statusCode === 200){
        // window.open(responseJson.body, "_blank")
        setOpenIframe(true); setIframeUrl(responseJson.body)
      }else if (responseJson.statusCode === 300 || 500) {
        // console.log(responseJson);
        //Do nothing
        //may be a reload
        Utils.addinfoNotification(responseJson.message)
        // this.setState({openIframe: true, iframeUrl: responseJson.body})
      }else{
        Utils.adderrorNotification(responseJson);
      }
    })
    .catch((error) => {
      Utils.adderrorNotification(error);
    });
  }

  const startStudentVM = async (items) => {
    const newItems = await items.map((item) => {
      return({
        'vm_name': item.vm_name,
        'student_id': item.student_id
      })
    })
    Utils.addinfoNotification(<CustomToast
      message = "Starting machine(s)"
      type = "request"
    />)
    await Utils.startVM(newItems)
    .then(data => {
      if(data.message === 'success'){
        readStudent();
        Utils.addsuccessNotification(<CustomToast
          message = "Successfully started machine(s)"
          type = "response"
        />)
      }
    })
   .catch(err => {
      toast.dismiss();
      if(err.statusCode === 500){
        Utils.adderrorNotification("No VM deployed yet")
      }else {
        Utils.addinfoNotification('Hang tight! Still working on starting the machine(s)')
      }
      throw err
    });
  };

  const restartStudentVM = async (items) => {
    const newItems = await items.map((item) => {
      return({
        'vm_name': item.vm_name,
        'student_id': item.student_id
      })
    })
    Utils.addinfoNotification(<CustomToast
      message = "Restarting machine(s)"
      type = "request"
    />)
    await Utils.restartVM(newItems)
    .then(data => {
      if(data.message === 'success'){
        readStudent();
        Utils.addsuccessNotification(<CustomToast
          message = "Successfully restarted machine(s)"
          type = "response"
        />)
      }
    })
   .catch(err => {
     toast.dismiss();
     if(err.statusCode === 500){
       Utils.adderrorNotification("No VM deployed yet")
     }else {
       Utils.addinfoNotification('Hang tight! Still working on restarting the machine(s)')
     }
     throw err
    });
  };

  const stopStudentVM = async (items) => {
    const newItems = await items.map((item) => {
      return({
        'vm_name': item.vm_name,
        'student_id': item.student_id
      })
    })
    Utils.addinfoNotification(<CustomToast
      message = "Stopping machine"
      type = "request"
    />)
    await Utils.stopVM(newItems)
    .then(data => {
      if(data.message === 'success'){
        readStudent();
        Utils.addsuccessNotification(<CustomToast
          message = "Successfully stopped machine"
          type = "response"
        />)
      }
    })
    .catch(err => {
      toast.dismiss();
      if(err.statusCode === 500){
        Utils.adderrorNotification("No VM deployed yet")
      }else {
        Utils.addinfoNotification('Hang tight! Still working on stopping the machine(s)')
      }
      throw err
     });
  };

  const deleteAlert = async(rowData) => {
    setOpen(true);
    // await this.setState({open: true});
    if(rowData === 'vm'){
      setDeleteType('vm')
    }else {
      setDeleteType('student')
    }
    if(type === 'network')
      setSelectedStudentRows([rowData])
  };

  const handleCloseAlert = () => {
    setOpen(false);
    setOpenIframe(false);
    setSendEmail(false);
    // Remove the access token from the URL
    const url = new URL(window.location);
    url.searchParams.delete('access_token');
    window.history.replaceState({}, document.title, url.toString());
    setOpenExportDialog(false);
    // setSelectedStudentRows([]);
  };

  const selectionOnChange = (rows) => {
    var selected = [];
    rows.forEach((row) => {
      var newItem = {};
      if(row.machines.length > 0){
        newItem = {
          vm_name: row.machines[0].vm_name,
          vm_status: row.machines[0].vm_status,
          connection_url: row.machines[0].connection_url,
          connection_id: row.machines[0].connection_id,
          guac_url: row.machines[0].guac_url
        }
      }
      const finalObj = { ...newItem, ...row}
      selected.push(finalObj)
    })
    // console.log(selected);
    setSelectedStudentRows(selected);
    // setSelectedStudentRows(rows);
    // this.setState({selectedStudentRows: selected})
  }

  const reloadComponent = () => {
    // setRefresh(!refresh)
    readStudent();
  }

  const handleToggle = () => {
    setEditorVisible(!editorVisible)
    // this.setState((prevState) => ({
    //   editorVisible: !prevState.editorVisible,
    // }));
  };

  const emailStudents = (rows) => {
    setSendEmail(true);
    setSelectedStudentRows(rows);
  }

  const exportStudentsAlert = (rows) => {
    setOpenExportDialog(true);
    setSelectedStudentRows(rows);
    // Put the array into storage
    localStorage.setItem('selectedStudents', JSON.stringify(rows));
  }

  // Sort the data array to have highlighted rows on top
  const sortedData = dataS && [...dataS].sort((a, b) => {
    if (a.student_email === a.instructor_email) return -1; // Highlighted row comes first
    if (b.student_email === b.instructor_email) return 1; // Highlighted row comes first
    return 0;
  });

  const queryParams = getQueryParams(window.location.search);
  const shouldShowCreateClassDialog = !queryParams.access_token;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        {type === 'network' && (
          <FormControlLabel
            control={
              <Switch
                checked={editorVisible}
                onChange={handleToggle}
                color="primary"
              />
            }
            label="Open editor to assign student machines"
            labelPlacement="end" // Use "top", "bottom", "start", or "end"
          />
        )}
        {editorVisible ? (
          <DndProvider backend={HTML5Backend}>
            {/* Environment component */}
            <Environment data={props.class}
              reload={reloadComponent}/>
          </DndProvider>
        ) : (
          <MaterialTable
              title="Scheduled Labs Details"
              localization={{ body:{ emptyDataSourceMessage:
                <>
                  {loadedS ? 'No records to display' :
                    <div style={{color:primaryColor}} className="d-flex justify-content-center">
                      <Spinner  animation="border" role="status">
                          <span className="sr-only">Loading...</span>
                      </Spinner>
                    </div>
                   }
                </>
              } }}
              columns={[
                  {title: 'Student', field: 'student_id', hidden: true},
                  {title: 'Name', field: 'student_name'},
                  {title: 'Class Name', field: 'class_name', hidden: true,
                    // editComponent: (props) => (
                    //     <select className="form-control form-control-sm"
                    //             value={props.value}
                    //             onChange={e => props.onChange(e.target.value)}
                    //             required
                    //     >
                    //       <option value="">Select</option>
                    //       {loadedClasses ?
                    //           classes.map((item) => {
                    //               return (<option key={item.class_id}
                    //                               data-key={item.class_name}
                    //                               value={item.class_id+'&&'+item.class_name}>{item.class_name}</option>);
                    //             })
                    //           : null
                    //       }
                    //     </select>
                    // )
                  },
                  {title: 'Email', field: 'student_email',
                    render: rowData => {
                      return(
                        <a href = {`mailto: ${rowData.student_email}`}>{rowData.student_email}</a>
                      )
                    }
                  },
                  {title: 'VM Name', field: 'vm_name', editable: 'never',
                    hidden: type === 'network' ? true : false,
                    render: rowData => rowData.machines.length > 0 ? rowData.machines.map((machine) => {
                      return(
                        machine.vm_name !== undefined ? <>
                          <span>{machine.vm_name}</span>
                          <IconButton size="small" onClick={() => getGuacDetails(rowData)}>
                            <ScreenSearchDesktopIcon/>
                          </IconButton>
                          {openIframe && (
                            <div className="iframe-dialog">
                              <button onClick={handleCloseAlert}>Close</button>
                              <div className="dialog-content">
                                <iframe src={iframeUrl} title="Iframe Dialog"></iframe>
                              </div>
                            </div>
                          )}
                        </> : 'N/A'
                      )
                    }) : 'N/A'
                  },
                  {title: 'VM State', field: 'vm_status', editable: 'never',
                    hidden: type === 'network' ? true : false,
                    render: rowData => rowData.machines.length > 0 ? rowData.machines.map((machine) => {
                      return (
                        <span className={machine.vm_status === 'online' ? "badge badge-pill badge-success" :
                                         machine.vm_status === 'offline' && machine.connection_url === 'pending' ?
                                         "badge badge-pill badge-warning" : "badge badge-pill badge-danger"}>
                           {machine.vm_status !== undefined && machine.vm_status!== "" ?
                             machine.vm_status === 'online' ? 'Running' :
                             machine.vm_status === 'offline' && machine.connection_url === 'pending' ?
                             'Creating...' : 'Stopped' : "Not available"}
                        </span>
                      )
                    }): 'N/A'
                  },
                  {title: 'OTS URL', field: 'ots_url', editable: 'never',
                    lookup: {Available: 'Available'},
                    hidden: type === 'network' ? true : false,
                    render: rowData => rowData.machines.length > 0 ? rowData.machines.map((machine) => {
                        return (
                          machine.ots_url ?
                              <span className="badge badge-success">
                                <a href={machine.ots_url} target="_blank" rel="noopener noreferrer" style={{color: 'white'}}>
                                  Access Student Lab
                                </a>
                              </span> :
                              <span className="badge badge-danger">Not available</span>
                        )
                    }): 'N/A'
                  },
                  {title: 'Class', field: 'class_id', hidden: true},
                  {title: 'Machines allocated', field: 'machines', editable: 'never',
                    hidden: type === 'network' ? false : true,
                    render: rowData => {
                      return(
                        <>
                          {(rowData.machines !== undefined && rowData.machines.length !== 0) ?
                            rowData.machines.map((item) => {
                              const name = item.name!==undefined ? item.name : item.image_name;
                              return <li>{name}</li>
                            }): 'Not assigned'
                          }
                        </>
                      )
                    }
                  },
                  {
                      title: 'Customer ID',
                      field: 'customer_id',
                      hidden: true
                  },
                  {
                      title: 'VM Created',
                      field: 'vm_created_time',
                      editable: 'never',
                      hidden: true,
                      render: rowData => {
                          const c_date = moment(rowData.vm_created_time * 1000).format('MMM-DD-YYYY HH:mm:ss');
                          return c_date
                      }
                  },
                  {
                      title: 'VM Last Activity',
                      field: 'vm_updated_time',
                      editable: 'never',
                      hidden: true,
                      render: rowData => {
                          return (
                            rowData.vm_updated_time !== undefined ?
                              moment(rowData.vm_updated_time * 1000).format('MMM-DD-YYYY HH:mm') : 'N/A'
                          )
                      }
                  },
                  {
                      title: 'Created',
                      field: 'created_ts',
                      editable: 'never',
                      render: rowData => {
                          const c_date = moment(rowData.created_ts * 1000).format('MMM-DD-YYYY HH:mm');
                          return c_date
                      }
                  },
                  {
                      title: 'Last Updated',
                      field: 'updated_ts',
                      editable: 'never',
                      render: rowData => {
                          const u_date = moment(rowData.updated_ts * 1000).format('MMM-DD-YYYY HH:mm');
                          return u_date
                      }
                  },
              ]}
              data={sortedData}
              options={{
                headerStyle: {
                    backgroundColor: 'gray',
                    color: '#FFF',
                    fontSize: '12px'
                },
                exportButton: true,
                exportAllData: true,
                selection: type === 'network' ? false : true,
                showSelectAllCheckbox: true,
                showTitle: false,
                rowStyle: rowData => ({
                  backgroundColor: rowData.student_email === rowData.instructor_email ? '#DAF7A6' : 'inherit',
                  fontSize: '12px'
                }),
                pageSize: 10,
                showTextRowsSelected: false,
                columnsButton: true,
                grouping: true,
                padding: "dense",
                filtering: true,
                toolbar: props.class.templateDetails.type === 'network' ? false : true,
                sorting: true,
              }}
              onSelectionChange={(rows) => selectionOnChange(rows)}
              components={{
                Toolbar: (props) => (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      height: '45px',
                      margin: '3px'
                    }}
                  >
                    <Tooltip title='Refresh student data' placement="top">
                      <span>
                        <IconButton onClick={() => readStudent()}
                                    size="small"
                                    style={{borderRadius: 0}}>
                          <CachedIcon/>
                       </IconButton>
                      </span>
                    </Tooltip>{' '}
                    <Tooltip title='Create Student VM' placement="top">
                      <span>
                        <IconButton onClick={() => createStudentVM(selectedStudentRows)}
                                    size="small"
                                    style={{borderRadius: 0}}
                                    disabled={(selectedStudentRows.length > 0 ? false : true) ||
                                          (selectedStudentRows[0] !== undefined &&
                                          selectedStudentRows[0].vm_status !== undefined)}
                        >
                          <AddIcon/>
                          <span style={{fontSize: '13px'}}>Create</span>
                       </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title='Launch Student VM in a new tab' placement="top">
                      <span>
                        <IconButton onClick={() => launchStudentVM(selectedStudentRows)}
                                    size="small"
                                    style={{borderRadius: 0}}
                                    disabled={selectedStudentRows.length === 1
                                              ? false : true}>
                          <LaunchIcon/>
                          <span style={{fontSize: '13px'}}>Launch</span>
                       </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title='Start Student VM' placement="top">
                      <span>
                        <IconButton onClick={() => startStudentVM(selectedStudentRows)}
                                    size="small"
                                    style={{borderRadius: 0}}
                                    disabled={selectedStudentRows.length > 0
                                              ? false : true}>
                          <PlayArrowIcon/>
                          <span style={{fontSize: '13px'}}>Start</span>
                       </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title='Restart Student VM' placement="top">
                      <span>
                        <IconButton onClick={() => restartStudentVM(selectedStudentRows)}
                                    size="small"
                                    style={{borderRadius: 0}}
                                    disabled={selectedStudentRows.length > 0
                                              ? false : true}>
                          <ReplayIcon fontSize='medium'/>
                          <span style={{fontSize: '13px'}}>Restart</span>
                       </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title='Stop Student VM' placement="top">
                      <span>
                        <IconButton onClick={() => stopStudentVM(selectedStudentRows)}
                                    size="small"
                                    style={{borderRadius: 0}}
                                    disabled={selectedStudentRows.length > 0
                                              ? false : true}>
                          <StopIcon/>
                          <span style={{fontSize: '13px'}}>Stop</span>
                       </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title='Delete Student VM' placement="top">
                      <span>
                        <IconButton onClick={() => deleteAlert('vm')}
                                    size="small"
                                    style={{borderRadius: 0}}
                                    disabled={selectedStudentRows.length > 0
                                              ? false : true}>
                          <DeleteIcon/>
                          <span style={{fontSize: '13px'}}>Delete</span>
                       </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title='Email student(s)' placement="top">
                      <span>
                        <IconButton onClick={() => emailStudents(selectedStudentRows)}
                                    size="small"
                                    style={{borderRadius: 0}}
                                    disabled={selectedStudentRows.length > 0
                                              ? false : true}>
                          <MailIcon/>
                          <span style={{fontSize: '13px'}}>Email</span>
                       </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title='Export student(s) to D2L' placement="top">
                      <span>
                        <IconButton onClick={() => exportStudentsAlert(selectedStudentRows)}
                                    size="small"
                                    style={{borderRadius: 0}}
                                    disabled={selectedStudentRows.length > 0
                                              ? false : true}>
                          <ImportExportIcon/>
                          <span style={{fontSize: '13px'}}>Export</span>
                       </IconButton>
                      </span>
                    </Tooltip>

                    <div style={{width: "100%"}}>
                      <MTableToolbar {...props} searchFieldVariant="standard" />
                    </div>
                  </div>
                ),

              }}
              actions={[
                  rowData => ({
                      icon: 'delete',
                      tooltip: 'Delete Student',
                      onClick: (event, rowData) => deleteAlert(rowData)
                  })
              ]}
              editable={{
                onRowUpdate: (newData, oldData) =>
                  new Promise((resolve, reject) => {
                      setTimeout(() => {
                        updateStudent(newData, oldData);
                        resolve();
                      }, 3000)
                  })
              }}
              detailPanel={rowData => {
              return (
                <div style={{ width: '100%', textAlign: 'center', margin: '5px' }}>
                  {rowData.student_rating ? (
                    <>
                      <div>
                        Rating provided by the student: {Utils.renderStars(rowData.student_rating.rating)}
                      </div>
                      <div>
                        {rowData.student_rating.public_comment !== '' ?
                          rowData.student_rating.public_comment : "There are no written public comments for your review."}
                      </div>
                      <div>
                        {rowData.student_rating.private_comment !== '' ?
                          rowData.student_rating.private_comment : "There are no written private comments for your review."}
                      </div>
                    </>
                  ) : (
                    "No rating details available"
                  )}
                </div>
              );
            }}

          />
        )}
        {/* Dialog component */}
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={handleCloseAlert}
            aria-labelledby="alert-dialog-slide-title"
            aria-describedby="alert-dialog-slide-description"
        >
            <DialogTitle id="alert-dialog-slide-title">
                {deleteType === 'vm' ? "Delete Student(s) VM?"
                  : "Delete Student(s)?" }
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-slide-description">
                    All the resources related to the student(s) {deleteType === 'vm' ? "VM" : null } will be deleted. We can't recover them once you delete.<br/>
                    Are you sure you want to delete this {deleteType === 'vm' ? "student(s) VM?"
                      : "student(s)?" }
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseAlert} color="primary">
                    No
                </Button>
                <Button onClick={() => deleteType === 'vm' ?
                  deleteStudentVM(selectedStudentRows) :
                  deleteStudent(selectedStudentRows)}
                        color="primary">
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
        {sendEmail && (
          <EmailDialog
           open={sendEmail}
           data={selectedStudentRows}
           close={handleCloseAlert}/>
        )}
        {(openExportDialog || !shouldShowCreateClassDialog) && (
          <ExportToD2LDialog
           open={openExportDialog || !shouldShowCreateClassDialog}
           data={selectedStudents}
           cls={classSel}
           token={queryParams!== undefined && queryParams.access_token}
           close={handleCloseAlert}/>
        )}
      </Grid>
    </Grid>
  );
};

export default Students;
