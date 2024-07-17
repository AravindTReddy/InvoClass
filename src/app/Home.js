import React, { Component, Suspense, lazy } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import Spinner from '../app/AppStack/shared/Spinner';
import { Auth } from 'aws-amplify';
import Utils from './AppStack/shared/Utils';
import { userIcons, socketUrl } from "./AppStack/shared/General.js";
import TemplateLab from './AppStack/admin/Developer/TemplateLab'
import StudentLab from './AppStack/student/StudentLab'
import UploadPart from './AppStack/admin/UploadPart'
const Myaccount = lazy(() => import('./AppStack/user/Myaccount'));
const HomeDashboard = lazy(() => import('./AppStack/home/Homedashboard'));
const CustomerManagement = lazy(() => import('./AppStack/brixon_admin/CustomerManagement'));
const ClassroomManagement = lazy(() => import('./AppStack/admin/ClassroomManagement'));
const UserManagement = lazy(() => import('./AppStack/admin/UserManagement'));
const TemplateManagement = lazy(() => import('./AppStack/admin/TemplateManagement'));
const HealthDashboard = lazy(() => import('./AppStack/admin/HealthDashboard'));
const MachineManagement = lazy(() => import('./AppStack/admin/MachineManagement'));
// const StudentDashboard = lazy(() => import('./AppStack/student/StudentDashboard'));

// const ClassStepperWizard = lazy(() => import('./AppStack/admin/Class/ClassStepperWizard'));
const ClassDetails = lazy(() => import('./AppStack/admin/Class/ClassDetails'));

const TemplateDetails = lazy(() => import('./AppStack/admin/Developer/TemplateDetails'));

class Home extends Component {
  constructor(props){
    super(props);
    this.state = {
      role: this.props.role
    };
  }

  render () {
    // var userAuthDetails, userDetails;
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    if(userAuthDetails !== null && userDetails !== null){
      Auth.currentAuthenticatedUser()
      .then(async (user) => {
        userAuthDetails = {
          'user': user.attributes.email,
          'access_token': user.signInUserSession.accessToken.jwtToken,
          'refresh_token': user.signInUserSession.refreshToken.token,
          'id_token': user.signInUserSession.idToken.jwtToken
        }
        // Put the object into storage
        localStorage.setItem('userAuthDetails', JSON.stringify(userAuthDetails));
      })
      .catch((err) => {
        Auth.signOut()
        .then(() => {
            localStorage.clear();
            window.open('/', "_self");
        })
      });
    }
    else{
      Auth.currentAuthenticatedUser()
      .then(async (user) => {
        userAuthDetails = {
          'user': user.attributes.email,
          'access_token': user.signInUserSession.accessToken.jwtToken,
          'refresh_token': user.signInUserSession.refreshToken.token,
          'id_token': user.signInUserSession.idToken.jwtToken
        }
        // Put the object into storage
        localStorage.setItem('userAuthDetails', JSON.stringify(userAuthDetails));
        await Utils.getRole(userAuthDetails.user, userAuthDetails.refresh_token, userAuthDetails.id_token)
        .then((res) => {
          res.map((item) => {
            var userIcon;
            userIcons.map((entry) => {
              if(entry.role === item.user_role){
                userIcon = entry.icon;
              }
            })
            userDetails = {
              additonal_roles: item.additonal_roles,
              role: item.user_role,
              customer_id: item.customer_id,
              user_first_name: item.user_first_name,
              user_last_name: item.user_last_name,
              userIcon: userIcon,
              user_notification_preferences: item.user_notification_preferences
            }
            // Put the object into storage
            localStorage.setItem('userDetails', JSON.stringify(userDetails));
          })
        })
        .catch((err) => {
          Auth.signOut()
          .then(() => {
              localStorage.clear();
              window.open('/', "_self");
          })
        })
      })
      .catch((err) => {
        Auth.signOut()
        .then(() => {
            localStorage.clear();
            window.open('/', "_self");
        })
      });
    }
    var userDetails = localStorage.getItem('userDetails');
    return (
      <Suspense fallback={<Spinner/>}>
        <Switch>
          {this.props.role === 'student' ?
            <Route exact path="/admin/classes" component={ ClassroomManagement } /> :
            <Route exact path="/admin/home" component={ HomeDashboard } />
          }

          {/*<Route exact path="/admin/home" component={ ClassStepperWizard } />*/}
          {/*<Route exact path="/student/student-dashboard" component={ StudentDashboard } /> */}

          <Route exact path="/admin/home" component={ HomeDashboard } />

          <Route exact path="/brixon_admin/customer-management" component={ CustomerManagement } />
          <Route exact path="/admin/users" component={ UserManagement } />
          <Route exact path="/admin/templates" component={ TemplateManagement } />
          <Route exact path="/admin/classes" component={ ClassroomManagement } />
          <Route exact path="/admin/health" component={ HealthDashboard } />
          <Route exact path="/admin/machine-management" component={ MachineManagement } />
          {/*<Route exact path="/student/student-dashboard" component={ StudentDashboard } />*/}
          <Route exact path='/admin/upload-image' component={ UploadPart }/>
          <Route exact path="/user/my-account" component={ Myaccount } />
          <Route path='/admin/developer/template-lab' component={TemplateLab}/>
          <Route path='/student/student-lab' component={StudentLab}/>
          <Route exact path="/admin/templates/:id" component={ TemplateDetails } />
          <Route exact path="/admin/classes/class/:id" component={ ClassDetails } />

          {this.props.role === 'student' ?
            <Redirect to="/admin/classes" /> :
            <Redirect to="/admin/home" />
          }
        </Switch>
      </Suspense>
    );
  }
}

export default Home;
