import React from 'react';
import { Button, type ButtonProps } from '@mui/material';

interface CustomButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outlined';
  children: React.ReactNode;
}

export default function CustomButton({ 
  variant = 'primary', 
  children, 
  sx = {}, 
  ...props 
}: CustomButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: '#027de2',
          color: '#e6ecf3',
          '&:hover': {
            backgroundColor: '#1e7ad8',
            color: '#e6ecf3',
            boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
          },
        };
      case 'secondary':
        return {
          backgroundColor: '#d0e5fb',
          color: '#027de2',
          '&:hover': {
            backgroundColor: '#b8d6f9',
            color: '#1e7ad8',
            boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
          },
        };
      case 'outlined':
        return {
          backgroundColor: 'transparent',
          color: '#027de2',
          border: '2px solid #027de2',
          '&:hover': {
            backgroundColor: '#027de2',
            color: '#e6ecf3',
            boxShadow: '0 4px 8px 0 rgba(0, 0, 0, 0.2)',
          },
        };
      default:
        return {};
    }
  };

  const baseStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 'fit-content',
    fontWeight: 'bold',
    borderRadius: '0.5rem',
    border: 'solid 0px',
    padding: '0.5rem 1rem',
    margin: '1.5rem 0',
    cursor: 'pointer',
    fontSize: 'large',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px 0 rgba(0,0,0,0.1)',
    textTransform: 'none',
    minHeight: '48px',
    ...getVariantStyles(),
  };

  return (
    <Button
      {...props}
      sx={{
        ...baseStyles,
        ...sx,
      } as any}
    >
      {children}
    </Button>
  );
}
