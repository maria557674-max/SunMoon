/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { CreateTrip } from './pages/CreateTrip';
import { AdminPanel } from './pages/AdminPanel';
import { MyTrips } from './pages/MyTrips';
import { PackageDetails } from './pages/PackageDetails';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <ErrorBoundary>
          <div className="min-h-screen bg-white font-sans text-gray-900">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreateTrip />} />
                <Route path="/my-trips" element={<MyTrips />} />
                <Route path="/admin" element={<AdminPanel />} />
                <Route path="/package/:id" element={<PackageDetails />} />
              </Routes>
            </main>
            <footer className="py-12 border-t border-gray-100 mt-20">
              <div className="max-w-7xl mx-auto px-4 text-center">
                <p className="text-gray-400 text-sm font-medium">
                  © {new Date().getFullYear()} Sun Moon Travel Agency. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  );
}

