import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faUsers, 
  faRightFromBracket,
  faChevronLeft,
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      path: '/',
      icon: faChartLine,
      label: 'Dashboard'
    },
    {
      path: '/members',
      icon: faUsers,
      label: 'Members'
    }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <img 
          src="/images/arise-logo.png" 
          alt="Arise Esports" 
          className="sidebar-logo"
        />
        {!isCollapsed && <h2>Arise Esports</h2>}
      </div>

      <button 
        className="sidebar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand' : 'Collapse'}
      >
        <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
      </button>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
            title={item.label}
          >
            <span className="sidebar-icon">
              <FontAwesomeIcon icon={item.icon} />
            </span>
            {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <>
            <div className="sidebar-user">
              <div className="user-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {!isCollapsed && (
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-role">{user.role}</div>
                </div>
              )}
            </div>
            <button 
              className="sidebar-logout"
              onClick={logout}
              title="Logout"
            >
              <span className="sidebar-icon">
                <FontAwesomeIcon icon={faRightFromBracket} />
              </span>
              {!isCollapsed && <span>Logout</span>}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;