/* helper functions to avoid code rewriting */
import React from 'react';
import { reactAPIURL, backendAPIURL, stgName } from "../../shared/General";
export default {

  /**
    * To delete an image
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {Array} item Array of image details(lab_id)
    * @return {JSON}  response with a success custom message and statusCode
  */
  deleteClass(item, refresh_token, user) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'deleteclass', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            "refresh_token": refresh_token,
            "entries": item,
            "user": user
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.message === "success" && responseJson.statusCode === 200){
          resolve(responseJson);
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
  * To create the instructor VM on demand
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {Array} rowData An array with student details(class_id, course_id, customer_id, lab_id, student_email)
    * @return {JSON}  response with a success custom message and statusCode
  */
  createInstructorVM(item, refresh_token, user) {
    return new Promise((resolve, reject) => {
      fetch(backendAPIURL + 'deploy_student_vm', {
          method: 'post',
          headers: {
              'Accept': 'application/json',
              'Content-type': 'application/json',
          },
          body: JSON.stringify({
            "secret_password": "start_student_server_qw3$t&YWS",
            'student_id': item.student_id,
            'customer_id': item.customer_id,
            'class_id': item.class_id,
            'student_email': item.instructor_email,
            'stg': stgName,
            'user': user,
            'request': 'default'
          })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.message === "success" && responseJson.statusCode === 200){
          resolve(responseJson);
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
  * To create the class server VM on demand
  * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
  * @param  {Array} rowData An array with class details(class_id, course_id, customer_id)
  * @return {JSON}  response with a success custom message and statusCode
  */
  createClassServerVM(class_id, serverStatus, user) {
    return new Promise((resolve, reject) => {
      fetch(backendAPIURL + 'deploy_class_server_vm', {
      // fetch('http://areddy-cloud9.omnifsi.com:5000/deploy_class_server_vm', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            "secret_password": "start_class_server_qw3$t&YWS",
            'class_id': class_id,
            "server_status": serverStatus,
            'user': user,
            'rebuild': false
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          resolve(responseJson);
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
    * To schedule build for classes using a specific version of an image
    * @param  {Object} item An object with classes list, resource_id, lab_id
    * @param  {Object} scheduler An Object with scheduler type and time
    * @return {JSON}  response with a success custom message and statusCode
  */
  createTemplateBuild(item, scheduler, refresh_token, custid, user) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'createbuild', {
          method: 'post',
          headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
          },
          body: JSON.stringify({
            "refresh_token": refresh_token,
            "customer_id": custid,
            "user": user,
            "build_data": item,
            "stg": stgName,
            "scheduler_type": scheduler.type,
            "scheduler_time": scheduler.time
          })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          resolve(responseJson);
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
    * To delete an build
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {Array} item Array of image details(lab_id)
    * @return {JSON}  response with a success custom message and statusCode
  */
  deleteTemplateBuild(item, refresh_token, custid) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'deletebuild', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          "refresh_token": refresh_token,
          "customer_id": custid,
          "entry": item,
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          resolve(responseJson);
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  /**
    * To update build details
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} user user email id
    * @param  {String} lab_id image unique id
    * @param  {String} image_name image name
    * @param  {String} image_description image description
    * @return {JSON}  response with a success and list of courses
  */
  updateTemplateBuild(item, scheduler, refresh_token, custid, user) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'updatebuild', {
          method: 'post',
          headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
          },
          body: JSON.stringify({
            "refresh_token": refresh_token,
            "customer_id": custid,
            "user": user,
            "build_data": item,
            "stg": stgName,
            "scheduler_type": scheduler.type,
            "scheduler_time": scheduler.time,
            "name": item.name
          })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200){
          resolve(responseJson);
        }else{
          reject(responseJson.errorMessage);
        }
      })
      .catch((error) => {
        reject(error);
      });
    })
  },
  //more added
}
