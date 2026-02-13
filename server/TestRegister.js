// SIMPLE TEST - Save this as TestRegister.js in client/src/pages/

import React, { useState } from 'react';
import axios from 'axios';

const TestRegister = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    setResult('Sending request...');
    
    try {
      console.log('Attempting to connect to http://127.0.0.1:5000/api/test');
      
      const response = await axios.post('http://127.0.0.1:5000/api/test', {
        test: 'data',
        timestamp: new Date().toISOString()
      }, {
        timeout: 5000, // 5 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Success!', response.data);
      setResult(JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.error('Error:', error);
      
      if (error.code === 'ECONNABORTED') {
        setResult('ERROR: Request timeout - server not responding');
      } else if (error.response) {
        setResult(`ERROR: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        setResult('ERROR: No response from server - check if server is running');
      } else {
        setResult(`ERROR: ${error.message}`);
      }
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: '50px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Connection Test</h1>
      
      <button 
        onClick={testConnection}
        disabled={loading}
        style={{
          padding: '15px 30px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px'
        }}
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      
      {result && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          background: '#f5f5f5',
          borderRadius: '5px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace'
        }}>
          {result}
        </div>
      )}
      
      <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
        <p><strong>Instructions:</strong></p>
        <ol>
          <li>Make sure test-server.js is running on port 5000</li>
          <li>Click "Test Connection" button</li>
          <li>Check browser console (F12) for details</li>
          <li>Check server terminal for logs</li>
        </ol>
      </div>
    </div>
  );
};

export default TestRegister;