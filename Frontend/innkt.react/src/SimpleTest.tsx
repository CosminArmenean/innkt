import React from 'react';

const SimpleTest = () => {
  console.log('SimpleTest component is rendering');
  return (
    <div style={{ 
      padding: '50px', 
      backgroundColor: 'red', 
      color: 'white', 
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🚨 SIMPLE TEST - CAN YOU SEE THIS?</h1>
      <p>If you can see this red box, React is working!</p>
    </div>
  );
};

export default SimpleTest;
