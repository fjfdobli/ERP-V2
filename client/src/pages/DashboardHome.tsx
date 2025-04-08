import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchOrders } from '../redux/slices/ordersSlice';
import { fetchClients } from '../redux/slices/clientsSlice';
import { fetchInventory, fetchLowStockItems } from '../redux/slices/inventorySlice';
import { fetchEmployees } from '../redux/slices/employeesSlice';
import { fetchAttendance } from '../redux/slices/attendanceSlice';
import { fetchPayrolls } from '../redux/slices/payrollSlice';
import { fetchMachinery, fetchMachineryStats } from '../redux/slices/machinerySlice';
import { fetchSuppliers } from '../redux/slices/suppliersSlice';
import { fetchOrderRequests } from '../redux/slices/orderRequestSlice';
import { format, parseISO, startOfMonth, endOfMonth, subMonths, isToday, isBefore } from 'date-fns';
import { 
  Box, Grid, Paper, Typography, Divider, List, ListItem, ListItemText, Card, CardContent, 
  CardHeader, Avatar, IconButton, Button, Chip, useTheme, LinearProgress, Alert,
  Stack, Badge, Tabs, Tab, ListItemAvatar, ListItemButton, Menu, MenuItem, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress,
  Skeleton, Link
} from '@mui/material';
import { 
  Assignment as OrdersIcon, 
  People as ClientsIcon, 
  People as PeopleIcon,
  Inventory as InventoryIcon, 
  Warning as WarningIcon, 
  TrendingUp as TrendingUpIcon, 
  MoreVert as MoreVertIcon, 
  ChevronRight as ChevronRightIcon, 
  Circle as CircleIcon,
  CalendarMonth as CalendarIcon,
  Paid as PaidIcon,
  Build as BuildIcon,
  Construction as ConstructionIcon,
  ShoppingCart as ShoppingCartIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  PriorityHigh as PriorityHighIcon,
  Refresh as RefreshIcon,
  DashboardCustomize as DashboardCustomizeIcon,
  FilterAlt as FilterAltIcon,
  DateRange as DateRangeIcon,
  RequestQuote as RequestIcon
} from '@mui/icons-material';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// Interface definitions
interface Order {
  id: string;
  orderId: string;
  clientId: string;
  client?: {
    name: string;
  };
  title: string;
  description?: string;
  status: string;
  totalAmount: number;
  amountPaid: number;
  createdAt?: string;
  updatedAt?: string;
}

interface InventoryItem {
  id: string;
  itemName: string;
  itemType: string;
  quantity: number;
  minStockLevel: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface Notification {
  id: string;
  type: 'order' | 'inventory' | 'machinery' | 'payroll' | 'employee' | 'supplier';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// TabPanel component for tabbed interface
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Utility functions
const getStatusColor = (status: string): "success" | "info" | "warning" | "error" | "default" => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'In Progress':
      return 'info';
    case 'Pending':
      return 'warning';
    case 'Cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    return 'Invalid Date';
  }
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Generate mock notifications for demo purposes
const generateMockNotifications = (): Notification[] => {
  return [
    {
      id: '1',
      type: 'inventory',
      title: 'Low Stock Alert',
      message: '5 inventory items are below minimum stock levels',
      severity: 'warning',
      timestamp: new Date().toISOString(),
      read: false,
      actionUrl: '/inventory'
    },
    {
      id: '2',
      type: 'order',
      title: 'New Order',
      message: 'Order #ORD-2023-089 has been placed by Client ABC',
      severity: 'info',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
      actionUrl: '/orders'
    },
    {
      id: '3',
      type: 'machinery',
      title: 'Maintenance Due',
      message: 'Printing Press Machine #3 requires scheduled maintenance',
      severity: 'warning',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true,
      actionUrl: '/machinery'
    },
    {
      id: '4',
      type: 'payroll',
      title: 'Payroll Generated',
      message: 'March 2023 payroll has been processed successfully',
      severity: 'success',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      read: true,
      actionUrl: '/payroll'
    },
    {
      id: '5',
      type: 'supplier',
      title: 'Payment Due',
      message: 'Invoice #INV-456 from Paper Supplier Inc. is due in 3 days',
      severity: 'error',
      timestamp: new Date(Date.now() - 43200000).toISOString(),
      read: false,
      actionUrl: '/suppliers'
    }
  ];
};

const DashboardHome: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Redux state
  const { orders, error: ordersError } = useAppSelector(state => state.orders);
  const ordersLoading = useAppSelector(state => state.orders.isLoading || false); // Adjust based on your state structure
  const { clients, error: clientsError } = useAppSelector(state => state.clients);
  const { inventoryItems, lowStockItems, isLoading: inventoryLoading, error: inventoryError } = useAppSelector(state => state.inventory);
  const { employees, isLoading: employeesLoading } = useAppSelector(state => state.employees);
  const { attendanceRecords, isLoading: attendanceLoading } = useAppSelector(state => state.attendance || { attendanceRecords: [], isLoading: false });
  const { payrollRecords, isLoading: payrollLoading } = useAppSelector(state => state.payroll || { payrollRecords: [], isLoading: false });
  const { machinery, machineryStats, isLoading: machineryLoading } = useAppSelector(state => state.machinery || { machinery: [], machineryStats: null, isLoading: false });
  const suppliersState = useAppSelector(state => state.suppliers);
  const suppliers = suppliersState?.suppliers || [];
  const suppliersLoading = suppliersState?.isLoading || false;
  const { orderRequests, isLoading: orderRequestsLoading } = useAppSelector(state => state.orderRequests || { orderRequests: [], isLoading: false });
  
  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [activeTimeFilter, setActiveTimeFilter] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>(generateMockNotifications());
  const [notificationsMenuAnchor, setNotificationsMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Calculate dashboard metrics - using useMemo for performance optimization
  const dashboardMetrics = useMemo(() => {
    // Order metrics
    const pendingOrders: number = (orders || []).filter((order: Order) => order.status === 'Pending').length;
    const inProgressOrders: number = (orders || []).filter((order: Order) => order.status === 'In Progress').length;
    const completedOrders: number = (orders || []).filter((order: Order) => order.status === 'Completed').length;
    const cancelledOrders: number = (orders || []).filter((order: Order) => order.status === 'Cancelled').length;
    
    // Order request metrics
    const pendingRequests = (orderRequests || []).filter((req: any) => req.status === 'Pending').length;
    const approvedRequests = (orderRequests || []).filter((req: any) => req.status === 'Approved').length;
    const rejectedRequests = (orderRequests || []).filter((req: any) => req.status === 'Rejected').length;
    
    // Financial metrics
    const totalRevenue: number = (orders || []).reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0);
    const outstandingRevenue: number = (orders || []).reduce((sum: number, order: Order) => sum + ((order.totalAmount || 0) - (order.amountPaid || 0)), 0);
    const currentMonthRevenue = (orders || [])
      .filter((order: Order) => {
      if (!order.createdAt) return false;
      const orderDate: Date = new Date(order.createdAt);
      const currentMonth: number = new Date().getMonth();
      const currentYear: number = new Date().getFullYear();
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
      })
      .reduce((sum: number, order: Order) => sum + (order.totalAmount || 0), 0);
      
    // Resource metrics
    const totalEmployees = employees?.length || 0;
    const totalPayroll = (payrollRecords || []).reduce((sum, record: any) => sum + (record.netSalary || 0), 0);
    const totalInventoryItems = inventoryItems?.length || 0;
    const totalLowStockItems = lowStockItems?.length || 0;
    const totalMachinery = machinery?.length || 0;
    const totalSuppliers = suppliers?.length || 0;
    const totalClients = clients?.length || 0;
    
    // Maintenance metrics
    const machinesNeedingMaintenance = (machinery || []).filter((machine: any) => {
      if (!machine.nextMaintenanceDate) return false;
      const today = new Date();
      const nextMaintenanceDate = new Date(machine.nextMaintenanceDate);
      return nextMaintenanceDate <= today;
    }).length;
    
    // Attendance metrics
    const todayAttendanceCount = (attendanceRecords || []).filter((record: any) => {
      if (!record.date) return false;
      try {
        const recordDate = new Date(record.date);
        return isToday(recordDate);
      } catch (e) {
        return false;
      }
    }).length;
    
    return {
      pendingOrders,
      inProgressOrders,
      completedOrders,
      cancelledOrders,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalRevenue,
      outstandingRevenue,
      currentMonthRevenue,
      totalEmployees,
      totalPayroll,
      totalInventoryItems,
      totalLowStockItems,
      totalMachinery,
      totalSuppliers,
      totalClients,
      machinesNeedingMaintenance,
      todayAttendanceCount
    };
  }, [orders, orderRequests, employees, payrollRecords, inventoryItems, lowStockItems, machinery, suppliers, clients, attendanceRecords]);
  
