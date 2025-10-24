import React from 'react';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';

const CustomTextField: React.FC<TextFieldProps> = ({ 
  sx, 
  size = 'small',
  variant = 'outlined',
  ...props 
}) => {
  return (
    <TextField
      size={size}
      variant={variant}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '.75rem', // equivalente a xl en Tailwind (~12px)
        },
        ...sx,
      }}
      {...props}
    />
  );
};

export default CustomTextField;
