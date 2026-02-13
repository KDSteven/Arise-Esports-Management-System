import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand">
          <img 
            src="/images/arise-logo.png" 
            alt="Arise Esports Logo" 
            className="navbar-logo"
          />
          <h1>ARISE ESPORTS MANAGEMENT SYSTEM</h1>
        </div>
        <div className="navbar-right">
          {user && (
            <>
              <div className="navbar-user">
                <span>{user.name}</span>
                <span style={{ color: '#adb5bd' }}>({user.role})</span>
              </div>
              <button className="btn-logout" onClick={logout}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;