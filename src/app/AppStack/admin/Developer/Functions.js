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
  deleteTemplate(item, refresh_token, custid) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'deletetemplate', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          "refresh_token": refresh_token,
          "customer_id": custid,
          "template_id": item.template_id,
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
  * To update image details
  * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
  * @param  {String} customer_id The unique customer ID of the current logged in user
  * @param  {String} user user email id
  * @param  {String} lab_id image unique id
  * @param  {String} image_name image name
  * @param  {String} image_description image description
  * @return {JSON}  response with a success and list of courses
  */
  updateTemplate(item, refresh_token, custid, user) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'updatetemplate', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body:JSON.stringify({
          "refresh_token": refresh_token,
          // "template_name": item.name,
          "customer_id": custid,
          "user": user,
          "item": item
          // "template_id": item.template_id,
          // "template_description": item.description,
          // "template_network": item.network,
          // "template_type": item.type
          // "version_history" include
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
    * To create an image lab from the available stock images
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} user user email id
    * @param  {String} image_name image name
    * @param  {String} image_resourceId azure image resource id
    * @param  {String} image_nsg azure nsg resource id
    * @param  {String} image_size azure VM size
    * @param  {String} image_version image version
    * @param  {String} image_description image description
    * @return {JSON}  response with a success and list of courses
  */
  createTemplate(item, refresh_token, custid, user, role) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'createtemplate', {
        method: 'post',
        headers:{
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body:JSON.stringify({
          "refresh_token": refresh_token,
          "customer_id": custid,
          "user": user,
          "role": role,
          "item": item
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
    * To create the stand alone template VM on demand
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} lab_id lab_id associated with the image
    * @return {JSON}  response with a success and list of courses
  */
  deployTemplateVM(item, custid, user) {
    if(item.type === "network")
      var endpoint = 'deploy_network'
    else {
      endpoint = 'deploy_image_vm'
    }
    return new Promise((resolve, reject) => {
      fetch(backendAPIURL + endpoint, {
      // fetch('http://areddy-cloud9.omnifsi.com:5000/' + endpoint, {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json'
        },
        body: JSON.stringify({
            "secret_password": "start_image_server_qw3$t&YWS",
            "customer_id": custid,
            "template_id": item.template_id,
            "stg": stgName,
            "user": user,
            "redeploy": "default"
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.statusCode === 200 || 505){
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
    * To save the changes made to an image launched
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @return {JSON}  response with a success and statusCode
  */
  saveTemplateVM(item, description, custid, user) {
    return new Promise((resolve, reject) => {
      fetch(backendAPIURL + 'create_image_from_vm', {
      // fetch('http://areddy-cloud9.omnifsi.com:5000/create_image_from_vm', {
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
          "create_image_password": "create_azure_im@G&^!fr",
          "template_id": item.template_id,
          "template_name": item.name,
          "description": description,
          "vm_name": item.vm_name,
          "stg": stgName,
          "user": user,
          "customer_id": custid,
        })
      })
      .then((response) => response.json())
      .then(responseJson => {
        // console.log(responseJson);
        if(responseJson.success === "success"){
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
  /**
    * To delete an environment
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {Array} item Array of image details(lab_id)
    * @return {JSON}  response with a success custom message and statusCode
  */
  deleteEnvironment(item, refresh_token, custid) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'deleteenvironment', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          "refresh_token": refresh_token,
          "customer_id": custid,
          "env_id": item.env_id,
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
    * To create an environment
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {Array} item Array of image details(lab_id)
    * @return {JSON}  response with a success custom message and statusCode
  */
  createEnvironment(item, refresh_token, custid, user, role) {
    return new Promise((resolve, reject) => {
      fetch(reactAPIURL + 'createenvironment', {
        method: 'post',
        headers:{
          'Accept': 'application/json',
          'Content-type': 'application/json'
        },
        body:JSON.stringify({
          "refresh_token": refresh_token,
          "customer_id": custid,
          "user": user,
          "role": role,
          "network": item.environment,
          "name": item.name,
          "description": item.description
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
  //more added
}
