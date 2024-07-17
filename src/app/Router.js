import React from 'react'
import {
    withRouter,
    Switch,
    Route,
    Redirect,
    BrowserRouter as Router
} from 'react-router-dom'
import {Auth} from 'aws-amplify'

import Authenticator from './Authenticator'
import AppRoutes from './AppRoutes'

class PrivateRoute extends React.Component {
    state = {
        loaded: false,
        isAuthenticated: false
    };

    async componentDidMount(): void {
      await this.authenticate();
      this.unlisten = this.props.history.listen(() => {
          Auth.currentAuthenticatedUser()
              .catch(() => {
                  if (this.state.isAuthenticated) this.setState({isAuthenticated: false})
              })
      });
    }

    componentWillUnmount() {
      this.unlisten();
    }

    authenticate() {
        Auth.currentAuthenticatedUser()
            .then((data) => {
                this.setState({loaded: true, isAuthenticated: true})
            })
            .catch(() => this.props.history.push('/auth'))
    }

    render() {
        const {component: Component, ...rest} = this.props;
        const {loaded, isAuthenticated} = this.state;
        if (!loaded) return null;
        return (
            <Route
                {...rest}
                render={props => {
                    return isAuthenticated ? (
                        <Component {...props} />
                    ) : (
                        <Redirect
                            to={{
                                pathname: "/auth",
                            }}
                        />
                    )
                }}
            />
        )
    }
}

PrivateRoute = withRouter(PrivateRoute);

const Routes = () => (

    <Router>
        <Switch>
          <Route path='/auth' component={Authenticator}/>
          <PrivateRoute path='/' component={AppRoutes}/>
        </Switch>
    </Router>
);

export default Routes
