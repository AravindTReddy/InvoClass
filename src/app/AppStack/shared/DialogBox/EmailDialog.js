// Import necessary libraries/components
import React, { useState, useEffect } from "react";
import TextField from '@material-ui/core/TextField';
import Slide from "@material-ui/core/Slide";
import Button from '@material-ui/core/Button';
import { toast } from 'react-toastify';
import Utils from '../../shared/Utils';
import { reactAPIURL } from "../../shared/General.js";
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogActions from "@material-ui/core/DialogActions";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const EmailDialog = ({ open, data, close }) => {
    // State variables
    const [emailSubject, setEmailSubject] = useState('');
    const [editorHtml, setEditorHtml] = useState('');
    const [refreshToken, setRefreshToken] = useState('');
    const [user, setUser] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [role, setRole] = useState('');
    const [theme] = useState('snow');
    const [subjectError, setSubjectError] = useState(false);
    const [messageError, setMessageError] = useState(false);

    useEffect(() => {
        // Fetch user and authentication details
        const userAuthDetails = localStorage.getItem('userAuthDetails');
        const userDetails = localStorage.getItem('userDetails');
        if (userAuthDetails && userDetails) {
            const parsedUserAuthDetails = JSON.parse(userAuthDetails);
            const parsedUserDetails = JSON.parse(userDetails);
            setRefreshToken(parsedUserAuthDetails.refresh_token);
            setUser(parsedUserAuthDetails.user);
            setCustomerId(parsedUserDetails.customer_id);
            setRole(parsedUserDetails.role);
        }
    }, [open]);

    // Function to handle email sending
    const sendEmails = () => {
        // Check if subject and message are not empty
        if (!emailSubject.trim()) {
            setSubjectError(true);
            return;
        }
        if (!editorHtml.trim()) {
            setMessageError(true);
            return;
        }

        Utils.addinfoNotification('Sending email to student(s)...');

        // Send email
        fetch(reactAPIURL + 'sendemails', {
            method: 'post',
            headers: {
                'Accept': 'application/json',
                'Content-type': 'application/json'
            },
            body: JSON.stringify({
                "refresh_token": refreshToken,
                "message": editorHtml,
                "subject": emailSubject,
                "students": data
            })
        })
        .then((response) => response.json())
        .then(responseJson => {
            toast.dismiss();
            if (responseJson.message === "success" && responseJson.statusCode === 200) {
                Utils.addsuccessNotification("Email sent successfully");
                close();
            } else {
                Utils.adderrorNotification('Error sending email: ' + responseJson.errorMessage);
            }
        })
        .catch((error) => {
            toast.dismiss();
            Utils.adderrorNotification('Error sending email: ' + error);
        });
    }

    // Function to handle editor change
    const handleChange = (html) => {
        setEditorHtml(html);
        setMessageError(false); // Reset message error when the user starts typing
    }

    // Function to close the dialog
    const handleClose = async () => {
        close();
    }

    return (
        <Dialog
            open={open}
            TransitionComponent={Transition}
            keepMounted
            onClose={handleClose}
            aria-labelledby="alert-dialog-slide-title"
            aria-describedby="alert-dialog-slide-description"
            style={{ zIndex: 100000 }}
            fullWidth
            maxWidth="sm"
        >
            <DialogTitle id="alert-dialog-slide-title">New Message</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-slide-description">
                    <div className="col-lg-12 grid-margin">
                        {role !== 'student' ? (
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="row">
                                        <div className="col-sm-12">
                                            <TextField
                                                fullWidth
                                                size="small"
                                                variant="outlined"
                                                label="Subject"
                                                value={emailSubject}
                                                type="text"
                                                required
                                                error={subjectError}
                                                InputLabelProps={{ style: { fontSize: 12 } }}
                                                InputProps={{ style: { fontSize: 13 } }}
                                                onChange={(evt) => {
                                                    setEmailSubject(evt.target.value);
                                                    setSubjectError(false); // Reset subject error when the user starts typing
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="row mt-2">
                                        <div className="col-sm-12">
                                            <span>Message*</span>
                                            <ReactQuill
                                                theme={theme}
                                                onChange={handleChange}
                                                value={editorHtml}
                                                bounds={'.app'}
                                                placeholder="Message"
                                            />
                                            {messageError && <span style={{ color: 'red' }}>Message is required</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button variant="outlined" onClick={sendEmails} color="primary">
                    Send
                </Button>
                <Button variant="outlined" onClick={handleClose} color="primary">
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EmailDialog;
