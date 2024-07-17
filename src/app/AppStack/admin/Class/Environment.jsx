import React, { memo, useState, useEffect, useCallback } from "react";
import {Spinner} from 'react-bootstrap';
import { reactAPIURL, socketUrl } from "../../shared/General.js";
import { toast } from 'react-toastify';
import Utils from '../../shared/Utils';
import CustomToast from '../../shared/CustomToast.js'
import Grid from '@material-ui/core/Grid';
import Node from './Node'
import update from 'immutability-helper';
import Editor from './Editor'
import { w3cwebsocket as W3CWebSocket } from "websocket";
import LaunchIcon from '@material-ui/icons/Launch';
import { IconButton } from '@mui/material';
import List from '@mui/material/List';

const Environment = memo(function Environment({data, reload}) {
  // const [data, setData] = useState(data);
  const [classId, setClassId] = useState(data.classId);
  const [envId] = useState(data.env_id);
  const [refreshToken, setRefreshToken] = useState('');
  const [user, setUser] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [role, setRole] = useState('');
  const [droppedItems, setDroppedItems] = useState([])
  const [envVms, setEnvVms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadedStudents, setLoadedStudents] = useState(false);
  const [studentMachines, setStudentMachines] = useState([]);
  const [loadedEnvVms, setLoadedEnvVms] = useState(false);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    // Add inner async function
    const initailizeThings = async () => {
      var assignedStudents = JSON.parse(localStorage.getItem('assignedStudents'));
      try {
        //setState
        const result = await setStates()
        setRefreshToken(result.refresh_token);
        setUser(result.user);
        setCustomerId(result.customer_id);
        setRole(result.role);
        // setStudents(result.students);
        //get students
        var dataS = [], dataSM = [];
        const studentData = await Utils.getCustomerStudents(result.refresh_token,
          result.customer_id, result.role, result.user)
        .then(data => {
          data.map((item) => {
            if(item.instructor_email !== item.student_email && item.class_id === classId){
              const node = { ...item, ...{ droppedItems: item.machines,
              selectedItems: [], lastDroppedItem: null, type: 'node' }}
              dataS.push(node);
              dataSM = dataSM.concat(item.machines)
            }
          });
          setStudents(dataS);
          setLoadedStudents(true);
          setStudentMachines(dataSM);
          // Put the array into storage
          // localStorage.setItem('assignedStudents', JSON.stringify(dataS));
        })
        .catch(err => { throw err; });
        let tmp = [];
        if(data.env_vms!== undefined && data.env_vms !== 'pending'){
          data.env_vms.map((network, index) => {
            network.machines.map((machine) => {
              tmp.push({ ...machine, ...{ network_name: network.network_name}})
            })
          })
        }

        const res = await finalFunc(tmp, dataSM)
        setEnvVms(res);
        setLoadedEnvVms(true);
      } catch (err) {
        throw err;
      }
    }
    // Calls this function immediately
    initailizeThings();
  }, [data, user, refresh])

  useEffect(() => {
    if(user){
      const client = new W3CWebSocket(socketUrl +'?email=' + user);
      client.onopen = () => {
          // console.log('WebSocket Client Connected');
      };
      client.onmessage = (message) => {
        reload();
        if(message.data){
          if(message.data.includes('&&')){
            //some url link is present in the notification
            let text = message.data.split('&&')[0];
            let link = message.data.split('&&')[1];
            Utils.addsuccessNotification(<CustomToast
              message = {text}
              link = {link}
              type = "response"
            />)
          }else {
            //normal text message notification
            Utils.addsuccessNotification(message.data);
          }
        }
      };
    }
  }, [user])

  const setStates = () => {
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    var assignedStudents = JSON.parse(localStorage.getItem('assignedStudents'));
    if(appearanceObject !== null && userAuthDetails !== null && userDetails !== null){
      return({
        refresh_token: JSON.parse(userAuthDetails).refresh_token,
        user: JSON.parse(userAuthDetails).user,
        customer_id: JSON.parse(userDetails).customer_id,
        role: JSON.parse(userDetails).role,
        students: assignedStudents !== null &&
        assignedStudents.filter(item => item.class_id === classId)
      })
    }
  }

  const finalFunc = (tmp, dataSM) => {
    tmp = tmp.map((eMachine) => {
      var res = { ...eMachine, ...{ assigned: false}}
      dataSM.map((sMachine, i) => {
        if(sMachine.vm_name === eMachine.vm_name){
         const test1 = { ...eMachine, ...{ assigned: true}}
         res = {...test1}
        }
      });
      return res
    })
    return tmp
  }

   const [accepts] = useState(['node', 'connector'])

   const handleDrop = useCallback((index, item) => {
     // if(students[index].machines.length < 1){
       const findIndex = envVms.findIndex(vm => vm.vm_name === item.details.vm_name);
       findIndex !== -1 &&
       setEnvVms(update(envVms, {
           [findIndex]: {
               assigned: {
                 $set: true
               }
           },
       }));
       setStudents(update(students, {
           [index]: {
               droppedItems: {
                 $push: [item.details],
               },
               machines: {
                 $push: [item.details],
               }
           },
       }));
       saveStudentMachines(students[index], students[index].machines.concat([item.details]))
     // }
     //only allowing single networked machine for the student
   });

   const handleSelect = (index, item, flag) => {
     if(flag){
       setStudents(update(students, {
           [index]: {
               selectedItems: {
                   $push: [item],
               }
           },
       }));
     }else {
       students.map((student, index) => {
         const findIndex = student.selectedItems.indexOf(item)
         findIndex !== -1 && student.selectedItems.splice(findIndex , 1)
       })
       setStudents(students)
     }
   };

   const handleSelectAll = (index, item, flag) => {
     if(flag === 'select'){
       setStudents(update(students, {
           [index]: {
               selectedItems: {
                   $set: item,
               }
           },
       }));
     }else {
       setStudents(update(students, {
           [index]: {
               selectedItems: {
                   $set: [],
               }
           },
       }));
     }
   };

   const saveStudentMachines = (student, data) => {
     fetch(reactAPIURL + 'updatestudent', {
         method: 'post',
         headers: {
             'Accept': 'application/json',
             'Content-type': 'application/json',
         },
         body: JSON.stringify({
             "student_id": student.student_id,
             "customer_id": student.customer_id,
             "refresh_token": refreshToken,
             "machines": data,
             "student_email_new": student.student_email.toLowerCase(),
             "student_email_old": student.student_email.toLowerCase(),
         })
     })
     .then((response) => response.json())
     .then(responseJson => {
       // console.log(responseJson);
       toast.dismiss();
       if (responseJson.message === "success" && responseJson.statusCode === 200) {
           // Utils.addsuccessNotification('Student data updated successfully')
       } else {
           Utils.adderrorNotification('Error updating the student data: ' + responseJson.errorMessage)
       }
     })
     .catch((error) => {
       Utils.adderrorNotification('Error editing student data: ' + error)
     });
   }

   const deleteMachines = (index, item) => {
     let temp = envVms.map((eMachine) => {
       var res = { ...eMachine}
       item.selectedItems.map((sMachine, i) => {
         if(sMachine.vm_name === eMachine.vm_name){
           const test1 = { ...eMachine, ...{ assigned: false}}
           res = {...test1}
         }
       });
       return res
     })
     setEnvVms(temp)
     const tmp = item.machines.filter(function(val) {
       return item.selectedItems.indexOf(val) === -1;
     });
     const indexNo = students.indexOf(item);
     setStudents(update(students, {
         [indexNo]: {
             droppedItems: {
               $set: tmp,
             },
             machines: {
               $set: tmp,
             },
             selectedItems: {
               $set: []
             }
         },
     }));
     saveStudentMachines(item, tmp)
   }

   const startMachines = async (item) => {
     const newObj = await item.selectedItems.map((machine) => {
       return({
         'vm_name': machine.vm_name,
         'student_id': item.student_id
       })
     })
     Utils.addinfoNotification(<CustomToast
       message = "Starting machine(s)"
       type = "request"
     />)
     // console.log(newObj);
     await Utils.startVM(newObj)
     .then(data => {
       if(data.message === 'success'){
         toast.dismiss();
         Utils.addsuccessNotification(<CustomToast
           message = "Successfully started machine(s)"
           type = "response"
         />)
       }
     })
     .catch(err => { throw err });
   }

   const stopMachines = async(item) => {
     const newObj = await item.selectedItems.map((machine) => {
       return({
         'vm_name': machine.vm_name,
         'student_id': item.student_id
       })
     })
     Utils.addinfoNotification(<CustomToast
       message = "Stopping machine(s)"
       type = "request"
     />)
     await Utils.stopVM(newObj)
     .then(data => {
       if(data.message === 'success'){
         toast.dismiss();
         Utils.addsuccessNotification(<CustomToast
           message = "Successfully stopped machine(s)"
           type = "response"
         />)
       }
     })
     .catch(err => { throw err });
   }

   const deployMachine = (item) => {
     //coming soon
     //redeploy individual machine within a network
   }

   const reloadComponent = () =>  {
     reload();
     setRefresh(!refresh);
   }

   const launchMachine = (item) => {
     //when assigned to student
     let newItem = item.selectedItems[0];
     newItem.student_email = item.student_email;
     newItem.student_id = item.student_id;
     Utils.addinfoNotification('Launching machine in a new tab..');
     Utils.getGuacToken(newItem, refreshToken, 'student')
     .then(data => {
       toast.dismiss();
       window.open(data, "_blank")
     })
     .catch(err => {
       Utils.adderrorNotification('Error launching the machine, Please try again.');
     });
   }

  return(
    <div>
      <Grid container spacing={2}>
        <Grid item xs={3}>
          <div className="card">
            <div className="card-body">
              <div className="card-title">Network Machines</div>
              {loadedEnvVms ? <>
                {envVms.length > 0 ? envVms.map((machine, index) => {
                  const name = machine.name!== undefined ? machine.name : machine.image_name;
                  const type2 = machine.name!== undefined ? 'Stock Image' : 'Custom Image'
                  return (
                    <Node
                      key={index}
                      details={machine}
                      name={name}
                      network={machine.network_name}
                      subnet_type={machine.privacy}
                      type="node"
                      assigned={machine.assigned}
                      token={refreshToken}
                      reload={reloadComponent}
                    />

                  );
                }) : <p>No machines available. Please deploy the networked lab template for this class here.</p>}
               </> : <div className="d-flex justify-content-center">
              <Spinner  animation="border" role="status">
                  <span className="sr-only">Loading...</span>
              </Spinner>
            </div> }
            </div>
          </div>
        </Grid>
        <Grid item xs={9}>
        <div className="card">
          <div className="card-body">
            <Grid container spacing={1}>
              {loadedStudents ? <>
                {students.length > 0 ? students.map((item, index) => {
                  return(
                    <Editor
                      key={index}
                      accept={['node', 'connector']}
                      // lastDroppedItem={lastDroppedItem}
                      onDrop={(item) => handleDrop(index, item)}
                      droppedItems={item.droppedItems}
                      details={item}
                      selectedItems={item.selectedItems}
                      onSelect={(item, flag) => handleSelect(index, item, flag)}
                      onSelectAll={(item, flag) => handleSelectAll(index, item, flag)}
                      start={(item) => startMachines(item)}
                      stop={(item) => stopMachines(item)}
                      create={(item) => deployMachine(item)}
                      launch={(item) => launchMachine(item)}
                      deletedItem={(item) => deleteMachines(index, item)}
                    />
                  )
                }) : <p>No students available.</p>
              } </> : <div className="d-flex justify-content-center">
                <Spinner  animation="border" role="status">
                    <span className="sr-only">Loading...</span>
                </Spinner>
              </div> }
            </Grid>
          </div>
        </div>
        </Grid>
      </Grid>
    </div>
  )
})
export default Environment;
