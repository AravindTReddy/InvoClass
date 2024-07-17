import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  InputLabel,
  MenuItem,
  Container,
  Paper,
  Typography, Grid, CardMedia
} from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { Form, Spinner } from 'react-bootstrap';
import { languages, classLevels, classCategories, s3BucketUrl } from '../../shared/General'
import empty_class from "../../../../assets/images/empty-class.jpg";
import Utils from '../../shared/Utils';

const ClassOverview = ({ step1Data, setStep1Data, newclass }) => {

  const filter = createFilterOptions();

  const [classTitleCount, setClassTitleCount] = useState(0);
  const [maxClassTitleLength] = useState(40);
  const [customTagInput, setCustomTagInput] = useState('');
  const [user, setUser] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [userLastName, setUserLastName] = useState('');
  const [role, setRole] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [refreshToken, setRefreshToken] = useState('');


  useEffect(() => {

    var userTemplates = JSON.parse(localStorage.getItem('templates'));
    var userInstructors = JSON.parse(localStorage.getItem('instructors'));
    var userAuthDetails = localStorage.getItem('userAuthDetails');
    var userDetails = localStorage.getItem('userDetails');
    if(userDetails !== null){
      setCustomerId(JSON.parse(userDetails).customer_id);
      setRole(JSON.parse(userDetails).role);
      setUserLastName(JSON.parse(userDetails).user_last_name);
      setUserFirstName(JSON.parse(userDetails).user_first_name);
    }
    if(userAuthDetails !== null){
      setUser(JSON.parse(userAuthDetails).user);
      setRefreshToken(JSON.parse(userAuthDetails).refresh_token);
    }

  }, [refreshToken])

  const handleClassTitleChange = (event) => {
    const inputText = event.target.value;
    setClassTitleCount(inputText.length);
    if (inputText.length < maxClassTitleLength) {
      const { name, value } = event.target;
      setStep1Data((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    const imgName = event.target.files[0].name.replace(/\s/g, "");
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        // img.src = reader.result;
        img.src = URL.createObjectURL(file);
        img.onload = () => {
          if (
            img.width >= 400 && img.width <= 780 &&
            img.height >= 280 && img.height <= 420
          ){
            setStep1Data((prevData) => ({
              ...prevData,
              ['imageName']: imgName,
              ['imageType']: file.type,
              ['imageFile']: file,
              ['previewImage']: reader.result,
              ['classBanner']: imgName
            }));
          } else {
            alert(`Uploaded image dimensions should be between 400x280 and 780x420 pixels. Please upload a suitable image.`);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setStep1Data((prevData) => ({
      ...prevData,
      ['classBanner']: null,
      ['previewImage']: null
    }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setStep1Data((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAutocompleteChange = (event, newValue, name) => {
    if (newValue.length > 3) {
      newValue.pop();
    }
    setStep1Data((prevData) => ({
      ...prevData,
      [name]: newValue,
    }));
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <TextField
          label="Class Title"
          fullWidth
          name="classTitle"
          value={step1Data.classTitle}
          onChange={handleClassTitleChange}
          required
          helperText="Your title should be a mix of attention-grabbing, informative, and optimized for search."
          size="small"
          InputProps={{
            endAdornment: (
              <Typography color={classTitleCount > maxClassTitleLength ? 'error' : 'inherit'}>
                {classTitleCount}/{maxClassTitleLength}
              </Typography>
            ),
          }}
          InputLabelProps={{style: {fontSize: 14}}}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          label="Class Description"
          name="classDescription"
          multiline
          size="small"
          InputLabelProps={{style: {fontSize: 14}}}
          rows={4}
          fullWidth
          value={step1Data.classDescription}
          onChange={handleInputChange}
          required
          helperText="Description must have 20 words. This description will be public and provide your learners with an understanding of the class you are providing."
        />
      </Grid>
      <Grid item xs={4}>
        <TextField
          select
          size="small"
          name="classLanguage"
          value={step1Data.classLanguage}
          // onChange={(event) => handleLanguageChange(event.target.value)}
          onChange={handleInputChange}
          variant="outlined"
          fullWidth
          label="Select a language"
          InputLabelProps={{style: {fontSize: 14}}}
          required
        >
          {languages.map((language) => (
            <MenuItem key={language.code} value={language.code}>
              {language.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={4}>
        <TextField
          select
          size="small"
          value={step1Data.classLevel}
          name="classLevel"
          // onChange={(event) => handleLevelChange(event.target.value)}
          onChange={handleInputChange}
          variant="outlined"
          fullWidth
          label="Select a level"
          InputLabelProps={{style: {fontSize: 14}}}
          required
        >
          {classLevels.map((level) => (
            <MenuItem key={level.code} value={level.code}>
              {level.name}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item xs={4}>
        <Autocomplete
          multiple
          value={step1Data.classTags}
          // options={[...classCategories]}
          options={[...classCategories, customTagInput]}
          freeSolo
          filterSelectedOptions
          name="classTags"
          noOptionsText="No categories available"
          getOptionLabel={(option) => option}
          renderInput={(params) => (
            <TextField
              {...params}
              required
              fullWidth
              InputLabelProps={{style: {fontSize: 14}}}
              label="What is primarily taught in your class?"
              helperText="Up to 3 keywords that best describe your class. These will be used by the search engine to make your class discoverable to potential learners."
              variant="outlined"
              size="small"
            />
          )}
          onChange={(event, newValue) => {
            if (newValue.length <= 3) {
              let updatedValue = newValue;
              // Check if the input is a custom tag and not already selected
              if (
                newValue.some(tag => typeof tag === 'string' && tag.toLowerCase() === customTagInput.toLowerCase())
              ) {
                // Custom tag exists in selected tags
                setCustomTagInput('');
              } else if (
                customTagInput.trim() !== '' &&
                !classCategories.some(tag => tag.toLowerCase() === customTagInput.toLowerCase())
              ) {
                // Custom tag not in options, add it
                updatedValue = [...newValue, customTagInput];
                setCustomTagInput(''); // Reset the custom tag input
              }
              handleAutocompleteChange(event, updatedValue, 'classTags');
            } else {
              // Limit reached, do not allow further selection
              event.preventDefault();
            }
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);
            const { inputValue } = params;

            // Suggest the creation of a new value
            if (inputValue !== '') {
              filtered.push(inputValue);
            }

            return filtered;
          }}
          autoHighlight
          autoComplete
          disableCloseOnSelect
        />
      </Grid>
      <Grid item xs={4}>
        <CardMedia
          component="img"
          alt="Preview"
          // newclass ?
          image={step1Data.previewImage!== null ? step1Data.previewImage : step1Data.classBanner === null ? empty_class :
                s3BucketUrl + customerId + "/" + 'classes' + "/" + step1Data.classId + "/" + step1Data.classBanner}
        />
      </Grid>
      <Grid item xs={6}>
      <Typography variant="body2" style={{marginBottom: '16px'}}>
        To stand out, add a backdrop to your class entry in the InvoClass marketplace!. It must meet our image standards to be accepted. Important guidelines: 768x420 pixels and less accepted; .jpg, .jpeg, .gif, or .png. no text on the image.
      </Typography>
        <Button component="label" variant="outlined" color="primary">
          Upload Image
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
        </Button>
        {step1Data.previewImage && (
          <Button variant="outlined" color="secondary" onClick={handleRemoveImage}>
            Remove Image
          </Button>
        )}
      </Grid>
    </Grid>
  );
};

export default ClassOverview;
