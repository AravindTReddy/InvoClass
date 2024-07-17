import React, {Component} from 'react';
import {withRouter} from 'react-router-dom';
import './App.scss';
import Home from './Home';
import Navbar from './AppStack/shared/Navbar';
import Footer from './AppStack/shared/Footer';
import { Auth } from 'aws-amplify';
import Utils from './AppStack/shared/Utils';
import 'react-toastify/dist/ReactToastify.css';
import { userIcons, reactAPIURL } from "./AppStack/shared/General.js";

class AppRoutes extends Component {
    state = {
       subscriptionStatus: ''
    };
    async componentDidMount() {
      try {
          const appearanceObject = localStorage.getItem('appearanceObject');
          const userAuthDetails = localStorage.getItem('userAuthDetails');
          const userDetails = localStorage.getItem('userDetails');
          const sub_status = localStorage.getItem('subscriptionStatus');

          if (appearanceObject && userAuthDetails && userDetails) {
              this.setState({
                  primary_color: JSON.parse(appearanceObject).primary_color,
                  secondary_color: JSON.parse(appearanceObject).secondary_color,
                  logo: JSON.parse(appearanceObject).logo_image,
                  mini_logo: JSON.parse(appearanceObject).minilogo_image,
                  bg_image: JSON.parse(appearanceObject).bg_image,
                  role: JSON.parse(userDetails).role,
                  customer_id: JSON.parse(userDetails).customer_id,
                  user_first_name: JSON.parse(userDetails).user_first_name,
                  subscriptionStatus: JSON.parse(sub_status)
              });
          } else {
              const user = await Auth.currentAuthenticatedUser();
              const userAuthDetails = {
                  user: user.attributes.email,
                  access_token: user.signInUserSession.accessToken.jwtToken,
                  refresh_token: user.signInUserSession.refreshToken.token,
                  id_token: user.signInUserSession.idToken.jwtToken
              };
              localStorage.setItem('userAuthDetails', JSON.stringify(userAuthDetails));

              const res = await Utils.getRole(userAuthDetails.user, userAuthDetails.refresh_token, userAuthDetails.id_token);
              if (!res || res.length < 1) {
                  Utils.adderrorNotification('Error retrieving user details: Please logout and log back in!');
                  return;
              }

              const userDetails = res.map(item => {
                  const userIcon = userIcons.find(entry => entry.role === item.user_role)?.icon;
                  return {
                      additonal_roles: item.additonal_roles,
                      role: item.user_role,
                      customer_id: item.customer_id,
                      user_first_name: item.user_first_name,
                      user_last_name: item.user_last_name,
                      userIcon,
                      user_notification_preferences: item.user_notification_preferences
                  };
              })[0];
              localStorage.setItem('userDetails', JSON.stringify(userDetails));

              const [appearanceRes, customerDetails, templates, stockImages, classes, instructors, users, assignedStudents] = await Promise.all([
                  Utils.getAppearanceDetails(userDetails.role, userDetails.customer_id, userAuthDetails.refresh_token, userAuthDetails.id_token),
                  Utils.getCustomerDetails(userAuthDetails.refresh_token, userDetails.customer_id, userDetails.role),
                  Utils.getCustomerTemplates(userAuthDetails.refresh_token, userAuthDetails.user, userDetails.customer_id, userDetails.role),
                  Utils.getStockImages(userAuthDetails.refresh_token),
                  Utils.getCustomerClasses(userAuthDetails.user, userDetails.role, userDetails.customer_id, userAuthDetails.refresh_token),
                  userDetails.role !== 'student' && Utils.getCustomerInstructors(userAuthDetails.refresh_token, userDetails.customer_id, userDetails.role),
                  Utils.getCustomerUsers(userAuthDetails.user, userDetails.role, userDetails.customer_id, userAuthDetails.refresh_token),
                  Utils.getCustomerStudents(userAuthDetails.refresh_token, userDetails.customer_id, userDetails.role, userAuthDetails.user, 'default')
              ]);

              if (appearanceRes && appearanceRes.length >= 1) {
                  const appearanceObject = appearanceRes.map(item => ({
                      primary_color: item.primary_color,
                      secondary_color: item.secondary_color,
                      logo_image: item.logo,
                      minilogo_image: item.mini_logo,
                      bg_image: item.bg_image
                  }))[0];
                  localStorage.setItem('appearanceObject', JSON.stringify(appearanceObject));
              } else {
                  Utils.adderrorNotification('Error retrieving user appearance details: Please logout and log back in!');
              }
              // console.log('customerDetails', customerDetails);
              localStorage.setItem('customerDetails', JSON.stringify(customerDetails));

              if (customerDetails.length === 1 && customerDetails[0].customer_plan?.sub_id) {
                  const response = await fetch(reactAPIURL + 'payment', {
                      method: 'post',
                      headers: {
                          'Accept': 'application/json',
                          'Content-type': 'application/json'
                      },
                      body: JSON.stringify({
                          'type': 'readsubscription',
                          'subscription_id': customerDetails[0].customer_plan.sub_id
                      })
                  });
                  const responseJson = await response.json();
                  if (responseJson.statusCode === 200) {
                      const subscriptionData = responseJson.result;
                      this.setState({ subscriptionStatus: subscriptionData.status });
                      localStorage.setItem('subscriptionStatus', JSON.stringify(subscriptionData.status));
                  }
              } else {
                  localStorage.setItem('subscriptionStatus', JSON.stringify(null));
              }
              // console.log('Templates', templates);
              // console.log('stockImages', stockImages);
              // console.log('Classes', classes);
              localStorage.setItem('templates', JSON.stringify(templates));
              localStorage.setItem('stockimages', JSON.stringify(stockImages));
              localStorage.setItem('classes', JSON.stringify(classes));

              if(userDetails.role !== 'student'){
                const instructorsData = instructors.map(item => ({
                    name: `${item.user_first_name} ${item.user_last_name}`,
                    email: item.user_email
                }));
                // console.log('Instructors', instructorsData);
                localStorage.setItem('instructors', JSON.stringify(instructorsData));
              }

              const usersData = users.filter(item => userAuthDetails.user !== item.user_email).map(item => {
                  let mappedData;
                  switch (item.user_role) {
                      case 'admin':
                          mappedData = "Brixon Administrator";
                          break;
                      case 'customer_admin':
                          mappedData = "Administrator";
                          break;
                      case 'brixon_developer':
                          mappedData = "Brixon Developer";
                          break;
                      case 'customer_developer':
                          mappedData = "Customer Developer";
                          break;
                      case 'course_author':
                          mappedData = "Course Author";
                          break;
                      case 'instructor':
                          mappedData = "Instructor";
                          break;
                      default:
                          mappedData = "Student";
                          break;
                  }
                  return { ...item, user_role: mappedData };
              });
              // console.log('Users', usersData);
              localStorage.setItem('users', JSON.stringify(usersData));
              // console.log('assignedStudents', assignedStudents);
              localStorage.setItem('assignedStudents', JSON.stringify(assignedStudents));

              // holding for a second more
              this.interval = setTimeout(() => {
                window.location.reload()
              }, 1000);
          }
      } catch (error) {
          console.error('Error:', error);
          // Optionally, redirect the user to the login page if authentication fails
      }
    }

    render() {
        let navbarComponent = !this.state.isFullPageLayout ? <Navbar/> : '';
        // let sidebarComponent = !this.state.isFullPageLayout ? <Sidebar/> : '';
        let footerComponent = !this.state.isFullPageLayout ? <Footer/> : '';

        return (
            <div className="container-scroller">
                {navbarComponent}
                  <div className="container-fluid page-body-wrapper">
                      <div className="main-panel"
                         style={{
                           backgroundImage: `url(${this.state.bg_image})`,
                         }}
                      >
                          <div className="content-wrapper">
                              {this.state.role && <Home role={this.state.role}/>}
                          </div>
                      </div>
                  </div>
            </div>
        );
    }

}

export default withRouter(AppRoutes);
