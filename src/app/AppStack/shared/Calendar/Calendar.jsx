import React, { Component } from "react";
import {Dropdown, Modal, Form} from 'react-bootstrap';
import Utils from '../Utils';
import Tooltip from '@material-ui/core/Tooltip';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@mui/material/Button';
import Card from '@material-ui/core/Card';
import Typography from '@material-ui/core/Typography';
import CardContent from '@material-ui/core/CardContent';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"; // needed for dayClick
import bootstrapPlugin from '@fullcalendar/bootstrap';
import "@fullcalendar/daygrid/main.css";
import "@fullcalendar/timegrid/main.css";
import CloseIcon from '@material-ui/icons/Close';
import TodayIcon from '@material-ui/icons/Today';
import CachedIcon from '@material-ui/icons/Cached';
import moment from 'moment';
import momenttz from 'moment-timezone'
import uuid from 'react-uuid';
import { repeatEvents, weekDays, reactAPIURL } from "../General.js";
import VideocamIcon from '@material-ui/icons/Videocam';
import VideoCallIcon from '@material-ui/icons/VideoCall';
import { StyleSheet, css } from 'aphrodite';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
var uniqid = require('uniqid');
/* eslint-disable no-useless-escape */
class Calendar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      class_id: '',
      width: window.innerWidth,
      height: window.innerHeight,
      allDay: false,
      calendarWeekends: true,
      calendarEvents: [],
      show_add: false,
      show_view: false,
      show_edit: false,
      title: '',
      videoConference: 'no-video',
      recurring: false,
      repeatEventType: 'daily',
      repeatEventTypeValue: 1,
      daysOfWeek: [],
      checkedState: new Array(7).fill(false),
      guestList: [],
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
    this.class_idChange = this.class_idChange.bind(this);
    this.repeatEventChange = this.repeatEventChange.bind(this);
    this.onStartDateChange = this.onStartDateChange.bind(this);
    this.repeatEventTypeChange = this.repeatEventTypeChange.bind(this);
    this.repeatEventTypeValueChange = this.repeatEventTypeValueChange.bind(this);
    this.daysOfWeekChange = this.daysOfWeekChange.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  async componentDidMount() {
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    if(appearanceObject !== null && userAuthDetails !== null && userDetails !== null){
      await this.setState({
        primary_color: JSON.parse(appearanceObject).primary_color,
        secondary_color: JSON.parse(appearanceObject).secondary_color,
        user: JSON.parse(userAuthDetails).user,
        refresh_token: JSON.parse(userAuthDetails).refresh_token,
        id_token: JSON.parse(userAuthDetails).id_token,
        role: JSON.parse(userDetails).role,
        customer_id: JSON.parse(userDetails).customer_id,
        user_first_name: JSON.parse(userDetails).user_first_name,
        user_last_name: JSON.parse(userDetails).user_last_name,
      });
      this.readCalendarEvents();
      Utils.getCustomerClasses(this.state.user, this.state.role,
        this.state.customer_id, this.state.refresh_token, this.state.id_token)
      .then(data => {
        this.setState({classes: data, loaded_classes: true});
      })
      .catch(err => {
          throw err;
      });
      Utils.getCustomerUsers(this.state.user, this.state.role,
            this.state.customer_id, this.state.refresh_token)
      .then(data => {
        var users = [];
        data.forEach((item) => {
          if(this.state.user !== item.user_email){
              users.push({
                customer_id: item.customer_id,
                user_first_name: item.user_first_name,
                user_last_name: item.user_last_name,
                user_role: item.user_role,
                user_email: item.user_email
              })
          }
        })
        this.setState({users: users, loaded_users: true});
      })
      .catch(err => {
          throw err;
      });
    }
    window.addEventListener('resize', this.updateDimensions);
  }

  updateDimensions = () => {
    this.setState({ width: window.innerWidth, height: window.innerHeight });
  };

  repeatEventChange(event){
    this.setState({recurring: !this.state.recurring});
  }

  repeatEventTypeChange(event){
    this.setState({repeatEventType: event.target.value})
  }

  // Function to calculate duration in hours
  calculateDurationInHours = (start, end) => {
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    const durationInMs = endTime - startTime;
    return durationInMs / (1000 * 60 * 60); // Convert milliseconds to hours
  }

  // Function to determine if the event lasts for the entire day
  isAllDay = (start, end) => {
    const durationInHours = this.calculateDurationInHours(start, end);
    return durationInHours >= 24;
  }

  repeatEventTypeValueChange(event){
    if(this.state.repeatEventType === 'daily'){
      var dayStepValue = parseInt(event.target.value);
      var dayValues = [];
      var loopCount = Math.ceil(7/dayStepValue)
      let x = parseInt(this.state.startDayOfWeek);
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
    if(this.state.repeatEventType === 'weekly'){
      dayStepValue = parseInt(event.target.value);
      dayValues = this.state.daysOfWeek
    }
    this.setState({
      repeatEventTypeValue: event.target.value,
      daysOfWeek: dayValues
    })
  }

  async onStartDateChange(event){
    const index = this.state.daysOfWeek.indexOf(this.state.startDayOfWeek);
    if (index > -1) {
      this.state.daysOfWeek.splice(index, 1);
    }
    var dayValue = moment(event.target.value).day();

    var updatedCheckedState = this.state.checkedState.map((item, index) =>
      index === this.state.startDayOfWeek ? !item : item
    );
    updatedCheckedState = updatedCheckedState.map((item, index) =>
      item === false && index === dayValue ? !item : item
    );
    this.setState({
      eventStartDate: event.target.value,
      startDayOfWeek: moment(event.target.value).day(),
      daysOfWeek: this.state.daysOfWeek.concat(moment(event.target.value).day()),
      checkedState: updatedCheckedState
    })
  }

  daysOfWeekChange(position){
    const updatedCheckedState = this.state.checkedState.map((item, index) =>
     index === position ? !item : item
   );
   this.setState({checkedState: updatedCheckedState})
  }

  //User input onchange handler function to set state dynamically
  onChange = (key, value) => {
    this.setState({
        [key]: value
    })
  };

  //class dropdown onchange handler function to update state
  class_idChange(event) {
    this.setState({guestList:[], key: !this.state.key})
    this.setState({
      class_id: event.target.value,
      class_name: event.currentTarget.getAttribute("name")
    });
  }

  /**
   * Get the list of all calendar events related to the logged in user
   * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
   * @param  {String} customer_id The unique customer ID of the current logged in user
   * @param  {String} role logged in user role
   * @param  {String} user logged in user email
   * @return {JSON}  array of objects from the respective database
 */
  readCalendarEvents = () => {
    var calendarEvents = [];
    fetch(reactAPIURL + 'readcalendarevents', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json'
      },
      body:JSON.stringify({
        "refresh_token": this.state.refresh_token,
        "customer_id": this.state.customer_id,
        "role": this.state.role,
        "user": this.state.user
      })
    })
    .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          if(responseJson.body !== null && responseJson.body.length>=1){
            calendarEvents = responseJson.body.map((item) => {
              // Get the user's time zone dynamically from the browser
              const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

              // Convert start time to local time zone
              const localStartTime = momenttz.utc(`${item.calendar_event.startRecur} ${item.calendar_event.startTime}`).tz(localTimeZone);

              // Convert end time to local time zone
              const localEndTime = momenttz.utc(`${item.calendar_event.endRecur} ${item.calendar_event.endTime}`).tz(localTimeZone);

              // Update the calendar event with local times
              item.calendar_event.startTime = localStartTime.format("HH:mm");
              item.calendar_event.endTime = localEndTime.format("HH:mm");
              item.calendar_event.startRecur = localStartTime.format("YYYY-MM-DD");
              item.calendar_event.endRecur = localEndTime.add(1, "days").format("YYYY-MM-DD");

              return item.calendar_event
            });
          }
        }else{
          Utils.adderrorNotification(responseJson.errorMessage)
        }
        this.setState({
          calendarEvents: calendarEvents
        })
      })
    .catch((error)=>{
      throw error;
    });
  }

  /**
   * To create a calendar event
   * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
   * @param  {String} customer_id The unique customer ID of the current logged in user
   * @param {Object}  calendar_event event object with parameters(id, title, start, end, allDay, videoConference..)
   * @param  {String} user logged in user email
   * @return {JSON}  suceess message along with statusCode
 */
  createCalendarEvent = (event) => {
    fetch(reactAPIURL + 'createcalendarevent', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
        'Authorization': this.state.id_token
      },
      body:JSON.stringify({
        "refresh_token": this.state.refresh_token,
        "customer_id": this.state.customer_id,
        "user": this.state.user,
        "calendar_event": event,
        "class_id": this.state.class_id
      })
    })
    .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.message === "success" && responseJson.statusCode === 200){
          Utils.addsuccessNotification('Event added successfully.')
          this.readCalendarEvents();
        }else {
          Utils.adderrorNotification('Error adding event details to calendar: ' + responseJson.errorMessage )
        }
      })
    .catch((error)=>{
      Utils.adderrorNotification('Error adding event details to calendar: ' + error )
    });
  }
  /**
   * To delete an calendar event
   * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
   * @param  {String} customer_id The unique customer ID of the current logged in user
   * @param {String}  calendar_id calendar event unique identifier
   * @return {JSON}  suceess message along with statusCode
 */
  deleteCalendarEvent = (id) => {
    fetch(reactAPIURL + 'deletecalendarevent', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
        'Authorization': this.state.id_token
      },
      body:JSON.stringify({
        "refresh_token": this.state.refresh_token,
        "customer_id": this.state.customer_id,
        "user": this.state.user,
        "calendar_id": id
      })
    })
    .then((response) => response.json())
      .then(responseJson => {
        if(responseJson.message === "success" && responseJson.statusCode === 200){
          Utils.addsuccessNotification('Event removed successfully.')
        }else {
          Utils.adderrorNotification('Error deleting event details from calendar: ' + responseJson.errorMessage )
        }
      })
    .catch((error)=>{
      Utils.adderrorNotification('Error deleting event details from calendar: ' + error )
    });
  }
  /**
   * To edit an calendar event
   * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
   * @param  {String} customer_id The unique customer ID of the current logged in user
   * @param {JSON}  calendar_event event object with updated parameters(id, title, start, end, allDay, videoConference)
   * @param {String} user logged in user email
   * @return {JSON}  suceess message along with statusCode
 */
  editCalendarEvent = (event) => {
    fetch(reactAPIURL + 'editcalendarevent', {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
        'Authorization': this.state.id_token
      },
      body:JSON.stringify({
        "refresh_token": this.state.refresh_token,
        "customer_id": this.state.customer_id,
        "user": this.state.user,
        "calendar_event": event,
        "class_id": event.class_id
      })
    })
    .then((response) => response.json())
      .then(responseJson => {
        if(responseJson.message === "success" && responseJson.statusCode === 200){
          Utils.addsuccessNotification('Event updated successfully.')
          this.readCalendarEvents();
        }else {
          Utils.adderrorNotification('Error updating event details: ' + responseJson.errorMessage )
        }
      })
    .catch((error)=>{
      Utils.adderrorNotification('Error updating event details: ' + error )
    });
  }

  handleClose() {
    this.setState({
      show_add: false,
      show_view: false,
      id: '',
      title:'',
      eventStartDate: '',
      eventEndDate: '',
      eventStartTime: '',
      eventEndTime: '',
      allDay: '',
      videoConference:'no-video',
      classVideoConference: '',
      class_id:'',
      guestList: [],
      recurring: false,
      daysOfWeek:[],
      startDayValue:'',
      repeatEventType: 'daily',
      repeatEventTypeValue: 1,
      checkedState: new Array(7).fill(false)
    })
  }

  handleDateClick = async(arg) => {
    if(this.state.role !== 'student'){
      const startDayValue = moment(arg.date).day();
      const updatedCheckedState = this.state.checkedState.map((item, index) =>
       index === startDayValue ? !item : item
      );

      await this.setState({
        show_add: true,
        id: uuid(),
        eventStartDate: arg.dateStr,
        eventEndDate: arg.dateStr,
        // eventEndDate: moment(arg.dateStr).clone().add(1, 'day').format('YYYY-MM-DD'),
        eventStartTime: moment(arg.date).format('HH:mm'),
        eventEndTime: moment(arg.date).format('HH:mm'),
        allDay: arg.allDay,
        startDayOfWeek: startDayValue,
        checkedState: updatedCheckedState
      })
    }
  }

  //This function is triggered when the user clicks on an calendar date/time slot
  handleDateSelect = async(arg) => {
    if(this.state.role !== 'student'){
      const startDayValue = moment(arg.start).day();
      const updatedCheckedState = this.state.checkedState.map((item, index) =>
       index === startDayValue ? !item : item
      );
      await this.setState({
        show_add: true,
        id: uuid(),
        eventStartDate: moment(arg.start).format('YYYY-MM-DD'),
        eventEndDate: moment(arg.end).format('YYYY-MM-DD'),
        eventStartTime: moment(arg.start).format('HH:mm'),
        eventEndTime: moment(arg.end).format('HH:mm'),
        allDay: arg.allDay,
        startDayOfWeek: startDayValue,
        checkedState: updatedCheckedState
      })
    }
  };

  //This function is triggered when the user clicks on an existing calendar event
  handleEventClick = async(arg) => {
    if(arg.event._def.recurringDef !== null){
      var checkedState = new Array(7).fill(false);
      var daysOfWeek = arg.event._def.recurringDef.typeData.daysOfWeek;
        daysOfWeek.map((day) => {
          checkedState.splice(day, 1, true)
        })
      var eventStartDate = arg.event._def.recurringDef.typeData.startRecur;
      eventStartDate = new Date(eventStartDate.getTime() + eventStartDate.getTimezoneOffset()*60*1000);
      eventStartDate = moment(eventStartDate).format('YYYY-MM-DD')
      // startRecur.setDate(startRecur.getDate() + 1)
      var eventEndDate = moment(arg.event._def.recurringDef.typeData.endRecur).format('YYYY-MM-DD');
    }else {
      eventStartDate = moment(arg.event.start).format('YYYY-MM-DD')
      eventEndDate = moment(arg.event.end).format('YYYY-MM-DD')
    }
    const eventStartTime = moment(arg.event.start).format('HH:mm')
    const eventEndTime = moment(arg.event.end).format('HH:mm');
    
    await this.setState({
      show_view: true,
      id: arg.event.id,
      title: arg.event.title,
      eventStartDate: eventStartDate,
      eventEndDate: eventEndDate,
      eventStartTime: eventStartTime,
      eventEndTime: eventEndTime,
      allDay: arg.event.allDay,
      videoConference: arg.event.extendedProps.videoConference,
      class_id: arg.event.extendedProps.class_id,
      calendar_id: arg.event.extendedProps.calendar_id,
      meetingType: arg.event.extendedProps.meetingType,
      guestList: arg.event.extendedProps.guestList,
      recurring: arg.event.extendedProps.recurring,
      groupId: arg.event.groupId,
      daysOfWeek: daysOfWeek,
      checkedState: checkedState,
      repeatEventType: arg.event.extendedProps.repeatEventType,
      repeatEventTypeValue: arg.event.extendedProps.repeatEventTypeValue,
      startDayOfWeek: arg.event.extendedProps.startDayOfWeek
    })
  }

  //This function is triggered when the user resizes an existing calendar event
  handleEventResize = async(arg) => {
    if(this.state.role !== 'student'){
      //case to edit recurring events -- more work to go here
      if(arg.event.groupId !== "" && arg.event.groupId !== undefined){
        //prevent user to edit class event
        if(arg.event.extendedProps.meetingType === 'class_lecture'){
          Utils.adderrorNotification('You can not reschedule this event.')
          this.readCalendarEvents();
        }else {
          var event_start_date = new Date(arg.event._def.recurringDef.typeData.startRecur)
          event_start_date.setDate(event_start_date.getDate() + 1)
          var event_end_date = new Date(arg.event._def.recurringDef.typeData.endRecur)
          event_end_date.setDate(event_end_date.getDate() + 1)
          const daysOfWeek = arg.event._def.recurringDef.typeData.daysOfWeek
          const eventStartDate = moment(event_start_date).format('YYYY-MM-DD')
          const eventEndDate = moment(event_end_date).format('YYYY-MM-DD')
          const eventStartTime = moment(arg.event.start).format('HH:mm');
          const eventEndTime = moment(arg.event.end).format('HH:mm');
          // const startDateTime = moment(eventStartDate + ' ' + eventStartTime, "YYYY-MM-DD HH:mm");
          // const endDateTime = moment(eventEndDate + ' ' + eventEndTime, "YYYY-MM-DD HH:mm");
          var event = {
            groupId: arg.event.groupId,
            id: arg.event.id,
            title: arg.event.title,
            startTime: eventStartTime,
            endTime: eventEndTime,
            startRecur: eventStartDate,
            endRecur: eventEndDate,
            allDay: arg.event.allDay,
            daysOfWeek: daysOfWeek,
            videoConference: arg.event.extendedProps.videoConference,
            class_id: arg.event.extendedProps.class_id,
            guestList: arg.event.extendedProps.guestList,
            recurring: arg.event.extendedProps.recurring,
            repeatEventType: arg.event.extendedProps.repeatEventType,
            repeatEventTypeValue: arg.event.extendedProps.repeatEventTypeValue,
            startDayOfWeek: arg.event.extendedProps.startDayOfWeek,
            calendar_id: arg.event.extendedProps.calendar_id
          }
          this.editCalendarEvent(event);
        }
      }else{
        const eventStartDate = moment(arg.event.start).format('YYYY-MM-DD')
        const eventEndDate = moment(arg.event.end).format('YYYY-MM-DD')
        const eventStartTime = moment(arg.event.start).format('HH:mm');
        const eventEndTime = moment(arg.event.end).format('HH:mm');
        const startDateTime = moment(eventStartDate + ' ' + eventStartTime, "YYYY-MM-DD HH:mm");
        const endDateTime = moment(eventEndDate + ' ' + eventEndTime, "YYYY-MM-DD HH:mm");
        event = {
          id: arg.event.id,
          title: arg.event.title,
          start: new Date(startDateTime._i),
          end: new Date(endDateTime._i),
          allDay: arg.event.allDay,
          videoConference: arg.event.extendedProps.videoConference,
          class_id: arg.event.extendedProps.class_id,
          guestList: arg.event.extendedProps.guestList,
          calendar_id: arg.event.extendedProps.calendar_id
        }
        this.editCalendarEvent(event);
      }
   }
  };

  //This function is triggered when the user drags and drops an existing calendar event into a new date slot
  handleEventDrop = (arg) => {
    if(this.state.role !== 'student'){
      if(arg.event.groupId !== "" && arg.event.groupId !== undefined){
        //prevent user to edit class event
        if(arg.event.extendedProps.meetingType === 'class_lecture'){
          Utils.adderrorNotification('You can not reschedule this event.')
          this.readCalendarEvents();
        }else {
          //we are not allowing user to drag drop recurring events
          Utils.adderrorNotification('Operation not permitted.')
          this.readCalendarEvents();
        }
      }else{
        const eventStartDate = moment(arg.event.start).format('YYYY-MM-DD')
        const eventEndDate = moment(arg.event.end).format('YYYY-MM-DD')
        const eventStartTime = moment(arg.event.start).format('HH:mm')
        const eventEndTime = moment(arg.event.end).format('HH:mm');
        const startDateTime = moment(eventStartDate + ' ' + eventStartTime, "YYYY-MM-DD HH:mm");
        const endDateTime = moment(eventEndDate + ' ' + eventEndTime, "YYYY-MM-DD HH:mm");
        const event = {
          id: arg.event.id,
          title: arg.event.title,
          start: new Date(startDateTime._i),
          end: new Date(endDateTime._i),
          allDay: arg.event.allDay,
          videoConference: arg.event.extendedProps.videoConference,
          class_id: arg.event.extendedProps.class_id,
          guestList: arg.event.extendedProps.guestList,
          calendar_id: arg.event.extendedProps.calendar_id
        }
        this.editCalendarEvent(event);
      }
   }
  }
  //addEvent will create a new calendar event
  addEvent = (e) => {
    e.preventDefault();
    var title, videoConference, event, dayValue = [];
    var calendarId = uniqid('calendar-');
    if(!this.state.title)
      title = 'New Event ' + moment(this.state.eventStartDate).format('YYYY-MM-DD');
    else title = this.state.title
    if(!this.state.videoConference)
      videoConference = 'no-video'
    else videoConference = this.state.videoConference
    if(this.state.repeatEventType === 'daily' && this.state.repeatEventTypeValue === 1){
      dayValue = [0, 1, 2, 3, 4, 5, 6];
    }else if(this.state.repeatEventType === 'weekly' && this.state.repeatEventTypeValue === 1){
      this.state.checkedState.map((item, index) => {
        item === true && dayValue.push(index)
      })
    }else {
      dayValue = this.state.daysOfWeek
    }
    // const allDay = this.isAllDay(this.state.eventStartTime, this.state.eventEndTime);
    // if(this.state.recurring){
      // Parse date and time strings into JavaScript Date objects
      const startDate = new Date(this.state.eventStartDate);
      const endDate = new Date(this.state.eventEndDate);
      const startTime = momenttz(this.state.eventStartTime, 'HH:mm').toDate();
      const endTime = momenttz(this.state.eventEndTime, 'HH:mm').toDate();

      // Set timezone offset to convert to UTC
      startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
      endDate.setMinutes(endDate.getMinutes() - endDate.getTimezoneOffset());

      // Convert Date objects back to strings in UTC format
      const startDateUTC = startDate.toISOString().split('T')[0];
      const endDateUTC = endDate.toISOString().split('T')[0];
      const startTimeUTC = momenttz(startTime).utc().format('HH:mm');
      const endTimeUTC = momenttz(endTime).utc().format('HH:mm');

       event = {
        calendar_id: calendarId,
        groupId: uuid(),
        id: this.state.id,
        title: title,
        // startTime: moment.utc(this.state.eventStartTime).format('HH:mm'),
        startTime: startTimeUTC,
        // endTime: moment.utc(this.state.eventEndTime).format('HH:mm'),
        endTime: endTimeUTC, //endTime,
        startRecur: startDateUTC,
        endRecur: endDateUTC,
        allDay: false,
        daysOfWeek: dayValue,
        videoConference: videoConference,
        class_id: this.state.class_id,
        guestList: this.state.guestList,
        recurring: this.state.recurring,
        repeatEventType: this.state.repeatEventType,
        repeatEventTypeValue: this.state.repeatEventTypeValue,
        startDayOfWeek: this.state.startDayOfWeek
      }
    // }else {
    //   event = {
    //     calendar_id: calendarId,
    //     id: this.state.id,
    //     title: title,
    //     start: new Date(startDateTime._i),
    //     end: new Date(endDateTime._i),
    //     allDay: false,
    //     videoConference: videoConference,
    //     class_id: this.state.class_id,
    //     guestList: this.state.guestList
    //   }
    // }
    // insert event details data to DB

    this.createCalendarEvent(event);
    this.setState({calendarEvents: this.state.calendarEvents.concat(event)})
    this.handleClose();
  }
  //removeEvent will delete a calendar event
  removeEvent = async() => {
    const id = this.state.id;
    this.state.calendarEvents = await this.state.calendarEvents.filter(function( obj ) {
        return obj.id !== id;
    });
    //delete event details data from DB
    this.deleteCalendarEvent(this.state.calendar_id);
    this.setState({calendarEvents: this.state.calendarEvents})
    this.handleClose();
  }
  //editEvent will update a calendar event
  editEvent = async(e) => {
    e.preventDefault();
    var title, videoConference, event, dayValue = [];
    if(!this.state.title)
      title = 'New Event ' + moment(this.state.eventStartDate).format('YYYY-MM-DD');
    else title = this.state.title
    if(!this.state.videoConference)
      videoConference = 'no-video'
    else videoConference = this.state.videoConference
    if(this.state.repeatEventType === 'daily' && this.state.repeatEventTypeValue === 1)
      dayValue = [0, 1, 2, 3, 4, 5, 6];
    else if(this.state.repeatEventType === 'weekly' && this.state.repeatEventTypeValue === 1){
      this.state.checkedState.map((item, index) => {
        item === true && dayValue.push(index)
      })
    }else {
      dayValue = this.state.daysOfWeek
    }
    const startDateTime = moment(this.state.eventStartDate + ' ' + this.state.eventStartTime, "YYYY-MM-DD HH:mm");
    const endDateTime = moment(this.state.eventEndDate + ' ' + this.state.eventEndTime, "YYYY-MM-DD HH:mm");
    var event_start_date = new Date(this.state.eventStartDate.replace(/-/g, '\/'))
    var event_end_date = new Date(this.state.eventEndDate.replace(/-/g, '\/'))
    event_end_date.setDate(event_end_date.getDate() + 1)
    if(this.state.recurring){
       event = {
        groupId: this.state.groupId,
        id: this.state.id,
        title: title,
        startTime: this.state.eventStartTime,
        endTime: this.state.eventEndTime,
        startRecur: moment(event_start_date).format('YYYY-MM-DD'),
        endRecur: moment(event_end_date).format('YYYY-MM-DD'),
        allDay: this.state.allDay,
        daysOfWeek: dayValue,
        videoConference: videoConference,
        class_id: this.state.class_id,
        guestList: this.state.guestList,
        recurring: true,
        repeatEventType: this.state.repeatEventType,
        repeatEventTypeValue: this.state.repeatEventTypeValue,
        startDayOfWeek: this.state.startDayOfWeek,
        calendar_id: this.state.calendar_id
      }
    }else {
      event = {
        id: this.state.id,
        title: title,
        start: new Date(startDateTime._i),
        end: new Date(endDateTime._i),
        allDay: this.state.allDay,
        videoConference: videoConference,
        class_id: this.state.class_id,
        guestList: this.state.guestList,
        calendar_id: this.state.calendar_id
      }
    }
    this.editCalendarEvent(event);
    this.handleClose();
  }

  // Show/hide toggle to display event dialog on click
  editEventDialog = async() => {
    await this.setState({
      show_view: false,
      show_edit: true,
      show_add: true
    })
  }

  renderEventContent = (eventInfo) => {
    const eventStyle = {
      fontWeight: 'bold', // Set the title in bold
      paddingLeft: '15px', // Add some padding for the dot
      position: 'relative' // Position relative for absolute dot positioning
    };
    const dotStyle = {
      width: '10px',
      height: '10px',
      backgroundColor: 'orange',
      borderRadius: '50%',
      position: 'absolute',
      left: '0',
      top: '50%',
      transform: 'translateY(-50%)' // Center the dot vertically
    };
    if (eventInfo.event.extendedProps.meetingType === 'class_lecture' &&
          eventInfo.event.extendedProps.videoConference === 'no-video') {
      // Hide event time
      return (
        <div style={eventStyle}>
          <span style={dotStyle}></span> {/* Orange dot */}
          {eventInfo.event.title}
        </div>
      );
    } else {
      // Show event time
      return (
        <div style={eventStyle}>
          <span style={dotStyle}></span> {/* Orange dot */}
          {eventInfo.timeText} {eventInfo.event.title}
        </div>
      );
    }
  };

  render() {
    const styles = StyleSheet.create({
      cardheader: {
        backgroundColor: 'white',
        color: this.state.primary_color,
      },
      button: {
        ':hover': {
            color: this.state.secondary_color,
        }
      },
      navitem: {
        color: this.state.primary_color,
        ':hover': {
            color: this.state.secondary_color,
            textDecoration: 'none',
        }
      },
      navitem_active: {
        color: this.state.secondary_color,
        ':hover': {
            textDecoration: 'none',
            backgroundColor: 'rgba(74, 74, 74, 0)',
            color: this.state.primary_color,
        }
      },
    });

    return (
      <li className="nav-item nav-profile border-0 pl-3">
        <Dropdown alignRight show={this.props.calendarDropdown}>
          <Tooltip title="Calendar">
            <Dropdown.Toggle onClick={ () => this.props.toggler('calendarDropdown') }
              className={`${ this.props.calendarDropdown ? 'nav-link active' : 'nav-link' }
                          ${ this.props.calendarDropdown ? css(styles.navitem_active) : css(styles.navitem) }
                          count-indicator bg-transparent toggle-arrow-hide`}>
              <TodayIcon/>
            </Dropdown.Toggle>
          </Tooltip>
          <Dropdown.Menu style={{ width: this.state.width }}
                         className="navbar-dropdown preview-list">
           <div className="card">
             <div className= {`${ 'card-header d-flex justify-content-between align-items-center' } ${ css(styles.cardheader) }`}>Calendar
             <span>
               <Tooltip title="refresh calendar events">
                 <CachedIcon className="refresh" onClick={() => {
                     this.readCalendarEvents();
                 }}/>
               </Tooltip>&nbsp;{' '}&nbsp;
               <span data-toggle="tooltip" data-placement="top"
                  title="close">
                <CloseIcon className="refresh" onClick={() => this.props.close('calendarDropdown')}/>
               </span>
             </span>
             </div>
             <div className="card-body" style={{
               height: 'calc(100vh - 100px)',
               overflow: 'auto'
             }}>
               <FullCalendar
                 timeZone= 'local' //UTC
                 // timeZone= {this.state.timeZone}
                 themeSystem= "standard"
                 eventTimeFormat={{
                   hour: 'numeric',
                   minute: '2-digit',
                   meridiem: 'short'
                 }}
                 headerToolbar={{
                   left: "prev,next,prevYear,nextYear,today",
                   center: "title",
                   right: "dayGridMonth,timeGridWeek,timeGridDay"
                 }}
                 firstDay={0}
                 plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, bootstrapPlugin]}
                 ref={this.calendarComponentRef}
                 weekends={this.state.calendarWeekends}
                 events={this.state.calendarEvents}
                 dateClick={this.handleDateClick}
                 // select={this.handleDateSelect}
                 eventClick={this.handleEventClick}
                 eventResize={this.handleEventResize}
                 eventDrop={this.handleEventDrop}
                 navLinks={true}
                 weekNumbers={true}
                 editable= {true}
                 selectable= {true}
                 nowIndicator= {true}
                 scrollTime= {moment().format("HH") + ":00:00"}
                 weekNumberCalculation={'ISO'}
                 selectMirror= {true}
                 expandRows= {true}
                 contentHeight={'auto'}
                 height= 'auto'
                 handleWindowResize={true}
                 eventColor={this.state.primary_color}
                 // displayEventTime={false}
                 eventContent={this.renderEventContent}
               />
             </div>
           </div>
         </Dropdown.Menu>
        </Dropdown>
        {/*Dialog box to add a new event */}
        <Modal show={this.state.show_add} onHide={this.handleClose}
               aria-labelledby="contained-modal-title-vcenter"
               centered
               dialogClassName="modal-right-30w"
        >
          <form className="form-sample" onSubmit={this.state.show_edit ? this.editEvent : this.addEvent}>
            <Modal.Header closeButton>
              <Modal.Title id="contained-modal-title-vcenter">
                {!this.state.show_edit ? 'Add Event' : 'Edit Event' }
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="modal-30w-body">
              <div className="row">
                <div className="col-lg-12 grid-margin">

                      <div className="row">
                        <div className="col-md-12">
                          <Form.Group className="row">
                            <div className="col-sm-12">
                              <span>Add title&#42;</span>
                              <Form.Control
                                  placeholder={'New Event ' + moment(this.state.eventStartDate).format('YYYY-MM-DD')}
                                  value={this.state.title}
                                  type='text'
                                  onChange={evt => this.onChange('title', evt.target.value)}
                              />
                            </div>
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group className="row">
                            <div className="col-sm-12">
                              <span>Start&#42;</span>
                              <Form.Control
                                  required
                                  type="date"
                                  value={this.state.eventStartDate}
                                  onChange={this.onStartDateChange}
                              />
                              <Form.Control
                                  step="900"
                                  type="time"
                                  value={this.state.eventStartTime}
                                  onChange={event => this.setState({eventStartTime: event.target.value})}
                                  required
                              />
                            </div>
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group className="row">
                            <div className="col-sm-12">
                              <span>End&#42;</span>
                              <Form.Control
                                  required
                                  type="date"
                                  value={this.state.eventEndDate}
                                  onChange={event => this.setState({eventEndDate: event.target.value})}
                              />
                              <Form.Control
                                  step="900"
                                  required
                                  type="time"
                                  value={this.state.eventEndTime}
                                  onChange={event => this.setState({eventEndTime: event.target.value})}
                              />
                              <Form.Text className="text-muted">
                                <div className="checkboxes">
                                  <label>
                                    <input
                                      checked={this.state.recurring}
                                      ref="complete"
                                      type="checkbox"
                                      onChange={this.repeatEventChange}
                                    /> Repeat Event
                                  </label>
                                </div>
                              </Form.Text>
                            </div>
                          </Form.Group>
                        </div>
                        {this.state.recurring ?
                        <>
                        <div className="col-md-6">
                          <Form.Group className="row">
                              <div className="col-sm-12">
                                <select className="form-control form-control-sm"
                                        value={this.state.repeatEventType}
                                        onChange={this.repeatEventTypeChange}
                                        required
                                >
                                    <option value="daily">Repeat Daily</option>
                                    <option value="weekly">Repeat Weekly</option>
                                    <option value="monthly">Repeat Monthly</option>
                                </select>
                              </div>
                            </Form.Group>
                          </div>
                          <div className="col-md-6">
                            <Form.Group className="row">
                              <div className="col-sm-12">
                                <select className="form-control form-control-sm"
                                        value={this.state.repeatEventTypeValue}
                                        onChange={this.repeatEventTypeValueChange}
                                        required
                                >
                                    {repeatEvents.map((entry) => {
                                      if(entry.name === this.state.repeatEventType){
                                        return entry.types.map((item, index) => {
                                          return (<option key={index}
                                                          value={item.value}>{item.name}</option>);
                                        })
                                      }
                                    })
                                    }
                                </select>
                              </div>
                            </Form.Group>
                          </div>
                          {this.state.repeatEventType === 'weekly' ?
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
                                  checked={this.state.checkedState[index]}
                                  disabled={this.state.checkedState[index] && this.state.startDayOfWeek === item.id}
                                  onChange={() => this.daysOfWeekChange(index)}
                                />
                                <label>{item.name}</label>
                                </div>
                              );
                            })}
                            </div>
                           </div> : null
                          }

                          <div className="col-md-6">
                            <Form.Group className="row">
                              <div className="col-sm-12">
                                <Form.Control
                                    placeholder={'End On Date'}
                                    disabled
                                    type='text'
                                />
                              </div>
                            </Form.Group>
                          </div>
                          <div className="col-md-6">
                            <Form.Group className="row">
                              <div className="col-sm-12">
                                <Form.Control
                                    required
                                    type="date"
                                    value={this.state.eventEndDate}
                                    onChange={event => this.setState({eventEndDate: event.target.value})}
                                />
                              </div>
                            </Form.Group>
                          </div>
                        </> : null
                        }
                        <div className="col-md-12">
                          <Form.Group className="row">
                            <div className="col-sm-12">
                              <TextField
                                fullWidth
                                size="small"
                                select
                                label="Class Name"
                                value={this.state.class_id}
                                onChange={this.class_idChange}
                                variant="outlined"
                                required
                              >
                                <MenuItem value="">Select</MenuItem>
                                {this.state.loaded_classes ?
                                  this.state.classes.map((item) => {
                                    return (<MenuItem key={item.class_id}
                                                    name={item.class_name}
                                                    value={item.class_id}>{item.class_name}</MenuItem>);
                                  })
                                : null
                               }
                              </TextField>
                            </div>
                          </Form.Group>
                        </div>
                        <div className="col-md-12">
                          <Form.Group className="row">
                            <div className="col-sm-12">
                              {!this.state.show_edit ?
                                <Autocomplete
                                  key={this.state.key}
                                  multiple
                                  noOptionsText= {this.state.class_id ? 'No users available' : 'Please select a class from above'}
                                  options={this.state.class_id ? this.state.users : []}
                                  getOptionLabel={(option) => option.user_email}
                                  renderOption={(option, { selected }) => (
                                    <React.Fragment>
                                      <div style={{fontWeight: 'normal'}}>
                                        <span style={{fontSize: '13px'}}>
                                          {option.user_email}
                                        </span>
                                        <br />
                                        <span style={{fontSize: '11px', color: 'gray' }}>
                                          {option.user_first_name}{' '}{option.user_last_name}
                                          <span className="badge badge-success">{option.user_role}</span>
                                        </span>
                                      </div>
                                    </React.Fragment>
                                  )}
                                  renderInput={(params) => <TextField {...params}
                                                              fullWidth
                                                              label="Add guests"
                                                              variant="outlined" size="small"
                                                              helperText="Optional"
                                                            />}
                                  onChange={(event, newValue) => {
                                    this.setState({guestList: newValue})
                                  }}
                                /> :
                                <Autocomplete
                                  key={this.state.key}
                                  multiple
                                  noOptionsText= {this.state.class_id ? 'No users available' : 'Please select a class from above'}
                                  options={this.state.class_id ? this.state.users : []}
                                  value={this.state.guestList}
                                  getOptionLabel={(option) => option.user_email}
                                  renderOption={(option, { selected }) => (
                                    <React.Fragment>
                                      <div style={{fontWeight: 'normal'}}>
                                        <span style={{fontSize: '13px'}}>
                                          {option.user_email}
                                        </span>
                                        <br />
                                        <span style={{fontSize: '11px', color: 'gray' }}>
                                          {option.user_first_name}{' '}{option.user_last_name}
                                          <span className="badge badge-success">{option.user_role}</span>
                                        </span>
                                      </div>
                                    </React.Fragment>
                                  )}
                                  renderInput={(params) => <TextField {...params}
                                                              fullWidth
                                                              label="Add guests"
                                                              variant="outlined" size="small"
                                                              helperText="Optional"
                                                            />}
                                  onChange={(event, newValue) => {
                                    this.setState({guestList: newValue})
                                  }}
                                />
                              }
                            </div>
                          </Form.Group>
                        </div>
                        {this.state.videoConference === 'no-video' ?
                        <div className="col-md-12">
                          <Form.Group className="row">
                            <div className="col-sm-12">
                              <Button size="small" disabled={this.state.disabled}
                                      onClick={() => {this.setState({videoConference: 'video'})}}>
                                <Tooltip title="Create your class room conference">
                                  <span><VideoCallIcon/>{' '}Add video conference</span>
                                </Tooltip>
                              </Button>
                           </div>
                          </Form.Group>
                        </div> :
                        <div className="col-md-12">
                          <Form.Group className="row">
                            <div className="col-sm-12">
                              <Button disabled={this.state.disabled} size="small"
                                      onClick={() => {this.setState({videoConference: 'no-video'})}}>
                                <Tooltip title="Remove your class room conference">
                                  <span><VideocamOffIcon/>{' '}Remove video conference</span>
                                </Tooltip>
                              </Button>
                           </div>
                          </Form.Group>
                        </div>
                        }
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                  <Button variant="outlined" type="submit">
                      Save
                  </Button>
                  <Button variant="outlined" onClick={this.handleClose}>
                      Close
                  </Button>
              </Modal.Footer>
            </form>
         </Modal>
         {/*Dialog box to view an existing event */}
         <Modal show={this.state.show_view} onHide={this.handleClose}
                aria-labelledby="contained-modal-title-vcenter"
                centered
                dialogClassName="modal-30w"
         >
           <Modal.Header closeButton>
             <Modal.Title id="contained-modal-title-vcenter">{this.state.title}</Modal.Title>
           </Modal.Header>
           <Modal.Body>
             <Card>
               <CardContent>
                 <Typography variant="body2" component="p">
                   Timing: {' '}{moment(this.state.eventStartTime, "HH:mm").format("hh:mm a")}{' '}-{' '}
                   {moment(this.state.eventEndTime, "HH:mm").format("hh:mm a")}
                   <br/>
                     {this.state.videoConference!== 'no-video' &&
                      <>
                       {this.state.role !== 'student' ?
                         <Button disabled={this.state.disabled} className="button"
                                 onClick={()=> Utils.joinMeetingModerator(
                                   this.state.id, this.state.title,
                                   this.state.user_first_name,
                                   this.state.user_last_name )}>
                           <Tooltip title="Join video conference as moderator">
                             <span><VideocamIcon/>{' '}Join video conference</span>
                           </Tooltip>
                         </Button> :
                         <Button disabled={this.state.disabled} className="button"
                                 onClick={()=> Utils.joinMeetingAttendee(
                                   this.state.id, this.state.title,
                                   this.state.user_first_name,
                                   this.state.user_last_name )}>
                           <Tooltip title="Join video conference as attendee">
                             <span><VideocamIcon/>{' '}Join video conference</span>
                           </Tooltip>
                         </Button>
                       }
                      </>
                     }
                 </Typography>
               </CardContent>
             </Card>
           </Modal.Body>
           {this.state.role !== 'student' && this.state.meetingType !== "class_lecture" ?
           <Modal.Footer>
               <Button variant="outlined" onClick={this.editEventDialog}>
                   Edit
               </Button>
               <Button variant="outlined" onClick={this.removeEvent}>
                   Delete
               </Button>
           </Modal.Footer> : null
           }
        </Modal>
      </li>
    );
  }
}

export default Calendar;
