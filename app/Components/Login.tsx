import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false); // State to track form type
  const [successMessage, setSuccessMessage] = useState(''); // State to hold success message
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Logging you in...');
        setTimeout(() => {
          onLogin(data.token, data.user);
        }, 2000); // Simulate a delay for the animation
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Error logging in');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Registered successfully. Redirecting to login...');
        setTimeout(() => {
          setIsRegistering(false); // Switch to login form after successful registration
          setSuccessMessage('');   // Reset the success message when switching to login form
        }, 2000); // Simulate a delay for the animation
      } else {
        console.error('Error:', data);
        setError(data.errors ? data.errors.map(err => err.msg).join(', ') : 'Registration failed');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Error registering');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          {isRegistering ? 'Register' : 'Login'}
        </h2>
        
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 text-white bg-green-500 rounded-lg text-center animate-bounce">
            {successMessage}
          </div>
        )}
        
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <button
            type="submit"
            className={`w-full text-white py-2 px-4 rounded-lg transition duration-300 ${
              isRegistering ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isRegistering ? 'Register' : 'Login'}
          </button>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </form>
        <p className="text-center text-gray-700 mt-6">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setSuccessMessage(''); // Clear the success message when switching forms
              setError(''); // Clear any existing error message
            }}
            className="text-blue-500 hover:underline"
          >
            {isRegistering ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
