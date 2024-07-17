import React, { useState, memo, useEffect } from 'react';
import Utils from '../../shared/Utils';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import { stockImage, templateSteps, templateTypes, templateSizes } from "../../shared/General.js";
import Typography from '@material-ui/core/Typography';
import { Form } from 'react-bootstrap';
import TextField from '@material-ui/core/TextField';
import Card from '@material-ui/core/Card';
import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import Button from '@material-ui/core/Button';
import MenuItem from '@material-ui/core/MenuItem';
import Radio from '@mui/material/Radio';
import LanIcon from '@mui/icons-material/Lan';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import EditorDialog from './TemplateEditor'
import PermDeviceInformationIcon from '@mui/icons-material/PermDeviceInformation';
import FormatColorFillIcon from '@mui/icons-material/FormatColorFill';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import PreviewIcon from '@mui/icons-material/Preview';
import { styled as styled1 } from "@mui/material/styles";
import StepConnector, {
  stepConnectorClasses
} from "@mui/material/StepConnector";
import PropTypes from "prop-types";
import styled from "styled-components";
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

const TemplateStepperWizard = memo(function StepperWizard({create, close}) {

  const [activeStep, setActiveStep] = useState(0);
  const [skipped, setSkipped] = useState(new Set())
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [checkedTemplate, setCheckedTemplate] = useState('');
  const [templateVersion, setTemplateVersion] = useState(1.0);
  const [templateResourceId, setTemplateResourceId] = useState('');
  const [templateNsg, setTemplateNsg] = useState('');
  const [templateSize, setTemplateSize] = useState('');
  const [templatePlan, setTemplatePlan] = useState('');
  const [templateCode, setTemplateCode] = useState('');
  const [refreshToken, setRefreshToken] = useState('');
  const [stockImages, setStockImages] = useState([]);
  const [showStockImages, setShowStockImages] = useState(false);
  const [showCustomImages, setShowCustomImages] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showCustomNetworks, setShowCustomNetworks] = useState(false);
  const [checkedTemplateSize, setCheckedTemplateSize] = useState('');
  const [showNetwork, setShowNetwork] = useState(false);
  const [network, setNetwork] = useState(null);
  const [networkAddressRange, setNetworkAddressRange] = useState('');
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    //this is like our componentDidMount
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var stockImages = JSON.parse(localStorage.getItem('stockimages'));
    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    userTemplates !== null && setTemplates(userTemplates);
    stockImages !== null && setStockImages(stockImages);
    if(userAuthDetails !== null){
      setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
    }
  }, [refreshToken]);

  const isStepOptional = (step) => {
    return step === 1 || 2 || 3;
  };
  const isStepSkipped = (step) => {
    return skipped.has(step);
  };
  const handleNext = (e) => {
    e.preventDefault();
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }
    setActiveStep(activeStep + 1);
    setSkipped(newSkipped);
    if(activeStep === 2){
      if(checkedTemplate === 'network'){
        var item = {
          template_network: network,
          template_name: templateName,
          template_description: templateDescription,
          template_code: templateCode,
          network_address_range: networkAddressRange
        }
      }else {
        item = {
          template_name: templateName,
          template_resourceId: templateResourceId,
          template_nsg: templateNsg,
          template_size: templateSize,
          template_version: templateVersion,
          template_plan: templatePlan,
          template_code: templateCode,
          template_description: templateDescription
        }
      }
      create(item);
    }
  };
  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };
  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      throw new Error("You can't skip a step that isn't optional.");
    }
    setActiveStep(activeStep + 1)
    const newSkipped = new Set(skipped.values());
    newSkipped.add(activeStep);
    setSkipped(newSkipped);
  };

  const handleTemplateTypeChange = (event) => {
    setCheckedTemplate(event.target.value)
    if(event.target.value === 'network'){
      setShowStockImages(false);
      setShowCustomImages(false);
      // setShowEditor(true);
    }else {
      setShowCustomNetworks(false);
      // setShowStockImages(true);
      // setShowEditor(false);
    }
  };

  const stockImageChange = (event) => {
    setTemplateResourceId(event.target.value);
    setTemplateNsg(event.currentTarget.getAttribute("data-nsg"));
    setTemplateSize(event.currentTarget.getAttribute("data-vm_size"));
    setTemplatePlan(JSON.parse(event.currentTarget.getAttribute("data-plan")));
    setTemplateCode(event.currentTarget.getAttribute("data-code"))
  }

  const customImageChange = (event) => {
    setTemplateResourceId(event.target.value);
    setTemplateNsg(event.currentTarget.getAttribute("data-nsg"));
    setTemplateSize(event.currentTarget.getAttribute("data-vm_size"));
    setTemplatePlan(JSON.parse(event.currentTarget.getAttribute("data-plan")));
    setTemplateCode(event.currentTarget.getAttribute("data-code"))
  }

  const customNetworkChange = (event) => {
    const item = {
      network: JSON.parse(event.target.value)
    }
    setNetwork(item);
    setTemplateCode(event.currentTarget.getAttribute("data-code"));
    setNetworkAddressRange(event.currentTarget.getAttribute("data-address"));
  }

  const openStockImages = () => {
    setShowStockImages(!showStockImages);
    setShowCustomImages(false);
  }

  const openCustomImages = () => {
    setShowCustomImages(!showCustomImages);
    setShowStockImages(false);
  }

  const openCustomNetworks = () => {
    setShowCustomNetworks(!showCustomNetworks);
    setShowEditor(false);
  }

  const openEditor = () => {
    setShowEditor(!showEditor);
    setShowCustomNetworks(false);
  }

  const handleCloseEditorDialog = () => {
    setShowEditor(!showEditor);
  }

  const useNetwork = async (item, address) => {
    setShowNetwork(true)
    setNetwork(item);
    setNetworkAddressRange(address);
  }

  const updateNetwork = (item) => {
    console.log(item);
    // setNetwork(item);
  }

  const ColorlibConnector = styled1(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        "linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)"
    }
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage:
        "linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)"
    }
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.grey[800] : "#eaeaf0",
    borderRadius: 1
  }
}));
const ColorlibStepIconRoot = styled1("div")(({ theme, ownerState }) => ({
  backgroundColor:
    theme.palette.mode === "dark" ? theme.palette.grey[700] : "#ccc",
  zIndex: 1,
  color: "#fff",
  width: 50,
  height: 50,
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  ...(ownerState.active && {
    backgroundImage:
      "linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)",
    boxShadow: "0 4px 10px 0 rgba(0,0,0,.25)"
  }),
  ...(ownerState.completed && {
    backgroundImage:
      "linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)"
  })
}));

