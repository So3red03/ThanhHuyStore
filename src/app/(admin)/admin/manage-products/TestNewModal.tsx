'use client';
import { useState } from 'react';
import { Button } from '@mui/material';
import AddProductModalNew from './AddProductModalNew';

const TestNewModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ padding: '20px' }}>
      <Button 
        variant="contained" 
        onClick={() => setIsOpen(true)}
        sx={{
          backgroundColor: '#3b82f6',
          '&:hover': {
            backgroundColor: '#2563eb'
          }
        }}
      >
        Test New Product Modal (WordPress Style)
      </Button>
      
      <AddProductModalNew 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </div>
  );
};

export default TestNewModal;
