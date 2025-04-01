import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, InputAdornment, Chip, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Grid, Divider } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { fetchInventory, updateInventoryItem, addInventoryTransaction, createInventoryItem } from '../redux/slices/inventorySlice';

// Use your project's actual types
interface InventoryItem {
  id: string;
  itemName: string;
  sku?: string;
  itemType: string;
  quantity: number;
  minStockLevel: number;
}

// Mock types for suppliers and employees
interface SupplierType {
  id: string;
  name: string;
}

interface EmployeeType {
  id: string;
  name: string;
}

// Item types for a printing press
const itemTypes = [
  { id: 'paper', name: 'Paper' },
  { id: 'ink', name: 'Ink' },
  { id: 'plate', name: 'Printing Plate' },
  { id: 'chemical', name: 'Chemical' },
  { id: 'binding', name: 'Binding Material' },
  { id: 'spare', name: 'Spare Part' },
  { id: 'other', name: 'Other' }
];

const InventoryList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { inventoryItems, isLoading } = useAppSelector((state) => state.inventory);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [quantityDialogOpen, setQuantityDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState(1);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // State for new item form
  const [newItem, setNewItem] = useState({
    itemName: '',
    sku: '',
    itemType: '',
    quantity: 0,
    minStockLevel: 0,
    unitPrice: 0,
    supplierId: ''
  });

  // Mock data since we don't have these in Redux yet
  const mockSuppliers: SupplierType[] = [
    { id: '1', name: 'Paper Supplies Co.' },
    { id: '2', name: 'Ink Masters Ltd.' },
    { id: '3', name: 'Print Materials Inc.' }
  ];

  const mockEmployees: EmployeeType[] = [
    { id: '1', name: 'John Smith' },
    { id: '2', name: 'Maria Garcia' },
    { id: '3', name: 'Alex Johnson' }
  ];

  useEffect(() => {
    dispatch(fetchInventory());
  }, [dispatch]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredItems = inventoryItems.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.itemType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenQuantityDialog = (item: InventoryItem, type: 'add' | 'remove') => {
    setSelectedItem(item);
    setAdjustmentType(type);
    setAdjustmentAmount(1);
    
    // Set default selections for supplier or employee
    if (type === 'add' && mockSuppliers.length > 0) {
      setSelectedSupplierId(mockSuppliers[0].id);
    } else if (type === 'remove' && mockEmployees.length > 0) {
      setSelectedEmployeeId(mockEmployees[0].id);
    }
    
    setQuantityDialogOpen(true);
  };

  const handleCloseQuantityDialog = () => {
    setQuantityDialogOpen(false);
    setSelectedItem(null);
    setSelectedSupplierId('');
    setSelectedEmployeeId('');
  };

  const handleOpenAddItemDialog = () => {
    setAddItemDialogOpen(true);
    // Set default supplier if available
    if (mockSuppliers.length > 0) {
      setNewItem(prev => ({ ...prev, supplierId: mockSuppliers[0].id }));
    }
  };

  const handleCloseAddItemDialog = () => {
    setAddItemDialogOpen(false);
    // Reset form
    setNewItem({
      itemName: '',
      sku: '',
      itemType: '',
      quantity: 0,
      minStockLevel: 0,
      unitPrice: 0,
      supplierId: ''
    });
  };

  const handleAdjustmentAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 1) {
      setAdjustmentAmount(value);
    }
  };

  const handleSupplierChange = (event: SelectChangeEvent<string>) => {
    setSelectedSupplierId(event.target.value);
  };

  const handleEmployeeChange = (event: SelectChangeEvent<string>) => {
    setSelectedEmployeeId(event.target.value);
  };

  const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleNewItemNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setNewItem(prev => ({ ...prev, [name]: numValue }));
    }
  };

  const handleNewItemSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveNewItem = async () => {
    try {
      // Check required fields
      if (!newItem.itemName || !newItem.sku || !newItem.itemType) {
        setSnackbarMessage('Please fill in all required fields');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      // Convert to your InventoryItem format
      await dispatch(createInventoryItem({
        itemName: newItem.itemName,
        sku: newItem.sku,
        itemType: newItem.itemType,
        quantity: newItem.quantity,
        minStockLevel: newItem.minStockLevel,
        unitPrice: newItem.unitPrice
        // Add other fields as needed by your API
      })).unwrap();

      setSnackbarMessage('Inventory item created successfully');
      setSnackbarSeverity('success');
      handleCloseAddItemDialog();
    } catch (error) {
      console.error('Error creating inventory item:', error);
      setSnackbarMessage('Error creating inventory item');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleAdjustQuantity = async () => {
    if (!selectedItem) return;

    try {
      const newQuantity = adjustmentType === 'add' 
        ? selectedItem.quantity + adjustmentAmount
        : Math.max(0, selectedItem.quantity - adjustmentAmount);

      // Selected person based on transaction type
      const personId = adjustmentType === 'add' ? selectedSupplierId : selectedEmployeeId;
      // Removed unused variable 'personName'

      // First, update the item quantity
      await dispatch(updateInventoryItem({
        id: selectedItem.id,
        data: { quantity: newQuantity }
      })).unwrap();

      // Then add a transaction record - adjust according to your actual transaction type
      await dispatch(addInventoryTransaction({
        inventoryId: selectedItem.id,
        transactionData: {
          transactionType: adjustmentType === 'add' ? 'stock_in' : 'stock_out',
          quantity: adjustmentAmount,
          createdBy: personId,
          // If your transaction object doesn't have notes, you can handle this differently
          // e.g., store the person info in another way or skip it for now
          // Removed notes field to fix TypeScript error
        }
      })).unwrap();

      setSnackbarMessage(`Successfully ${adjustmentType === 'add' ? 'added' : 'removed'} ${adjustmentAmount} ${selectedItem.itemName}`);
      setSnackbarSeverity('success');
    } catch (error) {
      console.error('Error adjusting inventory:', error);
      setSnackbarMessage(`Error ${adjustmentType === 'add' ? 'adding' : 'removing'} inventory: ${error}`);
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
      handleCloseQuantityDialog();
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Inventory
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenAddItemDialog}
        >
          Add Item
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          placeholder="Search inventory..."
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
        <Button variant="outlined" color="error" sx={{ mr: 1 }}>Low Stock</Button>
      </Box>

      {isLoading && inventoryItems.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'background.paper' }}>
              <TableRow>
                <TableCell><strong>Item Name</strong></TableCell>
                <TableCell><strong>SKU</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell><strong>Quantity</strong></TableCell>
                <TableCell><strong>Min Stock</strong></TableCell>
                <TableCell><strong>Current Stock</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => {
                  const quantity = item.quantity;
                  const minStock = item.minStockLevel;
                  const stockLevel = Math.min((quantity / Math.max(minStock, 1)) * 100, 100); // Capped at 100%
                  const isLowStock = quantity < minStock;
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{item.itemName}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>{item.itemType}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: 100, mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={stockLevel} 
                              color={isLowStock ? "error" : "primary"} 
                            />
                          </Box>
                          <Typography>
                            {quantity}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{minStock}</TableCell>
                      <TableCell>{quantity}</TableCell>
                      <TableCell>
                        <Chip 
                          label={isLowStock ? 'Low Stock' : 'In Stock'} 
                          color={isLowStock ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="small" 
                          variant="outlined"
                          color="primary"
                          onClick={() => handleOpenQuantityDialog(item, 'add')}
                          sx={{ mr: 1 }}
                        >
                          Stock In
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined"
                          color="error"
                          onClick={() => handleOpenQuantityDialog(item, 'remove')}
                          disabled={quantity <= 0}
                        >
                          Stock Out
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

      {/* Quantity Adjustment Dialog */}
      <Dialog open={quantityDialogOpen} onClose={handleCloseQuantityDialog}>
        <DialogTitle>
          {adjustmentType === 'add' ? 'Stock In' : 'Stock Out'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, minWidth: 350 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedItem?.itemName} (Current: {selectedItem?.quantity})
            </Typography>
            
            <TextField
              label="Quantity"
              type="number"
              fullWidth
              value={adjustmentAmount}
              onChange={handleAdjustmentAmountChange}
              margin="normal"
              InputProps={{
                inputProps: { min: 1 }
              }}
              autoFocus
            />
            
            {adjustmentType === 'add' ? (
              <FormControl fullWidth margin="normal">
                <InputLabel id="supplier-select-label">Supplier</InputLabel>
                <Select
                  labelId="supplier-select-label"
                  value={selectedSupplierId}
                  label="Supplier"
                  onChange={handleSupplierChange}
                >
                  {mockSuppliers.map((supplier) => (
                    <MenuItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <FormControl fullWidth margin="normal">
                <InputLabel id="employee-select-label">Employee</InputLabel>
                <Select
                  labelId="employee-select-label"
                  value={selectedEmployeeId}
                  label="Employee"
                  onChange={handleEmployeeChange}
                >
                  {mockEmployees.map((employee) => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            
            {adjustmentType === 'remove' && selectedItem && adjustmentAmount > selectedItem.quantity && (
              <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
                Warning: This will reduce inventory below zero.
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQuantityDialog}>Cancel</Button>
          <Button 
            onClick={handleAdjustQuantity} 
            color="primary" 
            variant="contained"
            disabled={
              adjustmentAmount <= 0 || 
              (adjustmentType === 'add' && !selectedSupplierId) || 
              (adjustmentType === 'remove' && !selectedEmployeeId)
            }
          >
            {adjustmentType === 'add' ? 'Stock In' : 'Stock Out'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add New Item Dialog */}
      <Dialog open={addItemDialogOpen} onClose={handleCloseAddItemDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Inventory Item</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Basic Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="itemName"
                  label="Item Name *"
                  value={newItem.itemName}
                  onChange={handleNewItemChange}
                  fullWidth
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="sku"
                  label="SKU *"
                  value={newItem.sku}
                  onChange={handleNewItemChange}
                  fullWidth
                  required
                  helperText="Unique identifier for this item"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel id="item-type-label">Item Type</InputLabel>
                  <Select
                    labelId="item-type-label"
                    name="itemType"
                    value={newItem.itemType}
                    label="Item Type *"
                    onChange={handleNewItemSelectChange}
                  >
                    {itemTypes.map(type => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="supplier-label">Supplier</InputLabel>
                  <Select
                    labelId="supplier-label"
                    name="supplierId"
                    value={newItem.supplierId}
                    label="Supplier"
                    onChange={handleNewItemSelectChange}
                  >
                    {mockSuppliers.map(supplier => (
                      <MenuItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Stock Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="quantity"
                  label="Initial Quantity"
                  type="number"
                  value={newItem.quantity}
                  onChange={handleNewItemNumberChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="minStockLevel"
                  label="Minimum Stock Level"
                  type="number"
                  value={newItem.minStockLevel}
                  onChange={handleNewItemNumberChange}
                  fullWidth
                  InputProps={{
                    inputProps: { min: 0 }
                  }}
                  helperText="Alert when below this level"
                />
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  name="unitPrice"
                  label="Unit Price"
                  type="number"
                  value={newItem.unitPrice}
                  onChange={handleNewItemNumberChange}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                    inputProps: { min: 0, step: 0.01 }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseAddItemDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveNewItem} 
            variant="contained" 
            color="primary"
            disabled={!newItem.itemName || !newItem.sku || !newItem.itemType}
          >
            Save Item
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
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

export default InventoryList;