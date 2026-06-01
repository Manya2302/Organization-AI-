import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { 
  LandingPage, FeaturesPage, SolutionsPage, IndustriesPage, 
  SecurityPage, PricingPage, AboutPage, ContactPage, 
  DocumentationPage, PrivacyPolicyPage, TermsOfServicePage 
} from './pages/PublicPages'
import { 
  LoginPage, OrgRegisterPage, EmployeeRegisterPage, ForgotPasswordPage, SuperAdminLoginPage 
} from './pages/AuthPages'
import { DashboardLayout } from './pages/DashboardPages'
import { useAppStore } from './store/useAppStore'
import ScrollToTop from './components/ScrollToTop'

const App: React.FC = () => {
  useEffect(() => {
    const initialTheme = useAppStore.getState().theme;
    if (initialTheme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, []);
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-white dark:bg-dark-bg text-slate-850 dark:text-gray-100 flex flex-col font-sans transition-colors duration-300">
        {/* Navigation */}
        <Navbar />

        {/* Page Content */}
        <div className="flex-1 flex flex-col">
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/solutions" element={<SolutionsPage />} />
            <Route path="/industries" element={<IndustriesPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-of-service" element={<TermsOfServicePage />} />

            {/* Auth Pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/secure-admin-portal" element={<SuperAdminLoginPage />} />
            <Route path="/register" element={<OrgRegisterPage />} />
            <Route path="/register-employee" element={<EmployeeRegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Dashboard Workspace Console (Nested routes handled inside DashboardLayout) */}
            <Route path="/dashboard/*" element={<DashboardLayout />} />

            {/* Fallback Catch-All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </Router>
  )
}

export default App
