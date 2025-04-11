import React, { useEffect, ReactNode, createContext, useState, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './redux/store';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { getCurrentUser } from './redux/slices/authSlice';
import defaultTheme from './theme';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthConfirm from './pages/AuthConfirm';
import ResetPassword from './pages/ResetPassword';
import DashboardLayout from './components/layout/Dashboard';
import DashboardHome from './pages/DashboardHome';
import ClientsList from './pages/Clients';
import OrderRequestsList from './pages/Orders/OrderRequest';
import ClientOrdersList from './pages/Orders/ClientOrders';
import InventoryList from './pages/Inventory';
import EmployeesList from './pages/Employees';
import SuppliersList from './pages/Suppliers';
import Payroll from './pages/Payroll';
import MachineryList from './pages/Machinery';
import ReportsList from './pages/Reports';
import ProfilePage from './pages/Profile';
import SettingsPage from './pages/Settings';
import NotFound from './pages/NotFound';
import LoadingScreen from './components/common/LoadingScreen';
import AttendanceList from './pages/Attendance';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      const token = localStorage.getItem('token');
      if (token) {
        dispatch(getCurrentUser());
      }
    }
  }, [dispatch, isAuthenticated, loading]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Create Theme Context
type ThemeContextType = {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  themeColor: string;
  setThemeColor: (value: string) => void;
  compactView: boolean;
  setCompactView: (value: boolean) => void;
  applySettings: (settings: any) => void;
};

export const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  setDarkMode: () => {},
  themeColor: 'default',
  setThemeColor: () => {},
  compactView: false,
  setCompactView: () => {},
  applySettings: () => {}
});

// Theme Provider Component
const ThemeContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [themeColor, setThemeColor] = useState('default');
  const [compactView, setCompactView] = useState(false);
  
  // Apply theme classes to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);
  
  // Apply compact view
  useEffect(() => {
    if (compactView) {
      document.body.classList.add('compact-view');
    } else {
      document.body.classList.remove('compact-view');
    }
  }, [compactView]);
  
  // Apply theme colors
  useEffect(() => {
    const themeColors = {
      default: { primary: '#1976d2', secondary: '#115293' },
      green: { primary: '#2e7d32', secondary: '#1b5e20' },
      purple: { primary: '#7b1fa2', secondary: '#4a148c' },
      teal: { primary: '#00796b', secondary: '#004d40' },
      orange: { primary: '#ef6c00', secondary: '#e65100' }
    };
    
    const selectedTheme = themeColors[themeColor as keyof typeof themeColors] || themeColors.default;
    document.documentElement.style.setProperty('--primary-color', selectedTheme.primary);
    document.documentElement.style.setProperty('--secondary-color', selectedTheme.secondary);
  }, [themeColor]);
  
  // Function to apply all settings from user profile
  const applySettings = (settings: any) => {
    if (!settings) return;
    
    if (settings.darkMode !== undefined) setDarkMode(settings.darkMode);
    if (settings.theme) setThemeColor(settings.theme);
    if (settings.compactView !== undefined) setCompactView(settings.compactView);
    
    // Apply other settings like auto logout, etc.
    if (settings.autoLogout && settings.logoutTime) {
      setupAutoLogout(settings.logoutTime);
    }
  };
  
  // Setup auto logout timer
  const setupAutoLogout = (logoutTimeMinutes: number) => {
    console.log(`Auto logout enabled: ${logoutTimeMinutes} minutes`);
    
    // In a real app, this would set up inactivity detection and auto logout
    const inactivityTime = logoutTimeMinutes * 60 * 1000;
    let timer: NodeJS.Timeout;
    
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        console.log('Auto logout triggered');
        // Would dispatch logout action here in a real implementation
      }, inactivityTime);
    };
    
    // Set up event listeners
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);
    
    // Initial timer start
    resetTimer();
    
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
      clearTimeout(timer);
    };
  };
  
  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      setDarkMode, 
      themeColor, 
      setThemeColor, 
      compactView, 
      setCompactView,
      applySettings
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useThemeContext = () => useContext(ThemeContext);

// App Initializer for authentication and settings
const AppInitializer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { applySettings } = useThemeContext();

  // Handle authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);
  
  // Apply user settings when user data is loaded
  useEffect(() => {
    if (user?.settings) {
      console.log('Applying user settings from profile');
      applySettings(user.settings);
    }
  }, [user, applySettings]);

  return null;
};

const AppContent: React.FC = () => {
  return (
    <>
      <AppInitializer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/confirm" element={<AuthConfirm />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="clients" element={<ClientsList />} />
          <Route path="orders/requests" element={<OrderRequestsList />} />
          <Route path="orders/clients" element={<ClientOrdersList />} />
          <Route path="inventory" element={<InventoryList />} />
          <Route path="employees" element={<EmployeesList />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="suppliers" element={<SuppliersList />} />
          <Route path="machinery" element={<MachineryList />} />
          <Route path="reports" element={<ReportsList />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="attendance" element={<AttendanceList />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  // Create a dynamic theme using the current theme settings
  const [muiTheme, setMuiTheme] = useState(defaultTheme);
  
  return (
    <Provider store={store}>
      <ThemeContextProvider>
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          <Router>
            <AppContent />
          </Router>
        </ThemeProvider>
      </ThemeContextProvider>
    </Provider>
  );
};

export default App;