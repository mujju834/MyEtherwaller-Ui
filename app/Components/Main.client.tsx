"use client";
import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';

const WalletComponent = dynamic(() => import('./Wallet'), {
  suspense: true,
});

const LoginComponent = dynamic(() => import('./Login'), {
  suspense: true,
});

interface User {
  id: string;
  email: string;
}

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Check if the user is already logged in (based on localStorage)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setIsLoggedIn(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (token: string, user: User) => {
    setIsLoggedIn(true);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Suspense fallback={<div>Loading...</div>}>
        {isLoggedIn ? (
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
          <WalletComponent token={localStorage.getItem('token')} user={user} onLogout={handleLogout} />
        ) : (
          <LoginComponent onLogin={handleLogin} />
        )}
      </Suspense>
    </div>
  );
}
