import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/static/AboutPage';
import { ContactPage } from './pages/static/ContactPage';
import { FAQPage } from './pages/static/FAQPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

// Auth Pages
import { AdminLogin } from './pages/auth/AdminLogin';
import { CorporateLogin } from './pages/auth/CorporateLogin';
import { CorporateRegister } from './pages/auth/CorporateRegister';

// Dashboard Pages
import { AdminDashboard } from './pages/dashboards/AdminDashboard';
import { CorporateDashboard } from './pages/dashboards/CorporateDashboard';

// Sub-page
import { CompanySubPage } from './pages/CompanySubPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Authentication Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/corporate/login" element={<CorporateLogin />} />
              <Route path="/corporate/register" element={<CorporateRegister />} />

              {/* Protected Dashboard Routes */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/corporate/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['corporate']}>
                    <CorporateDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* Company Sub-pages */}
              <Route path="/company/:slug" element={<CompanySubPage />} />

              {/* Catch-all 404 */}
              <Route path="*" element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                    <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
                    <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                      Back to Home
                    </a>
                  </div>
                </div>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;