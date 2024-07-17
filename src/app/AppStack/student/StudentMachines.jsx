import React, { Component, useState, useEffect, useRef } from "react";
import TextField from '@material-ui/core/TextField';
import WarningIcon from '@material-ui/icons/Warning';
import Button from '@material-ui/core/Button';
import {Spinner, Form} from 'react-bootstrap';
import { toast } from 'react-toastify';
import MaterialTable, {MTableBody} from 'material-table';
import moment from 'moment';
import StopIcon from '@material-ui/icons/Stop';
import LaunchIcon from '@material-ui/icons/Launch';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import Utils from '../shared/Utils';
import CustomToast from '../shared/CustomToast.js'
import PolicyDialog from '../shared/DialogBox/PolicyDialog';

const StudentMachines = (function StudentMachines({items, read}) {

  const [type, setType] = useState('');
  const [open, setOpen] = useState(false);
  const [classServerData, setClassServerData] = useState([]);
  const [refreshToken, setRefreshToken] = useState('');
  const [user, setUser] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [role, setRole] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    //this is like our componentDidMount

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
  }, [refreshToken, user]);


  /**
    * To stop the student VM on demand
    * @param  {Object} item VM details object
    * @return {JSON}  response with a success custom message
  */
  const stopStudentVM = async (item, vm) => {
    //we will stop the machine irrespective of class server being on or off
    let newItem;
    if(vm === undefined){
      newItem = {...item}
    }else {
      newItem = {...vm};
      newItem.student_email = item.student_email;
      newItem.student_id = item.student_id;
      newItem.env_id = item.env_id
    }
    const newObj = {
      'vm_name': newItem.vm_name,
      'student_id': newItem.student_id
    }
    Utils.addinfoNotification(<CustomToast
      message = "Stopping machine"
      type = "request"
    />)
    await Utils.stopVM([newObj])
    .then(data => {
      if(data.message === 'success'){
        this.props.read();
        Utils.addsuccessNotification(<CustomToast
          message = "Successfully stopped machine"
          type = "response"
        />)
      }
    })
    .catch(err => { throw err });
  };

  /**
    * To start the student VM on demand
    * @param  {Object} item VM details object
    * @return {JSON}  response with a success custom message
  */
  const startStudentVM = async (item, vm) => {
    let newItem;
    if(vm === undefined){
      newItem = {...item}
    }else {
      newItem = {...vm};
      newItem.student_email = item.student_email;
      newItem.student_id = item.student_id;
      newItem.class_vm_status = item.class_vm_status
      newItem.class_vm_name = item.class_vm_name
      newItem.class_name = item.class_name
    }
    if(newItem.class_vm_status !== 'online'){
      setOpen(true); setType('start');
      setClassServerData(newItem);
      //A DIALOG BOX TO START CLASS SERVER
    }else {
      const newObj = {
        'vm_name': newItem.vm_name,
        'student_id': newItem.student_id
      }
      Utils.addinfoNotification(<CustomToast
        message = "Starting machine"
        type = "request"
      />)
      await Utils.startVM([newObj])
      .then(data => {
        if(data.message === 'success'){
          this.props.read();
          Utils.addsuccessNotification(<CustomToast
            message = "Successfully started machine"
            type = "response"
          />)
        }
      })
      .catch(err => { throw err });
    }
  };

  /**
  * To launch an existing active lab
  */
  const launchStudentVM = async(item, vm)=>{
    let newItem;
    if(vm === undefined){
      newItem = {...item}
    }else {
      newItem = {...vm};
      newItem.student_email = item.student_email;
      newItem.student_id = item.student_id;
      newItem.class_educators = item.class_educators;
      newItem.class_vm_status = item.class_vm_status
      newItem.class_vm_name = item.class_vm_name
      newItem.class_name = item.class_name
    }
    if (item.class_vm_status !== 'online') {
        // Utils.adderrorNotification('Class server is in stopped state, Please start the VM and try again later!')
        setOpen(true); setType('launch');
        setClassServerData(newItem);
    } else {
        Utils.addinfoNotification(<CustomToast
          message = "Launching student VM"
          type = "request"
        />)
        await Utils.getGuacToken(newItem, refreshToken, 'student')
        .then(async (data) => {
          // console.log(data);
          toast.dismiss();
          // await window.open('/student/student-lab?student_id='+newItem.student_id+'&&vm='+newItem.vm_name+'&&url='+data.split('/#/')[0]+'&&token='+data.split('?token=')[1]);
          await window.open('/student/student-lab?item='+btoa(JSON.stringify(newItem))+'&&url='+btoa(data))
        })
        .catch(err => { throw err });
    }
  }

  const startClassServerVM = async (item) => {
    this.setState({open: false})
    const newObj = {
      'vm_name': item.class_vm_name,
      'class_id': item.class_id
    }
    const studentObject = {
      'vm_name': item.vm_name,
      'student_id': item.student_id,
    }
    Utils.addinfoNotification(<CustomToast
      message = "Starting class server before proceeding..."
      type = "request"
    />)
    await Utils.startVM([newObj])
    .then(async data => {
      if(data.message === 'success'){
        //and call start student machines here or
        //call launch machine based on type state
        if(type === 'start'){
          await Utils.startVM([studentObject])
          .then(data => {
            if(data.message === 'success'){
              read();
              Utils.addsuccessNotification(<CustomToast
                message = "Successfully started machine(s)"
                type = "response"
              />)
            }
          })
          .catch(err => { throw err });
        }else if (type === 'launch') {
          await Utils.getGuacToken(item, refreshToken, 'student')
          .then(async (data) => {
            toast.dismiss();
            // await window.open('/student/student-lab?student_id='+newItem.student_id+'&&vm='+newItem.vm_name+'&&url='+data.split('/#/')[0]+'&&token='+data.split('?token=')[1]);
            await window.open('/student/student-lab?item='+btoa(JSON.stringify(item))+'&&url='+btoa(data))
          })
          .catch(err => { throw err });
        }
      }
    })
    .catch(err => { throw err });
  }

  const handleCloseDialog = () => {
    setOpen(false);
  };

  return (
    <div>
      {items && items.length > 0 ? <>
        {items.map((item, index) => {
          return(
            <MaterialTable
              key={index}
              localization={{ body:{
                emptyDataSourceMessage: 'No machines deployed for this class yet.'
              }}}
              columns={[
                  {title: 'VM Name', field: 'name',
                    render: rowData => {
                      return(
                        rowData.name !== undefined ?
                            rowData.name : rowData.template_name
                      )
                    }
                  },
                  {title: 'VM State', field: 'vm_status',
                    render: rowData => {
                      return(
                        <span className={rowData.vm_status === 'online' ? "badge badge-pill badge-success" :
                                         rowData.vm_status === 'offline' && rowData.connection_url === 'pending' ?
                                         "badge badge-pill badge-warning" : "badge badge-pill badge-danger"}>
                            {rowData.vm_status !== undefined && rowData.vm_status!== "" ?
                             rowData.vm_status === 'online' ? 'Running' :
                             rowData.vm_status === 'offline' && rowData.connection_url === 'pending' ?
                              'Creating...' : 'Stopped' : "Not available"}
                          </span>
                      )
                    }
                  },
                  {title: 'Type', field: 'privacy',
                    render: rowData => {
                      return(
                        rowData.privacy !== undefined ?
                            rowData.privacy : rowData.network_name
                      )
                    }
                  },
                  {title: 'OS', field: 'image_name',
                    render: rowData => {
                      const osPort = rowData.nsg.split("/")[8]
                      if(osPort === 'centOS-nsg')
                        var image_os = 'Linux'
                      else image_os = 'Windows'
                      return image_os
                    }
                  },
                  {
                      title: 'Created',
                      field: 'vm_created_time',
                      editable: 'never',
                      render: rowData => {
                          const c_date = moment(rowData.vm_created_time * 1000).format('MMM-DD-YYYY HH:mm A');
                          return c_date
                      },
                      hidden: true
                  },
                  {
                      title: 'Updated',
                      field: 'vm_updated_time',
                      editable: 'never',
                      render: rowData => {
                          const u_date = moment(rowData.vm_updated_time * 1000).format('MMM-DD-YYYY HH:mm A');
                          return u_date
                      },
                      hidden: true
                  },
              ]}
              data={item.machines}
              actions={[
                rowData => ({
                  icon: () => rowData.vm_status!== undefined && rowData.vm_status === 'online' ?
                    <StopIcon fontSize='medium'/> : <PlayArrowIcon fontSize='medium'/>,
                  tooltip: rowData.vm_status!== undefined && rowData.vm_status === 'online' ?
                    'Stop lab' : 'Start lab',
                  onClick: (event, rowData) => rowData.vm_status!== undefined && rowData.vm_status === 'online' ?
                    stopStudentVM(item, rowData) : startStudentVM(item, rowData),
                  position: 'row',
                  disabled: rowData.vm_status === undefined || rowData.connection_url === 'pending'
                }),
                rowData => ({
                  icon: () => <LaunchIcon fontSize='medium'/>,
                  tooltip: 'Launch lab',
                  onClick: (event, rowData) => launchStudentVM(item, rowData),
                  position: 'row',
                  disabled: rowData.vm_status !== 'online' ? true : false
                }),

              ]}
              options={{
                  toolbar:false,
                  paging:true,
                  pageSize: 4,
                  padding: "dense",
                  maxBodyHeight: 400,
              }}
            />
          )

        })}</>
          :
        'No machines deployed for this class yet.'
       }
       {/*A dialog box to save image description before a new image version is created*/}
       {open &&
         <PolicyDialog dashboard="student"
           open={open}
           data={classServerData}
           close={handleCloseDialog}
           start={startClassServerVM}/>
       }
    </div>
  );
});

export default StudentMachines;
