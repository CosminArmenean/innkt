import React from 'react';

const TestApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🚀 INNKT React App is Working!</h1>
      <p>If you can see this, the React app is running successfully.</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Status Check:</h3>
        <ul>
          <li>✅ React is rendering</li>
          <li>✅ TypeScript compilation working</li>
          <li>✅ Webpack dev server running</li>
        </ul>
      </div>
    </div>
  );
};

export default TestApp;
