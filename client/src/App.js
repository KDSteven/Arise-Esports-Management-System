import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Officers from './pages/Officers';
import './App.css';

// Layout wrapper component
const AppLayout = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  if (!user) {
    // Not logged in - show navbar and full width content
    return (
      <div className="App">
        <Navbar />
        {children}
      </div>
    );
  }
  
  // Logged in - show sidebar instead of navbar
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/members" 
              element={
                <PrivateRoute>
                  <Members />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/officers" 
              element={
                <PrivateRoute>
                  <Officers />
                </PrivateRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;