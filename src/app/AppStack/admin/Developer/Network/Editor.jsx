import React, {memo, useState, useEffect} from 'react';
import Utils from '../../../shared/Utils';
import { useDrop } from 'react-dnd'
import Node from './Node'
import PublicIcon from '@mui/icons-material/Public';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import Tooltip from '@material-ui/core/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';
import Divider from '@mui/material/Divider';
import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import LaunchIcon from '@material-ui/icons/Launch';
import AddIcon from '@material-ui/icons/Add';
import FormLabel from '@material-ui/core/FormLabel';
import {Spinner, Form} from "react-bootstrap";
import MenuItem from '@material-ui/core/MenuItem';
import SettingsEthernetIcon from '@mui/icons-material/SettingsEthernet';
import {toast} from 'react-toastify';

const Editor = memo(function Editor({ accept, item, onDrop, close, deletedItem,
                    editDetails, networkvms, maxnetworkvms, type, update}) {

  const [editorItems, setEditorItems] = useState(item.droppedItems);
  const [subnetType, setSubnetType] = useState(item.subnet_type);
  const [subnetId] = useState(item.id);
  const [templateVersion, setTemplateVersion] = useState('');
  const [subnetName, setSubnetName] = useState(item.name);
  const [subnetAddressRange, setSubnetAddressRange] = useState(item.addressRange);
  const [vmCount, setVmCount] = useState(new Array(20).fill(1));

  useEffect(() => {
    //this is like our componentDidMount
    setEditorItems(item.droppedItems);
    setSubnetAddressRange(item.addressRange);
    setSubnetName(item.name);
  }, [item]);

  const [{ isOver, canDrop }, drop] = useDrop({
      accept,
      drop: onDrop,
      canDrop: () => {
        return networkvms < maxnetworkvms ? true : false
      },
      collect: (monitor) => ({
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
      }),
  });

  const isActive = isOver && canDrop
  let backgroundColor = 'white'
  if (isActive) {
    backgroundColor = 'green'
  } else if (canDrop) {
    backgroundColor = 'darkkhaki'
  }

  const deleteNode = (item) => {
    const newArr = [...editorItems];
    const findIndex = newArr.indexOf(item)
    findIndex !== -1 && newArr.splice(findIndex , 1)
    setEditorItems(newArr)
    deletedItem(item, subnetId);
  }

  //version dropdown onchange handler function to update state
  const versionChange = (event, item1, i) => {
    const selectedIndex = event.target.options.selectedIndex;
    const tmp = [...editorItems];
    const items = tmp.map((item, index) => {
      if(item1.name === item.name && i === index){
        var res = {
          ...item,
          ...{resource_id: event.target.options[selectedIndex].getAttribute('data-key')},
          ...{description: event.target.options[selectedIndex].getAttribute('desc')},
          ...{version: event.target.value}
        }
      }else {
        res = {...item}
      }
      return res
    })
    setEditorItems(items);
    update(subnetId, items);
  }

  const editSubnetDetails = (value, type) => {
    if(type === 'name')
      setSubnetName(value);
    else
      setSubnetAddressRange(value);
    editDetails(value, subnetId, type)
  }

  const setQty = (event, item, i) => {
    // lets validate first and go from There
    let inputValue = parseInt(event.target.value); // Parse the input to an integer

    if (isNaN(inputValue)) {
      // Handle the case when the input is NaN
      inputValue = 0;
    } else if(inputValue === 2){
      //Handle the case when user hits up incrementor
      inputValue = 1;
    } else {
      // Handle the case when the input is a valid number
      console.log("input: " + inputValue);
    }
    const finalValue = inputValue + networkvms

    if(finalValue <= maxnetworkvms){
      var idk, res; let flag = true;
      const tmpVmCount = [...vmCount];
      const updatedvmCount = tmpVmCount.map((item1, index) => {
        if(index === i){
          if(event.target.value < item1){
            flag = false
            idk = item1 - event.target.value
          }else {
            idk = event.target.value - item1
          }
          res = event.target.value
        }else {
          res = item1
        }
        return res
      });
      setVmCount(updatedvmCount);
      var newArr = [];
      const tmp = [...editorItems];
       tmp.map((item2, index) => {
         if(item2.name === item.name && i === index){
           for (let i = 1; i <= idk; i++) {
             if(flag){
               networkvms > maxnetworkvms ? Utils.adderrorNotification("Max VM reached.") :
                                tmp.push(item)
             } else {
               const index = tmp.findIndex(y => y === item2);
               index > -1 && tmp.splice(index, 1);
             }
           }
         }
       })
      setEditorItems(tmp);
      update(subnetId, tmp);
      setVmCount(new Array(20).fill(1));
    }else {
      toast.dismiss();
      Utils.adderrorNotification("Maximum VM count reached.")
    }
  }

  return (
    <div
      ref={drop}
      role="Editor"
      className="subnet"
    >
      <div className="d-flex justify-content-end align-items-center pl-1">
        <Tooltip title="remove subnetwork">
          <IconButton onClick={close}>
            <CloseIcon id = "x"/>
          </IconButton>
        </Tooltip>
      </div>
      <div className="d-flex justify-content-between align-items-center pl-1">
        <div className="row">
          <div className="col-md-12">
            <TextField
              fullWidth
              size="small"
              id="input-with-icon-textfield"
              value={subnetName}
              label="Subnet Name"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {subnetType === 'public' ? <PublicIcon /> :
                      subnetType === 'private' ? <VpnLockIcon/> : <SettingsEthernetIcon/> }
                  </InputAdornment>
                ),
                style: {fontSize: 12},
                maxLength: 16,
              }}
              InputLabelProps={{style: {fontSize: 12}}}
              variant="standard"
              onChange={evt => editSubnetDetails(evt.target.value, 'name')}
            />
          </div>
          <div className="col-md-6">
            <Tooltip title="The subnet's address range in CIDR notation (e.g. 192.168.1.0/24). It must be contained by the address space of the virtual network. The address range of a subnet which is in use can't be edited.">
              <TextField
                disabled
                fullWidth
                size="small"
                id="input-with-icon-textfield"
                value={subnetAddressRange}
                label="Subnet address range"
                InputProps={{
                  style: {fontSize: 10},
                  maxLength: 18,
                }}
                InputLabelProps={{style: {fontSize: 10}}}
                variant="filled"
                onChange={evt => editSubnetDetails(evt.target.value, 'address')}
              />
            </Tooltip>
          </div>
          <div className="col-md-6">
            <Tooltip title="The subnet's machine count">
              <TextField
                sx={{ input: { color: 'red' } }}
                disabled
                fullWidth
                size="small"
                id="input-with-icon-textfield"
                value={editorItems.length}
                label="Machine count"
                InputProps={{
                  style: {fontSize: 10}
                }}
                InputLabelProps={{style: {fontSize: 10}}}
                variant="filled"
              />
            </Tooltip>
          </div>
        </div>
      </div>
      <Divider/>
      <div className="scroll">
      {editorItems.map((item, index) => {
          if(item.type === 'node'){
            var color = 'lightgreen';
          }else{
            color = '#00AB66'
          }
          //small bug still exists here, we will miss the latest version

          // const versions = item.version_history.concat({
          //     "resource_id": item.resource_id,
          //     "version": item.version,
          //     "description": item.description
          // })
          return (
            <div className="d-flex justify-content-between align-items-center" key={index}>
                <Node
                  key={index}
                  left={item.left}
                  top={item.top}
                  details={item}
                  name={item.name}
                  type={item.type}
                  source="editor"
                  color={color}
                  // isDropped={isDropped(node.name)}
                />
                x
                <input type="number" id="vmcount" name="vmcount"
                       min="0" max={maxnetworkvms} value={vmCount[index]}
                       onChange={(e) => setQty(e, item, index)}
                       // onKeyDown={(event) => {
                       //  event.preventDefault();
                       // }}
                       className="small-form"
                />
                {item.version_history && (
                  <select
                  // value={this.state.resource_id}
                    value={templateVersion}
                    onChange={(e) => versionChange(e, item, index)}
                    required
                    className="sm small-form"
                  >
                  <option
                                  data-key={item.resource_id}
                                  desc={item.description}
                                  value={item.version}>
                            v{item.version}{' -- '}{item.description}
                          </option>
                    {
                       item.version_history.map((item, index) => {
                          return (<option key={index}
                                          data-key={item.resource_id}
                                          desc={item.description}
                                          value={item.version}>
                                    v{item.version}{' -- '}{item.description}
                                  </option>);
                      })
                    }
                  </select>
                )}
                {/*individual VM deplyments within network may be*/}
                <IconButton onClick={() => deleteNode(item)}>
                  <DeleteIcon fontSize="small"/>
                </IconButton>
            </div>

          );
      })}
      </div>
    </div>
  )
});
export default Editor
