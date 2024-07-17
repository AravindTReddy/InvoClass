import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';

const CopyLinkToClipboard = ({ title, onClick }) => {
  const [open, setOpen] = useState(false);

  const handleButtonClick = () => {
    setOpen(true); // Show the tooltip
    onClick(); // Call the click handler (e.g., to copy to clipboard)

    // Close the tooltip after 2 seconds (you can adjust the duration)
    setTimeout(() => {
      setOpen(false);
    }, 2000);
  };

  return (
    <Tooltip title={open ? title: 'Copy class invite link'} arrow placement="bottom">
      <IconButton size='small'
        onClick={handleButtonClick}>
        <LinkIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default CopyLinkToClipboard;
