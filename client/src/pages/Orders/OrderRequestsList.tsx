import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, InputAdornment, Chip } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';

const OrderRequestsList: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Order Requests
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          New Request
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          placeholder="Search requests..."
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
              <TableCell><strong>Request ID</strong></TableCell>
              <TableCell><strong>Client</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Type</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5].map((row) => (
              <TableRow key={row}>
                <TableCell>REQ-2025-0000{row}</TableCell>
                <TableCell>Client {row}</TableCell>
                <TableCell>2025-03-{10 + row}</TableCell>
                <TableCell>{row % 2 === 0 ? 'Printing' : 'Design'}</TableCell>
                <TableCell>
                  <Chip 
                    label={row % 3 === 0 ? 'Approved' : row % 2 === 0 ? 'Pending' : 'New'} 
                    color={row % 3 === 0 ? 'success' : row % 2 === 0 ? 'warning' : 'info'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button size="small">Review</Button>
                  <Button size="small">Approve</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OrderRequestsList;