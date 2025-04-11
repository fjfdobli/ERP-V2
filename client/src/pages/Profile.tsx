import React, { useState, useRef, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { updateUserProfile } from '../redux/slices/authSlice';
import { supabase } from '../supabaseClient';
import { 
  Box, Card, CardContent, Typography, TextField, Button, 
  Avatar, Grid, Divider, Alert, Snackbar, Paper, Stack, 
  InputAdornment, MenuItem, useTheme, Tab, Tabs, Select,
  FormControl, InputLabel, FormHelperText, IconButton, Tooltip,
  SelectChangeEvent, CircularProgress, Backdrop
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Edit as EditIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  CalendarMonth as CalendarIcon,
  PhotoCamera as PhotoCameraIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

// Philippines regions specific to where printing company operates
const philippineRegions = [
  { value: 'davao_city', label: 'Davao City' },
  { value: 'davao_del_norte', label: 'Davao Del Norte' },
  { value: 'davao_del_sur', label: 'Davao Del Sur' },
  { value: 'davao_oriental', label: 'Davao Oriental' },
];

// Common job titles in a printing press
const jobTitles = [
  'Production Manager',
  'Print Operator',
  'Graphic Designer',
  'Bindery Specialist',
  'Sales Representative',
  'Customer Service Representative',
  'Quality Control Specialist',
  'Accounts Manager',
  'Machine Technician',
  'Administrative Staff',
  'Driver/Logistics Personnel',
  'Other'
];

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const [tabValue, setTabValue] = useState(0);
  
  // Extended user profile data
  interface ExtendedUserData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    jobTitle: string;
    department: string;
    employeeId: string;
    address: string;
    city: string;
    emergencyContact: string;
    emergencyPhone: string;
    birthdate: string;
    joinDate: string;
    bio: string;
    avatarUrl?: string;
  }
  
  const [formData, setFormData] = useState<ExtendedUserData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    jobTitle: user?.jobTitle || '',
    department: '',
    employeeId: '',
    address: '',
    city: 'davao_city',
    emergencyContact: '',
    emergencyPhone: '',
    birthdate: '',
    joinDate: '',
    bio: '',
    avatarUrl: user?.avatarUrl || ''
  });
  
  // Update form data when user object changes
  useEffect(() => {
    if (user) {
      setFormData(prevState => ({
        ...prevState,
        firstName: user.firstName || prevState.firstName,
        lastName: user.lastName || prevState.lastName,
        email: user.email || prevState.email,
        phone: user.phone || prevState.phone,
        jobTitle: user.jobTitle || prevState.jobTitle,
        avatarUrl: user.avatarUrl || prevState.avatarUrl,
        // Additional fields from user_metadata if available
        department: user.user_metadata?.department || prevState.department,
        employeeId: user.user_metadata?.employeeId || prevState.employeeId,
        address: user.user_metadata?.address || prevState.address,
        city: user.user_metadata?.city || prevState.city || 'davao_city',
        emergencyContact: user.user_metadata?.emergencyContact || prevState.emergencyContact,
        emergencyPhone: user.user_metadata?.emergencyPhone || prevState.emergencyPhone,
        birthdate: user.user_metadata?.birthdate || prevState.birthdate,
        joinDate: user.user_metadata?.joinDate || prevState.joinDate,
        bio: user.user_metadata?.bio || prevState.bio
      }));
    }
  }, [user]);
  
  const [success, setSuccess] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Function to handle avatar file upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    setUploadLoading(true);
    setUploadError(null);
    
    try {
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
        
      const avatarUrl = data.publicUrl;
      
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatarUrl }
      });
      
      if (updateError) {
        throw updateError;
      }
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        avatarUrl
      }));
      
      setSuccess(true);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setUploadError('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };
  
  // Trigger file input click when avatar edit button is clicked
  const handleAvatarEditClick = () => {
    fileInputRef.current?.click();
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };
  
  // Separate handler for Select components
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Save user profile basic data first through the Redux action
      const userProfileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        jobTitle: formData.jobTitle,
        avatarUrl: formData.avatarUrl
      };
      
      // Save extended profile data to user_metadata
      const extendedProfileData = {
        department: formData.department,
        employeeId: formData.employeeId,
        address: formData.address,
        city: formData.city,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        birthdate: formData.birthdate,
        joinDate: formData.joinDate,
        bio: formData.bio
      };
      
      // Update user profile through Redux
      const resultAction = await dispatch(updateUserProfile({
        ...userProfileData,
        user_metadata: {
          ...extendedProfileData
        }
      }));
      
      if (updateUserProfile.fulfilled.match(resultAction)) {
        setSuccess(true);
      } else {
        setSubmitError('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  const getInitial = (str?: string): string => {
    return str && str.length > 0 ? str.charAt(0).toUpperCase() : 'U';
  };

  const formatPhoneNumber = (phone: string = '') => {
    // For Philippines format: +63 XXX XXX XXXX
    if (!phone) return '';
    if (phone.startsWith('+63')) return phone;
    if (phone.startsWith('0')) return `+63${phone.substring(1)}`;
    return `+63${phone}`;
  };

  return (
    <Box>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: 'white',
          backgroundImage: 'linear-gradient(45deg, #1976d2, #115293)',
          boxShadow: (theme) => `0 4px 20px 0 ${theme.palette.primary.dark}40`
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight="bold">
          My Profile
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Manage your personal information and account preferences
        </Typography>
      </Paper>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* User Profile Card */}
        <Card 
          sx={{ 
            width: { xs: '100%', md: 300 },
            height: 'fit-content',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
          }}
        >
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              {uploadLoading ? (
                <Box 
                  sx={{ 
                    width: 120, 
                    height: 120, 
                    borderRadius: '50%',
                    mx: 'auto',
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '4px solid white',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  <CircularProgress size={40} />
                </Box>
              ) : (
                <Avatar
                  src={formData.avatarUrl}
                  sx={{ 
                    width: 120, 
                    height: 120,
                    mx: 'auto',
                    bgcolor: 'primary.main',
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    border: '4px solid white',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                  }}
                >
                  {getInitial(user?.firstName) || getInitial(user?.email)}
                </Avatar>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
              
              <Tooltip title="Change profile picture" arrow>
                <IconButton 
                  onClick={handleAvatarEditClick}
                  disabled={uploadLoading}
                  sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    right: '50%', 
                    transform: 'translateX(30px)',
                    bgcolor: 'background.paper',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                  size="small"
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            
            {uploadError && (
              <Alert 
                severity="error" 
                sx={{ mb: 2, fontSize: '0.8rem' }}
                onClose={() => setUploadError(null)}
              >
                {uploadError}
              </Alert>
            )}
            <Typography variant="h6" fontWeight="bold">
              {user?.firstName 
                ? `${user.firstName} ${user.lastName || ''}`
                : user?.email}
            </Typography>
            <Typography 
              variant="body2" 
              color="primary" 
              sx={{ 
                display: 'inline-block',
                py: 0.5,
                px: 1.5,
                bgcolor: 'primary.light',
                color: 'white',
                borderRadius: 5,
                fontWeight: 'medium',
                mb: 2,
                mt: 0.5,
                fontSize: '0.8rem'
              }}
            >
              {user?.role || 'Admin'}
            </Typography>
            
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={1.5} sx={{ textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BadgeIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Employee ID: {formData.employeeId || 'Not set'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WorkIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {formData.jobTitle || 'Position not set'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                  {user?.email}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {formatPhoneNumber(formData.phone) || 'Phone not set'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {philippineRegions.find(r => r.value === formData.city)?.label || 'Location not set'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarIcon fontSize="small" sx={{ color: 'text.secondary', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Joined: {formData.joinDate || 'Date not set'}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Profile Information & Forms */}
        <Box sx={{ flexGrow: 1 }}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="profile tabs"
                textColor="primary"
                indicatorColor="primary"
              >
                <Tab 
                  label="Personal Information" 
                  icon={<PersonIcon />} 
                  iconPosition="start"
                  sx={{ textTransform: 'none', fontWeight: 500 }}
                />
                <Tab 
                  label="Work Details" 
                  icon={<WorkIcon />} 
                  iconPosition="start"
                  sx={{ textTransform: 'none', fontWeight: 500 }}
                />
                <Tab 
                  label="Emergency Contact" 
                  icon={<PhoneIcon />} 
                  iconPosition="start"
                  sx={{ textTransform: 'none', fontWeight: 500 }}
                />
              </Tabs>
            </Box>
            
            <CardContent sx={{ p: 3 }}>
              <Box component="form" onSubmit={handleSubmit}>
                <TabPanel value={tabValue} index={0}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="First Name"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="Last Name"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        disabled
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g. 9XXXXXXXXX"
                        helperText="Without leading 0, will be formatted as +63"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="Street address"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="city-select-label">City/Region</InputLabel>
                        <Select
                          labelId="city-select-label"
                          name="city"
                          value={formData.city}
                          label="City/Region"
                          onChange={handleSelectChange}
                        >
                          {philippineRegions.map((region) => (
                            <MenuItem key={region.value} value={region.value}>
                              {region.label}
                            </MenuItem>
                          ))}
                        </Select>
                        <FormHelperText>Your operating location</FormHelperText>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Birthdate"
                        name="birthdate"
                        type="date"
                        value={formData.birthdate}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="Employee ID"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleChange}
                        placeholder="e.g. EMP-2023-001"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="job-title-select-label">Job Title</InputLabel>
                        <Select
                          labelId="job-title-select-label"
                          name="jobTitle"
                          value={formData.jobTitle}
                          label="Job Title"
                          onChange={handleSelectChange}
                        >
                          {jobTitles.map((title) => (
                            <MenuItem key={title} value={title}>
                              {title}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g. Production, Design, Sales"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <WorkIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Join Date"
                        name="joinDate"
                        type="date"
                        value={formData.joinDate}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="About / Bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleChange}
                        multiline
                        rows={4}
                        placeholder="Brief description about yourself and your role in the company"
                      />
                    </Grid>
                  </Grid>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Emergency contact information will be used only in case of emergency
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Emergency Contact Name"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        placeholder="Full name of emergency contact"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Emergency Contact Phone"
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleChange}
                        placeholder="e.g. 9XXXXXXXXX"
                        helperText="Without leading 0, will be formatted as +63"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </TabPanel>

                {submitError && (
                  <Alert 
                    severity="error" 
                    sx={{ mt: 2, mb: 1 }}
                    onClose={() => setSubmitError(null)}
                  >
                    {submitError}
                  </Alert>
                )}
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    type="submit"
                    size="large"
                    disabled={isSubmitting}
                    sx={{ 
                      px: 4, 
                      borderRadius: 2,
                      boxShadow: (theme) => `0 4px 14px 0 ${theme.palette.primary.main}40`
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          Profile updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;