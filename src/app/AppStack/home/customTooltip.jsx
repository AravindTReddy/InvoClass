import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const CustomTooltip = ({ code, title, onClick }) => {
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
    <Tooltip title={open ? title: code === 'coupon' ? 'Copy Coupon Code' : 'Copy Invite Link'} arrow placement="bottom">
      <IconButton sx={{ width: '18px', height: '18px' }}
        onClick={handleButtonClick}>
        <ContentCopyIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
};

export default CustomTooltip;
