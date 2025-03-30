import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, InputAdornment, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Tabs, Tab, Snackbar, Alert, CircularProgress } from '@mui/material';
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { ClientOrder, clientOrdersService } from '../../services/clientOrdersService';
import { OrderRequestItem } from '../../services/orderRequestsService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`order-tabpanel-${index}`}
      aria-labelledby={`order-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface ExtendedClientOrder extends ClientOrder {
  items?: OrderRequestItem[];
  order_type?: string;
}

interface OrderDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  order: ExtendedClientOrder | null;
  onStatusChange: (orderId: number, status: string) => void;
}

const OrderDetailsDialog: React.FC<OrderDetailsDialogProps> = ({ open, onClose, order, onStatusChange }) => {
  const [tabValue, setTabValue] = useState(0);
  const [orderHistory, setOrderHistory] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (order && open) {
      setSelectedStatus(order.status);
      
      // Generate order history entries
      const historyEntries = [
        {
          date: order.created_at,
          status: 'Created',
          updatedBy: 'System',
          notes: 'Order created'
        }
      ];
      
      // Add entry for status changes if updated_at is different from created_at
      if (order.updated_at && new Date(order.updated_at).getTime() !== new Date(order.created_at).getTime()) {
        historyEntries.push({
          date: order.updated_at,
          status: order.status,
          updatedBy: 'Admin',
          notes: `Status changed to ${order.status}`
        });
      }
      
      setOrderHistory(historyEntries);
    }
  }, [order, open]);

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    setSelectedStatus(event.target.value);
  };

  const handleSaveStatus = () => {
    if (order && selectedStatus && order.status !== selectedStatus) {
      onStatusChange(order.id, selectedStatus);
      onClose();
    } else {
      onClose();
    }
  };

  if (!order) return null;

  const getChipColor = (status: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Completed':
        return 'info';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Order Details: {order.order_id}
        <Chip 
          label={order.status} 
          color={getChipColor(order.status)}
          size="small"
          sx={{ ml: 2 }}
        />
      </DialogTitle>
      
      <Tabs value={tabValue} onChange={handleTabChange} centered>
        <Tab label="Basic Info" />
        <Tab label="Order History" />
        <Tab label="Items" />
      </Tabs>
      
      <DialogContent>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">Client</Typography>
            <Typography variant="body1">{order.clients?.name || 'N/A'}</Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">Contact Person</Typography>
            <Typography variant="body1">{order.clients?.contactPerson || 'N/A'}</Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">Date</Typography>
            <Typography variant="body1">{new Date(order.date).toLocaleDateString()}</Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">Order Type</Typography>
            <Typography variant="body1">{order.order_type || 'General Order'}</Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">Amount</Typography>
            <Typography variant="body1">₱{order.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">Status</Typography>
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel id="order-status-label">Order Status</InputLabel>
              <Select
                labelId="order-status-label"
                value={selectedStatus}
                onChange={handleStatusChange}
                label="Order Status"
              >
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">Notes</Typography>
            <Typography variant="body1">{order.notes || 'No notes available'}</Typography>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {orderHistory.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No order history available.
            </Typography>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Updated By</strong></TableCell>
                    <TableCell><strong>Notes</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderHistory.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(entry.date).toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={entry.status} 
                          color={getChipColor(entry.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{entry.updatedBy}</TableCell>
                      <TableCell>{entry.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {order.items && order.items.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Product</strong></TableCell>
                    <TableCell><strong>Quantity</strong></TableCell>
                    <TableCell><strong>Unit Price</strong></TableCell>
                    <TableCell><strong>Total</strong></TableCell>
                    <TableCell><strong>Serial Numbers</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {order.items.map((item: OrderRequestItem, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>₱{item.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>₱{item.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        {item.serial_start && item.serial_end 
                          ? `${item.serial_start} - ${item.serial_end}`
                          : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} align="right" sx={{ fontWeight: 'bold' }}>Total Amount:</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>₱{order.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
              No items found for this order.
            </Typography>
          )}
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSaveStatus} 
          variant="contained" 
          color="primary"
          disabled={order.status === selectedStatus}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main component for client orders list
const ClientOrdersList: React.FC = () => {
  const [approvedOrders, setApprovedOrders] = useState<ExtendedClientOrder[]>([]);
  const [completedOrders, setCompletedOrders] = useState<ExtendedClientOrder[]>([]);
  const [rejectedOrders, setRejectedOrders] = useState<ExtendedClientOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<ExtendedClientOrder | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const allOrders = await clientOrdersService.getClientOrders();
      
      setApprovedOrders(allOrders.filter(order => order.status === 'Approved'));
      setCompletedOrders(allOrders.filter(order => order.status === 'Completed'));
      setRejectedOrders(allOrders.filter(order => order.status === 'Rejected'));
    } catch (error) {
      console.error('Error fetching orders:', error);
      setSnackbar({
        open: true,
        message: 'Failed to fetch orders',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filterOrders = (orders: ExtendedClientOrder[]) => {
    if (!searchTerm.trim()) return orders;
    
    const searchLower = searchTerm.toLowerCase();
    return orders.filter(order => {
      const orderIdMatch = order.order_id.toLowerCase().includes(searchLower);
      const clientNameMatch = order.clients?.name?.toLowerCase().includes(searchLower) || false;
      const statusMatch = order.status.toLowerCase().includes(searchLower);
      
      return orderIdMatch || clientNameMatch || statusMatch;
    });
  };

  const handleViewDetails = (order: ExtendedClientOrder) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetailsDialog = () => {
    setDetailsDialogOpen(false);
    setSelectedOrder(null);
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setLoading(true);
    try {
      console.log(`Attempting to change order ${orderId} status to ${newStatus}`);
      
      // Make the API call to change the status
      await clientOrdersService.changeOrderStatus(orderId, newStatus);
      
      // Update the local state
      const updatedOrder = { ...selectedOrder, status: newStatus } as ExtendedClientOrder;
      
      // If order is being set to "Pending", it should move back to Order Requests
      // We should remove it from our client orders view
      if (newStatus === 'Pending') {
        console.log(`Order ${orderId} moved to Pending, removing from client orders view`);
        
        // Remove the order from whatever tab it was in
        if (selectedOrder?.status === 'Approved') {
          setApprovedOrders(prev => prev.filter(o => o.id !== orderId));
        } else if (selectedOrder?.status === 'Completed') {
          setCompletedOrders(prev => prev.filter(o => o.id !== orderId));
        } else if (selectedOrder?.status === 'Rejected') {
          setRejectedOrders(prev => prev.filter(o => o.id !== orderId));
        }
        
        setSnackbar({
          open: true,
          message: 'Order moved back to Order Requests',
          severity: 'success'
        });
      } else {
        // Handle normal status changes between Client Order tabs
        console.log(`Moving order ${orderId} to ${newStatus} tab`);
        
        // Remove from current tab
        if (selectedOrder?.status === 'Approved') {
          setApprovedOrders(prev => prev.filter(o => o.id !== orderId));
        } else if (selectedOrder?.status === 'Completed') {
          setCompletedOrders(prev => prev.filter(o => o.id !== orderId));
        } else if (selectedOrder?.status === 'Rejected') {
          setRejectedOrders(prev => prev.filter(o => o.id !== orderId));
        }
        
        // Add to the appropriate tab
        if (newStatus === 'Approved') {
          setApprovedOrders(prev => [updatedOrder, ...prev]);
        } else if (newStatus === 'Completed') {
          setCompletedOrders(prev => [updatedOrder, ...prev]);
        } else if (newStatus === 'Rejected') {
          setRejectedOrders(prev => [updatedOrder, ...prev]);
        }
        
        setSnackbar({
          open: true,
          message: `Order status changed to ${newStatus}`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error changing order status:', error);
      setSnackbar({
        open: true,
        message: 'Failed to change order status. Please try again.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchOrders();
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const renderOrdersTable = (orders: ExtendedClientOrder[]) => (
    <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)', mb: 4 }}>
      <Table>
        <TableHead sx={{ backgroundColor: 'background.paper' }}>
          <TableRow>
            <TableCell><strong>Order ID</strong></TableCell>
            <TableCell><strong>Client</strong></TableCell>
            <TableCell><strong>Date</strong></TableCell>
            <TableCell><strong>Amount</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No orders found
              </TableCell>
            </TableRow>
          ) : (
            filterOrders(orders).map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.order_id}</TableCell>
                <TableCell>{order.clients?.name || `Client ${order.client_id}`}</TableCell>
                <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                <TableCell>₱{order.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                <TableCell>
                  <Chip 
                    label={order.status} 
                    color={
                      order.status === 'Approved' ? 'success' : 
                      order.status === 'Completed' ? 'info' : 
                      order.status === 'Rejected' ? 'error' : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button 
                    size="small"
                    onClick={() => handleViewDetails(order)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Client Orders
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          placeholder="Search orders..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={handleSearch}
          sx={{ width: 300, mr: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ width: '100%', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label={`Approved Orders (${approvedOrders.length})`} />
              <Tab label={`Completed Orders (${completedOrders.length})`} />
              <Tab label={`Rejected Orders (${rejectedOrders.length})`} />
            </Tabs>
          </Box>

          <TabPanel value={activeTab} index={0}>
            {renderOrdersTable(approvedOrders)}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {renderOrdersTable(completedOrders)}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {renderOrdersTable(rejectedOrders)}
          </TabPanel>
        </>
      )}

      <OrderDetailsDialog 
        open={detailsDialogOpen}
        onClose={handleCloseDetailsDialog}
        order={selectedOrder}
        onStatusChange={handleStatusChange}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ClientOrdersList;