  const unreadNotificationsCount = notifications.filter(notification => !notification.read).length;

  // Get sorted lists for display - using useMemo for better performance
  const recentOrders = useMemo(() => {
    return [...(orders || [])].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 5);
  }, [orders]);
  
  const recentOrderRequests = useMemo(() => {
    return [...(orderRequests || [])].sort((a: any, b: any) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 5);
  }, [orderRequests]);
  
  const latestAttendance = useMemo(() => {
    return [...(attendanceRecords || [])].sort((a: any, b: any) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 5);
  }, [attendanceRecords]);

  const upcomingMaintenances = useMemo(() => {
    return [...(machinery || [])].filter((machine: any) => machine.nextMaintenanceDate)
      .sort((a: any, b: any) => {
        const dateA = new Date(a.nextMaintenanceDate).getTime();
        const dateB = new Date(b.nextMaintenanceDate).getTime();
        return dateA - dateB;
      }).slice(0, 5);
  }, [machinery]);

  // Effect to fetch data
  useEffect(() => {
    fetchDashboardData();
  }, [dispatch]);

  // Function to fetch all dashboard data
  const fetchDashboardData = async () => {
    setRefreshing(true);
    
    try {
      // Get date range for queries
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
      const startDate = format(startOfMonth(subMonths(new Date(), 3)), 'yyyy-MM-dd');
      
      // Fetch data for all systems
      await Promise.all([
        dispatch(fetchOrders()),
        dispatch(fetchClients()),
        dispatch(fetchInventory()),
        dispatch(fetchLowStockItems()),
        dispatch(fetchEmployees()),
        dispatch(fetchAttendance({ startDate, endDate })),
        dispatch(fetchPayrolls({ startDate, endDate })),
        dispatch(fetchMachinery({})),
        dispatch(fetchMachineryStats()),
        dispatch(fetchSuppliers()),
        dispatch(fetchOrderRequests())
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handlers for UI interactions
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleTimeFilterChange = (filter: 'week' | 'month' | 'quarter' | 'year') => {
    setActiveTimeFilter(filter);
    setFilterMenuAnchor(null);
  };
  
  const handleRefresh = () => {
    fetchDashboardData();
  };
  
  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsMenuAnchor(event.currentTarget);
  };
  
  const handleNotificationClose = () => {
    setNotificationsMenuAnchor(null);
  };
  
  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };
  
  const handleFilterClose = () => {
    setFilterMenuAnchor(null);
  };
  
  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    handleNotificationClose();
  };

  const handleNotificationAction = (notification: Notification) => {
    // Mark as read
    setNotifications(notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    ));
    
    // Navigate to the action URL if provided
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    
    handleNotificationClose();
  };

  // Chart data preparation - using useMemo for better performance
  const chartData = useMemo(() => {
    // Order status data
    const orderStatusData = [
      { name: 'Pending', value: dashboardMetrics.pendingOrders, color: theme.palette.warning.main },
      { name: 'In Progress', value: dashboardMetrics.inProgressOrders, color: theme.palette.info.main },
      { name: 'Completed', value: dashboardMetrics.completedOrders, color: theme.palette.success.main },
      { name: 'Cancelled', value: dashboardMetrics.cancelledOrders, color: theme.palette.error.main },
    ].filter(item => item.value > 0);
    
    // Order request status data
    const orderRequestStatusData = [
      { name: 'Pending', value: dashboardMetrics.pendingRequests, color: theme.palette.warning.main },
      { name: 'Approved', value: dashboardMetrics.approvedRequests, color: theme.palette.success.main },
      { name: 'Rejected', value: dashboardMetrics.rejectedRequests, color: theme.palette.error.main },
    ].filter(item => item.value > 0);

    // Generate mock monthly data based on current month
    const currentMonth = new Date().getMonth();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenueData = Array.from({ length: 6 }, (_, i) => {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const revenue = Math.floor(60000 + Math.random() * 60000);
      return {
        name: months[monthIndex],
        revenue: revenue,
        expenses: Math.floor(revenue * (0.6 + Math.random() * 0.2)) // 60-80% of revenue
      };
    });

    // Inventory category data - could be derived from actual inventory items by type
    const inventoryCategoryData = [
      { name: 'Paper', value: 35, color: '#8884d8' },
      { name: 'Ink', value: 25, color: '#83a6ed' },
      { name: 'Binding', value: 15, color: '#8dd1e1' },
      { name: 'Packaging', value: 10, color: '#82ca9d' },
      { name: 'Other', value: 15, color: '#a4de6c' },
    ];
    
    // Suppliers activity data
    const suppliersActivityData = [
      { name: 'Products', a: 120, b: 110, fullMark: 150 },
      { name: 'Delivery Time', a: 98, b: 130, fullMark: 150 },
      { name: 'Quality', a: 86, b: 130, fullMark: 150 },
      { name: 'Price', a: 99, b: 100, fullMark: 150 },
      { name: 'Service', a: 85, b: 90, fullMark: 150 },
      { name: 'Reliability', a: 65, b: 85, fullMark: 150 },
    ];

    // Employee attendance data
    const employeeAttendanceData = [
      { date: '06/01', present: 28, absent: 2, late: 5 },
      { date: '06/02', present: 27, absent: 3, late: 2 },
      { date: '06/03', present: 29, absent: 1, late: 4 },
      { date: '06/04', present: 25, absent: 5, late: 3 },
      { date: '06/05', present: 28, absent: 2, late: 6 },
    ];

    // Maintenance cost data
    const maintenanceCostData = [
      { month: 'Jan', cost: 12000 },
      { month: 'Feb', cost: 8000 },
      { month: 'Mar', cost: 15000 },
      { month: 'Apr', cost: 6000 },
      { month: 'May', cost: 10000 },
      { month: 'Jun', cost: 9000 },
    ];

    // Payroll distribution data
    const payrollDistributionData = [
      { name: 'Base Salary', value: 65, color: '#0088FE' },
      { name: 'Overtime', value: 15, color: '#00C49F' },
      { name: 'Bonuses', value: 10, color: '#FFBB28' },
      { name: 'Benefits', value: 10, color: '#FF8042' },
    ];
    
    return {
      orderStatusData,
      orderRequestStatusData,
      monthlyRevenueData,
      inventoryCategoryData,
      suppliersActivityData,
      employeeAttendanceData,
      maintenanceCostData,
      payrollDistributionData
    };
  }, [dashboardMetrics, theme.palette]);

  return (
    <Box>
      {/* Header with title, welcome message, and action buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's an overview of your business performance.
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1}>
          <Tooltip title="Filter">
            <IconButton onClick={handleFilterClick}>
              <FilterAltIcon />
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={filterMenuAnchor}
            open={Boolean(filterMenuAnchor)}
            onClose={handleFilterClose}
          >
            <MenuItem 
              onClick={() => handleTimeFilterChange('week')}
              selected={activeTimeFilter === 'week'}
            >
              Last Week
            </MenuItem>
            <MenuItem 
              onClick={() => handleTimeFilterChange('month')}
              selected={activeTimeFilter === 'month'}
            >
              Last Month
            </MenuItem>
            <MenuItem 
              onClick={() => handleTimeFilterChange('quarter')}
              selected={activeTimeFilter === 'quarter'}
            >
              Last Quarter
            </MenuItem>
            <MenuItem 
              onClick={() => handleTimeFilterChange('year')}
              selected={activeTimeFilter === 'year'}
            >
              Last Year
            </MenuItem>
          </Menu>
          
          <Badge badgeContent={unreadNotificationsCount} color="error">
            <IconButton onClick={handleNotificationClick}>
              <NotificationsIcon />
            </IconButton>
          </Badge>
          
          <Menu
            anchorEl={notificationsMenuAnchor}
            open={Boolean(notificationsMenuAnchor)}
            onClose={handleNotificationClose}
            PaperProps={{
              style: {
                maxHeight: 400,
                width: 360,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
              <Button size="small" onClick={markAllNotificationsAsRead}>
                Mark all as read
              </Button>
            </Box>
            <Divider />
            {notifications.length === 0 ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  No notifications
                </Typography>
              </Box>
            ) : (
              notifications.map((notification) => (
                <MenuItem 
                  key={notification.id} 
                  onClick={() => handleNotificationAction(notification)}
                  sx={{ 
                    py: 1.5,
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    borderLeft: notification.read ? 'none' : `4px solid ${theme.palette[notification.severity].main}`,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette[notification.severity].light }}>
                      {notification.severity === 'warning' && <WarningIcon color="warning" />}
                      {notification.severity === 'error' && <PriorityHighIcon color="error" />}
                      {notification.severity === 'info' && <NotificationsIcon color="info" />}
                      {notification.severity === 'success' && <CheckCircleIcon color="success" />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={
                      <Typography variant="body1" fontWeight={notification.read ? 'regular' : 'bold'}>
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" sx={{ display: 'block' }}>
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(notification.timestamp)}
                        </Typography>
                      </>
                    }
                  />
                </MenuItem>
              ))
            )}
          </Menu>
          
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <CircularProgress size={24} />
              ) : (
                <RefreshIcon />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Key metrics cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: 'primary.light',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.dark', mr: 1 }}>
                  <OrdersIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="medium">
                  Orders
                </Typography>
              </Box>
              {ordersLoading ? (
                <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 1 }} width="60%" height={50} />
              ) : (
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {orders?.length || 0}
                </Typography>
              )}
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Pending</Typography>
                  {ordersLoading ? (
                    <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} width="80%" />
                  ) : (
                    <Typography variant="h6" fontWeight="medium">{dashboardMetrics.pendingOrders}</Typography>
                  )}
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>In Progress</Typography>
                  {ordersLoading ? (
                    <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} width="80%" />
                  ) : (
                    <Typography variant="h6" fontWeight="medium">{dashboardMetrics.inProgressOrders}</Typography>
                  )}
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Completed</Typography>
                  {ordersLoading ? (
                    <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} width="80%" />
                  ) : (
                    <Typography variant="h6" fontWeight="medium">{dashboardMetrics.completedOrders}</Typography>
                  )}
                </Grid>
              </Grid>
              <Button 
                variant="contained" 
                size="small" 
                sx={{ 
                  mt: 2, 
                  bgcolor: 'primary.dark',
                  '&:hover': {
                    bgcolor: 'primary.main'
                  }
                }}
                onClick={() => navigate('/orders/clients')}
              >
                View Orders
              </Button>
            </Box>
            <OrdersIcon sx={{ 
              position: 'absolute', 
              right: -20, 
              bottom: -20, 
              fontSize: 150,
              opacity: 0.2
            }} />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: theme.palette.warning.dark,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', mr: 1 }}>
                  <RequestIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="medium">
                  Order Requests
                </Typography>
              </Box>
              {orderRequestsLoading ? (
                <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 1 }} width="60%" height={50} />
              ) : (
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {orderRequests?.length || 0}
                </Typography>
              )}
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Pending</Typography>
                  {orderRequestsLoading ? (
                    <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} width="80%" />
                  ) : (
                    <Typography variant="h6" fontWeight="medium">{dashboardMetrics.pendingRequests}</Typography>
                  )}
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Approved</Typography>
                  {orderRequestsLoading ? (
                    <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} width="80%" />
                  ) : (
                    <Typography variant="h6" fontWeight="medium">{dashboardMetrics.approvedRequests}</Typography>
                  )}
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Rejected</Typography>
                  {orderRequestsLoading ? (
                    <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} width="80%" />
                  ) : (
                    <Typography variant="h6" fontWeight="medium">{dashboardMetrics.rejectedRequests}</Typography>
                  )}
                </Grid>
              </Grid>
              <Button 
                variant="contained"
                size="small"
                sx={{ 
                  mt: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.3)'
                  }
                }}
                onClick={() => navigate('/orders/requests')}
              >
                View Requests
              </Button>
            </Box>
            <RequestIcon sx={{ 
              position: 'absolute', 
              right: -20, 
              bottom: -20, 
              fontSize: 150,
              opacity: 0.2
            }} />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: theme.palette.info.main,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.info.dark, mr: 1 }}>
                  <TrendingUpIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="medium">
                  Revenue
                </Typography>
              </Box>
              {ordersLoading ? (
                <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 1 }} width="60%" height={50} />
              ) : (
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatCurrency(dashboardMetrics.totalRevenue)}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  This Month: {formatCurrency(dashboardMetrics.currentMonthRevenue)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2">
                  Outstanding: {formatCurrency(dashboardMetrics.outstandingRevenue)}
                </Typography>
              </Box>
              <Button 
                variant="contained"
                size="small"
                sx={{ 
                  mt: 2,
                  bgcolor: theme.palette.info.dark,
                  '&:hover': {
                    bgcolor: theme.palette.info.dark,
                    opacity: 0.9
                  }
                }}
                onClick={() => navigate('/reports')}
              >
                View Reports
              </Button>
            </Box>
            <TrendingUpIcon sx={{ 
              position: 'absolute', 
              right: -20, 
              bottom: -20, 
              fontSize: 150,
              opacity: 0.2
            }} />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: theme.palette.success.main,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.success.dark, mr: 1 }}>
                  <ClientsIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="medium">
                  Clients & Suppliers
                </Typography>
              </Box>
              {/* Show skeleton loading when data is loading */}
              {clientsError || suppliersLoading ? (
                <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 1 }} width="60%" height={50} />
              ) : (
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {dashboardMetrics.totalClients} / {dashboardMetrics.totalSuppliers}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  size="small"
                  label={`${dashboardMetrics.totalClients} Clients`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  onClick={() => navigate('/clients')}
                />
                <Chip
                  size="small"
                  label={`${dashboardMetrics.totalSuppliers} Suppliers`}
                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  onClick={() => navigate('/suppliers')}
                />
              </Box>
              <Button 
                variant="contained"
                size="small"
                sx={{ 
                  mt: 2,
                  bgcolor: theme.palette.success.dark,
                  '&:hover': {
                    bgcolor: theme.palette.success.dark,
                    opacity: 0.9
                  }
                }}
                onClick={() => navigate('/clients')}
              >
                Manage Clients
              </Button>
            </Box>
            <ClientsIcon sx={{ 
              position: 'absolute', 
              right: -20, 
              bottom: -20, 
              fontSize: 150,
              opacity: 0.2
            }} />
          </Paper>
        </Grid>
      </Grid>

      {/* Second row of metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: theme.palette.warning.main,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.warning.dark, mr: 1 }}>
                  <InventoryIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="medium">
                  Inventory
                </Typography>
              </Box>
              {inventoryLoading ? (
                <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 1 }} width="60%" height={50} />
              ) : (
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {dashboardMetrics.totalInventoryItems}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  {inventoryLoading ? (
                    <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} width="120px" />
                  ) : (
                    <>{dashboardMetrics.totalLowStockItems} items low stock</>
                  )}
                </Typography>
              </Box>
              <Button 
                variant="contained"
                size="small"
                sx={{ 
                  mt: 2,
                  bgcolor: theme.palette.warning.dark,
                  '&:hover': {
                    bgcolor: theme.palette.warning.dark,
                    opacity: 0.9
                  }
                }}
                onClick={() => navigate('/inventory')}
              >
                View Inventory
              </Button>
            </Box>
            <InventoryIcon sx={{ 
              position: 'absolute', 
              right: -20, 
              bottom: -20, 
              fontSize: 150,
              opacity: 0.2
            }} />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: '#7E57C2', // Purple color
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#5E35B1', mr: 1 }}>
                  <PeopleIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="medium">
                  Employees
                </Typography>
              </Box>
              {employeesLoading ? (
                <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 1 }} width="60%" height={50} />
              ) : (
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {dashboardMetrics.totalEmployees}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  {attendanceLoading ? (
                    <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} width="120px" />
                  ) : (
                    <>{dashboardMetrics.todayAttendanceCount} checked in today</>
                  )}
                </Typography>
              </Box>
              <Button 
                variant="contained"
                size="small"
                sx={{ 
                  mt: 2,
                  bgcolor: '#5E35B1',
                  '&:hover': {
                    bgcolor: '#5E35B1',
                    opacity: 0.9
                  }
                }}
                onClick={() => navigate('/employees')}
              >
                Manage Employees
              </Button>
            </Box>
            <PeopleIcon sx={{ 
              position: 'absolute', 
              right: -20, 
              bottom: -20, 
              fontSize: 150,
              opacity: 0.2
            }} />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: '#26A69A', // Teal color
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#00897B', mr: 1 }}>
                  <PaidIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="medium">
                  Payroll
                </Typography>
              </Box>
              {payrollLoading ? (
                <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 1 }} width="60%" height={50} />
              ) : (
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {formatCurrency(dashboardMetrics.totalPayroll)}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DateRangeIcon sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  {payrollLoading ? (
                    <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} width="120px" />
                  ) : (
                    <>Last payroll: {formatDate((payrollRecords || [])[0]?.endDate || '')}</>
                  )}
                </Typography>
              </Box>
              <Button 
                variant="contained"
                size="small"
                sx={{ 
                  mt: 2,
                  bgcolor: '#00897B',
                  '&:hover': {
                    bgcolor: '#00897B',
                    opacity: 0.9
                  }
                }}
                onClick={() => navigate('/payroll')}
              >
                View Payroll
              </Button>
            </Box>
            <PaidIcon sx={{ 
              position: 'absolute', 
              right: -20, 
              bottom: -20, 
              fontSize: 150,
              opacity: 0.2
            }} />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: '#EF6C00', // Dark orange color
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: '#E65100', mr: 1 }}>
                  <BuildIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="medium">
                  Machinery
                </Typography>
              </Box>
              {machineryLoading ? (
                <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)', mb: 1 }} width="60%" height={50} />
              ) : (
                <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                  {dashboardMetrics.totalMachinery}
                </Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  {machineryLoading ? (
                    <Skeleton variant="text" sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} width="150px" />
                  ) : (
                    <>{dashboardMetrics.machinesNeedingMaintenance} need maintenance</>
                  )}
                </Typography>
              </Box>
              <Button 
                variant="contained"
                size="small"
                sx={{ 
                  mt: 2,
                  bgcolor: '#E65100',
                  '&:hover': {
                    bgcolor: '#E65100',
                    opacity: 0.9
                  }
                }}
                onClick={() => navigate('/machinery')}
              >
                View Machinery
              </Button>
            </Box>
            <ConstructionIcon sx={{ 
              position: 'absolute', 
              right: -20, 
              bottom: -20, 
              fontSize: 150,
              opacity: 0.2
            }} />
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs for different dashboard sections */}
      <Paper sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)', mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<DashboardCustomizeIcon />} label="Overview" />
          <Tab icon={<OrdersIcon />} label="Orders & Clients" />
          <Tab icon={<InventoryIcon />} label="Inventory & Suppliers" />
          <Tab icon={<PeopleIcon />} label="Employees & Payroll" />
          <Tab icon={<BuildIcon />} label="Machinery" />
        </Tabs>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Monthly Revenue Chart */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader
                  title="Revenue vs Expenses"
                  subheader="Monthly comparison"
                  action={
                    <IconButton size="small" onClick={handleRefresh}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  }
                />
                <CardContent>
                  {refreshing ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={chartData.monthlyRevenueData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `₱${value/1000}k`} />
                          <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stackId="1"
                            stroke={theme.palette.success.main} 
                            fill={theme.palette.success.light} 
                            name="Revenue"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="expenses" 
                            stackId="2"
                            stroke={theme.palette.error.main} 
                            fill={theme.palette.error.light} 
                            name="Expenses"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Order Status Pie Chart */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader
                  title="Order Status"
                  subheader="Distribution of orders by status"
                  action={
                    <IconButton size="small" onClick={handleRefresh}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  }
                />
                <CardContent>
                  {ordersLoading || refreshing ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : (chartData.orderStatusData.length === 0) ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        No orders found
                      </Typography>
                      <Button 
                        variant="contained" 
                        size="small" 
                        onClick={() => navigate('/orders/clients')}
                      >
                        Create New Order
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.orderStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {chartData.orderStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => `${value} orders`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Recent Orders */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader
                  title="Recent Orders"
                  action={
                    <Button 
                      variant="outlined" 
                      endIcon={<ChevronRightIcon />}
                      onClick={() => navigate('/orders/clients')}
                      size="small"
                      color="primary"
                    >
                      View All
                    </Button>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  {ordersLoading ? (
                    <Box sx={{ py: 3 }}>
                      {[0, 1, 2].map((index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', py: 1.5, px: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" height={24} />
                            <Skeleton variant="text" width="80%" height={20} />
                          </Box>
                          <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                        </Box>
                      ))}
                    </Box>
                  ) : ordersError ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {process.env.NODE_ENV === 'development' 
                          ? 'API not available in development mode' 
                          : 'Could not load order data'}
                      </Typography>
                    </Box>
                  ) : recentOrders.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No orders found
                      </Typography>
                      <Button 
                        variant="contained" 
                        size="small" 
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/orders/clients')}
                      >
                        Create New Order
                      </Button>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {recentOrders.map((order) => (
                        <ListItemButton 
                          key={order.id}
                          onClick={() => navigate(`/orders/${order.id}`)}
                          sx={{ px: 0 }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body1" fontWeight="medium">
                                  {order.orderId}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={order.status}
                                  color={getStatusColor(order.status)}
                                  sx={{ ml: 1, minWidth: 90 }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary" component="span">
                                  {order.client?.name || 'Unknown Client'} • 
                                </Typography>
                                <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                                  {formatCurrency(order.totalAmount || 0)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                                  • {formatDate(order.createdAt)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Recent Order Requests */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader
                  title="Recent Order Requests"
                  action={
                    <Button 
                      variant="outlined" 
                      endIcon={<ChevronRightIcon />}
                      onClick={() => navigate('/orders/requests')}
                      size="small"
                      color="warning"
                    >
                      View All
                    </Button>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  {orderRequestsLoading ? (
                    <Box sx={{ py: 3 }}>
                      {[0, 1, 2].map((index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', py: 1.5, px: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" height={24} />
                            <Skeleton variant="text" width="80%" height={20} />
                          </Box>
                          <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                        </Box>
                      ))}
                    </Box>
                  ) : orderRequests?.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No order requests found
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="warning"
                        size="small" 
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/orders/requests')}
                      >
                        Create Request
                      </Button>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {recentOrderRequests.map((request: any) => (
                        <ListItemButton 
                          key={request.id}
                          onClick={() => navigate(`/orders/requests/${request.id}`)}
                          sx={{ px: 0 }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body1" fontWeight="medium">
                                  {request.request_id || `Request #${request.id}`}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={request.status}
                                  color={
                                    request.status === 'Approved' ? 'success' :
                                    request.status === 'Rejected' ? 'error' : 'warning'
                                  }
                                  sx={{ ml: 1, minWidth: 90 }}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary" component="span">
                                  {request.clients?.name || 'Unknown Client'} • 
                                </Typography>
                                <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                                  {formatCurrency(request.total_amount || 0)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                                  • {formatDate(request.created_at)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Low Stock Items */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader
                  title="Low Stock Items"
                  action={
                    <Button 
                      variant="outlined" 
                      endIcon={<ChevronRightIcon />}
                      onClick={() => navigate('/inventory')}
                      size="small"
                      color="error"
                    >
                      View All
                    </Button>
                  }
                />
                <CardContent sx={{ pt: 0 }}>
                  {inventoryLoading ? (
                    <Box sx={{ py: 3 }}>
                      {[0, 1, 2].map((index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', py: 1.5, px: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" height={24} />
                            <Skeleton variant="text" width="80%" height={20} />
                          </Box>
                          <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                        </Box>
                      ))}
                    </Box>
                  ) : inventoryError ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        {process.env.NODE_ENV === 'development' 
                          ? 'API not available in development mode' 
                          : 'Could not load inventory data'}
                      </Typography>
                    </Box>
                  ) : !lowStockItems || lowStockItems.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <Alert severity="success" sx={{ mb: 2 }}>
                        All inventory items are at adequate stock levels
                      </Alert>
                      <Button 
                        variant="contained" 
                        size="small" 
                        color="primary"
                        onClick={() => navigate('/inventory')}
                      >
                        View Inventory
                      </Button>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {lowStockItems.slice(0, 5).map((item: InventoryItem) => (
                      <ListItemButton 
                        key={item.id}
                        onClick={() => navigate(`/inventory/${item.id}`)}
                        sx={{ px: 0 }}
                      >
                        <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircleIcon sx={{ fontSize: 12, mr: 1, color: 'error.main' }} />
                          <Typography variant="body1" fontWeight="medium">
                            {item.itemName}
                          </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body2" color="text.secondary" component="span">
                            Current: {item.quantity} • Min: {item.minStockLevel}
                          </Typography>
                          <Typography variant="body2" color="error" component="span" sx={{ ml: 1, fontWeight: 'medium' }}>
                            • Restock needed
                          </Typography>
                          </Box>
                        }
                        />
                      </ListItemButton>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            {/* Supplier Performance */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader
                  title="Supplier Performance"
                  action={
                    <Button 
                      variant="outlined" 
                      endIcon={<ChevronRightIcon />}
                      onClick={() => navigate('/suppliers')}
                      size="small"
                    >
                      View All
                    </Button>
                  }
                />
                <CardContent>
                  {suppliersLoading ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : suppliers?.length === 0 ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        No suppliers found
                      </Typography>
                      <Button 
                        variant="contained" 
                        size="small" 
                        onClick={() => navigate('/suppliers')}
                      >
                        Add Suppliers
                      </Button>
                    </Box>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart 
                          outerRadius={100} 
                          width={500} 
                          height={300} 
                          data={chartData.suppliersActivityData}
                        >
                          <PolarGrid />
                          <PolarAngleAxis dataKey="name" />
                          <PolarRadiusAxis angle={30} domain={[0, 150]} />
                          <Radar 
                            name="Paper Supplier" 
                            dataKey="a" 
                            stroke={theme.palette.primary.main} 
                            fill={theme.palette.primary.main} 
                            fillOpacity={0.6} 
                          />
                          <Radar 
                            name="Ink Supplier" 
                            dataKey="b" 
                            stroke={theme.palette.secondary.main} 
                            fill={theme.palette.secondary.main} 
                            fillOpacity={0.6} 
                          />
                          <Legend />
                          <RechartsTooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Orders & Clients Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {/* Order Status Distribution */}
            <Grid item xs={12} md={6}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader 
                  title="Order Status Distribution" 
                  action={
                    <IconButton size="small" onClick={handleRefresh}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  }
                />
                <CardContent>
                  {ordersLoading || refreshing ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.orderStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {chartData.orderStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => `${value} orders`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Order Request Status */}
            <Grid item xs={12} md={6}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader 
                  title="Order Request Status" 
                  action={
                    <IconButton size="small" onClick={handleRefresh}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  }
                />
                <CardContent>
                  {orderRequestsLoading || refreshing ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.orderRequestStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {chartData.orderRequestStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value) => `${value} requests`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Monthly Revenue */}
            <Grid item xs={12} md={12}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader 
                  title="Monthly Revenue" 
                  action={
                    <IconButton size="small" onClick={handleRefresh}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  }
                />
                <CardContent>
                  {refreshing ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData.monthlyRevenueData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `₱${value/1000}k`} />
                          <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke={theme.palette.primary.main} 
                            activeDot={{ r: 8 }}
                            name="Revenue"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="expenses" 
                            stroke={theme.palette.error.main}
                            name="Expenses"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Orders List */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader 
                  title="Recent Orders" 
                  action={
                    <Button 
                      variant="contained" 
                      color="primary"
                      size="small"
                      onClick={() => navigate('/orders')}
                    >
                      View All Orders
                    </Button>
                  }
                />
                <CardContent>
                  {ordersLoading ? (
                    <LinearProgress />
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Order ID</TableCell>
                            <TableCell>Client</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {recentOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>{order.orderId}</TableCell>
                              <TableCell>{order.client?.name || 'Unknown'}</TableCell>
                              <TableCell>{formatDate(order.createdAt)}</TableCell>
                              <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={order.status}
                                  color={getStatusColor(order.status)}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Button 
                                  size="small" 
                                  variant="text"
                                  onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Inventory & Suppliers Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {/* Inventory Category Distribution */}
            <Grid item xs={12} md={6}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader 
                  title="Inventory Category Distribution" 
                  action={
                    <IconButton size="small" onClick={handleRefresh}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  }
                />
                <CardContent>
                  {inventoryLoading || refreshing ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.inventoryCategoryData}
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {chartData.inventoryCategoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Low Stock Items */}
            <Grid item xs={12} md={6}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader 
                  title="Low Stock Items" 
                  action={
                    <Button 
                      variant="contained" 
                      color="error"
                      size="small"
                      onClick={() => navigate('/inventory')}
                    >
                      View All
                    </Button>
                  }
                />
                <CardContent>
                  {inventoryLoading ? (
                    <LinearProgress />
                  ) : lowStockItems && lowStockItems.length > 0 ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Item Name</TableCell>
                            <TableCell>Current Stock</TableCell>
                            <TableCell>Min Level</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                            {lowStockItems.slice(0, 5).map((item: InventoryItem) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.itemName}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.minStockLevel}</TableCell>
                              <TableCell>
                              <Chip
                                label="Low Stock"
                                color="error"
                                size="small"
                              />
                              </TableCell>
                            </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="success">All inventory items are at adequate stock levels.</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Suppliers Overview */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader title="Suppliers Overview" />
                <CardContent>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Paper Inc.', orders: 12, spending: 42000 },
                          { name: 'Ink Solutions', orders: 8, spending: 28000 },
                          { name: 'Binding Pro', orders: 5, spending: 15000 },
                          { name: 'Package Masters', orders: 7, spending: 22000 },
                          { name: 'Equipment Ltd', orders: 3, spending: 35000 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tickFormatter={(value) => `₱${value/1000}k`} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="orders" fill="#8884d8" name="Orders" />
                        <Bar yAxisId="right" dataKey="spending" fill="#82ca9d" name="Spending" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Employees & Payroll Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            {/* Employee Attendance */}
            <Grid item xs={12} md={6}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader 
                  title="Employee Attendance (Last 5 Days)" 
                  action={
                    <IconButton size="small" onClick={handleRefresh}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  }
                />
                <CardContent>
                  {attendanceLoading || refreshing ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData.employeeAttendanceData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <RechartsTooltip />
                          <Legend />
                          <Bar dataKey="present" stackId="a" fill="#4CAF50" name="Present" />
                          <Bar dataKey="late" stackId="a" fill="#FFC107" name="Late" />
                          <Bar dataKey="absent" stackId="a" fill="#F44336" name="Absent" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Payroll Distribution */}
            <Grid item xs={12} md={6}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader 
                  title="Payroll Distribution" 
                  action={
                    <IconButton size="small" onClick={handleRefresh}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  }
                />
                <CardContent>
                  {payrollLoading || refreshing ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.payrollDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {chartData.payrollDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Recent Attendance */}
            <Grid item xs={12} md={6}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader 
                  title="Recent Attendance" 
                  action={
                    <Button 
                      variant="contained" 
                      size="small"
                      onClick={() => navigate('/attendance')}
                    >
                      View All
                    </Button>
                  }
                />
                <CardContent>
                  {attendanceLoading ? (
                    <LinearProgress />
                  ) : latestAttendance && latestAttendance.length > 0 ? (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Employee</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Time In</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {latestAttendance.map((record: any) => (
                            <TableRow key={record.id}>
                              <TableCell>{record.employeeName || `Employee #${record.employeeId}`}</TableCell>
                              <TableCell>{formatDate(record.date)}</TableCell>
                              <TableCell>{record.timeIn || 'N/A'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={record.status || 'Present'}
                                  color={record.status === 'Absent' ? 'error' : record.status === 'Late' ? 'warning' : 'success'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="info">No recent attendance records found.</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Department Distribution */}
            <Grid item xs={12} md={6}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader title="Department Distribution" />
                <CardContent>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={[
                          { department: 'Production', employees: 12 },
                          { department: 'Administration', employees: 5 },
                          { department: 'Sales', employees: 7 },
                          { department: 'Design', employees: 4 },
                          { department: 'Logistics', employees: 3 },
                        ]}
                        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="department" type="category" />
                        <RechartsTooltip />
                        <Bar dataKey="employees" fill="#8884d8" name="Employees" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Machinery Tab */}
        <TabPanel value={tabValue} index={4}>
          <Grid container spacing={3}>
            {/* Maintenance Costs */}
            <Grid item xs={12} md={6}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader 
                  title="Maintenance Costs (Last 6 Months)" 
                  action={
                    <IconButton size="small" onClick={handleRefresh}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  }
                />
                <CardContent>
                  {machineryLoading || refreshing ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData.maintenanceCostData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(value) => `₱${value/1000}k`} />
                          <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                          <Bar dataKey="cost" fill="#FF9800" name="Maintenance Cost" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Machinery Status */}
            <Grid item xs={12} md={6}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader 
                  title="Machinery Status" 
                  action={
                    <IconButton size="small" onClick={handleRefresh}>
                      <RefreshIcon fontSize="small" />
                    </IconButton>
                  }
                />
                <CardContent>
                  {machineryLoading || refreshing ? (
                    <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Operational', value: dashboardMetrics.totalMachinery - dashboardMetrics.machinesNeedingMaintenance, color: '#4CAF50' },
                              { name: 'Needs Maintenance', value: dashboardMetrics.machinesNeedingMaintenance, color: '#FFC107' },
                              { name: 'Under Repair', value: 1, color: '#F44336' },
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={90}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {[
                              { name: 'Operational', value: dashboardMetrics.totalMachinery - dashboardMetrics.machinesNeedingMaintenance, color: '#4CAF50' },
                              { name: 'Needs Maintenance', value: dashboardMetrics.machinesNeedingMaintenance, color: '#FFC107' },
                              { name: 'Under Repair', value: 1, color: '#F44336' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Upcoming Maintenance */}
            <Grid item xs={12}>
              <Card sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <CardHeader 
                  title="Upcoming Maintenance" 
                  action={
                    <Button 
                      variant="contained" 
                      color="warning"
                      size="small"
                      onClick={() => navigate('/machinery')}
                    >
                      View All
                    </Button>
                  }
                />
                <CardContent>
                  {machineryLoading ? (
                    <LinearProgress />
                  ) : upcomingMaintenances && upcomingMaintenances.length > 0 ? (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Machine Name</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Last Maintenance</TableCell>
                            <TableCell>Next Maintenance</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {upcomingMaintenances.map((machine: any) => {
                            const nextMaintenanceDate = new Date(machine.nextMaintenanceDate);
                            const today = new Date();
                            const daysUntilMaintenance = Math.ceil((nextMaintenanceDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            
                            let status = 'Scheduled';
                            let statusColor: "success" | "warning" | "error" = 'success';
                            
                            if (daysUntilMaintenance <= 0) {
                              status = 'Overdue';
                              statusColor = 'error';
                            } else if (daysUntilMaintenance <= 7) {
                              status = 'Due Soon';
                              statusColor = 'warning';
                            }
                            
                            return (
                              <TableRow key={machine.id}>
                                <TableCell>{machine.name}</TableCell>
                                <TableCell>{machine.type}</TableCell>
                                <TableCell>{formatDate(machine.lastMaintenanceDate)}</TableCell>
                                <TableCell>{formatDate(machine.nextMaintenanceDate)}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={status}
                                    color={statusColor}
                                    size="small"
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Alert severity="success">No upcoming maintenance required.</Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default DashboardHome;