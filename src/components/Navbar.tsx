import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Compass, Map, User, LogIn, PlusCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { cn } from '../lib/utils';

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const navItems = [
    { name: 'Destinations', path: '/', icon: Compass },
    { name: 'My Trips', path: '/my-trips', icon: Map, protected: true },
    { name: 'Create Trip', path: '/create', icon: PlusCircle, protected: true },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Compass className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">Sun Moon</span>
          </Link>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => {
              if (item.protected && !user) return null;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-orange-500 flex items-center space-x-1",
                    isActive ? "text-orange-500" : "text-gray-600"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-red-500 flex items-center space-x-1",
                  location.pathname === '/admin' ? "text-red-500" : "text-gray-600"
                )}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <img 
                    src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full border border-gray-200"
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline-block">
                    {user.displayName?.split(' ')[0]}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
