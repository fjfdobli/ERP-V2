import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, InputAdornment, Avatar, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, Grid, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert, SelectChangeEvent, Divider, FormControlLabel, Checkbox, Tab, Tabs } from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Business, Person, Payments, Info, Refresh as RefreshIcon } from '@mui/icons-material';
import { clientsService, Client, InsertClient } from '../../services/clientsService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { supabase } from '../../supabaseClient';

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
      id={`client-tabpanel-${index}`}
      aria-labelledby={`client-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('clients').select('count');
    
    if (error) {
      console.error('Supabase connection error:', error);
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      message: 'Connected to Supabase successfully',
      data 
    };
  } catch (err) {
    const error = err as Error;
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

const validateClientsTable = async () => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error validating clients table:', error);
      return { 
        success: false, 
        error: error.message,
        suggestion: 'Make sure the clients table exists and has the correct permissions'
      };
    }
    
    if (data && data.length > 0) {
      console.log('Table structure sample:', Object.keys(data[0]));
      const requiredFields = ['id', 'name', 'contactPerson', 'email', 'phone', 'status'];
      const missingFields = requiredFields.filter(field => !Object.keys(data[0]).includes(field));
      
      if (missingFields.length > 0) {
        return {
          success: false,
          message: 'Table exists but is missing required fields',
          missingFields
        };
      }
      
      return {
        success: true,
        message: 'Clients table exists and has the correct structure',
        sampleData: data[0]
      };
    }
    
    return {
      success: true,
      message: 'Clients table exists but contains no data'
    };
  } catch (err) {
    const error = err as Error;
    console.error('Unexpected error:', error);
    return { success: false, error: error.message };
  }
};

interface ClientFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: string;
  businessType: string;
  taxId: string;
  industry: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  alternatePhone: string;
  billingAddressSame: boolean;
  billing_address_line1: string;
  billing_address_line2: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  paymentTerms: string;
  creditLimit: number;
  taxExempt: boolean;
  specialRequirements: string;
  acquisition_date: Date | null;
  notes: string;
  createdAt?: string;
}

const ClientsList: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    status: 'Regular',
    businessType: 'Company',
    taxId: '',
    industry: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    alternatePhone: '',
    billingAddressSame: true,
    billing_address_line1: '',
    billing_address_line2: '',
    billing_city: '',
    billing_state: '',
    billing_postal_code: '',
    paymentTerms: '30 Days Term',
    creditLimit: 5000,
    taxExempt: false,
    specialRequirements: '',
    acquisition_date: new Date(),
    notes: ''
  });

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const businessTypes = ['Company', 'Organization', 'Government', 'Educational', 'Individual', 'Other'];
  const industries = ['Publishing', 'Marketing', 'Advertising', 'Education', 'Government', 'Retail', 'Healthcare', 'Financial', 'Technology', 'Manufacturing', 'Nonprofit', 'Other'];
  const paymentTerms = [
    'Cash on Delivery (COD)',
    'Cash Before Delivery (CBD)',
    '7 Days PDC',
    '15 Days PDC',
    '30 Days PDC',
    'Cash on Pickup (COP)',
    '50% DP, 50% on Delivery',
    '30% DP, 70% on Delivery',
    'Cash Terms',
    '7 Days Term',
    '15 Days Term',
    '30 Days Term',
    'GCash/Digital Payment',
    'Credit Card',
    'Monthly Direct Debit'
  ];

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const troubleshootDataIssue = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Troubleshooting data issue...');
      
      // Check direct database connection
      const { data: directData, error: directError } = await supabase
        .from('clients')
        .select('*');
        
      if (directError) {
        console.error('Direct database query error:', directError);
        showSnackbar('Database connection error', 'error');
        return;
      }
      
      console.log('Direct database query results:', directData);
      
      if (!directData || directData.length === 0) {
        console.log('No data found in direct database query');
        showSnackbar('No clients found in the database', 'error');
      } else {
        console.log(`Found ${directData.length} records directly in database`);
        
        // Check if service layer is failing
        try {
          const serviceData = await clientsService.getClients();
          console.log('Service layer returned:', serviceData);
          
          if (!serviceData || serviceData.length === 0) {
            console.log('Service layer returned empty results despite data in database');
            showSnackbar('Service layer issue - check console logs', 'error');
          } else {
            setClients(serviceData);
            showSnackbar(`Successfully loaded ${serviceData.length} clients`, 'success');
          }
        } catch (serviceError) {
          console.error('Service layer error:', serviceError);
          showSnackbar('Error in service layer', 'error');
        }
      }
    } catch (error) {
      console.error('Troubleshooting failed:', error);
      showSnackbar('Troubleshooting failed', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching clients...');
      const data = await clientsService.getClients();
      console.log('Fetched clients data:', data);
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showSnackbar('Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const connectionTest = await testSupabaseConnection();
        console.log('Connection test result:', connectionTest);
        
        const tableValidation = await validateClientsTable();
        console.log('Table validation result:', tableValidation);
        
        if (!connectionTest.success) {
          showSnackbar('Failed to connect to the database: ' + connectionTest.error, 'error');
        } else if (!tableValidation.success) {
          showSnackbar('Database table issue: ' + (tableValidation.error || tableValidation.message), 'error');
        }
      } catch (error) {
        console.error('Test error:', error);
        showSnackbar('Connection test failed', 'error');
      }
    };
    
    testConnection();
  }, [showSnackbar]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchClients();
      return;
    }
    
    setLoading(true);
    try {
      const data = await clientsService.searchClients(searchQuery);
      setClients(data);
    } catch (error) {
      console.error('Error searching clients:', error);
      showSnackbar('Search failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setSelectedClient(client);
      setFormData({
        name: client.name,
        contactPerson: client.contactPerson,
        email: client.email,
        phone: client.phone,
        status: client.status || 'Regular',
        createdAt: client.createdAt,
        businessType: client.businessType || 'Company',
        taxId: client.taxId || '',
        industry: client.industry || '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        alternatePhone: client.alternatePhone || '',
        billingAddressSame: client.billingAddressSame !== false,
        billing_address_line1: '',
        billing_address_line2: '',
        billing_city: '',
        billing_state: '',
        billing_postal_code: '',
        paymentTerms: client.paymentTerms || '30 Days Term',
        creditLimit: client.creditLimit || 5000,
        taxExempt: client.taxExempt || false,
        specialRequirements: client.specialRequirements || '',
        acquisition_date: client.clientSince ? new Date(client.clientSince) : new Date(),
        notes: client.notes || ''
      });
    } else {
      setSelectedClient(null);
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        status: 'Regular',
        businessType: 'Company',
        taxId: '',
        industry: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        alternatePhone: '',
        billingAddressSame: true,
        billing_address_line1: '',
        billing_address_line2: '',
        billing_city: '',
        billing_state: '',
        billing_postal_code: '',
        paymentTerms: '30 Days Term',
        creditLimit: 5000,
        taxExempt: false,
        specialRequirements: '',
        acquisition_date: new Date(),
        notes: ''
      });
    }
    setOpenDialog(true);
    setTabValue(0);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
    
    if (name === 'billingAddressSame' && checked) {
      setFormData(prev => ({
        ...prev,
        billing_address_line1: prev.address_line1 || '',
        billing_address_line2: prev.address_line2 || '',
        billing_city: prev.city || '',
        billing_state: prev.state || '',
        billing_postal_code: prev.postal_code || ''
      }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      acquisition_date: date
    }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.contactPerson) {
      showSnackbar('Client name and contact person are required', 'error');
      return;
    }

    setLoading(true);
    try {
      const formattedAddress = formData.address_line1 ? 
        [
          formData.address_line1,
          formData.address_line2,
          formData.city,
          formData.state,
          formData.postal_code
        ].filter(Boolean).join(', ') : null;
      
      const formattedBillingAddress = !formData.billingAddressSame && formData.billing_address_line1 ? 
        [
          formData.billing_address_line1,
          formData.billing_address_line2,
          formData.billing_city,
          formData.billing_state,
          formData.billing_postal_code
        ].filter(Boolean).join(', ') : null;

      let clientSince: string | undefined = undefined;
      if (formData.acquisition_date) {
        clientSince = formData.acquisition_date.toISOString().split('T')[0]; 
      }
      
      const clientData: InsertClient = {
        name: formData.name,
        contactPerson: formData.contactPerson,
        email: formData.email || '',
        phone: formData.phone || '',
        status: formData.status,
        address: formattedAddress,
        notes: formData.notes || '',
        businessType: formData.businessType || 'Company',
        industry: formData.industry || '',
        taxId: formData.taxId || '',
        clientSince: clientSince,
        alternatePhone: formData.alternatePhone || '',
        billingAddressSame: formData.billingAddressSame,
        billingAddress: formattedBillingAddress,
        paymentTerms: formData.paymentTerms || '30 Days Term',
        creditLimit: Number(formData.creditLimit) || 5000,
        taxExempt: Boolean(formData.taxExempt),
        specialRequirements: formData.specialRequirements || ''
      };

      console.log('Submitting client data:', clientData);

      let result;
      if (selectedClient && selectedClient.id) {
        console.log('Updating client with ID:', selectedClient.id, 'Type:', typeof selectedClient.id);
        const clientId = typeof selectedClient.id === 'string' 
          ? parseInt(selectedClient.id, 10) 
          : selectedClient.id;
          
        result = await clientsService.updateClient(clientId, clientData);
        console.log('Updated client result:', result);
        showSnackbar('Client updated successfully', 'success');
      } else {
        result = await clientsService.createClient(clientData);
        console.log('Created client result:', result);
        showSnackbar('Client created successfully', 'success');
      }
      
      await fetchClients();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving client:', error);
      showSnackbar('Failed to save client: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 50%)`;
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Clients
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Client
        </Button>
      </Box>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <TextField
          placeholder="Search clients..."
          variant="outlined"
          size="small"
          sx={{ width: 300, mr: 2 }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button 
          variant="outlined" 
          sx={{ mr: 1 }}
          onClick={handleSearch}
        >
          Filter
        </Button>
        <Button 
          variant="outlined"
          sx={{ mr: 1 }}
        >
          Export
        </Button>
        <Button 
          variant="outlined"
          color="secondary"
          startIcon={<RefreshIcon />}
          onClick={troubleshootDataIssue}
        >
          Refresh Data
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
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
              {clients.length > 0 ? (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: getAvatarColor(client.name), mr: 2 }}>
                          {getInitials(client.name)}
                        </Avatar>
                        <Typography variant="body2" fontWeight="medium">
                          {client.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{client.contactPerson}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>
                      <Chip 
                        label={client.status} 
                        color={client.status === '' ? 'secondary' : (client.status === 'New' ? 'primary' : 'default')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small">View</Button>
                      <Button size="small">Edit</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No clients found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {selectedClient ? `Edit Client: ${selectedClient.name}` : 'Add New Client'}
        </DialogTitle>
        <Divider />
        
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="client form tabs" centered>
          <Tab icon={<Business />} label="Business Info" />
          <Tab icon={<Person />} label="Contact Details" />
          <Tab icon={<Payments />} label="Billing & Payment" />
          <Tab icon={<Info />} label="Additional Info" />
        </Tabs>
        
        <DialogContent>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Basic Business Information
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="name"
                  label="Business/Organization Name"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="business-type-label">Business Type</InputLabel>
                  <Select
                    labelId="business-type-label"
                    name="businessType"
                    value={formData.businessType}
                    label="Business Type"
                    onChange={handleSelectChange}
                  >
                    {businessTypes.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="taxId"
                  label="TIN"
                  fullWidth
                  value={formData.taxId}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="industry-label">Industry</InputLabel>
                  <Select
                    labelId="industry-label"
                    name="industry"
                    value={formData.industry}
                    label="Industry"
                    onChange={handleSelectChange}
                  >
                    {industries.map((industry) => (
                      <MenuItem key={industry} value={industry}>{industry}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="status-label">Client Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status}
                    label="Client Status"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="Regular">Regular</MenuItem>
                    <MenuItem value="New">New</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Client Since"
                    value={formData.acquisition_date}
                    onChange={handleDateChange}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Primary Contact
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="contactPerson"
                  label="Contact Person Name"
                  fullWidth
                  required
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="email"
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="phone"
                  label="Phone Number"
                  fullWidth
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="alternatePhone"
                  label="Alternate Phone"
                  fullWidth
                  value={formData.alternatePhone}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Address
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="address_line1"
                  label="Address Line 1"
                  fullWidth
                  value={formData.address_line1}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  name="address_line2"
                  label="Address Line 2"
                  fullWidth
                  value={formData.address_line2}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="city"
                  label="City"
                  fullWidth
                  value={formData.city}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="state"
                  label="State/Province"
                  fullWidth
                  value={formData.state}
                  onChange={handleInputChange}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  name="postal_code"
                  label="Postal Code"
                  fullWidth
                  value={formData.postal_code}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Billing Information
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.billingAddressSame}
                      onChange={handleCheckboxChange}
                      name="billingAddressSame"
                      color="primary"
                    />
                  }
                  label="Billing address same as business address"
                />
              </Grid>
              
              {!formData.billingAddressSame && (
                <>
                  <Grid item xs={12}>
                    <TextField
                      name="billing_address_line1"
                      label="Billing Address Line 1"
                      fullWidth
                      value={formData.billing_address_line1}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      name="billing_address_line2"
                      label="Billing Address Line 2"
                      fullWidth
                      value={formData.billing_address_line2}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="billing_city"
                      label="City"
                      fullWidth
                      value={formData.billing_city}
                      onChange={handleInputChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      name="billing_state"
                      label="State/Province"
                      fullWidth
                      value={formData.billing_state}
                      onChange={handleInputChange}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                   <TextField
                     name="billing_postal_code"
                     label="Postal Code"
                     fullWidth
                     value={formData.billing_postal_code}
                     onChange={handleInputChange}
                   />
                 </Grid>
               </>
             )}
             
             <Grid item xs={12}>
               <Divider sx={{ my: 2 }} />
               <Typography variant="h6" gutterBottom>
                 Payment Details
               </Typography>
             </Grid>
             
             <Grid item xs={12} md={6}>
               <FormControl fullWidth>
                 <InputLabel id="payment-terms-label">Payment Terms</InputLabel>
                 <Select
                   labelId="payment-terms-label"
                   name="paymentTerms"
                   value={formData.paymentTerms}
                   label="Payment Terms"
                   onChange={handleSelectChange}
                 >
                   {paymentTerms.map((term) => (
                     <MenuItem key={term} value={term}>{term}</MenuItem>
                   ))}
                 </Select>
               </FormControl>
             </Grid>
             
             <Grid item xs={12} md={6}>
               <TextField
                 name="creditLimit"
                 label="Credit Limit (₱)"
                 type="number"
                 fullWidth
                 value={formData.creditLimit}
                 onChange={handleInputChange}
                 InputProps={{
                   startAdornment: <InputAdornment position="start">₱</InputAdornment>,
                 }}
               />
             </Grid>
             
             <Grid item xs={12}>
               <FormControlLabel
                 control={
                   <Checkbox
                     checked={formData.taxExempt}
                     onChange={handleCheckboxChange}
                     name="taxExempt"
                     color="primary"
                   />
                 }
                 label="Tax Exempt"
               />
             </Grid>
           </Grid>
         </TabPanel>
         
         <TabPanel value={tabValue} index={3}>
           <Grid container spacing={3}>
             <Grid item xs={12}>
               <Typography variant="h6" gutterBottom>
                 Printing Preferences
               </Typography>
             </Grid>
             
             <Grid item xs={12}>
               <TextField
                 name="specialRequirements"
                 label="Special Requirements or Preferences"
                 multiline
                 rows={4}
                 fullWidth
                 value={formData.specialRequirements}
                 onChange={handleInputChange}
                 placeholder="Enter any special requirements or preferences for printing jobs"
               />
             </Grid>
             
             <Grid item xs={12}>
               <Divider sx={{ my: 2 }} />
               <Typography variant="h6" gutterBottom>
                 Notes
               </Typography>
             </Grid>
             
             <Grid item xs={12}>
               <TextField
                 name="notes"
                 label="General Notes"
                 multiline
                 rows={4}
                 fullWidth
                 value={formData.notes}
                 onChange={handleInputChange}
                 placeholder="Add any additional information about this client's specific needs, history, or other important details."
               />
             </Grid>
           </Grid>
         </TabPanel>
       </DialogContent>
       <DialogActions>
         <Button onClick={handleCloseDialog}>Cancel</Button>
         <Button 
           onClick={handleSubmit} 
           variant="contained" 
           disabled={loading}
         >
           {loading ? <CircularProgress size={24} /> : 'Save Client'}
         </Button>
       </DialogActions>
     </Dialog>

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

export default ClientsList;