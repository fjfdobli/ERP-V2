// src/pages/Clients/ClientsList.tsx
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
  Avatar,
  Chip
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';

const ClientsList: React.FC = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Clients
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Client
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          placeholder="Search clients..."
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
              <TableCell><strong>Client</strong></TableCell>
              <TableCell><strong>Contact Person</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Phone</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5].map((row) => (
              <TableRow key={row}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: `hsl(${row * 50}, 70%, 50%)`, mr: 2 }}>
                      {`C${row}`}
                    </Avatar>
                    <Typography variant="body2" fontWeight="medium">
                      Client {row} Company
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>Contact Person {row}</TableCell>
                <TableCell>client{row}@example.com</TableCell>
                <TableCell>+1 (555) 123-456{row}</TableCell>
                <TableCell>
                  <Chip 
                    label={row % 3 === 0 ? 'VIP' : 'Regular'} 
                    color={row % 3 === 0 ? 'secondary' : 'default'}
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

export default ClientsList;