import React, { useEffect, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './redux/store';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { getCurrentUser } from './redux/slices/authSlice';
import theme from './theme';
import Login from './pages/Login';
import Register from './pages/Register';
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
import SettingsPage from './pages/SettingsPage';
import NotFound from './pages/NotFound';
import LoadingScreen from './components/common/LoadingScreen';
import AttendanceList from './pages/Attendance'
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

const AppInitializer: React.FC = () => {
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);
  
  return null;
};

const AppContent: React.FC = () => {
  return (
    <>
      <AppInitializer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
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
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;