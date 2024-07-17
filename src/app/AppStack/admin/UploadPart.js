import React, { Component } from 'react';
import { ProgressBar, Form } from 'react-bootstrap';
import { getAppInsights } from '../shared/TelemetryService';
import TelemetryProvider from '../shared/telemetry-provider.jsx';
import {Prompt} from 'react-router-dom'
import Button from '@mui/material/Button';
import axios from 'axios'
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import * as SparkMD5 from 'spark-md5';
import {toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Utils from '../shared/Utils';
import { StyleSheet, css } from 'aphrodite';
import TextField from '@material-ui/core/TextField';
import {ThemeProvider, createMuiTheme} from '@material-ui/core/styles';
import Footer from '../shared/Footer';
import { reactAPIURL } from "../shared/General.js";

class UploadPart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      loaded: false,
      open: false,
      template_name: '',
      description: '',
      uploadButton: false,
      primary_color: '#F38A2C',
      secondary_color: '#606060'
    };
      this.handleChange = this.handleChange.bind(this);
  }

  async componentDidMount() {
    var appearanceObject = localStorage.getItem('appearanceObject');
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    if(appearanceObject !== null && userAuthDetails !== null && userDetails !== null){
      await this.setState({
        primary_color: JSON.parse(appearanceObject).primary_color,
        secondary_color: JSON.parse(appearanceObject).secondary_color,
        logo: JSON.parse(appearanceObject).logo_image,
        mini_logo: JSON.parse(appearanceObject).minilogo_image,
        bg_image: JSON.parse(appearanceObject).bg_image,
        user: JSON.parse(userAuthDetails).user,
        access_token: JSON.parse(userAuthDetails).access_token,
        refresh_token: JSON.parse(userAuthDetails).refresh_token,
        id_token: JSON.parse(userAuthDetails).id_token,
        role: JSON.parse(userDetails).role,
        customer_id: JSON.parse(userDetails).customer_id,
        userIcon: JSON.parse(userDetails).userIcon,
        user_first_name: JSON.parse(userDetails).user_first_name,
        user_last_name: JSON.parse(userDetails).user_last_name,
        loaded: true,
      });
    }
  }

  /**
    * To get the pre signedURL(putObject) of the object from S3 bucket
  */
  putS3SignedUrl = async(e) => {
    e.preventDefault();
    //.ova, .ovf, and .vmdk(allowing .iso for testing)
      const extension = this.state.fileName.split('.').pop();
      if(extension === 'ova' || extension === 'ovf' || extension === 'vmdk'){
        Utils.addinfoNotification('Uploading your file...');
        await this.setState({uploadButton: true})
        const directory = this.state.customer_id + "/templates/uploaded/";
        await Utils.putS3SignedUrl(this.state.refresh_token, [this.state.fileName],
                                    this.state.fileType, directory)
        .then(data => {
          data.map(async (item) =>{
            this.uploadToS3(item.url);
          })
        })
        .catch(err => { throw err });
      }else{
        Utils.adderrorNotification('Please select a valid file format and try again')
      }
  }
  /**
    * To upload the object to S3 bucket using the above generated pre-signed URL
    * @param  {String} Content-Type the file type
    * @param  {String} signedURL pre signed url that is generated above to putObject into the bucket
    * @param  {Object} item the file name
    * @return {JSON}  response with a statusText, request readyState and statusCode
  */
  uploadToS3 = async(item) => {
    const started = new Date().getTime();
    const CancelToken = axios.CancelToken;
    this.source = CancelToken.source();
    try {
      const options = {
        cancelToken: this.source.token,
        onUploadProgress: (progressEvent) => {
          const {loaded, total} = progressEvent;
          let percent = Math.ceil( (loaded * 100) / total )
          //let percent = (loaded * 100) / total
          var progress = loaded / total;
          var timeSpent = new Date().getTime() - started;
          var secondsRemaining = Math.round(((timeSpent / progress) - timeSpent) / 1000);
          var mins = Math.floor(secondsRemaining / 60);
          var hours = (mins / 60);
          var rhours = Math.floor(hours);
          var minutes = (hours - rhours) * 60;
          var rminutes = Math.round(minutes);
          // console.log( `${loaded}kb of ${total}kb | ${percent}%` );
          if( percent < 100 ){
            this.setState({ uploadPercentage: percent, uploadedBytes: Math.floor(loaded/1024) , totalBytes: Math.floor(total/1024), timeElapsed: rhours + " hour(s) and " + rminutes + " minute(s)." })
          }
        },
        headers: { 'Content-Type': this.state.fileType }
      }
      await axios.put(item, this.state.filemain, options).then(res => {
        if(res.status === 200 && res.statusText === "OK" && res.request.readyState === 4 && JSON.parse(res.headers.etag) === this.state.filemd5Hash){
            this.setState({ uploadPercentage: 100 }, ()=>{
              setTimeout(() => {
                this.createImage();
                this.setState({ uploadPercentage: 0, uploadButton: false })
              }, 1000);
            })
        }
        else{
          toast.dismiss();
          Utils.adderrorNotification('Error uploading the file. Please try again')
          this.setState({uploadPercentage: 0, uploadButton: false})
        }
      })
    }catch (err) {
      // check if the request was cancelled
      toast.dismiss();
      if(axios.isCancel(err)) {
          Utils.adderrorNotification('Error uploading the image: ' + err.message)
          this.setState({uploadPercentage: 0, uploadButton: false})
      }else{
        Utils.adderrorNotification('Error uploading the image: ' + err.message)
        this.setState({uploadPercentage: 0, uploadButton: false})
      }
    }
  }
  /**
    * To create an image lab using the uploaded image details
    * @param  {String} refresh_token The refresh token of the current authenticated(logged in) user
    * @param  {String} customer_id The unique customer ID of the current logged in user
    * @param  {String} template_name Name of the image
    * @param  {String} file Name of the uploading file
    * @param  {String} user_first_name first name of the user uploading the file
    * @return {JSON}  response with a success custom message and statusCode
  */
  createImage = async() => {
    var item = {
      template_name: this.state.template_name,
      template_resourceId: 'convert',
      template_version: 1.0,
      template_nsg: '',
      template_size: '',
      template_plan: '',
      template_code: '',
      template_description: this.state.description
    }
    this.props.create(item);
  };
  /**
    * To calculated the Md5 checksumhash of the file
    * @param  {File} file the file that is being uploaded
    * @return {String}  Md5 hash value
  */
  computeChecksumMd5Hash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunkSize = 2097152; // Read in chunks of 2MB
      //const chunkSize = 10 * 1024 * 1024;
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();

      let cursor = 0; // current cursor in file

      fileReader.onerror = function(): void {
        reject('MD5 computation failed - error reading the file');
      };
      // read chunk starting at `cursor` into memory
      function processChunk(chunk_start: number): void {
        const chunk_end = Math.min(file.size, chunk_start + chunkSize);
        fileReader.readAsArrayBuffer(file.slice(chunk_start, chunk_end));
      }
      // when it's available in memory, process it
      // If using TS >= 3.6, you can use `FileReaderProgressEvent` type instead
      // of `any` for `e` variable, otherwise stick with `any`
      // See https://github.com/Microsoft/TypeScript/issues/25510
      fileReader.onload = function(e: any): void {
        spark.append(e.target.result); // Accumulate chunk to md5 computation
        cursor += chunkSize; // Move past this chunk
        if (cursor < file.size) {
          // Enqueue next chunk to be accumulated
          processChunk(cursor);
        } else {
          // Computation ended, last chunk has been processed. Return as Promise value.
          // This returns the base64 encoded md5 hash, which is what
          // Rails ActiveStorage or cloud services expect
          //resolve(btoa(spark.end(true)));
          // If you prefer the hexdigest form (looking like
          // '7cf530335b8547945f1a48880bc421b2'), replace the above line with:
          resolve(spark.end());
        }
      };
      processChunk(0);
    });
  }
  //assigning the state of above calculated Md5 hash on file change
  handleChange = event => {
      if(event.target.files[0]){
        this.computeChecksumMd5Hash(event.target.files[0]).then(md5 => {
            this.setState({filemd5Hash: md5});
      });
        this.setState({
          filemain: event.target.files[0],
          fileName: event.target.files[0].name,
          fileType: event.target.files[0].type,
        });
      }
      else{
        this.setState({filemain: '',fileName: '',fileType: ''});
      }
  }

  handleClickOpen = () => {
    this.setState({open:true})
  }
  handleClose = () => {
    this.setState({open:false})
  };
  //cancel the ongoing upload process
  cancelUpload = () => {
    this.setState({uploadButton: false, open:false})
    this.source.cancel('Upload aborted by user');
  }

  render () {
    let appInsights = null;
    const {uploadPercentage} = this.state;
    const styles = StyleSheet.create({
      cardheader: {
        backgroundColor: 'white',
        color: this.state.primary_color,
      },
      button: {
        ':hover': {
            color: this.state.secondary_color,
        }
      }
    });
    const header = {
      backgroundColor: this.state.primary_color,
      height: '45px' //same as OMS navbar height
    };
    const theme = createMuiTheme({
      palette: {
        primary: {
            main: this.state.primary_color,
        },
        secondary: {
            main: this.state.secondary_color,
        },
      },
    });
    return (
      <TelemetryProvider instrumentationKey="7696784d-3192-42a6-891e-1f8ca728cfae" after={() => { appInsights = getAppInsights() }}>
        <ThemeProvider theme={theme}>
          {this.state.role === "admin" || this.state.role === "customer_admin"
          || this.state.role === "biz_default_user" || this.state.role === "biz_customer_admin" ?
          <div className="App">
            <div className="row">
              <div className="col-md-12 grid-margin">
                <div className="card">
                    <div className="card-body">
                    <p className="card-description">(All fields marked with * are required)</p>
                      <form onSubmit={this.putS3SignedUrl}>

                        <Dialog
                            open={this.state.open}
                            onClose={() => this.handleClose()}
                            keepMounted
                            aria-labelledby="alert-dialog-slide-title"
                            aria-describedby="alert-dialog-slide-description"
                          >
                            <DialogTitle id="alert-dialog-slide-title">{"Cancel file upload?"}</DialogTitle>
                            <DialogContent>
                                <DialogContentText id="alert-dialog-slide-description">
                                    Are you sure this action
                                    can not be undone?
                                </DialogContentText>
                            </DialogContent>
                            <DialogActions>
                              <Button onClick={() => this.cancelUpload()} color="primary">
                                Confirm
                              </Button>
                              <Button onClick={() => this.handleClose()} color="primary">
                                Cancel
                              </Button>
                            </DialogActions>
                          </Dialog>
                        { uploadPercentage > 0 && (
                            <div className="row">
                              <div className="col-md-4">
                                  <Form.Group className="row">
                                    <div className="col-sm-12">
                                      <label className="col-sm-12 col-form-label"><ProgressBar style={{height: 20 + 'px'}} now={uploadPercentage} animated striped={true} variant="success" label={`${uploadPercentage}% Uploaded`} />
                                      <span>{Math.floor(this.state.uploadedBytes/1024)} Mb of {Math.floor(this.state.totalBytes/1024)} Mb | {this.state.timeElapsed}</span></label>
                                      <div className="col-sm-2">
                                      <span
                                          className="text-primary cursor-pointer"
                                          onClick={() => this.handleClickOpen()}
                                      >
                                          Cancel
                                      </span>
                                      </div>
                                    </div>
                                  </Form.Group>
                              </div>
                            </div>
                        )}
                        <div className="row">
                          <Prompt
                            when={!!this.state.uploadPercentage}
                            message={msg => `Upload under progress!! Are you sure you want to leave the page ?`}
                          />
                          <div className="col-md-6">
                            <Form.Group className="row">
                              <div className="col-sm-12">
                                <TextField
                                  fullWidth
                                  size="small"
                                  variant="outlined"
                                  label="Lab Template Name"
                                  value={this.state.template_name}
                                  type='text'
                                  required
                                  onChange={event => this.setState({'template_name': event.target.value.trim()})}
                                  helperText='No spaces are allowed  | Accepted file types are .ova, .ovf, and .vmdk.  Please allow up to 48 hours for the conversion to process. Please note not all Operating Systems are supportable.'
                                  autoFocus
                                />
                              </div>
                            </Form.Group>
                          </div>
                          <div className="col-md-6">
                              <Form.Group className="row">
                                  <div className="col-sm-12">
                                    <TextField
                                      fullWidth
                                      size="small"
                                      variant="outlined"
                                      label="Lab Template Description"
                                      value={this.state.description}
                                      rows={5}
                                      multiline
                                      required
                                      onChange={event => this.setState({'description': event.target.value})}
                                    />
                                  </div>
                              </Form.Group>
                          </div>
                          <div className="col-md-3">
                            <Form.Group className="row">
                              <input className="custom-file-upload"
                                     type="file" name="imageFile"
                                     required
                                     ref={ref=> this.fileInput = ref}
                                     onChange={this.handleChange}
                                     accept=".ova, .ovf, .vmdk"
                              />
                            </Form.Group>
                          </div>
                          <div className="col-md-12">
                            <Button
                              type="submit" variant="contained"
                              disabled={this.state.uploadButton}
                              size="small"
                            >
                              Upload
                            </Button>{' '}
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => this.props.close()}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                 </div>
               </div>
              </div>
          </div> : <div className="page-header">
              <h3 className="page-title">  </h3>
          </div>
          }
        </ThemeProvider>
      </TelemetryProvider>
    );
  }
}

export default UploadPart;
