import React, { useEffect, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { store } from './redux/store';
import { useAppDispatch, useAppSelector } from './redux/hooks';
import { getCurrentUser } from './redux/slices/authSlice';
import theme from './theme';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardLayout from './components/layout/Dashboard';
import DashboardHome from './pages/Dashboard/DashboardHome';
import ClientsList from './pages/Clients/ClientsList';
import OrderRequestsList from './pages/Orders/OrderRequestsList';
import ClientOrdersList from './pages/Orders/ClientOrdersList';
import SupplierOrdersList from './pages/Orders/SupplierOrdersList';
import InventoryList from './pages/Inventory/InventoryList';
import EmployeesList from './pages/Employees/EmployeesList';
import SuppliersList from './pages/Supplier/SuppliersList';
import Payroll from './pages/Payroll/Payroll';
import MachineryList from './pages/Machinery/MachineryList';
import ReportsList from './pages/Reports/ReportsList';
import NotFound from './pages/NotFound';
import LoadingScreen from './components/common/LoadingScreen';

// Protected Route Component
interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    // Check if token exists but user isn't authenticated yet
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

// App initialization check
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
          <Route path="orders/suppliers" element={<SupplierOrdersList />} />
          <Route path="inventory" element={<InventoryList />} />
          <Route path="employees" element={<EmployeesList />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="suppliers" element={<SuppliersList />} />
          <Route path="machinery" element={<MachineryList />} />
          <Route path="reports" element={<ReportsList />} />
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