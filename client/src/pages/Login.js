import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'President'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let result;
    if (isLogin) {
      result = await login(formData.email, formData.password);
    } else {
      result = await register(formData.name, formData.email, formData.password, formData.role);
    }

    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isLogin ? 'Login' : 'Register'}</h2>
        
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Role</label>
              <select
                name="role"
                className="form-control"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="President">President</option>
                <option value="Treasurer">Treasurer</option>
                <option value="Secretary">Secretary</option>
                <option value="Auditor">Auditor</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '20px' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;