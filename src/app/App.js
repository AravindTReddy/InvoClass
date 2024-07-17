import React, { Component } from 'react';
import Router from './Router'
import './App.scss';
import './App.css';
import { getAppInsights } from './AppStack/shared/TelemetryService';
import TelemetryProvider from './AppStack/shared/telemetry-provider.jsx';

export default class App extends Component {
  render() {
    let appInsights = null;
    return (
      <TelemetryProvider instrumentationKey="7696784d-3192-42a6-891e-1f8ca728cfae" after={() => { appInsights = getAppInsights() }}>
        <div className="App">
          <Router />
        </div>
      </TelemetryProvider>
    );
  }
}
