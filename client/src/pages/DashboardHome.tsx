import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchOrders } from '../redux/slices/ordersSlice';
import { fetchClients } from '../redux/slices/clientsSlice';
import { fetchInventory, fetchLowStockItems } from '../redux/slices/inventorySlice';
import { Box, Grid, Paper, Typography, Divider, List, ListItem, ListItemText, Card, CardContent, CardHeader, Avatar, IconButton, Button, Chip, useTheme, LinearProgress } from '@mui/material';
import { Assignment as OrdersIcon, People as ClientsIcon, Inventory as InventoryIcon, Warning as WarningIcon, TrendingUp as TrendingUpIcon, MoreVert as MoreVertIcon, ChevronRight as ChevronRightIcon, Circle as CircleIcon } from '@mui/icons-material';

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

const DashboardHome: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const { orders, isLoading: ordersLoading, error: ordersError } = useAppSelector(state => state.orders);
  const { clients, error: clientsError } = useAppSelector(state => state.clients);
  const { inventoryItems, lowStockItems, isLoading: inventoryLoading, error: inventoryError } = useAppSelector(state => state.inventory);

  useEffect(() => {
    try {
      dispatch(fetchOrders());
    } catch (error) {
      console.error('Error dispatching fetchOrders:', error);
    }
    
    try {
      dispatch(fetchClients());
    } catch (error) {
      console.error('Error dispatching fetchClients:', error);
    }
    
    try {
      dispatch(fetchInventory());
    } catch (error) {
      console.error('Error dispatching fetchInventory:', error);
    }
    
    try {
      dispatch(fetchLowStockItems());
    } catch (error) {
      console.error('Error dispatching fetchLowStockItems:', error);
    }
  }, [dispatch]);

  const pendingOrders = (orders || []).filter(order => order.status === 'Pending').length || 0;
  const inProgressOrders = (orders || []).filter(order => order.status === 'In Progress').length || 0;
  const completedOrders = (orders || []).filter(order => order.status === 'Completed').length || 0;
  const totalRevenue = (orders || []).reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;
  const outstandingRevenue = (orders || []).reduce((sum, order) => sum + ((order.totalAmount || 0) - (order.amountPaid || 0)), 0) || 0;

  const recentOrders = [...(orders || [])].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  }).slice(0, 5);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Welcome back! Here's an overview of your business performance.
      </Typography>

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
              overflow: 'hidden'
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
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                {orders?.length || 0}
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Pending</Typography>
                  <Typography variant="h6" fontWeight="medium">{pendingOrders}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>In Progress</Typography>
                  <Typography variant="h6" fontWeight="medium">{inProgressOrders}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Completed</Typography>
                  <Typography variant="h6" fontWeight="medium">{completedOrders}</Typography>
                </Grid>
              </Grid>
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
              backgroundColor: theme.palette.success.main,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.success.dark, mr: 1 }}>
                  <ClientsIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="medium">
                  Clients
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                {clients?.length || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  +4 new this month
                </Typography>
              </Box>
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

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: theme.palette.info.main,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
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
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
              ₱{totalRevenue.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Outstanding: ₱{outstandingRevenue.toLocaleString()}
              </Typography>
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
              backgroundColor: theme.palette.warning.main,
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
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
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                {inventoryItems?.length || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  {lowStockItems?.length || 0} items low stock
                </Typography>
              </Box>
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
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <CardHeader
              title="Recent Orders"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 0 }}>
              {ordersLoading ? (
                <LinearProgress sx={{ my: 3 }} />
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
                </Box>
              ) : (
                <List>
                  {recentOrders.map((order) => (
                    <React.Fragment key={order.id}>
                      <ListItem
                        secondaryAction={
                          <IconButton edge="end" aria-label="view details" onClick={() => navigate(`/orders/${order.id}`)}>
                            <ChevronRightIcon color="action" />
                          </IconButton>
                        }
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
                                ₱{order.totalAmount?.toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
                                • {formatDate(order.createdAt)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  variant="outlined" 
                  endIcon={<ChevronRightIcon />}
                  onClick={() => navigate('/orders')}
                >
                  View All Orders
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <CardHeader
              title="Low Stock Items"
              action={
                <IconButton aria-label="settings">
                  <MoreVertIcon />
                </IconButton>
              }
              sx={{ pb: 0 }}
            />
            <CardContent sx={{ pt: 0 }}>
              {inventoryLoading ? (
                <LinearProgress sx={{ my: 3 }} />
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
                  <Typography variant="body2" color="text.secondary">
                    No low stock items found
                  </Typography>
                </Box>
              ) : (
                <List>
                  {lowStockItems.slice(0, 5).map((item) => (
                    <React.Fragment key={item.id}>
                      <ListItem
                        secondaryAction={
                          <IconButton edge="end" aria-label="view details" onClick={() => navigate(`/inventory/${item.id}`)}>
                            <ChevronRightIcon color="action" />
                          </IconButton>
                        }
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
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button 
                  variant="outlined" 
                  endIcon={<ChevronRightIcon />}
                  onClick={() => navigate('/inventory')}
                  color="error"
                >
                  View All Low Stock Items
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHome;