import React, { useEffect, useState, useMemo } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, InputAdornment, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, CircularProgress, Snackbar, Alert, Grid, IconButton, SelectChangeEvent } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Client, clientsService } from '../../services/clientsService';
import { OrderRequestItem, ExtendedOrderRequest } from '../../services/orderRequestsService';
import { orderRequestsService } from '../../services/orderRequestsService';

interface Product {
  id: number;
  name: string;
  price: number;
}

const printingProducts: Product[] = [
  { id: 1, name: 'Government Forms', price: 2500 },
  { id: 2, name: 'Magazines / Manuals', price: 3500 },
  { id: 3, name: 'Souvenir Programs', price: 2800 },
  { id: 4, name: 'Receipts / Invoices', price: 1800 },
  { id: 5, name: 'Yearbooks', price: 4500 },
  { id: 6, name: 'Business Forms', price: 2000 },
  { id: 7, name: 'Brochures/Post Cards', price: 1500 },
  { id: 8, name: 'Election Handbills/Posters', price: 2200 },
  { id: 9, name: 'Letterheads', price: 1300 },
  { id: 10, name: 'Workbooks/Books', price: 3800 },
  { id: 11, name: 'Calling Cards', price: 800 },
  { id: 12, name: 'Tickets', price: 900 },
  { id: 13, name: 'News Papers', price: 2500 },
  { id: 14, name: 'Wedding Invitation', price: 1800 },
  { id: 15, name: 'Letter Envelope', price: 1200 },
  { id: 16, name: 'Labels', price: 1000 },
  { id: 17, name: 'Stickers / Boxes', price: 1400 },
  { id: 18, name: 'Memo Pads', price: 1100 },
  { id: 19, name: 'Posters', price: 1700 },
  { id: 20, name: 'Identification Cards', price: 950 },
  { id: 21, name: 'Calendars', price: 1600 }
];

interface OrderRequestFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (request: any) => void;
  clients: Client[];
  products: Product[];
  initialData?: ExtendedOrderRequest | null;
  isEdit?: boolean;
}

const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  let color: 'success' | 'info' | 'warning' | 'error' = 'info';
  
  switch (status.toLowerCase()) {
    case 'approved':
      color = 'success';
      break;
    case 'new':
      color = 'info';
      break;
    case 'pending':
      color = 'warning';
      break;
    case 'rejected':
      color = 'error';
      break;
    default:
      color = 'info';
  }
  
  return (
    <Chip 
      label={status} 
      color={color}
      size="small"
    />
  );
};

