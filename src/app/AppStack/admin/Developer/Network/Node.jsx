import React, { memo, useState } from 'react';
import { useDrag, DragPreviewImage } from 'react-dnd';
import { knightImage } from './testImage'
import Tooltip from '@material-ui/core/Tooltip';
import DesktopWindowsIcon from '@mui/icons-material/DesktopWindows';
import { stockImages } from "../../../shared/General.js";
import DeleteIcon from '@material-ui/icons/Delete';
import Typography from '@material-ui/core/Typography';
import ConfigureVMDialog from '../../../shared/DialogBox/ConfigureVMDialog'
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';


const Node = memo(function Node({ details, name, type, source, color }) {
  const [open, setOpen] = useState(false);

  const [{ opacity }, drag, preview] = useDrag(() => ({
      type,
      item: { details },
      collect: (monitor) => ({
          opacity: monitor.isDragging() ? 0.4 : 1,
      }),
  }), []);

  let versions = [];
  if(details.version_history){
    versions = details.version_history.concat({
        "resource_id": details.resource_id,
        "version": details.version,
        "description": details.description
    })
  }

  const osPort = details.nsg.split("/")[8]
  if(osPort === 'centOS-nsg')
    var image_os = 'Linux'
  else image_os = 'Windows'
  let backgroundColor = 'white'
  if (source === 'templates') {
    backgroundColor = '#00AB66'
  } else if (source === 'stockimages') {
    backgroundColor = 'lightgreen'
  }else if (source === 'editor') {
    backgroundColor = color
  }
  let cursor = 'move';
  if(source === 'editor')
    cursor = 'pointer';

  const configureVM = (details) => {
    setOpen(true);
    //here we can open settings page to configure the VM
  }

  const closeDialog = () => {
    setOpen(false);
  }


  return (
    <>
      {/*position: source === 'editor' ? 'absolute': null*/}
      <Tooltip title={
                <>
                  <Typography color="inherit">OS: {image_os} </Typography>
                  <Typography color="inherit">Name: {name !== undefined ? name : 'No name'} </Typography>
                </>
              }>
        <div ref={drag}
             role="Node"
             style={{ ...opacity, cursor  }}
             className="vm d-flex justify-content-center align-items-center"
             // onClick={source === 'editor' ? () => {configureVM(details)} : null}
        >
          {name}
          {/*{source === 'editor' ? <> -v{details.version}</> : null}*/}
          <DesktopWindowsIcon style={{fill: backgroundColor}}/>
        </div>
      </Tooltip>
      <ConfigureVMDialog
        open={open}
        close={closeDialog}
        // create={createClass}
      />
    </>
  );
});
export default Node
