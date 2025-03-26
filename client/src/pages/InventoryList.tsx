import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, InputAdornment, Chip, LinearProgress } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';

const InventoryList: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Inventory
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Item
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          placeholder="Search inventory..."
          variant="outlined"
          size="small"
          sx={{ width: 300, mr: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="outlined" sx={{ mr: 1 }}>Filter</Button>
        <Button variant="outlined" color="error" sx={{ mr: 1 }}>Low Stock</Button>
        <Button variant="outlined">Export</Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <Table>
          <TableHead sx={{ backgroundColor: 'background.paper' }}>
            <TableRow>
              <TableCell><strong>Item Name</strong></TableCell>
              <TableCell><strong>SKU</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Quantity</strong></TableCell>
              <TableCell><strong>Min Stock</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5].map((row) => {
              const quantity = row === 2 ? 5 : row === 4 ? 8 : row * 20;
              const minStock = 10;
              const stockLevel = (quantity / 100) * 100;
              const isLowStock = quantity < minStock;
              
              return (
                <TableRow key={row}>
                  <TableCell>Item {row}</TableCell>
                  <TableCell>SKU-00{row}</TableCell>
                  <TableCell>{row % 2 === 0 ? 'Paper' : 'Ink'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ width: 100, mr: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={stockLevel} 
                          color={isLowStock ? "error" : "primary"} 
                        />
                      </Box>
                      {quantity}
                    </Box>
                  </TableCell>
                  <TableCell>{minStock}</TableCell>
                  <TableCell>
                    <Chip 
                      label={isLowStock ? 'Low Stock' : 'In Stock'} 
                      color={isLowStock ? 'error' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button size="small">View</Button>
                    <Button size="small">Restock</Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default InventoryList;