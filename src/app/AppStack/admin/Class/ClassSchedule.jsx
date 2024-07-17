import React, { useState, useEffect } from 'react';
import {
  TextField, Button, InputLabel, MenuItem, Checkbox,
  Container, Paper, Typography, Grid, Autocomplete, CardMedia,
  FormControlLabel
} from '@mui/material';
import { Form, Spinner } from 'react-bootstrap';
import { languages, classLevels, classCategories, videoConferenceInfo,
          weekDays, repeatEvents } from '../../shared/General'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import EditIcon from '@mui/icons-material/Edit';
import moment from 'moment';
import Builds from './Builds'

const ClassSchedule = ({ step2Data, setStep2Data, handleNext }) => {
  const [dateTimeError, setDateTimeError] = useState(null);
  const [timeZone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [checkedState, setCheckedState] = useState(new Array(7).fill(false))
  const [templates, setTemplates] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedTemplateVersion, setSelectedTemplateVersion] = useState(null);
  const [repeatEventType, setRepeatEventType] = useState('');
  const [repeatEventTypeValue, setRepeatEventTypeValue] = useState(1);
  const [recurring, setRecurring] = useState(false);
  const [startDayOfWeek, setStartDayOfWeek] = useState(0);
  const [daysOfWeek, setDaysOfWeek] = useState([]);


  const CustomInput = React.forwardRef(({ value, onClick, label, zone }, ref) => {
    return (
      <TextField
        fullWidth
        size="small"
        variant="outlined"
        value={value}
        label={`Class ${ label }`}
        required
        helperText={dateTimeError !== null ? dateTimeError : zone }
        onClick={onClick}
        ref={ref}
        InputLabelProps={{style: {fontSize: 14}}}
        error={dateTimeError !== null}
      />
    )
  })

  useEffect(() => {
    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    var userInstructors = JSON.parse(localStorage.getItem('instructors'));
    userTemplates !== null && setTemplates(userTemplates);
    userInstructors !== null && setInstructors(userInstructors);
    if(step2Data.classRecurring!== undefined){
      setRecurring(step2Data.classRecurring.recurring);
      setRepeatEventType(step2Data.classRecurring.type);
      setStartDayOfWeek(step2Data.classRecurring.startDayOfWeek)
    }
    const newCheckedState = [...checkedState];
    step2Data.classActiveDays!== undefined && step2Data.classActiveDays.map((day) => {
      newCheckedState[day] = true;
      setCheckedState(newCheckedState);
    })
    if (step2Data.templateDetails && step2Data.templateVersion) {
      const templateVersions = getAllVersions(step2Data.templateDetails);
      const selectedVersion = templateVersions.find(version => version.version === step2Data.templateVersion);
      setSelectedTemplate(step2Data.templateDetails);
      setSelectedTemplateVersion(selectedVersion);
    }
  }, [step2Data, selectedTemplate])

  // Function to get all versions including the latest one
  const getAllVersions = (template) => {
    if (!template) return [];
    const allVersions = [...template.version_history];
    allVersions.push({
      version: template.version,
      description: template.description,
      resource_id: template.resource_id
    });
    return allVersions;
  };

  const handleInputChange = (event) => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0)
    const nextYearMidnight = new Date();
    nextYearMidnight.setHours(0, 0, 0, 0);
    nextYearMidnight.setFullYear(nextYearMidnight.getFullYear() + 1);
    const { name, value } = event.target;
    if(name === 'classType' && value !== 'online'){
      setStep2Data((prevData) => ({
        ...prevData,
        ['classStartDate']: todayMidnight,
        ['classEndDate']: nextYearMidnight,
        ['classActiveDays']: [0, 1, 2, 3, 4, 5, 6],
        ['classVideoConference']: 'no-video'
      }));
    }
    setStep2Data((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const generateExclusiveCode = () => {
    // Generate a random unique code
    const code = Math.random().toString(36).substr(2, 8);
    setStep2Data((prevData) => ({
      ...prevData,
      classExclusive: {
        value: 'yes',
        code: code,
      },
    }));
  };

  const handleClassExclusiveChange = (event) => {
    const { value } = event.target;
    if (value === 'yes') {
      generateExclusiveCode();
    } else {
      setStep2Data((prevData) => ({
        ...prevData,
        classExclusive: {
          value: 'no',
          code: '',
        },
      }));
    }
  };

  const handleInstructorChange = (event) => {
    const { value } = event.target;
    const selectedInstructor = instructors.find((instructor) => instructor.email === value);
    setStep2Data((prevData) => ({
      ...prevData,
      ['classEducators']: value
    }));
    // setInstructorEmail(event.target.value)
    // setClassEducators(event.target.value);
  }

  const handleClassStartDateChange = (date) => {
    setDateTimeError(null);
    const index = daysOfWeek.indexOf(startDayOfWeek);
    if (index > -1) {
      daysOfWeek.splice(index, 1);
    }
    const startDayValue = moment(date).day();
    const updatedCheckedState = checkedState.map((item, index) =>
     index === startDayValue ? !item : item
    );
    setCheckedState(updatedCheckedState);
    setStartDayOfWeek(startDayValue);
    setDaysOfWeek(daysOfWeek.concat(moment(date).day()));
    // Update class start date in the state
    setStep2Data((prevData) => ({
      ...prevData,
      ['classStartDate']: date,
      classRecurring: {
        ...prevData.classRecurring,
        startDayOfWeek: startDayValue
      }
    }));
    if (step2Data.classType === 'online') {
      const startDate = moment(date);
      const endDate = moment(step2Data.classEndDate);
      // Check if the start date is after the end date
      if (startDate.isAfter(endDate, 'day')) {
        setDateTimeError('Start date cannot be after end date');
      } else if (startDate.isSame(endDate, 'day') &&
                 startDate.isSame(endDate, 'hour') &&
                 startDate.isSame(endDate, 'minute')) {
        // Check if the start time is the same as the end time
        setDateTimeError('Start time cannot be equal to end time');
      } else if (startDate.isSame(endDate, 'day') &&
                 startDate.isAfter(endDate, 'minute')) {
        // Check if the start time is after the end time on the same day
        setDateTimeError('Start time cannot be after end time');
      } else {
        setDateTimeError(null);
      }
    }
  };

  const handleClassEndDateChange = (date) => {
    setDateTimeError(null);
    // Update class end date in the state
    setStep2Data((prevData) => ({
      ...prevData,
      ['classEndDate']: date,
    }));
    if (step2Data.classType === 'online') {
      const startDate = moment(step2Data.classStartDate);
      const endDate = moment(date);
      // Check if the end date is before the start date
      if (endDate.isBefore(startDate, 'day')) {
        setDateTimeError('End date cannot be before start date');
      } else if (endDate.isSame(startDate, 'day') &&
                 endDate.isSame(startDate, 'hour') &&
                 endDate.isSame(startDate, 'minute')) {
        // Check if the end time is the same as the start time
        setDateTimeError('End time cannot be equal to start time');
      } else if (endDate.isSame(startDate, 'day') &&
                 endDate.isBefore(startDate, 'minute')) {
        // Check if the end time is before the start time on the same day
        setDateTimeError('End time cannot be before start time');
      } else {
        setDateTimeError(null);
      }
    }
  };

  const handleClassStartTimeChange = (date) => {
    setDateTimeError(null);
    // Update class start date in the state
    setStep2Data((prevData) => ({
      ...prevData,
      ['classStartDate']: date,
    }));
    const startDate = moment(date);
    const endDate = moment(step2Data.classEndDate);
    // Check if the start date is after the end date
    if (startDate.isAfter(endDate)) {
      setDateTimeError("Start date cannot be after end date");
    } else {
      // Check if the start date and time is the same as the end date and time
      if (startDate.isSame(endDate, 'day') &&
          startDate.isSame(endDate, 'hour') &&
          startDate.isSame(endDate, 'minute')) {
        setDateTimeError('Start time cannot be the same as end time');
      } else if (startDate.isSame(endDate, 'day') && startDate.isAfter(endDate, 'minute')) {
        setDateTimeError('Start time cannot be after end time');
      } else {
        setDateTimeError(null);
      }
    }
  };

  const handleClassEndTimeChange = (date) => {
    setDateTimeError(null);
    const startDate = moment(step2Data.classStartDate);
    const endDate = moment(date);
    // Check if the end date is before the start date
    if (endDate.isBefore(startDate)) {
      setDateTimeError("End date cannot be before start date");
    } else {
      // Check if the end date and time is the same as the start date and time
      if (endDate.isSame(startDate, 'day') && endDate.isSame(startDate, 'hour') && endDate.isSame(startDate, 'minute')) {
        setDateTimeError('End time cannot be the same as start time');
      } else {
        setDateTimeError(null);
      }
    }
    setStep2Data((prevData) => ({
      ...prevData,
      ['classEndDate']: date,
    }));
  };


  const handleClassVideoConferenceChange = (event) => {
    setStep2Data((prevData) => ({
      ...prevData,
      ['classVideoConference']: event.target.value,
    }));
    // var dayValue = [];
    // checkedState.map((item, index) => {
    //   item === true && dayValue.push(index)
    // })
    // if(dayValue.length > 0)
    //   var classDaysOfWeek = dayValue
    // else classDaysOfWeek = [0, 1, 2, 3, 4, 5, 6]
    // setStep2Data((prevData) => ({
    //   ...prevData,
    //   ['classActiveDays']: classDaysOfWeek,
    // }));
  };

  //days of week checkbox onchange handler function to update state
  const daysOfWeekChange = (position) => {
    const updatedCheckedState = checkedState.map((item, index) =>
     index === position ? !item : item
   );
   setCheckedState(updatedCheckedState);
   var dayValue = [];
   updatedCheckedState.map((item, index) => {
     item === true && dayValue.push(index)
   })
   if(dayValue.length > 0)
     var classDaysOfWeek = dayValue
   else classDaysOfWeek = [0, 1, 2, 3, 4, 5, 6]
   setStep2Data((prevData) => ({
     ...prevData,
     ['classActiveDays']: classDaysOfWeek,
   }));
  }

  const renderOption = (props, option) => (
    <div style={{fontWeight: 'normal'}} {...props}>
      <span style={{fontSize: '13px'}}>
        {option.name}
      </span>
      <br />
      <span style={{fontSize: '11px', color: 'gray' }}>
        {option.description}{' '}
        <span className="badge badge-success">{option.type}</span>
      </span>
    </div>
  );

  const handleTemplateManagement = () => {
    //open dialog on top of this or to a new tab or new component
  }

  const handleClassPublish = () => {
    setStep2Data((prevData) => ({
      ...prevData,
      ['classPublish']: !step2Data.classPublish,
    }));
  }

  const repeatEventTypeChange = (event) => {
    setRepeatEventType(event.target.value);
    setStep2Data((prevData) => ({
      ...prevData,
      classRecurring: {
        ...prevData.classRecurring,
        type: event.target.value,
      }
    }));
  }

  const repeatEventTypeValueChange = (event) => {
    if(repeatEventType === 'daily'){
      var dayStepValue = parseInt(event.target.value);
      var dayValues = [];
      var loopCount = Math.ceil(7/dayStepValue)
      let x = parseInt(startDayOfWeek);
      for(let i=1; i<=loopCount; i++){
        if(x<=6){
          dayValues.push(x)
          x = x + dayStepValue
        }else{
          dayValues.push(x-7)
          x = x + dayStepValue
        }
      }
    }
    if(repeatEventType === 'weekly'){
      dayStepValue = parseInt(event.target.value);
      dayValues = daysOfWeek
    }
    setRepeatEventTypeValue(event.target.value);
    setDaysOfWeek(dayValues);
  }

  const handleRecurringChange = (event) =>{
    setRecurring(!recurring);
    if(step2Data.classStartDate !== ""){
      var startDayValue = moment(step2Data.classStartDate).day();
    }else {
      startDayValue = 0
    }
    setStep2Data((prevData) => ({
      ...prevData,
      ['classActiveDays']: [0, 1, 2, 3, 4, 5, 6],
      ['classRecurring']: {
        recurring: event.target.checked,
        type: repeatEventType,
        startDayOfWeek: startDayValue,
        repeatEventTypeValue: repeatEventTypeValue,
      }
    }));
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={selectedTemplate ? 3 : 6}>
        <Autocomplete
          // defaultValue={Object.keys(step2Data.templateDetails).length > 0
          //   ? step2Data.templateDetails
          //   : null} // Set defaultValue to null when templateDetails is empty
          value={selectedTemplate}
          options={templates}
          filterSelectedOptions
          getOptionDisabled={(option) =>
            option.converted === false
          }
          noOptionsText= 'No templates available'
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.resource_id === value.resource_id}
          renderInput={(params) => <TextField {...params}
            fullWidth
            label="Lab Template"
            required
            InputLabelProps={{style: {fontSize: 14}}}
            variant="outlined" size="small"
            // helperText={
            //   <>
            //     Didn't find what you were looking for? Click
            //     <span style={{ cursor: 'pointer'}}
            //       onClick={() => handleTemplateManagement()}> here </span>
            //     to create new template.
            //   </>
            // }
          />}
          onChange={(event, newValue) => {
            setSelectedTemplate(newValue);
            setSelectedTemplateVersion(null); // Reset template version when a new template is selected
            newValue !== null &&
              setStep2Data((prevData) => ({
                ...prevData,
                ['templateId']: newValue.template_id,
                ['templateDetails']: newValue
              }));
          }}
          autoHighlight
          autoComplete
          // disableCloseOnSelect
        />
      </Grid>
      {selectedTemplate && (
        <Grid item xs={3}>
          {/* Template Version Autocomplete */}
          <Autocomplete
            value={selectedTemplateVersion}
            options={getAllVersions(selectedTemplate)}
            getOptionLabel={(option) => option.version.toString()}
            renderInput={(params) => (
              <TextField
                {...params}
                fullWidth
                label="Template Version"
                required
                InputLabelProps={{ style: { fontSize: 14 } }}
                variant="outlined"
                size="small"
              />
            )}
            renderOption={(props, option) => (
              <div style={{ fontWeight: 'normal' }} {...props}>
                <span style={{ fontSize: '13px' }}>{option.version}</span>
                <span style={{ fontSize: '11px', color: 'gray' }}>
                  {option.description}{' '}
                  <span className="badge badge-success">{option.type}</span>
                </span>
              </div>
            )}
            isOptionEqualToValue={(option, value) => option.resource_id === value.resource_id}
            onChange={(event, newValue) => {
              setSelectedTemplateVersion(newValue);
              newValue !== null &&
                setStep2Data((prevData) => ({
                  ...prevData,
                  ['templateVersion']: newValue.version,
                  ['templateResource']: newValue.resource_id,
                }));
            }}
          />
        </Grid>
      )}
      <Grid item xs={6}>
        <TextField
          fullWidth
          size="small"
          select
          label="Educator/(s)"
          InputLabelProps={{style: {fontSize: 14}}}
          value={step2Data.classEducators}
          onChange={handleInstructorChange}
          // SelectProps={{
          //   multiple: true,
          //   renderValue: (selected) => selected.join(', '),
          // }}
          SelectProps={{
            multiple: true,
            renderValue: (selected) =>
              selected
                .map((value) => {
                  const instructor = instructors.find((option) => option.email === value);
                  if (instructor) {
                    return instructor.name || instructor.email; // Display name if available, otherwise display email
                  }
                  return value; // Use the email as a fallback
                })
                .join(", ")
          }}
          variant="outlined"
          required
        >
          {instructors.length> 0 && instructors.map((item) => {
                  return (<MenuItem key={item.email}
                                  name={item.name}
                                  value={item.email}>
                            {item.name !== undefined ? item.name : item.email}
                          </MenuItem>);
              })
          }
        </TextField>
      </Grid>
      <Grid item xs={6}>
        <TextField
          fullWidth
          size="small"
          select
          name="classType"
          label="Class Type"
          value={step2Data.classType}
          onChange={handleInputChange}
          variant="outlined"
          required
          helperText="Live class requires a start and end time. Live class also supports a video conferencing option."
          InputLabelProps={{style: {fontSize: 14}}}
        >
          <MenuItem value="">Select</MenuItem>
          <MenuItem value="online">Online/Synchronous</MenuItem>
          <MenuItem value="offline">Offline/Asynchronous</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={step2Data.classExclusive.value === 'yes' ? 3 : 6}>
        <TextField
          fullWidth
          size="small"
          select
          label="Class Exclusive"
          value={step2Data.classExclusive.value || ''}
          onChange={handleClassExclusiveChange}
          variant="outlined"
          required
          InputLabelProps={{ style: { fontSize: 14 } }}
          helperText="Exclusive class limits general enrollments, Only students with exclusive code can enroll."
        >
          <MenuItem value="">Select</MenuItem>
          <MenuItem value="yes">Yes</MenuItem>
          <MenuItem value="no">No</MenuItem>
        </TextField>
      </Grid>
      {/* Display exclusive code if available */}
      {step2Data.classExclusive.value === 'yes' && (
        <Grid item xs={3}>
          <TextField
            fullWidth
            size="small"
            label="Exclusive Code"
            value={step2Data.classExclusive.code}
            variant="outlined"
            disabled
            InputLabelProps={{ style: { fontSize: 14 } }}
          />
        </Grid>
      )}

      {step2Data.classType === 'online' ? <>
        <Grid item xs={3}>
          <div className="customDatePickerWidth">
            <DatePicker
              dateFormat="MMM d, yyyy"
              selected={step2Data.classStartDate}
              onChange={(date) => handleClassStartDateChange(date)}
              renderInput={(params) => <TextField {...params} variant="outlined" size="small" />}
              showYearDropdown
              showMonthDropdown
              customInput={<CustomInput label="Start Date"
                            zone={timeZone}/>}
              popperPlacement="bottom-end"
              popperClassName="react-datepicker"
            />
          </div>
        </Grid>
        <Grid item xs={3}>
          <div className="customDatePickerWidth">
            <DatePicker
              dateFormat="MMM d, yyyy"
              selected={step2Data.classEndDate}
              onChange={(date) => handleClassEndDateChange(date)}
              showYearDropdown
              showMonthDropdown
              customInput={<CustomInput label="End Date"
                            zone={timeZone}/>}
              popperPlacement="bottom-end"
              popperClassName="react-datepicker"
            />
          </div>
        </Grid>
        <Grid item xs={3}>
          <div className="customDatePickerWidth">
            <DatePicker
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="h:mm aa"
              selected={step2Data.classStartDate}
              onChange={(date) => handleClassStartTimeChange(date)}
              customInput={<CustomInput label="Start Date"
                            zone={timeZone}/>}
              popperPlacement="bottom-end"
              timeInputLabel= {<EditIcon />}
              showTimeInput
              popperClassName="react-datepicker"
            />
          </div>
        </Grid>
        <Grid item xs={3}>
          <div className="customDatePickerWidth">
            <DatePicker
              selected={step2Data.classEndDate}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="h:mm aa"
              onChange={(date) => handleClassEndTimeChange(date)}
              customInput={<CustomInput label="End Time"
                          zone={timeZone}/>}
              timeInputLabel={<EditIcon />}
              showTimeInput
              popperPlacement="bottom-end"
              popperClassName="react-datepicker"
            />
          </div>
          <Form.Text className="text-muted">
            <div className="checkboxes">
              <label>
                <input
                  checked={recurring}
                  // ref="complete"
                  type="checkbox"
                  onChange={handleRecurringChange}
                /> Recurring Class?
              </label>
            </div>
          </Form.Text>
        </Grid>
        {recurring ?
          <>
          <Grid item xs={3}>
            <Form.Group className="row">
                <div className="col-sm-12">
                  <select className="form-control form-control-sm"
                          value={repeatEventType}
                          onChange={repeatEventTypeChange}
                          required
                  >
                      <option value="daily">Repeat Daily</option>
                      <option value="weekly">Repeat Weekly</option>
                      <option value="monthly">Repeat Monthly</option>
                  </select>
               </div>
            </Form.Group>
          </Grid>
          <Grid item xs={3}>
            <Form.Group className="row">
              <div className="col-sm-12">
                <select className="form-control form-control-sm"
                        value={repeatEventTypeValue}
                        onChange={repeatEventTypeValueChange}
                        required
                >
                  {repeatEvents.map((entry) => {
                    if(entry.name === repeatEventType){
                      return entry.types.map((item, index) => {
                        return (<option key={index}
                                        value={item.value}>{item.name}</option>);
                      })
                    }
                  })}
                </select>
              </div>
            </Form.Group>
          </Grid>
          {repeatEventType === 'weekly' ?
            <Grid item xs={3}>
               <div className="col-md-12">
                <div className="checkboxes justify-content-center">
                {weekDays.map((item, index) => {
                  return (
                    <div key={index} className="left-section" style={{float: 'left'}}>
                    <input
                      type="checkbox"
                      id={`custom-checkbox-${index}`}
                      name={item.name}
                      value={item.id}
                      checked={checkedState[index]}
                      // disabled={this.state.checkedState[index] && this.state.startDayOfWeek === item.id}
                      onChange={() => daysOfWeekChange(index)}
                    />
                    <label>{item.name}</label>
                    </div>
                  );
                })}
                </div>
               </div>
              </Grid>: null
            }
            <Grid item xs={3}>
              <div className="col-md-12">
                <Form.Group className="row">
                  <div className="col-sm-12">
                    <div className="customDatePickerWidth">
                      <DatePicker
                        dateFormat="MMM d, yyyy"
                        selected={step2Data.classEndDate}
                        onChange={(date) => handleClassEndDateChange(date)}
                        showYearDropdown
                        showMonthDropdown
                        customInput={<CustomInput label="End Date"
                                      zone={timeZone}/>}
                        popperPlacement="bottom-end"
                        popperClassName="react-datepicker"
                      />
                    </div>
                  </div>
                </Form.Group>
              </div>
            </Grid>
          </>: null
        }
        <Grid item xs={6}>
          <TextField
            fullWidth
            size="small"
            select
            label="Video Conference"
            value={step2Data.classVideoConference}
            onChange={handleClassVideoConferenceChange}
            variant="outlined"
            required
            InputLabelProps={{style: {fontSize: 14}}}
          >
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="video">Yes</MenuItem>
            <MenuItem value="no-video">No</MenuItem>
          </TextField>
        </Grid></> : null
      }
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Checkbox
              checked={step2Data.classPublish}
              onChange={handleClassPublish}
              name="checkedA"
              color="primary"
            />
          }
          label={
            <span>
              Publish my class to marketplace
              <Typography variant="body2" color="textSecondary">
                (This will make your class visible to others)
              </Typography>
            </span>
          }
        />
      </Grid>
      {/*Class builds table*/}
      <Grid item xs={12}>
        <Typography variant="h7" style={{marginBottom: '16px', fontSize: '20px'}}>
          Existing Builds
        </Typography>
        <Builds
          data={step2Data}
          setStep2Data={setStep2Data}
        />
      </Grid>
    </Grid>
  );
};

export default ClassSchedule;
