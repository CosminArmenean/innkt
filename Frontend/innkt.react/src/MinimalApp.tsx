import React from 'react';

const MinimalApp = () => {
  return (
    <div style={{ 
      padding: '50px', 
      backgroundColor: '#ff0000', 
      color: 'white', 
      fontSize: '32px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      minHeight: '100vh'
    }}>
      <h1>🚨 MINIMAL TEST - RED BACKGROUND</h1>
      <p>If you see this, React is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
};

export default MinimalApp;
