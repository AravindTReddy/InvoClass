import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './app/App';
import { ToastContainer } from 'react-toastify';
import * as serviceWorker from './serviceWorker';
import { getAppInsights } from './app/AppStack/shared/TelemetryService';
import TelemetryProvider from './app/AppStack/shared/telemetry-provider.jsx';
import config from './aws-exports'
import Amplify from 'aws-amplify'
Amplify.configure(config);
let appInsights = null;

ReactDOM.render(
  <BrowserRouter>
  <TelemetryProvider instrumentationKey="7696784d-3192-42a6-891e-1f8ca728cfae" after={() => { appInsights = getAppInsights() }}>
    <ToastContainer
      position="top-right"
      autoClose={false}
      newestOnTop
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      />
    <App />
  </TelemetryProvider>
  </BrowserRouter>
, document.getElementById('root'));

serviceWorker.unregister();