function ColorlibStepIcon(props) {
  const { active, completed, className } = props;

  const icons = {
    1: <PermDeviceInformationIcon />,
    2: <DesignServicesIcon />,
    3: <PreviewIcon />
  };

  return (
    <ColorlibStepIconRoot
      ownerState={{ completed, active }}
      className={className}
    >
      {icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  );
}

ColorlibStepIcon.propTypes = {
  active: PropTypes.bool,
  className: PropTypes.string,
  completed: PropTypes.bool,
  icon: PropTypes.node
};

const Item = styled.div`
  display: flex;
  align-items: center;
  height: 48px;
  position: relative;
`;

const RadioButtonLabel = styled.label`
  position: absolute;
  top: 25%;
  left: 4px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 1px solid #bebebe;
`;
const RadioButton = styled.input`
  opacity: 0;
  z-index: 1;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  margin-right: 10px;
  &:hover ~ ${RadioButtonLabel} {
    background: #bebebe;
    &::after {
      content: "";
      display: block;
      border-radius: 50%;
      width: 12px;
      height: 12px;
      margin: 6px;
      background: #eeeeee;
    }
  }
  ${(props) =>
    props.checked &&
    `
    &:checked + ${RadioButtonLabel} {
      background: #db7290;
      border: 1px solid #db7290;
      &::after {
        content: "";
        display: block;
        border-radius: 50%;
        width: 12px;
        height: 12px;
        margin: 6px;
        box-shadow: 1px 3px 3px 1px rgba(0, 0, 0, 0.1);
        background: white;
      }
    }
  `}
`;

  return (
    <>
    <div className="row">
      <div className="col-md-12">
        <Box sx={{ width: '100%' }}>
           <Stepper activeStep={activeStep}
            connector={<ColorlibConnector/>}>
             {templateSteps.map((label, index) => {
               const stepProps = {};
               const labelProps = {};
               if (isStepOptional(index)) {
                 labelProps.optional = (
                   <Typography variant="caption"></Typography>
                 );
               }
               if (isStepSkipped(index)) {
                 stepProps.completed = false;
               }
               return (
                 <Step key={label} {...stepProps}>
                   <StepLabel StepIconComponent={ColorlibStepIcon} {...labelProps}>
                      {label}
                   </StepLabel>
                 </Step>
               );
             })}
           </Stepper>
            <br/>
            <form onSubmit={handleNext}>
             {activeStep === 0 ?
                <div className="row">
                  <div className="col-md-12">
                     <Form.Group className="row">
                         <div className="col-sm-12">
                           <TextField
                             fullWidth
                             size="small"
                             variant="outlined"
                             label="Template name"
                             value={templateName}
                             type='text'
                             required
                             InputProps={{style: {fontSize: 12}}}
                             onChange={evt => setTemplateName(evt.target.value.trim())}
                             helperText='No spaces are allowed in the name.'
                           />
                         </div>
                     </Form.Group>
                  </div>
                  <div className="col-md-6">
                     <Form.Group className="row">
                         <div className="col-sm-12">
                           <TextField
                             fullWidth
                             size="small"
                             variant="outlined"
                             label="Template version"
                             value={templateVersion}
                             type='number'
                             required
                             InputProps={{style: {fontSize: 12}}}
                             inputProps={{ min: 1.0, step: 0.1 }}
                             onChange={evt => setTemplateVersion(evt.target.value)}
                           />
                         </div>
                     </Form.Group>
                  </div>
                  <div className="col-md-6">
                      <Form.Group className="row">
                          <div className="col-sm-12">
                            <TextField
                              fullWidth
                              size="small"
                              variant="outlined"
                              label="Template Description"
                              value={templateDescription}
                              rows={5}
                              multiline
                              InputProps={{style: {fontSize: 12}}}
                              onChange={evt => setTemplateDescription(evt.target.value)}
                            />
                          </div>
                      </Form.Group>
                  </div>
                </div> : null
              }
              {activeStep === 1 ?
                <>
                  <div className="row">
                    <div className="col-md-12">
                       <Form.Group className="row">
                         <div className="col-sm-12">
                           <Grid
                               container
                               spacing={2}
                               direction="row"
                               justifyContent="flex-start"
                               alignItems="flex-start"
                           >
                           {templateTypes.map((item, index) => {
                             return(
                               <Grid item xs={12} sm={12} md={6} key={index}>
                                 <Card>
                                   <CardContent>
                                     <Typography variant="subtitle1" component="h5" gutterBottom>
                                     {item.type === 'network' ?
                                       <LanIcon sx={{ fontSize: 60}}/> :
                                       <DesktopWindowsIcon sx={{ fontSize: 60}}/>
                                     }
                                     <Radio
                                       required
                                       checked={checkedTemplate === item.type}
                                       onChange={handleTemplateTypeChange}
                                       value={item.type}
                                       color="default"
                                       name="radio-button-os"
                                     />{item.name}
                                     </Typography>
                                     <Typography  variant="subtitle2" color="textSecondary" gutterBottom>
                                       {item.description}
                                     </Typography>
                                   </CardContent>
                                 </Card>
                               </Grid>
                             )
                           })
                         }
                         </Grid>
                        </div>
                      </Form.Group>
                    </div>
                  </div>
                  {checkedTemplate === 'network' ?
                    <div className="d-flex justify-content-center align-items-center">
                     <div className="col-md-6">
                        <Form.Group className="row">
                            <div className="col-sm-12">
                            <Item className="checkbox-div">
                               <RadioButton
                                 type="radio"
                                 name="radio"
                                 checked={showEditor || showNetwork}
                                 onChange={() => openEditor()}
                                 required
                               />
                               <RadioButtonLabel />
                               <div style={{fontSize: 16}}>Use editor to design a Network</div>
                            </Item>
                            </div>
                        </Form.Group>
                     </div>
                     <div className="col-md-6">
                         <Form.Group className="row">
                             <div className="col-sm-12">
                               <Item className="checkbox-div">
                                  <RadioButton
                                    type="radio"
                                    name="radio"
                                    checked={showCustomNetworks}
                                    onChange={() => openCustomNetworks()}
                                    required
                                  />
                                  <RadioButtonLabel />
                                  <div style={{fontSize: 16}}>Clone using an existing networked lab template</div>
                               </Item>
                             </div>
                         </Form.Group>
                     </div>
                   </div> : checkedTemplate === 'stand_alone' ?
                    <div className="d-flex justify-content-center align-items-center">
                     <div className="col-md-6">
                        <Form.Group className="row">
                            <div className="col-sm-12">
                              <Item className="checkbox-div">
                                 <RadioButton
                                   type="radio"
                                   name="radio"
                                   checked={showStockImages}
                                   onChange={() => openStockImages()}
                                   required
                                   value={showStockImages}
                                 />
                                 <RadioButtonLabel />
                                 <div style={{fontSize: 16}}>Use an InvoClass Stock Image</div>
                              </Item>
                            </div>
                        </Form.Group>
                     </div>
                     <div className="col-md-6">
                         <Form.Group className="row">
                             <div className="col-sm-12">
                               <Item className="checkbox-div">
                                  <RadioButton
                                    type="radio"
                                    name="radio"
                                    checked={showCustomImages}
                                    onChange={() => openCustomImages()}
                                    required
                                    disabled={templates.some(template => template.type === "stand_alone")}
                                  />
                                  <RadioButtonLabel />
                                  <div style={{fontSize: 16}}>Create a new Template derived from an existing Stand Alone Template</div>
                               </Item>
                             </div>
                         </Form.Group>
                     </div>
                   </div> : null
                  }

                  {showStockImages && (
                    <div className="row">
                      <div className="col-md-12">
                         <Form.Group className="row">
                             <div className="col-sm-12">
                             {stockImages.map((entry) => {
                               if(entry.tools !== true){
                                 return(
                                   <Item key={entry.template_id}>
                                    <RadioButton
                                      InputProps={{style: {fontSize: 12}}}
                                      type="radio"
                                      name="stockImages"
                                      value={entry.resource_id}
                                      data-code={entry.codename}
                                      data-nsg={entry.nsg}
                                      data-vm_size={entry.vm_size}
                                      data-plan={JSON.stringify(entry.plan)}
                                      checked={templateResourceId === entry.resource_id}
                                      onChange={(event) => stockImageChange(event)}
                                      required
                                    />
                                    <RadioButtonLabel />
                                    <div>{entry.name} / {entry.os}</div>
                                  </Item>
                                 )
                               }
                              })}
                             </div>
                         </Form.Group>
                      </div>
                    </div>
                  )}
                  {showCustomImages && (
                    <div className="row">
                      <div className="col-md-12">
                         <Form.Group className="row">
                            <div className="col-sm-12">
                             {templates && templates.some(template => template.type === "stand_alone") ?
                              templates.map((entry) => {
                               if(entry.type === 'stand_alone'){
                                 return(
                                   <Item key={entry.template_id}>
                                    <RadioButton
                                      type="radio"
                                      name="customImages"
                                      value={entry.resource_id}
                                      data-code={entry.codename}
                                      data-nsg={entry.nsg}
                                      data-vm_size={entry.vm_size}
                                      data-plan={JSON.stringify(entry.plan)}
                                      checked={templateResourceId === entry.resource_id}
                                      onChange={(event) => customImageChange(event)}
                                      required
                                    />
                                    <RadioButtonLabel />
                                    <div style={{fontWeight: 'normal'}}>
                                      <span style={{fontSize: '13px'}}>
                                        {entry.name}
                                      </span>
                                      <br />
                                      <span style={{fontSize: '11px', color: 'gray' }}>
                                        {entry.description}
                                      </span>
                                    </div>
                                  </Item>
                                 )
                               }
                             }) : null }
                             </div>
                         </Form.Group>
                      </div>
                    </div>
                  )}
                  {showCustomNetworks && (
                    <div className="row">
                      <div className="col-md-12">
                         <Form.Group className="row">
                            <div className="col-sm-12">
                             {templates && templates.some(template => template.type === "network") ?
                              templates.map((entry) => {
                               if(entry.type === 'network'){
                                 return(
                                   <Item key={entry.template_id}>
                                    <RadioButton
                                      type="radio"
                                      name="customNetworks"
                                      value={JSON.stringify(entry.network)}
                                      data-code={entry.codename}
                                      data-address={entry.vnet_address_range}
                                      // checked={network !== null && JSON.stringify(network.network) === JSON.stringify(entry.network)}

                                      checked={network!== null && JSON.stringify(network.network) === JSON.stringify(entry.network)}
                                      // checked={network === entry.network}
                                      onChange={(event) => customNetworkChange(event)}
                                      required={true}
                                    />
                                    <RadioButtonLabel />
                                    <div style={{fontWeight: 'normal'}}>
                                      <span style={{fontSize: '13px'}}>
                                        {entry.name}
                                      </span>
                                      <br />
                                      <span style={{fontSize: '11px', color: 'gray' }}>
                                        {entry.description}
                                      </span>
                                    </div>
                                  </Item>
                                 )
                               }
                             }) : null }
                             </div>
                         </Form.Group>
                      </div>
                    </div>
                  )}
                  {showNetwork && (
                    <div className="row">
                      <div className="col-md-12">
                         <Form.Group className="row">
                            <div className="col-sm-12">
                              {network!== null && network.network.map((item, index) => {
                                  return(
                                    <Card>
                                      <CardContent>
                                        Subnet name: {item.subnet_name.replace(/_/g, ' ')} <br/>
                                        Subnet type: {item.subnet_type} <br/>
                                        Subnet address range: {item.subnet_address_range} <br/>
                                        No of machines: {item.machines.length}
                                        {item.machines.map((machine) => {
                                          return(
                                            <li>{machine.name === undefined ? machine.image_name : machine.name}</li>
                                          )
                                        })}
                                      </CardContent>
                                    </Card>
                                  )
                                })
                              }
                             </div>
                         </Form.Group>
                      </div>
                    </div>
                  )}
                </> : null
               }
               {activeStep === 2 ? (
                  <React.Fragment>
                    <Typography sx={{ mt: 2, mb: 1 }}>
                    <div className="row">
                      <div className="col-md-6">
                         <Form.Group className="row">
                             <div className="col-sm-12">
                               <TextField
                                 fullWidth
                                 size="small"
                                 variant="outlined"
                                 label="Lab Template name"
                                 value={templateName}
                                 disabled
                               />
                             </div>
                         </Form.Group>
                      </div>
                      <div className="col-md-6">
                         <Form.Group className="row">
                             <div className="col-sm-12">
                               <TextField
                                 fullWidth
                                 size="small"
                                 variant="outlined"
                                 label="Lab Template version"
                                 value={templateVersion}
                                 disabled
                               />
                             </div>
                         </Form.Group>
                      </div>
                      <div className="col-md-12">
                        <Form.Group className="row">
                            <div className="col-sm-12">
                              <TextField
                                fullWidth
                                size="small"
                                variant="outlined"
                                label="Lab Template Description"
                                value={templateDescription}
                                disabled
                              />
                            </div>
                        </Form.Group>
                      </div>
                    </div>
                    </Typography>
                  </React.Fragment>
                ) : null }

                {activeStep === 3 ? (
                <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                  >
                    Back
                  </Button>&nbsp;&nbsp;
                  <Button variant="contained"
                          color="primary" type="submit" >
                    {activeStep === templateSteps.length - 1 ? 'Finish' : 'Next'}
                  </Button>
                  <Box sx={{ flex: '1 1 auto' }} />
                  <Button
                    onClick = {close}
                     variant="contained"
                     color="primary"  sx={{ mr: 1 }}>
                    Cancel
                  </Button>
                </Box> ) : activeStep === 4 ? null : (
                  <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={activeStep === 0}
                      onClick={handleBack}
                      sx={{ mr: 1 }}
                    >
                      Back
                    </Button>&nbsp;&nbsp;
                    <Button variant="contained"
                      disabled={(!templates.some(template => template.type === "stand_alone") && showCustomImages) ||
                                (!templates.some(template => template.type === "network") && showCustomNetworks) ||
                                (templates.length === 0 && showCustomImages)
                              }
                            color="primary" type="submit" >
                      {activeStep === templateSteps.length - 1 ? 'Finish' : 'Next'}
                    </Button>
                    <Box sx={{ flex: '1 1 auto' }} />
                    <Button
                      onClick = {close}
                       variant="contained"
                       color="primary"  sx={{ mr: 1 }}>
                      Cancel
                    </Button>
                  </Box>
                )
              }
            </form>
          </Box>
        </div>
      </div>
      {/*A pop up with drag and drop interface to create new network template*/}
      {showEditor && (
        <EditorDialog
          type="template_create"
          address="10.0.0.0/16"
          name={templateName}
          data={network!== null ? network : network}
          fullScreen
          create={useNetwork}
          update={updateNetwork}
          open={showEditor}
          close={handleCloseEditorDialog}
        />
      )}
    </>
  )
})
export default TemplateStepperWizard
