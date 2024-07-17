import React, { memo, useState, useCallback, useEffect } from 'react';
import Utils from '../../../shared/Utils';
import Button from '@mui/material/Button';
import Node from './Node'
import Editor from './Editor'
import Grid from '@material-ui/core/Grid';
import update from 'immutability-helper';
import AddIcon from '@material-ui/icons/Add';
import Tooltip from '@material-ui/core/Tooltip';
import PublicIcon from '@mui/icons-material/Public';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import SaveIcon from '@material-ui/icons/Save';
import Collapse from '@mui/material/Collapse';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import IconButton from '@mui/material/IconButton';
import { styled } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import {toast} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { reactAPIURL, socketUrl } from "../../../shared/General.js";
import {Spinner, Form } from 'react-bootstrap';
import TextField from '@material-ui/core/TextField';
// import Tree from 'react-d3-tree';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import Paper from '@mui/material/Paper';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import PolicyDialog from '../../../shared/DialogBox/PolicyDialog'
import Functions from '../Functions';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const style = {
  fontSize: '.75rem',
  marginBottom: '.5rem',
  color: 'black',
};

const NodePanel = memo(function NodePanel({create, address, close, type, data, updateN}) {
  const [loaded, setLoaded] = useState(false);
  const [refreshToken, setRefreshToken] = useState('');
  const [user, setUser] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [role, setRole] = useState('');
  const [editor, setEditor] = useState([]);
  const [images, setImages] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [stockImages, setStockImages] = useState([]);
  const [envName, setEnvName] = useState('');
  const [envDescription, setEnvDescription] = useState('');
  const [vnetAddressRange, setVnetAddressRange] = useState(address);
  const [orgChart, setOrgChart] = useState({
      "name": "VNet",
      "children": []
  })
  const [openDialog, setOpenDialog] = useState(false);
  const [updatedNetwork, setUpdatedNetwork] = useState('');
  const [vmCount, setVmCount] = useState(0);
  const [maxVmCount, setMaxVmCount] = useState(2);

  useEffect(() => {
    //this is like our componentDidMount
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    var customerDetails = JSON.parse(localStorage.getItem('customerDetails'));
    var stockImages = JSON.parse(localStorage.getItem('stockimages'));
    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    if(appearanceObject !== null && userAuthDetails !== null && userDetails !== null){
      setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
      setUser(JSON.parse(userAuthDetails).user);
      setCustomerId(JSON.parse(userDetails).customer_id);
      setRole(JSON.parse(userDetails).role);
    }
    const updatedTemplates = userTemplates !== null &&
    userTemplates.map((item) => {
      return({ ...item})
    })

    setTemplates(updatedTemplates);
    customerDetails!== null && setMaxVmCount(customerDetails[0].customer_plan.id);

    const updatedSImages = stockImages !== null &&
    stockImages.map((item) => {
      return ({ ...item, ...{ type: 'stock_templates' }})
    });
    setStockImages(updatedSImages);

    if(data === null){
      //template create mode
      setEditor([]);
      setVmCount(0);
      setOrgChart({
          "name": "VNet",
          "children": []
      })
    }else if(data.type !== 'stand_alone'){
      let count = 0;
      var item = data.network.length > 0 && data.network.map((subnet, index) => {
        count = count + subnet.machines.length;
        return ({
          name: subnet.subnet_name,
          accepts: ['node', 'connector'],
          droppedItems: subnet.machines,
          addressRange: subnet.subnet_address_range,
          subnet_type: subnet.subnet_type,
          id: subnet.subnet_id,
        })
      })
      setEditor(item);
      setVmCount(count);
      var orgItem = data.network.map((subnet) => {
          return(
            {
              name: subnet.subnet_name,
              // attributes: {
              //   range: subnet.subnet_address_range,
              //   type: subnet.subnet_type
              // },
              children: subnet.machines.map((machine) => {
                return({
                  name: machine.name,
                  // attributes: {
                  //   type: 'virtual machine',
                  // }
                })
              }),
              id: subnet.subnet_id
            }
          )

      })
      setOrgChart({
        "name": "VNet",
        "children": orgItem
      })
    }
  }, [refreshToken, user]);

  useEffect(() => {
    if(user){
      const client = new W3CWebSocket(socketUrl +'?email=' + user);
      client.onopen = () => {
          // console.log('WebSocket Client Connected');
      };
      client.onmessage = (message) => {
          Utils.addsuccessNotification(message.data);
          if(message.data){
            console.log('setState');
          }
      };
    }
  }, [user])

  const [droppedBoxNames, setDroppedBoxNames] = useState([]);
  function isDropped(boxName) {
      return droppedBoxNames.indexOf(boxName) > -1;
  }

  const handleDrop = useCallback((index, item, id) => {
    delete item.details.vm_status;
    delete item.details.vm_name;
    delete item.details.lab_access_url
    delete item.details.lab_connection_id
    const { name } = item;
    // setDroppedBoxNames(droppedBoxNames => [...droppedBoxNames, name])
    setDroppedBoxNames(update(droppedBoxNames, name ? { $push: [name] } : { $push: [] }));
    if(id === 'dmz'){
      if(editor[index].droppedItems.length < 1){
        setVmCount(vmCount + 1);
        setEditor(update(editor, {
            [index]: {
                droppedItems: {
                    $push: [item.details],
                }
            },
        }));
        //here vm as child orgchart grows
        const child = {
          name: item.details.name,
          // attributes: {
          //   type: 'virtual machine',
          // }
        }
        const tmp_orgChart = {...orgChart}
        tmp_orgChart.children.forEach((entry, i) => {
          if(entry.id === id ){
            entry.children.push(child);
          }
        });
        setOrgChart(tmp_orgChart);
      }else {
        Utils.adderrorNotification('You are not allowed to have more than 1 machines in a DMZ subnet.')
      }
    }else{
      if(editor[index].droppedItems.length < maxVmCount){
        setVmCount(vmCount + 1);
        setEditor(update(editor, {
            [index]: {
                droppedItems: {
                    $push: [item.details],
                }
            },
        }));
        //here vm as child orgchart grows
        const child = {
          name: item.details.name,
          // attributes: {
          //   type: 'virtual machine',
          // }
        }
        const tmp_orgChart = {...orgChart}
        tmp_orgChart.children.forEach((entry, i) => {
          if(entry.id === id ){
            entry.children.push(child);
          }
        });
        setOrgChart(tmp_orgChart);
      }
      else {
        Utils.adderrorNotification('You are not allowed to have more than 20 machines in a network.')
      }
    }
  }, [droppedBoxNames, editor, vmCount]);

  const addPrivateNetwork = () => {
    let tmp = [];
    editor.forEach((item, i) => {
      if(item.subnet_type === 'private')
        tmp.push(item);
    });
    if(tmp.length < 1){
      let x = 3 + tmp.length;
      const obj = { name: 'Private subnet'+tmp.length , accepts: ['node', 'connector'], droppedItems: [],
                    addressRange: '10.0.'+x+'.0/24', subnet_type: 'private', id: 'pri'+tmp.length };
      let temp = [...editor];
      temp.push(obj);
      setEditor(temp);
      // setEditor(editor => [...editor, obj])
      //here tree grows
      const child = {
        name: 'Private subnet'+tmp.length,
        // attributes: {
        //   range: '10.0.'+x+'.0/24',
        //   type: 'private'
        // },
        children: [],
        id: 'pri'+tmp.length
      }
      const tmp_orgChart = {...orgChart}
      tmp_orgChart.children.push(child);
      setOrgChart(tmp_orgChart);
    }
    else {
      Utils.adderrorNotification('You are not allowed to have more than 1 private segments.')
    }
  }

  const addPublicNetwork = () => {
    let tmp = [];
    editor.forEach((item, i) => {
      if(item.subnet_type === 'public')
        tmp.push(item);
    });
    if(tmp.length < 1){
      const obj = { name: 'Public subnet', accepts: ['node', 'connector'], droppedItems: [],
                    addressRange: '10.0.2.0/24', subnet_type: 'public', id: 'pub0' };
      let temp = [...editor];
      temp.splice(0, 0, obj)
      setEditor(temp);
      // setEditor(editor => [...editor, obj])
      //here tree grows
      const child = {
        name: 'Public subnet',
        // attributes: {
        //   range: '10.0.2.0/24',
        //   type:'public'
        // },
        children: [],
        id: 'pub0'
      }
      const tmp_orgChart = {...orgChart}
      tmp_orgChart.children.push(child);
      setOrgChart(tmp_orgChart);

    }
    else {
      Utils.adderrorNotification('You are not allowed to have more than 1 public segment.')
    }
  }

  const addDmzNetwork = () => {
    let tmp = [];
    editor.forEach((item, i) => {
      if(item.subnet_type === 'dmz')
        tmp.push(item);
    });
    if(tmp.length < 1){
      const obj = { name: 'DMZ subnet', accepts: ['node'], droppedItems: [],
                    addressRange: '10.0.1.0/24', subnet_type: 'dmz', id: 'dmz' };
      let temp = [...editor];
      temp.splice(1, 0, obj)
      setEditor(temp);
      // setEditor(editor => [...editor, obj])
      //here tree grows
      const child = {
        name: 'DMZ subnet',
        // attributes: {
        //   range: '10.0.1.0/24',
        //   type: 'dmz'
        // },
        children: [],
        id: 'dmz'
      }
      const tmp_orgChart = {...orgChart}
      tmp_orgChart.children.splice(1, 0, child)
      // tmp_orgChart.children.push(child);
      setOrgChart(tmp_orgChart);
    }
    else {
      Utils.adderrorNotification('You are not allowed to have more than 1 DMZ segment.')
    }
  }

  const deleteSubNetwork = (i, item, id) => {
    const tmp_orgChart = {...orgChart}
    tmp_orgChart.children.splice(i, 1)
    setOrgChart(tmp_orgChart);
    const temp = [...editor];
    let removed = temp.find(subnet => subnet.id === id).droppedItems.length
    temp.splice(i, 1);
    setEditor(temp);
    setVmCount(vmCount - removed);
  }
  const saveNetwork = (type) => {
    // vnet cidr validation
    if(vnetAddressRange !== ''){
      var range = vnetAddressRange
    }else {
      range = '10.0.0.0/16'
    }
    const regex = /((\b|\.)(1|2(?!5(?=6|7|8|9)|6|7|8|9))?\d{1,2}){4}(-((\b|\.)(1|2(?!5(?=6|7|8|9)|6|7|8|9))?\d{1,2}){4}|\/((1|2|3(?=1|2))\d|\d))\b/g;
    if (vnetAddressRange !== '' && regex.exec(vnetAddressRange) === null) {
        Utils.adderrorNotification('Invalid Vnet address range, Please enter a valid address range and try again.')
        return false;
    } else {
      const network = editor.map((item) => {
        if(item.droppedItems.length !== 0){
          return({
            subnet_type: item.subnet_type,
            machines: item.droppedItems,
            subnet_name: item.name,
            subnet_id: item.id,
            subnet_address_range: item.addressRange
          })
        }
      })
      const filteredEnv = network.filter(function(x) {
       return x !== undefined;
      });
      if ( filteredEnv.length === network.length ) {
        var machineCount = 0;
        network.map((item) => {
          machineCount+=item.machines.length
        })
        if(machineCount <= 40){
          const item = {
            network: network
          }
          if(type === 'template_create'){
            create(item, range);
            close();
          }else {
            //here we open a dialog to ask the user
            //to save the changes as a new version or override existing.
            setOpenDialog(true);
            setUpdatedNetwork(item);
          }
        }
        else {
          Utils.adderrorNotification('You are not allowed to have more than 40 machines in a network.')
        }
      }else {
        Utils.adderrorNotification(`You cannot save the network with an
          empty subnet(s). Remove the empty subnet or add machines to it and try saving again.`);
      }
    }
  }

  const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
    return <IconButton {...other} />;
  })(({ theme, expand }) => ({
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  }));

  const deleteNode = (item, id) => {
    editor.map((editorItem) => {
      if(editorItem.id === id){
        const findIndex = editorItem.droppedItems.indexOf(item)
        findIndex !== -1 && editorItem.droppedItems.splice(findIndex , 1)
      }
    })
    setEditor(editor)
    const count = vmCount - 1;
    setVmCount(count);
    const tmp_orgChart = {...orgChart}
    tmp_orgChart.children.map((entry) => {
      if(entry.id === id){
        entry.children.map((child) => {
          if(item.name === child.name){
            const findIndex = entry.children.indexOf(child)
            findIndex !== -1 && entry.children.splice(findIndex , 1)
          }
        })
      }
    })
    setOrgChart(tmp_orgChart)
  }

  const editSubnetDetails = (value, id, type) => {
    if(type === 'name'){
      let newName = value.replace(/ /g,"_");
      editor.map((editorItem) => {
        if(editorItem.id === id)
          editorItem.name = newName
      })
      setEditor(editor)
    }else {
      // let newAddress = value.replace(/ /g,"_");
      editor.map((editorItem) => {
        if(editorItem.id === id)
          editorItem.addressRange = value
      })
      setEditor(editor)
    }
  }

  const updateNetwork = (id, items) => {
    let index, count = 0;
    let newArr = [...editor];
    editor.map((editorItem) => {
      if(editorItem.id === id){
        index = editor.indexOf(editorItem)
        editorItem.droppedItems = items
      }
      count = count + editorItem.droppedItems.length
    })
    if(count <= maxVmCount){
      setEditor(editor)
      setVmCount(count);
      // updateN(editor);
    }
    else{
      Utils.adderrorNotification("Maximum VM count reached.")
    }
    // close();
  }

  const handleCloseDialog = (item) => {
    setOpenDialog(false);
  }

  const overrideTemplate = (item) => {
    //we name it override instead of close
    //so need to do db update here directly
    var newItem = {
      name : data.name,
      template_id : data.template_id,
      template_description : data.description,
      network: item.network,
      type: data.type,
      version_history: data.version_history,
      version: data.version
    };
    setOpenDialog(false);
    Utils.addinfoNotification("Updating template...")
    Functions.updateTemplate(newItem, refreshToken, customerId, user)
    .then((res) => {
      toast.dismiss();
      if(res.message === "success" && res.statusCode === 200){
        Utils.addsuccessNotification("Successfully updated template.")
        //here we update the images in localStorage
        let newArr = [...templates];
        newArr = newArr.map((template) => {
          var res = { ...template}
          if(template.template_id === data.template_id){
            template.name = data.name
            template.description = data.description
            template.network = newItem.network
            template.version_history = data.version_history
            template.version = data.version
            res = { ...template}
          }
          return res
        })
        localStorage.setItem('templates', JSON.stringify(newArr));
      }
    })
    .catch((error) => { throw error });
  }

  const updateTemplate = (item, desc, version) => {
    //adding the current version to the version history
    let newVersionHistory = data.version_history.concat({
        'network': data.network,
        'version': data.version,
        'description': data.description
    });
    var newItem = {
      name : data.name,
      template_id : data.template_id,
      template_description : desc,
      network: item.network,
      type: data.type,
      version_history: newVersionHistory,
      version: Number(version)
    };
    setOpenDialog(false);
    Utils.addinfoNotification("Updating template...")
    Functions.updateTemplate(newItem, refreshToken, customerId, user)
    .then((res) => {
      toast.dismiss();
      if(res.message === "success" && res.statusCode === 200){
        Utils.addsuccessNotification("Successfully updated template.")
        //here we update the images in localStorage
        let newArr = [...templates];
        newArr = newArr.map((template) => {
          var res = { ...template}
          if(template.template_id === data.template_id){
            template.name = data.name
            template.description = desc
            template.network = newItem.network
            template.version_history = newVersionHistory
            template.version = parseFloat(version)
            res = { ...template}
          }
          return res
        })
        localStorage.setItem('templates', JSON.stringify(newArr));
      }
    })
    .catch((error) => { throw error });
  }

  const nodeSize = { x: 100, y: 100 };

  return(
    <>
      <Container>
        <Row>
          <Col sm={2}>
              <Accordion defaultExpanded={true}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Customized User Templates</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ maxHeight: 120 }} className="AccordionDetails">
                {type === 'assignment' ? null :
                  <div className="row">
                    {templates.length > 0 ?
                      templates.map((node, index) => {
                        if(node.type === 'stand_alone'){
                          return(
                            <div className="col-sm" key={index}>
                              <Node
                                key={index}
                                details={node}
                                name={node.name}
                                type="node"
                                source="templates"
                                // isDropped={isDropped(node.name)}
                              />
                            </div>
                          )
                        }
                      }):
                    <Grid item xs={12}>
                      <p className="card-description">No templates to display.</p>
                    </Grid>
                  }
                 </div>}
              </AccordionDetails>
            </Accordion>
            {type === 'assignment' ? null : <>
            <Accordion defaultExpanded={true}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2a-content"
                id="panel2a-header"
              >
                <Typography variant="subtitle2" color="textSecondary">
                 Stock Templates</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ maxHeight: 120 }} className="AccordionDetails">
                <div className="row">
                  {stockImages.length > 0 ?
                      stockImages.map((node, index) => {
                        // var type = node.codename === 'securityonion' ? 'dmz' : 'node'
                        var type = 'node'
                        if(node.tools !== true){
                          return(
                            <div className="col-sm" key={index}>
                              <Node
                                key={index}
                                details={node}
                                name={node.name}
                                source="stockimages"
                                type={type}
                                // isDropped={isDropped(node.name)}
                              />
                            </div>
                          )
                        }
                  }):
                  <Grid item xs={12}>
                    <p className="card-description">No templates to display.</p>
                  </Grid>
                }
              </div>
            </AccordionDetails>
            </Accordion>
            <Accordion defaultExpanded={true}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2a-content"
                id="panel2a-header"
              >
                <Typography variant="subtitle2" color="textSecondary">
                 Customized Stock Templates</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ maxHeight: 120 }} className="AccordionDetails">
                <div className="row">
                  {stockImages.length > 0 ?
                      stockImages.map((node, index) => {
                        if(node.tools === true){
                          return(
                            <div className="col-sm" key={index}>
                              <Node
                                key={index}
                                details={node}
                                name={node.name}
                                source="stockimages"
                                type="node"
                                // isDropped={isDropped(node.name)}
                              />
                            </div>
                          )
                        }
                  }):
                  <Grid item xs={12}>
                    <p className="card-description">No templates to display.</p>
                  </Grid>
                }
              </div>
              </AccordionDetails>
            </Accordion>
            </>
            }
          </Col>
          <Col sm={9}>
            <div className="g-title d-flex justify-content-between">
                {/*<div>
                Drop (VNet)<br/>
                <Tooltip title="The VNet's address space, specified as one or more address prefixes in CIDR notation (e.g. 192.168.0.0/16).">
                  <TextField
                    disabled
                    size="small"
                    id="input-with-icon-textfield"
                    value={vnetAddressRange}
                    label="Vnet address range"
                    InputProps={{
                      style: {fontSize: 10},
                      maxLength: 18,
                    }}
                    InputLabelProps={{style: {fontSize: 10}}}
                    variant="standard"
                    onChange={evt => setVnetAddressRange(evt.target.value)}
                  />
                </Tooltip>
                </div>*/}
                <div>
                Virtual Asset Count
                <span className={vmCount <20 ? "badge badge-pill badge-success" :
                        "badge badge-pill badge-danger"}
                      id="days">{vmCount}</span> used of
                <span className="badge badge-pill badge-danger"
                      id="hours"> {maxVmCount}</span>{' '}
                <Tooltip title="Add a public segment">
                  <Button
                    size="small"
                    style={{textTransform: 'none'}}
                    variant="contained"
                    onClick={() => addPublicNetwork()}
                    endIcon={<AddIcon/>}
                  >
                      Public Segment
                  </Button>
                </Tooltip>{' '}
                <Tooltip title="Add a private segment">
                  <Button
                    size="small"
                    style={{textTransform: 'none'}}
                    variant="contained"
                    onClick={() => addPrivateNetwork()}
                    endIcon={<AddIcon/>}
                  >
                      Private Segment
                  </Button>
                </Tooltip>{' '}
                <Tooltip title="Add a DMZ segment">
                <Button
                  size="small"
                  style={{textTransform: 'none'}}
                  variant="contained"
                  onClick={() => addDmzNetwork()}
                  endIcon={<AddIcon/>}
                >
                    DMZ Segment
                </Button>
              </Tooltip>{' '}
                <Tooltip title="use this network for the template">
                  <span>
                  <Button
                    size="small"
                    onClick={() => saveNetwork(type)}
                    style={{textTransform: 'none'}}
                    variant="contained"
                    disabled={editor.length < 1 ? true: false}
                    endIcon={<SaveIcon/>}
                  >
                      {type === 'template_view' ? 'Update': 'Save' }
                  </Button>
                  </span>
                </Tooltip>
              </div>
              <div>

              </div>
            </div>
            <div className="d-flex justify-content-start align-items-start">
            {editor.length > 0 ?
              editor.map((item, index) => {
              return(
                <div key={index} style={{marginLeft: '40px'}}>
                <Editor
                  key={index}
                  accept={item.accepts}
                  item={item}
                  onDrop={(itm) => handleDrop(index, itm, item.id)}
                  close={(itm) => deleteSubNetwork(index, itm, item.id)}
                  deletedItem={deleteNode}
                  editDetails={editSubnetDetails}
                  type={type}
                  networkvms={vmCount}
                  maxnetworkvms={maxVmCount}
                  update={updateNetwork}
                />
                </div>
              )
            }) :
              <Grid item xs={12}>
                <p className="card-description">
                  You need to create a subnets before you drop items and save the network.
                </p>
              </Grid>
            }
            </div>
          </Col>
          {/*<Col sm={3}>
            <Tree data={orgChart}
              rootNodeClassName="node__root"
              branchNodeClassName="node__branch"
              leafNodeClassName="node__leaf"
              zoomable={true}
              collapsible={true}
              orientation="horizontal"
              nodeSize={nodeSize}
              dimensions= {{ height: 200, width: 300 }}
              // centeringTransitionDuration= {800}
              translate={{ x: 5, y: 280 }}
              collapsible={true}
              // initialDepth={1}
              pathFunc="step"
              // depthFactor: undefined,
              zoom={0.6}
              // scaleExtent: { min: 0.1, max: 1 },
              separation= {{ siblings: 2, nonSiblings: 2 }}
              // enableLegacyTransitions= {false}
              // transitionDuration= {500}
            />
          </Col>*/}
        </Row>
      </Container>
      {/*A dialog box to warn the user before rebuilding the network*/}
      <PolicyDialog dashboard="nodepanel"
        open={openDialog}
        versionHistory={data!==null && data.version_history !== undefined ?
                          data.version_history : []}
        version={data!==null && data.version!== undefined ? data.version : 1}
        data={updatedNetwork}
        create={updateTemplate}
        override={overrideTemplate}
        close={handleCloseDialog}
      />
    </>
  )
})

export default NodePanel;