const OrderRequestForm: React.FC<OrderRequestFormProps> = ({ open, onClose, onSubmit, clients, products, initialData = null, isEdit = false }) => {
  const [clientId, setClientId] = useState<number>(initialData?.client_id || 0);
  const [items, setItems] = useState<OrderRequestItem[]>(initialData?.items || []);
  const [notes, setNotes] = useState<string>(initialData?.notes || '');
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<OrderRequestItem | null>(null);
  const [itemIndex, setItemIndex] = useState<number | null>(null);
  const [showCustomProductInput, setShowCustomProductInput] = useState<boolean>(false);
  const [customProduct, setCustomProduct] = useState<{name: string; price: number}>({
    name: '',
    price: 0
  });
  
  useEffect(() => {
    if (initialData) {
      setClientId(initialData.client_id || 0);
      setItems(initialData.items || []);
      setNotes(initialData.notes || '');
    } else {
      setClientId(0);
      setItems([]);
      setNotes('');
    }
  }, [initialData]);

  const handleClientChange = (event: SelectChangeEvent<number>) => {
    setClientId(event.target.value as number);
  };

  const handleNotesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotes(event.target.value);
  };

  const calculateTotal = (): number => {
    return items.reduce((sum, item) => sum + item.total_price, 0);
  };

  const handleAddItem = () => {
    setCurrentItem({
      product_id: 0,
      product_name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      serial_start: '',
      serial_end: ''
    });
    setItemIndex(null);
    setItemDialogOpen(true);
    setShowCustomProductInput(false);
    setCustomProduct({ name: '', price: 0 });
  };

  const handleEditItem = (item: OrderRequestItem, index: number) => {
    setCurrentItem({ ...item });
    setItemIndex(index);
    setItemDialogOpen(true);
    setShowCustomProductInput(false);
    setCustomProduct({ name: '', price: 0 });
  };

  const handleDeleteItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleCloseItemDialog = () => {
    setItemDialogOpen(false);
    setCurrentItem(null);
    setItemIndex(null);
    setShowCustomProductInput(false);
    setCustomProduct({ name: '', price: 0 });
  };

  const handleSaveItem = () => {
    if (!currentItem) return;
    
    const newItems = [...items];
    
    if (itemIndex !== null) {
      newItems[itemIndex] = currentItem;
    } else {
      newItems.push(currentItem);
    }
    
    setItems(newItems);
    handleCloseItemDialog();
  };

  const handleProductChange = (event: SelectChangeEvent<number | string>) => {
    const value = event.target.value;
    
    if (value === 'custom') {
      setShowCustomProductInput(true);
      return;
    }
    
    setShowCustomProductInput(false);
    
    const productId = value as number;
    const product = products.find(p => p.id === productId);
    
    if (!currentItem || !product) return;
    
    const unitPrice = product.price;
    const totalPrice = unitPrice * (currentItem.quantity || 1);
    
    setCurrentItem({
      ...currentItem,
      product_id: productId,
      product_name: product.name,
      unit_price: unitPrice,
      total_price: totalPrice
    });
  };

  const handleAddCustomProduct = () => {
    if (!currentItem || !customProduct.name || customProduct.price <= 0) return;
    const tempId = -Math.floor(Math.random() * 1000) - 1;
    const totalPrice = customProduct.price * (currentItem.quantity || 1);
    
    setCurrentItem({
      ...currentItem,
      product_id: tempId,
      product_name: customProduct.name,
      unit_price: customProduct.price,
      total_price: totalPrice
    });
    
    setShowCustomProductInput(false);
    setCustomProduct({ name: '', price: 0 });
  };

  const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentItem) return;
    
    const quantity = parseInt(event.target.value) || 0;
    const totalPrice = currentItem.unit_price * quantity;
    
    setCurrentItem({
      ...currentItem,
      quantity,
      total_price: totalPrice
    });
  };

  const handleSerialChange = (field: 'serial_start' | 'serial_end', value: string) => {
    if (!currentItem) return;
    
    setCurrentItem({
      ...currentItem,
      [field]: value
    });
  };

  const handleSubmit = () => {
    const requestData = {
      ...(initialData || {}),
      client_id: clientId,
      items,
      notes,
      total_amount: calculateTotal(),
      type: items.length > 0 ? items[0].product_name : 'Other',
      status: initialData?.status || 'New',
      date: initialData?.date || new Date().toISOString().split('T')[0]
    };
    
    onSubmit(requestData);
    onClose();
  };

  const isClientInactive = (clientId: number): boolean => {
    const client = clients.find(c => c.id === clientId);
    return client?.status === 'Inactive';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Order Request' : 'Create New Order Request'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3, mt: 1 }}>
          <FormControl fullWidth required>
            <InputLabel id="client-label">Client</InputLabel>
            <Select
              labelId="client-label"
              value={clientId || ''}
              onChange={handleClientChange}
              label="Client"
            >
              {clients
                .filter(client => client.status !== 'Inactive' || client.id === clientId)
                .map((client) => (
                  <MenuItem 
                    key={client.id} 
                    value={client.id}
                    disabled={client.status === 'Inactive'}
                    sx={{
                      opacity: client.status === 'Inactive' ? 0.5 : 1,
                      '&.Mui-disabled': {
                        opacity: 0.5,
                      }
                    }}
                  >
                    {client.name} {client.status === 'Inactive' ? '(Inactive)' : ''}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </Box>
        
        <Typography variant="h6" sx={{ mb: 2 }}>Request Items</Typography>
        
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell><strong>Serial</strong></TableCell>
                <TableCell><strong>Unit Price</strong></TableCell>
                <TableCell><strong>Quantity</strong></TableCell>
                <TableCell><strong>Total</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No items added
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>
                      {item.serial_start && item.serial_end 
                        ? `${item.serial_start} - ${item.serial_end}`
                        : 'start - end'}
                    </TableCell>
                    <TableCell>₱{item.unit_price.toLocaleString()}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₱{item.total_price.toLocaleString()}</TableCell>
                    <TableCell>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditItem(item, index)}
                        sx={{ mr: 1 }}
                      >
                      </IconButton>
                      <IconButton 
                        size="small"
                        onClick={() => handleDeleteItem(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
              <TableRow>
                <TableCell colSpan={4} align="right">
                  <Typography variant="subtitle1"><strong>Total:</strong></Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="subtitle1"><strong>₱{calculateTotal().toLocaleString()}</strong></Typography>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={handleAddItem}
          >
            ADD ITEM
          </Button>
        </Box>
        
        <TextField
          label="Notes"
          multiline
          rows={4}
          fullWidth
          value={notes}
          onChange={handleNotesChange}
          variant="outlined"
        />
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="primary">
          CANCEL
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={clientId === 0 || items.length === 0 || isClientInactive(clientId)}
        >
          {isEdit ? 'SAVE CHANGES' : 'CREATE'}
        </Button>
      </DialogActions>

      <Dialog open={itemDialogOpen} onClose={handleCloseItemDialog} maxWidth="md">
        <DialogTitle>
          {itemIndex !== null ? 'Edit Item' : 'Add Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Product</InputLabel>
                <Select
                  value={showCustomProductInput ? 'custom' : (currentItem?.product_id || '')}
                  onChange={handleProductChange}
                  label="Product"
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.name} - ₱{product.price.toLocaleString()}
                    </MenuItem>
                  ))}
                  <MenuItem value="custom" divider>
                    <em>Add Custom Product</em>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {showCustomProductInput && (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="Custom Product Name"
                    fullWidth
                    required
                    value={customProduct.name}
                    onChange={(e) => setCustomProduct({...customProduct, name: e.target.value})}
                    placeholder="Enter product name"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Price"
                    type="number"
                    fullWidth
                    required
                    value={customProduct.price}
                    onChange={(e) => setCustomProduct({...customProduct, price: Number(e.target.value)})}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                      inputProps: { min: 0 }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    fullWidth
                    disabled={!customProduct.name || customProduct.price <= 0}
                    onClick={handleAddCustomProduct}
                  >
                    Add This Product
                  </Button>
                </Grid>
              </>
            )}

            {!showCustomProductInput && (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="Quantity"
                    type="number"
                    fullWidth
                    required
                    value={currentItem?.quantity || ''}
                    onChange={handleQuantityChange}
                    InputProps={{
                      inputProps: { min: 1 }
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Unit Price"
                    fullWidth
                    disabled
                    value={currentItem?.unit_price ? `₱${currentItem.unit_price.toLocaleString()}` : '₱0'}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Total Price"
                    fullWidth
                    disabled
                    value={currentItem?.total_price ? `₱${currentItem.total_price.toLocaleString()}` : '₱0'}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Serial Start"
                    fullWidth
                    value={currentItem?.serial_start || ''}
                    onChange={(e) => handleSerialChange('serial_start', e.target.value)}
                    placeholder="Starting #"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Serial End"
                    fullWidth
                    value={currentItem?.serial_end || ''}
                    onChange={(e) => handleSerialChange('serial_end', e.target.value)}
                    placeholder="Ending #"
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseItemDialog}>CANCEL</Button>
          {!showCustomProductInput && (
            <Button 
              onClick={handleSaveItem} 
              variant="contained"
              disabled={!currentItem?.product_id || !currentItem?.quantity}
            >
              {itemIndex !== null ? 'UPDATE' : 'ADD'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

const OrderRequestsList: React.FC = () => {
  const [orderRequests, setOrderRequests] = useState<ExtendedOrderRequest[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products] = useState<Product[]>(printingProducts);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<ExtendedOrderRequest | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  const clientsWithOrders = useMemo(() => {
    const clientIds = new Set<number>();
    orderRequests.forEach(request => {
      if (request.client_id > 0) { 
        clientIds.add(request.client_id);
      }
    });
    return clientIds;
  }, [orderRequests]);
  
  const availableClients = useMemo(() => {
    return clients.filter(client => !clientsWithOrders.has(client.id));
  }, [clients, clientsWithOrders]);

  const isClientInactive = (clientId: number): boolean => {
    const client = clients.find(c => c.id === clientId);
    return client?.status === 'Inactive';
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [requestsData, fetchedClients] = await Promise.allSettled([
          orderRequestsService.getOrderRequests(),
          clientsService.getClients()
        ]);
        
        if (requestsData.status === 'fulfilled' && requestsData.value) {
          const extendedRequests: ExtendedOrderRequest[] = requestsData.value.map(req => ({
            ...req,
            items: req.items || [],
            notes: req.notes || ''
          }));
          
          setOrderRequests(extendedRequests);
        } else {
          console.error('Error fetching order requests:', requestsData.status === 'rejected' ? requestsData.reason : 'No data returned');
          setOrderRequests([]);
        }

        if (fetchedClients.status === 'fulfilled' && fetchedClients.value) {
          setClients(fetchedClients.value);
        } else {
          console.error('Error fetching clients:', fetchedClients.status === 'rejected' ? fetchedClients.reason : 'No data returned');
          setClients([]);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setOrderRequests([]);
        setClients([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);  

  const filteredRequests = orderRequests.filter(request => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const requestIdMatch = request.request_id.toLowerCase().includes(searchLower);
    const client = clients.find(c => c.id === request.client_id);
    const clientNameMatch = client ? client.name.toLowerCase().includes(searchLower) : false;
    const typeMatch = request.type.toLowerCase().includes(searchLower);
    const statusMatch = request.status.toLowerCase().includes(searchLower);
    
    return requestIdMatch || clientNameMatch || typeMatch || statusMatch;
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenCreateForm = async () => {
    try {
      setIsLoading(true);

      const activeAvailableClients = availableClients.filter(client => client.status !== 'Inactive');

      if (activeAvailableClients.length === 0) {
        setSnackbarMessage('All active clients already have orders. Please add new clients or activate existing ones to create more orders.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
      
      const newRequestId = await orderRequestsService.generateRequestId();
      
      setCurrentRequest({
        id: 0,
        request_id: newRequestId,
        client_id: activeAvailableClients.length > 0 ? activeAvailableClients[0].id : 0,
        date: new Date().toISOString().split('T')[0],
        type: '',
        status: 'New',
        created_at: new Date().toISOString(),
        items: [],
        notes: ''
      });
      setFormOpen(true);
    } catch (error) {
      console.error('Error generating request ID:', error);
      setSnackbarMessage('Error generating request ID');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditForm = async (request: ExtendedOrderRequest) => {
    if (isClientInactive(request.client_id)) {
      setSnackbarMessage('Cannot edit order for inactive client');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    try {
      setIsLoading(true);
      const requestWithItems = await orderRequestsService.getOrderRequestById(request.id);
      
      if (requestWithItems) {
        setCurrentRequest({
          ...requestWithItems,
          notes: requestWithItems.notes || ''
        });
      } else {
        setCurrentRequest({
          ...request,
          items: request.items || [],
          notes: request.notes || ''
        });
      }
      
      setFormOpen(true);
    } catch (error) {
      console.error('Error fetching order items:', error);
      setCurrentRequest({
        ...request,
        items: request.items || [],
        notes: request.notes || ''
      });
      setFormOpen(true);
      
      setSnackbarMessage('Warning: Some order data may not be complete');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const isEdit = !!currentRequest?.id;

  const handleCloseForm = () => {
    setFormOpen(false);
    setCurrentRequest(null);
  };

  const handleOpenStatusDialog = (requestId: number) => {
    const request = orderRequests.find(r => r.id === requestId);
    if (request && isClientInactive(request.client_id)) {
      setSnackbarMessage('Cannot change status for order with inactive client');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    setSelectedRequestId(requestId);
    setStatusDialogOpen(true);
  };

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedRequestId(null);
  };

  const handleChangeStatus = async (status: string) => {
    if (selectedRequestId) {
      try {
        setIsLoading(true);
        await orderRequestsService.changeRequestStatus(selectedRequestId, status);
        
        setOrderRequests(prev => 
          prev.map(req => 
            req.id === selectedRequestId ? { ...req, status } : req
          )
        );
        
        setSnackbarMessage(`Request status updated to ${status}`);
        setSnackbarSeverity('success');
      } catch (error) {
        console.error('Error updating status:', error);
        setSnackbarMessage('Error updating request status');
        setSnackbarSeverity('error');
      } finally {
        setIsLoading(false);
        setSnackbarOpen(true);
        handleCloseStatusDialog();
      }
    }
  };

  const handleSubmitRequest = async (requestData: any) => {
    try {
      setIsLoading(true);
      
      const { client_id, items, notes, date, type, status } = requestData;

      if (isClientInactive(client_id)) {
        throw new Error('Cannot create or update order for inactive client');
      }
      
      if (currentRequest && currentRequest.id) {
        try {
          const updatedRequest = await orderRequestsService.updateOrderRequestWithItems(
            currentRequest.id,
            { client_id, date, type, status, notes },
            items
          );
          
          setOrderRequests(prev => 
            prev.map(req => 
              req.id === currentRequest.id ? updatedRequest : req
            )
          );
          
          setSnackbarMessage('Request updated successfully');
          setSnackbarSeverity('success');
        } catch (updateError) {
          console.error('Error updating request:', updateError);
          throw new Error('Failed to update request. Please try again.');
        }
      } else {
        try {
          const newRequestId = await orderRequestsService.generateRequestId();
          
          const createdRequest = await orderRequestsService.createOrderRequestWithItems(
            {
              request_id: newRequestId,
              client_id,
              date,
              type,
              status: 'New',
              notes
            },
            items
          );
          
          setOrderRequests(prev => [createdRequest, ...prev]);
          setSnackbarMessage('Request created successfully');
          setSnackbarSeverity('success');
        } catch (createError) {
          console.error('Error creating request:', createError);
          throw new Error('Failed to create request. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      setSnackbarMessage(error instanceof Error ? error.message : 'Error submitting request');
      setSnackbarSeverity('error');
    } finally {
      setIsLoading(false);
      setSnackbarOpen(true);
      handleCloseForm();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    handleChangeStatus(event.target.value);
  };

  const getClientName = (clientId: number): string => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : `Client ID: ${clientId}`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Order Requests
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenCreateForm}
          disabled={isLoading}
        >
          New Request
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          placeholder="Search requests..."
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

      {isLoading && orderRequests.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'background.paper' }}>
              <TableRow>
                <TableCell><strong>Request ID</strong></TableCell>
                <TableCell><strong>Client</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Items</strong></TableCell>
                <TableCell><strong>Total</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No requests found
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => {
                  const totalAmount = request.total_amount || (request.items 
                    ? request.items.reduce((sum, item) => sum + item.total_price, 0)
                    : 0);
                    
                  return (
                    <TableRow 
                      key={request.id} 
                      sx={{
                        opacity: isClientInactive(request.client_id) ? 0.5 : 1,
                        backgroundColor: isClientInactive(request.client_id) ? 'rgba(0, 0, 0, 0.05)' : 'inherit',
                        '&:hover': {
                          cursor: isClientInactive(request.client_id) ? 'not-allowed' : 'pointer',
                          backgroundColor: isClientInactive(request.client_id) ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.04)'
                        }
                      }}
                    >
                      <TableCell>{request.request_id}</TableCell>
                      <TableCell>
                        {getClientName(request.client_id)}
                        {isClientInactive(request.client_id) && (
                          <Chip 
                            label="Inactive" 
                            size="small" 
                            color="default" 
                            sx={{ ml: 1, fontSize: '0.7rem' }} 
                          />
                        )}
                      </TableCell>
                      <TableCell>{new Date(request.date).toLocaleDateString()}</TableCell>
                      <TableCell>{request.items ? request.items.length : 0} items</TableCell>
                      <TableCell>₱{totalAmount.toLocaleString()}</TableCell>
                      <TableCell>
                        <StatusChip status={request.status} />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small"
                          onClick={() => handleOpenEditForm(request)}
                          sx={{ mr: 1 }}
                          disabled={isClientInactive(request.client_id)}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small"
                          onClick={() => handleOpenStatusDialog(request.id)}
                          disabled={isClientInactive(request.client_id)}
                        >
                          Change Status
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {formOpen && (
        <OrderRequestForm
          open={formOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmitRequest}
          clients={isEdit ? clients : availableClients.filter(client => client.status !== 'Inactive')}
          products={products}
          initialData={currentRequest}
          isEdit={isEdit}
        />
      )}

      <Dialog open={statusDialogOpen} onClose={handleCloseStatusDialog}>
        <DialogTitle>Change Request Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={orderRequests.find(r => r.id === selectedRequestId)?.status || ''}
              label="Status"
              onChange={handleStatusChange}
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OrderRequestsList;