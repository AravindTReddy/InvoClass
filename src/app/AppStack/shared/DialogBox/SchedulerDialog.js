import React, { Component } from "react";
import {Spinner, Form} from "react-bootstrap";
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import Checkbox from '@material-ui/core/Checkbox';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Slide from "@material-ui/core/Slide";
import WarningIcon from '@material-ui/icons/Warning';
import Button from '@material-ui/core/Button';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import moment from 'moment';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const CustomInput = React.forwardRef(({ value, onClick, zone }, ref) => (
  <TextField
    fullWidth
    size="small"
    variant="outlined"
    value={value}
    label="Choose a Date and Time"
    required
    helperText={`Your timezone ${zone} `}
    onClick={onClick}
    ref={ref}
  />
));

class SchedulerDialog extends Component {
  constructor(props) {
      super(props);
      this.state = {
        serverStatus: false,
        schedule_date: this.props.data.time !== undefined ? new Date(this.props.data.time) : new Date(),
        isSchedule: 'scheduled',
        // buildClasses: this.props.data.classData !== undefined ? this.props.data.classData : '',
        resource_id:  this.props.data.resource_id !== undefined ? this.props.data.resource_id : '',
        network: this.props.data.network,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        version: this.props.data.version !== undefined ? this.props.data.version : '',
      }
      this.versionChange = this.versionChange.bind(this);
  }

  //User date selection onchange handler function to set state dynamically
  setScheduleDate = async(date) => {
    if (date !== null)
      await this.setState({schedule_date: date})
  }

  handleChange = (event) => {
    if(event.target.value === 'immediate'){
      this.setState({schedule_date: new Date()})
    }else{
      this.setState({schedule_date: ''})
    }
    this.setState({isSchedule: event.target.value})
  };

  handleSchedule = () => {
    if(this.props.dashboard === 'class' || this.props.dashboard === 'customer')
      var item = this.state.serverStatus;
    else if(this.props.dashboard === 'template'){
      if(this.props.template !== 'network'){
        item = {
          resource_id: this.state.resource_id,
          template_id: this.props.data.template_id,
          user: this.props.user,
          name: this.props.data.name,
          version: this.state.version
        };
      }else {
        item = {
          network: this.state.network,
          template_id: this.props.data.template_id,
          user: this.props.user,
          name: this.props.data.name,
          version: parseFloat(this.state.version)
        };
      }
      var scheduler = {type: this.state.isSchedule, time: this.state.schedule_date.toUTCString()}
    }
    if(this.props.type === 'update'){
      item.redeploy = this.props.data.redeploy
      item.template_type = this.props.data.template_type
      this.props.update(item, scheduler, this.props.template);
    }
    else{
      this.props.create(item, scheduler, this.props.template);
    }
    // this.setState({
    //   serverStatus: false,
    //   schedule_date: new Date(),
    //   // isSchedule: 'scheduled', resource_id: '',
    //   // version: '', buildClasses: []
    // })
  }

  handleClose = () => {
    this.setState({
      serverStatus: false,
      schedule_date: '',
      isSchedule: 'scheduled',
    })
    this.props.close();
  }

  //version dropdown onchange handler function to update state
  versionChange(event) {
    if(this.props.template !== 'network'){
      const selectedIndex = event.target.options.selectedIndex;
      this.setState({
        resource_id: event.target.value,
        version: event.target.options[selectedIndex].getAttribute('data-key')
      });
    }else {
      // const selectedIndex = event.target.options.selectedIndex;
      this.setState({
        version: event.target.value,
        network: JSON.parse(event.currentTarget.getAttribute("net")),
        description: event.currentTarget.getAttribute("desc")
      });
    }
  }


