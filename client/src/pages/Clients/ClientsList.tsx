// client/src/pages/Clients/ClientsList.tsx
import React, { useState, useEffect } from 'react';
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
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  SelectChangeEvent,
  Divider,
  FormControlLabel,
  Checkbox,
  Tab,
  Tabs
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon, Business, Person, Payments, Info } from '@mui/icons-material';
import { clientsService, Client, InsertClient } from '../../services/clientsService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

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

const ClientsList: React.FC = () => {
  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<InsertClient & {
    // Business details
    business_type?: string;
    tax_id?: string;
    industry?: string;
    website?: string;
    
    // Additional contact details
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    alternate_phone?: string;
    
    // Billing details
    billing_address_same?: boolean;
    billing_address_line1?: string;
    billing_address_line2?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal_code?: string;
    payment_terms?: string;
    credit_limit?: number;
    tax_exempt?: boolean;
    
    // Printing preferences
    special_requirements?: string;
    
    // Notes and metadata
    acquisition_date?: Date | null;
    notes?: string;
  }>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    status: 'Regular',
    
    // Business details
    business_type: 'Company',
    tax_id: '',
    industry: '',
    website: '',
    
    // Additional contact details
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    alternate_phone: '',
    
    // Billing details
    billing_address_same: true,
    billing_address_line1: '',
    billing_address_line2: '',
    billing_city: '',
    billing_state: '',
    billing_postal_code: '',
    payment_terms: 'Net 30',
    credit_limit: 5000,
    tax_exempt: false,
    
    // Printing preferences
    special_requirements: '',
    
    // Notes and metadata
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

  // Constants for form options
  const businessTypes = ['Company', 'Organization', 'Government', 'Educational', 'Individual', 'Other'];
  const industries = ['Publishing', 'Marketing', 'Advertising', 'Education', 'Government', 'Retail', 'Healthcare', 'Financial', 'Technology', 'Manufacturing', 'Nonprofit', 'Other'];
  const paymentTerms = ['Prepaid', 'COD', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Credit Card'];

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClientsData = async () => {
      await fetchClients();
    };
    
    fetchClientsData();
  }, []);

  // Fetch clients from API
  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await clientsService.getClients();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      showSnackbar('Failed to load clients', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle search
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

  // Handle dialog open
  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setSelectedClient(client);
      // In a real app, we would fetch the complete client details here
      setFormData({
        name: client.name,
        contact_person: client.contact_person,
        email: client.email,
        phone: client.phone,
        status: client.status,
        // Default values for other fields would be populated from complete client data
        business_type: 'Company',
        tax_id: '',
        industry: '',
        website: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        alternate_phone: '',
        billing_address_same: true,
        billing_address_line1: '',
        billing_address_line2: '',
        billing_city: '',
        billing_state: '',
        billing_postal_code: '',
        payment_terms: 'Net 30',
        credit_limit: 5000,
        tax_exempt: false,
        special_requirements: '',
        acquisition_date: new Date(),
        notes: ''
      });
    } else {
      setSelectedClient(null);
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        status: 'Regular',
        business_type: 'Company',
        tax_id: '',
        industry: '',
        website: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        alternate_phone: '',
        billing_address_same: true,
        billing_address_line1: '',
        billing_address_line2: '',
        billing_city: '',
        billing_state: '',
        billing_postal_code: '',
        payment_terms: 'Net 30',
        credit_limit: 5000,
        tax_exempt: false,
        special_requirements: '',
        acquisition_date: new Date(),
        notes: ''
      });
    }
    setOpenDialog(true);
    setTabValue(0);
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedClient(null);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle text input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle select input change
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
    
    // If billing address same is checked, copy the main address
    if (name === 'billing_address_same' && checked) {
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

  // Handle date change
  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      acquisition_date: date
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.name || !formData.contact_person) {
      showSnackbar('Client name and contact person are required', 'error');
      return;
    }

    setLoading(true);
    try {
      // Prepare client data for API
      // In a real implementation, we would map the extended form data to the API schema
      const clientData: InsertClient = {
        name: formData.name,
        contact_person: formData.contact_person,
        email: formData.email,
        phone: formData.phone,
        status: formData.status
        // Additional fields would be included depending on your API/database schema
      };

      if (selectedClient) {
        // Update existing client
        await clientsService.updateClient(selectedClient.id, clientData);
        showSnackbar('Client updated successfully', 'success');
      } else {
        // Create new client
        await clientsService.createClient(clientData);
        showSnackbar('Client created successfully', 'success');
      }
      
      // Refresh client list
      fetchClients();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving client:', error);
      showSnackbar('Failed to save client', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Generate avatar color based on client name
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 70%, 50%)`;
  };

  // Get client initials for avatar
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
        <Button variant="outlined">Export</Button>
      </Box>

      {loading && clients.length === 0 ? (
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
                    <TableCell>{client.contact_person}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell>
                      <Chip 
                        label={client.status} 
                        color={client.status === 'VIP' ? 'secondary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleOpenDialog(client)}>View</Button>
                      <Button size="small" onClick={() => handleOpenDialog(client)}>Edit</Button>
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

      {/* Client Form Dialog */}
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
                    name="business_type"
                    value={formData.business_type}
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
                  name="tax_id"
                  label="TIN"
                  fullWidth
                  value={formData.tax_id}
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
                <TextField
                  name="website"
                  label="Website"
                  fullWidth
                  value={formData.website}
                  onChange={handleInputChange}
                />
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
                    <MenuItem value="VIP">VIP</MenuItem>
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
                  name="contact_person"
                  label="Contact Person Name"
                  fullWidth
                  required
                  value={formData.contact_person}
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
                  name="alternate_phone"
                  label="Alternate Phone"
                  fullWidth
                  value={formData.alternate_phone}
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
                      checked={formData.billing_address_same}
                      onChange={handleCheckboxChange}
                      name="billing_address_same"
                      color="primary"
                    />
                  }
                  label="Billing address same as business address"
                />
              </Grid>
              
              {!formData.billing_address_same && (
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
                    name="payment_terms"
                    value={formData.payment_terms}
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
                  name="credit_limit"
                  label="Credit Limit (₱)"
                  type="number"
                  fullWidth
                  value={formData.credit_limit}
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
                      checked={formData.tax_exempt}
                      onChange={handleCheckboxChange}
                      name="tax_exempt"
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
                  name="special_requirements"
                  label="Special Requirements or Preferences"
                  multiline
                  rows={4}
                  fullWidth
                  value={formData.special_requirements}
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

      {/* Snackbar for notifications */}
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