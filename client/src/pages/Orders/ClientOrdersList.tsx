// src/pages/Orders/ClientOrdersList.tsx
import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  TextField,
  InputAdornment,
  Chip
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';

const ClientOrdersList: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Client Orders
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Order
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          placeholder="Search orders..."
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
        <Button variant="outlined">Export</Button>
      </Box>

      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
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
            {[1, 2, 3, 4, 5].map((row) => (
              <TableRow key={row}>
                <TableCell>ORD-2025-0000{row}</TableCell>
                <TableCell>Client {row}</TableCell>
                <TableCell>2025-03-{10 + row}</TableCell>
                <TableCell>${(100 * row).toFixed(2)}</TableCell>
                <TableCell>
                  <Chip 
                    label={row % 3 === 0 ? 'Completed' : row % 2 === 0 ? 'In Progress' : 'Pending'} 
                    color={row % 3 === 0 ? 'success' : row % 2 === 0 ? 'info' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button size="small">View</Button>
                  <Button size="small">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ClientOrdersList;