  render() {
    var selectedTemp;
    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    userTemplates!== null && userTemplates.forEach((item, i) => {
      if(this.props.data.template_id === item.template_id)
        selectedTemp = {...item}
    });

    if(this.props.dashboard === 'template'){
        var title = "Build Scheduler"
        var message = `By rebuilding, all the student machines will be deleted and recreated using the latest version
                   of this lab template. The student data from their own disk will still be available.
                   Before proceeding please make sure all the classes using this lab template are in running state.`;
    }

    return (
      <Dialog
          open={this.props.open}
          TransitionComponent={Transition}
          keepMounted
          onClose={this.handleClose}
          aria-labelledby="alert-dialog-slide-title"
          aria-describedby="alert-dialog-slide-description"
          style={{overflowY: 'visible'}}
          PaperProps={{style: {overflowY: 'visible', minHeight: '50vh',
                        maxHeight: '50vh'}}}
          fullWidth={true}
          maxWidth='md'
      >
        <DialogTitle
            id="alert-dialog-slide-title">{ title }</DialogTitle>
        <DialogContent>
          {this.props.dashboard === 'template' &&
            <>
              <FormControl component="fieldset">
                <FormLabel component="legend">When do you want to start the task?</FormLabel>
                <RadioGroup aria-label="scheduler" name="scheduler"
                            value={this.props.type === 'update' ? 'scheduled' : this.state.isSchedule}
                            onChange={this.handleChange} required row>
                  <FormControlLabel value="scheduled" control={<Radio />} label="Schedule Date & Time" />
                  <FormControlLabel value="immediate" control={<Radio disabled={this.props.type === 'update'}/>} label="Manual Start(Immediately)" />
                </RadioGroup>
              </FormControl>
              {this.state.isSchedule === 'scheduled' && (
                <div className="row">
                  <div className="col-md-12">
                      <Form.Group className="row">
                          <div className="col-sm-12">
                            <DatePicker
                              selected={this.state.schedule_date}
                              timeFormat="p"
                              timeIntervals={1}
                              dateFormat="MMM d, yyyy h:mm a"
                              onChange={(date) => this.setScheduleDate(date)}
                              customInput={<CustomInput zone={this.state.timeZone}/>}
                              showTimeSelect
                              required
                              minDate={new Date()}
                              showYearDropdown
                              showMonthDropdown
                            />
                          </div>
                      </Form.Group>
                  </div>
                </div>
              )}
              <div className="row">
              {this.props.template !== 'network' ?
               <div className="col-md-6">
                  <Form.Group className="row">
                      <div className="col-sm-12">
                        <select
                              value={this.state.resource_id === '' ? this.props.data.resource_id : this.state.resource_id}
                              onChange={this.versionChange}
                              required
                              className="sm sm-form"
                            >
                            {this.props.data!== '' &&
                              selectedTemp.version_history.map((item, index) => {
                                  return (<option key={index}
                                                  data-key={item.version}
                                                  value={item.resource_id}>
                                            v{item.version}{' -- '}{item.description}
                                          </option>);
                              })
                            }
                            <option value={this.props.data.resource_id}>
                              v{this.props.data.version}{' -- '}{this.props.data.description}
                            </option>

                          </select>
                          </div>
                      </Form.Group>
                  </div> :

                <div className="col-md-6">
                    <Form.Group className="row">
                        <div className="col-sm-12">
                          <TextField
                            fullWidth
                            size="small"
                            select
                            label="Template Version"
                            value={this.state.version}
                            onChange={this.versionChange}
                            required
                            variant="outlined"
                          >
                            {this.props.data!== '' &&
                              selectedTemp.version_history.map((item, index) => {
                                  return (<MenuItem key={index}
                                                  net={JSON.stringify(item.network)}
                                                  desc={item.description}
                                                  value={item.version}>
                                            v{item.version}{' -- '}{item.description}
                                          </MenuItem>);
                              })
                            }
                             <MenuItem value={selectedTemp.version} network={selectedTemp.network}
                                        desc={selectedTemp.description}>
                              v{selectedTemp.version}{' -- '}{selectedTemp.description}
                            </MenuItem>
                          </TextField>
                        </div>
                    </Form.Group>
                </div> }
                {/*<div className="col-md-12">
                    <Form.Group className="row">
                        <div className="col-sm-12">
                          <FormLabel component="legend">For which classes do you wish to run this build?</FormLabel>
                          {this.props.classData !== '' ? <>
                            {this.props.classData.length > 0 ?
                              <>
                                {this.props.classData.map((item, index) => (
                                  <>
                                    {item.vm_status !== 'online' ?
                                    <span data-toggle="tooltip" data-placement="top"
                                       title="Make sure your class server is in running state before you schedule/intiate a build.">
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={this.state.buildClasses.indexOf(item.class_id) !== -1 && item.vm_status === 'online'}
                                            onChange={this.classesChange(item.class_id)}
                                            name={item.class_name}
                                            color="primary"
                                            disabled={item.vm_status !== 'online'}
                                          />
                                        }
                                        label={item.class_name}
                                      />
                                      </span> :
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={this.state.buildClasses.indexOf(item.class_id) !== -1 && item.vm_status === 'online'}
                                            onChange={this.classesChange(item.class_id)}
                                            name={item.class_name}
                                            color="primary"
                                            disabled={item.vm_status !== 'online'}
                                          />
                                        }
                                        label={item.class_name}
                                      /> }
                                  </>
                                ))}
                              </> : <FormLabel>No classes available under this image</FormLabel>
                            }</> : <div className="d-flex justify-content-start">
                              <Spinner  animation="border" role="status">
                                  <span className="sr-only">Loading...</span>
                              </Spinner>
                            </div>
                          }
                        </div>
                      </Form.Group>
                  </div>*/}
              </div>
          </>}
              <DialogContentText id="alert-dialog-slide-description">
                <WarningIcon/>{message}
              </DialogContentText>

          </DialogContent>
          <DialogActions>
              <Button onClick={this.handleClose} color="primary">
                  Cancel
              </Button>
              {this.props.type !== 'update' ?
                <Button onClick={this.handleSchedule} color="primary"
                        disabled={this.state.schedule_date === ''}>
                    Schedule
                </Button> :
                <Button onClick={this.handleSchedule} color="primary"
                        disabled={
                                  this.state.schedule_date === ''}>
                    update
                </Button> }
          </DialogActions>
      </Dialog>
    );
  }
}

export default SchedulerDialog;
