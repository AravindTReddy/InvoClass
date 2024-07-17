import React, {memo, useState, useEffect} from 'react'
import { useDrop } from 'react-dnd'
import Node from './Node'
import PublicIcon from '@mui/icons-material/Public';
import VpnLockIcon from '@mui/icons-material/VpnLock';
import Tooltip from '@material-ui/core/Tooltip';
import CloseIcon from '@mui/icons-material/Close';
import { IconButton } from '@mui/material';
import Divider from '@mui/material/Divider';
import Button from '@material-ui/core/Button';
import DeleteIcon from '@material-ui/icons/Delete';
import MenuItem from '@material-ui/core/MenuItem';
import AddIcon from '@material-ui/icons/Add';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import CardMedia from '@material-ui/core/CardMedia';
import Typography from '@material-ui/core/Typography';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Menu from '@mui/material/Menu';
import { root } from "../../shared/General.js";
import LaunchIcon from '@material-ui/icons/Launch';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@material-ui/icons/Stop';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Avatar from '@mui/material/Avatar';
import { red } from '@mui/material/colors';
import InfoIcon from '@mui/icons-material/Info';
import SchoolIcon from '@mui/icons-material/School';
import ComputerIcon from '@mui/icons-material/Computer';

const style = {
  color: 'black',
  lineHeight: 'normal',
  float: 'left',
  border: '1px dashed gray',
  width: '100%',
  height: '100%'
}

const Editor = memo(function Editor({ accept, onDrop, droppedItems, details,
                            selectedItems, onSelect, onSelectAll, start, stop,
                            create, launch, deletedItem}) {

  const [editorItems, setEditorItems] = useState(droppedItems);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openOptions, setOpenOptions] = useState(false);
  const [item, setItem] = useState('');
  const [checkedState, setCheckedState] = useState(new Array(40).fill(false))
  const [selectAll, setSelectAll] = useState(false);
  useEffect(() => {
    //this is like our componentDidMount
    setEditorItems(droppedItems);
  }, [droppedItems, selectedItems, selectAll]);

  const [{ isOver, canDrop }, drop] = useDrop({
      accept,
      drop: onDrop,
      collect: (monitor) => ({
          isOver: monitor.isOver(),
          canDrop: monitor.canDrop(),
      }),
  });

  const isActive = isOver && canDrop
  let backgroundColor = 'white'
  if (isActive) {
    backgroundColor = 'green'
  } else if (canDrop) {
    backgroundColor = 'darkkhaki'
  }

  const deleteNode = (item) => {
    let newArr = [...editorItems];
    newArr = newArr.filter(function(val) {
      return item.selectedItems.indexOf(val) == -1;
    });
    setEditorItems(newArr)
    setCheckedState(new Array(40).fill(false))
    setSelectAll(false);
    deletedItem(item);
  }

  const handleDetails = (item, e) => {
    setItem(item);
    setAnchorEl(e.currentTarget);
    setOpenOptions(!openOptions);
  }

  const handleClose = () => {
    setItem('');
    setAnchorEl(null);
    setOpenOptions(false);
  }

  const handleMachineChange = (item, position) => {
    const tmp = [...checkedState]
    const updatedCheckedState = tmp.map((item, index) =>
     index === position ? !item : item
   );
   setCheckedState(updatedCheckedState);
   onSelect(item, updatedCheckedState[position]);
  }

  const handleSelectAll = () => {
    if(checkedState.every(element => element === true)){
      setSelectAll(false)
      setCheckedState(new Array(40).fill(false))
      onSelectAll(editorItems, 'deselect');
    }else {
      setSelectAll(true)
      setCheckedState(new Array(40).fill(true))
      onSelectAll(editorItems, 'select');
    }
  }
  return (
    <Card ref={drop}
          role="Editor"
          style={{ ...style, backgroundColor, root}}
          >
      <CardHeader title={details.student_name}
          avatar={
            <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
              <SchoolIcon/>
            </Avatar>
          }
          titleTypographyProps={{variant:'body2' }}
          subheaderTypographyProps={{variant: 'caption'}}
          subheader={<a href = {`mailto: ${details.student_email}`}>{details.student_email}</a>}
          action={
            <IconButton onClick={(evt) => handleDetails(details, evt)} aria-label="settings">
              <MoreVertIcon />
              <Menu
                anchorEl={anchorEl}
                id="basic-menu"
                open={openOptions}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'basic-button',
                }}
                button={false} // to stop clicking effect
              >
                <Tooltip title="Deploy student machine">
                  <MenuItem
                    disabled={!(selectedItems.length === 1)}
                    onClick={() => create(item)}
                  >
                    <AddIcon/>&nbsp;Create</MenuItem>
                </Tooltip>
                <Tooltip title="Start machine(s)">
                  <MenuItem
                    onClick={() => start(item)}
                    disabled={selectedItems.length === 0}
                  >
                    <PlayArrowIcon/>&nbsp;Start</MenuItem>
                </Tooltip>
                <Tooltip title="Stop machine(s)">
                  <MenuItem onClick={() => stop(item)}
                        disabled={selectedItems.length === 0}
                  >
                    <StopIcon/>&nbsp;Stop</MenuItem>
                </Tooltip>
                <Tooltip title="Launch machine">
                  <MenuItem
                    disabled={!(selectedItems.length === 1)}
                    onClick={() => launch(item)}
                  >
                    <LaunchIcon/>&nbsp;Launch</MenuItem>
                </Tooltip>
                <Tooltip title="UnAssign machine(s)">
                  <MenuItem
                    onClick={() => deleteNode(item)}
                    disabled={selectedItems.length === 0}
                  >
                    <DeleteIcon/>&nbsp;UnAssign</MenuItem>
                </Tooltip>
              </Menu>
            </IconButton>
          }
      />
      <CardContent style={{maxHeight: 180, overflow: 'scroll'}}>
        <Typography variant="body2" color="textSecondary">
          Drag and drop here to assign
          <Tooltip title="A single machine cannot be assigned to multiple students.">
            <InfoIcon/>
          </Tooltip>
        </Typography>
        <Typography variant="body2" color="textSecondary">
          <FormControlLabel
          label={
            <Typography variant="caption">
              Select/Deselect All | {'count: ' + editorItems.length}
            </Typography>
          }
            control={
              <Checkbox
                size="small"
                checked={selectAll}
                onChange={() => handleSelectAll()}
              />
            }
          />
        </Typography>
        <Typography variant="body2">
          <FormGroup style={{display:'flex', flexDirection:'row'}}>
            {editorItems.map((item, index) => {
              const name = item.name!== undefined ? item.name : item.image_name
              return (
                <Tooltip title={name}>
                  <FormControlLabel
                    label={<Typography variant="caption" color="textSecondary">
                    <ComputerIcon color={item.vm_status === 'online' ? "success" :
                                     item.vm_status === 'offline' && item.guac_server_url === 'pending' ?
                                     "warning" : "error"}/>{" "}

                      {item.ots_url ?
                        <span className="badge badge-success">
                          <a href={item.ots_url} target="_blank" rel="noopener noreferrer" style={{color: 'white'}}>
                            OTS
                          </a>
                        </span> : null
                      }
                    </Typography>}
                    control={
                      <Checkbox
                        size="small"
                        checked={checkedState[index]}
                        onChange={() => handleMachineChange(item, index)}
                      />
                    }
                  />
                </Tooltip>
              );
            })}
          </FormGroup>
        </Typography>
      </CardContent>
    </Card>
  )
});
export default Editor
