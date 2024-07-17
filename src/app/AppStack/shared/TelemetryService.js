import {ApplicationInsights} from '@microsoft/applicationinsights-web';
import {ReactPlugin} from '@microsoft/applicationinsights-react-js';

const reactPlugin = new ReactPlugin();
//let reactPlugin = null;
let appInsights;

/**
 * Create the App Insights Telemetry Service
 * @return {{reactPlugin: ReactPlugin, appInsights: Object, initialize: Function}} - Object
 */
const createTelemetryService = () => {

    /**
     * Initialize the Application Insights class
     * @param {string} instrumentationKey - Application Insights Instrumentation Key
     * @param {Object} browserHistory - client's browser history, supplied by the withRouter HOC
     * @return {void}
     */
    const initialize = (instrumentationKey, browserHistory) => {
    //const browserHistory = createBrowserHistory({ basename: '' });
    //var reactPlugin = new ReactPlugin();
    var appInsights = new ApplicationInsights({
        config: {
            instrumentationKey: '7696784d-3192-42a6-891e-1f8ca728cfae',
            extensions: [reactPlugin],
            extensionConfig: {
              [reactPlugin.identifier]: { history: browserHistory }
            }
        }
    });
    appInsights.loadAppInsights();
    };

    return {reactPlugin, appInsights, initialize};
};

export const ai = createTelemetryService();
export const getAppInsights = () => appInsights;
