import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { updateUserSettings } from '../redux/slices/authSlice';
import { useThemeContext } from '../App';
import { 
  Box, Card, CardContent, Typography, Switch, Divider, List, ListItem, 
  ListItemText, ListItemIcon, Button, FormControlLabel, Alert, Snackbar, 
  Select, MenuItem, FormControl, SelectChangeEvent, Paper, Grid, Stack,
  Tooltip, IconButton, useTheme, ToggleButtonGroup, ToggleButton, FormHelperText,
  CircularProgress
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Notifications as NotificationsIcon, 
  Visibility as VisibilityIcon, 
  ColorLens as ThemeIcon, 
  Print as PrintIcon,
  Dashboard as DashboardIcon,
  TableView as TableViewIcon,
  FileCopy as FileCopyIcon,
  DesktopWindows as DesktopWindowsIcon,
  LowPriority as LowPriorityIcon,
  FormatListNumbered as ListIcon,
  Inventory as InventoryIcon,
  NotificationImportant as AlertIcon,
  AccessTime as TimeIcon,
  AccountTree as WorkflowIcon,
  Info as InfoIcon
} from '@mui/icons-material';

interface UserSettings {
  emailNotifications: boolean;
  appNotifications: boolean;
  darkMode: boolean;
  theme: string;
  autoLogout: boolean;
  logoutTime: number;
  defaultView: string;
  inventoryAlerts: boolean;
  showPendingOrders: boolean;
  orderPriorityColors: boolean;
  compactView: boolean;
}

const defaultSettings: UserSettings = {
  emailNotifications: true,
  appNotifications: true,
  darkMode: false,
  theme: 'default',
  autoLogout: false,
  logoutTime: 30,
  defaultView: 'dashboard',
  inventoryAlerts: true,
  showPendingOrders: true,
  orderPriorityColors: true,
  compactView: false
};

const SettingsPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [success, setSuccess] = useState(false);
  
  // Use our theme context to apply settings app-wide
  const { 
    darkMode, 
    setDarkMode, 
    themeColor, 
    setThemeColor, 
    compactView, 
    setCompactView,
    applySettings: applyGlobalSettings
  } = useThemeContext();

  // Initialize settings from user profile
  useEffect(() => { 
    if (user?.settings) {
      setSettings({
        ...defaultSettings,
        ...user.settings
      });
    }
  }, [user]);
  
  // Apply settings immediately via ThemeContext when they change in this component
  useEffect(() => {
    // Apply theme settings using our context
    setDarkMode(settings.darkMode);
    setThemeColor(settings.theme);
    setCompactView(settings.compactView);
    
    // Set up notification handlers
    if (settings.emailNotifications) {
      console.log('Email notifications enabled - setting up handlers');
      window.localStorage.setItem('emailNotifications', 'enabled');
    } else {
      console.log('Email notifications disabled');
      window.localStorage.setItem('emailNotifications', 'disabled');
    }
    
    if (settings.appNotifications) {
      console.log('In-app notifications enabled - setting up handlers');
      window.localStorage.setItem('appNotifications', 'enabled');
    } else {
      console.log('In-app notifications disabled');
      window.localStorage.setItem('appNotifications', 'disabled');
    }
    
    if (settings.inventoryAlerts) {
      console.log('Inventory alerts enabled - setting up monitoring');
      window.localStorage.setItem('inventoryAlerts', 'enabled');
    } else {
      console.log('Inventory alerts disabled');
      window.localStorage.setItem('inventoryAlerts', 'disabled');
    }
    
    // Handle auto logout setup
    if (settings.autoLogout) {
      console.log(`Setting up auto logout for ${settings.logoutTime} minutes`);
      window.localStorage.setItem('autoLogoutEnabled', 'true');
      window.localStorage.setItem('autoLogoutTime', settings.logoutTime.toString());
    } else {
      console.log('Auto logout disabled');
      window.localStorage.setItem('autoLogoutEnabled', 'false');
    }
    
    // Handle order priority colors
    if (settings.orderPriorityColors) {
      console.log('Order priority colors enabled');
      window.localStorage.setItem('orderPriorityColors', 'enabled');
    } else {
      console.log('Order priority colors disabled');
      window.localStorage.setItem('orderPriorityColors', 'disabled');
    }
    
    // Handle pending orders display on dashboard
    if (settings.showPendingOrders) {
      console.log('Show pending orders on dashboard enabled');
      window.localStorage.setItem('showPendingOrders', 'enabled');
    } else {
      console.log('Show pending orders on dashboard disabled');
      window.localStorage.setItem('showPendingOrders', 'disabled');
    }
    
    // Store default view preference
    window.localStorage.setItem('defaultView', settings.defaultView);
    
  }, [settings, setDarkMode, setThemeColor, setCompactView]);

  const handleToggleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      [event.target.name]: event.target.checked
    });
  };

  const handleSelectChange = (event: SelectChangeEvent) => {
    setSettings({
      ...settings,
      [event.target.name]: event.target.value
    });
  };

  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: string | null
  ) => {
    if (newView !== null) {
      setSettings({
        ...settings,
        defaultView: newView
      });
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Apply settings to ThemeContext directly for immediate effect
      applyGlobalSettings(settings);
      
      // Handle notifications
      if (settings.appNotifications) {
        // Register for browser notifications
        console.log('Requesting permission for browser notifications');
        if ('Notification' in window && Notification.permission !== 'granted') {
          try {
            await Notification.requestPermission();
            console.log('Notification permission status:', Notification.permission);
          } catch (err) {
            console.log('Notification permission request failed');
          }
        }
      }
      
      // Save settings to Supabase via Redux for persistence
      const resultAction = await dispatch(updateUserSettings(settings));
      
      if (updateUserSettings.fulfilled.match(resultAction)) {
        setSuccess(true);
        
        // Show visual feedback with a notification
        if (settings.appNotifications && 'Notification' in window && Notification.permission === 'granted') {
          try {
            // Display a test notification
            const notification = new Notification('Settings Saved', {
              body: 'Your settings have been updated successfully',
              icon: '/favicon.ico'
            });
            
            // Auto close after 3 seconds
            setTimeout(() => notification.close(), 3000);
          } catch (err) {
            console.log('Failed to show notification');
          }
        }
        
        // Log some info about what's happening
        console.log('Settings applied globally:');
        console.log(`- Dark mode: ${settings.darkMode}`);
        console.log(`- Theme: ${settings.theme}`);
        console.log(`- Compact view: ${settings.compactView}`);
        console.log(`- Auto logout: ${settings.autoLogout ? `${settings.logoutTime} minutes` : 'disabled'}`);
        console.log(`- Default view: ${settings.defaultView}`);
        console.log(`- Email notifications: ${settings.emailNotifications}`);
        console.log(`- App notifications: ${settings.appNotifications}`);
        console.log(`- Inventory alerts: ${settings.inventoryAlerts}`);
        console.log(`- Show pending orders: ${settings.showPendingOrders}`);
        console.log(`- Order priority colors: ${settings.orderPriorityColors}`);
      } else {
        setSubmitError('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Settings update error:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  return (
    <Box>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Overview Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            borderRadius: 2, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
          }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  pb: 1,
                  borderBottom: `1px solid ${theme.palette.divider}`
                }}
              >
                <DesktopWindowsIcon sx={{ mr: 1 }} color="primary" />
                System Preferences
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Customize your ERP settings to optimize your workflow for printing operations. 
                  All settings are stored locally and synchronized with your account.
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Current Environment:
                </Typography>
                
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PrintIcon fontSize="small" sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="body2">
                      Opzon's Printing Press - Davao City
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <DesktopWindowsIcon fontSize="small" sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="body2">
                      System Version: 2.0
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ThemeIcon fontSize="small" sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="body2">
                      Theme: {settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1)}
                    </Typography>
                  </Box>
                </Stack>
                
                <Alert 
                  severity="info" 
                  icon={<InfoIcon />}
                  sx={{ 
                    mt: 3, 
                    borderRadius: 2, 
                    '& .MuiAlert-icon': { 
                      alignItems: 'center' 
                    } 
                  }}
                >
                  <Typography variant="body2">
                    Settings are automatically synced with your user account and will be applied to all devices you log in from.
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Settings Form */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <CardContent>
              <Box component="form" onSubmit={handleSubmit}>
                {/* Notifications Section */}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontWeight: 'bold',
                    mb: 2,
                    pb: 1,
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <NotificationsIcon sx={{ mr: 1 }} color="primary" />
                  Notifications
                </Typography>
                
                <List disablePadding>
                  <ListItem 
                    sx={{ 
                      px: 2, 
                      py: 1.5, 
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography fontWeight="medium">Email Notifications</Typography>
                      }
                      secondary="Receive alerts about orders, inventory, and urgent issues via email"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.emailNotifications}
                          onChange={handleToggleChange}
                          name="emailNotifications"
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  
                  <ListItem 
                    sx={{ 
                      px: 2, 
                      py: 1.5, 
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography fontWeight="medium">In-App Notifications</Typography>
                      }
                      secondary="Show real-time alerts within the application"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.appNotifications}
                          onChange={handleToggleChange}
                          name="appNotifications"
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  
                  <ListItem 
                    sx={{ 
                      px: 2, 
                      py: 1.5, 
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography fontWeight="medium">Inventory Alerts</Typography>
                      } 
                      secondary="Receive notifications when inventory items are low or need reordering"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.inventoryAlerts}
                          onChange={handleToggleChange}
                          name="inventoryAlerts"
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </ListItem>
                </List>

                <Divider sx={{ my: 3 }} />

                {/* Display Section */}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontWeight: 'bold',
                    mb: 2,
                    pb: 1,
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <VisibilityIcon sx={{ mr: 1 }} color="primary" />
                  Display & Appearance
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  {/* Dark Mode with Preview */}
                  <ListItem 
                    sx={{ 
                      px: 2, 
                      py: 1.5, 
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' },
                      mb: 2,
                      bgcolor: settings.darkMode ? 'rgba(0,0,0,0.05)' : 'transparent'
                    }}
                  >
                    <ListItemIcon>
                      <Box 
                        sx={{ 
                          borderRadius: '50%', 
                          p: 1,
                          color: settings.darkMode ? 'white' : 'inherit',
                          bgcolor: settings.darkMode ? '#333' : '#f0f0f0'
                        }}
                      >
                        <VisibilityIcon />
                      </Box>
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography fontWeight="medium">Dark Mode</Typography>
                      } 
                      secondary="Enable dark mode for better visibility in low-light environments"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.darkMode}
                          onChange={handleToggleChange}
                          name="darkMode"
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  

                  {/* Color Theme Selector */}
                  <Typography variant="subtitle2" sx={{ px: 2, mt: 3, mb: 2, fontWeight: 500 }}>
                    Color Theme
                  </Typography>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 1.5, 
                    px: 2, 
                    mb: 3
                  }}>
                    {[
                      { name: 'default', label: 'Blue', color: '#1976d2' },
                      { name: 'green', label: 'Green', color: '#2e7d32' },
                      { name: 'purple', label: 'Purple', color: '#7b1fa2' },
                      { name: 'teal', label: 'Teal', color: '#00796b' },
                      { name: 'orange', label: 'Orange', color: '#ef6c00' }
                    ].map((themeOption) => (
                      <Box 
                        key={themeOption.name}
                        onClick={() => {
                          setSettings({
                            ...settings,
                            theme: themeOption.name
                          });
                        }}
                        sx={{ 
                          width: 60,
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '50%', 
                            mx: 'auto',
                            mb: 0.5,
                            bgcolor: themeOption.color,
                            border: settings.theme === themeOption.name ? '3px solid' : '1px solid',
                            borderColor: settings.theme === themeOption.name ? 
                              'primary.main' : 
                              settings.darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'scale(1.1)'
                            }
                          }}
                        />
                        <Typography 
                          variant="caption"
                          sx={{ 
                            display: 'block',
                            fontWeight: settings.theme === themeOption.name ? 'bold' : 'regular',
                            color: settings.theme === themeOption.name ? 'primary.main' : 'inherit'
                          }}
                        >
                          {themeOption.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  
                  {/* Spacing & Layout Options */}
                  <Typography variant="subtitle2" sx={{ px: 2, mt: 3, mb: 1, fontWeight: 500 }}>
                    Layout Options
                  </Typography>
                  
                  <Box sx={{ px: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            cursor: 'pointer',
                            bgcolor: !settings.compactView ? 'action.selected' : 'transparent',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: !settings.compactView ? 'action.selected' : 'action.hover'
                            }
                          }}
                          onClick={() => setSettings({...settings, compactView: false})}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" fontWeight={!settings.compactView ? 'bold' : 'regular'}>
                              Standard View
                            </Typography>
                            <Box 
                              sx={{ 
                                width: 20, 
                                height: 20, 
                                borderRadius: '50%', 
                                border: '2px solid',
                                borderColor: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: !settings.compactView ? 1 : 0.3
                              }}
                            >
                              {!settings.compactView && (
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
                              )}
                            </Box>
                          </Box>
                          
                          {/* Standard view illustration */}
                          <Box sx={{ 
                            height: 60, 
                            bgcolor: 'background.paper', 
                            border: '1px dashed', 
                            borderColor: 'divider',
                            borderRadius: 1,
                            display: 'flex',
                            p: 1.5
                          }}>
                            <Box sx={{ width: 15, bgcolor: 'action.hover', borderRadius: 0.5, mr: 1.5 }} />
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ height: 8, width: '80%', bgcolor: 'action.hover', borderRadius: 0.5, mb: 1.5 }} />
                              <Box sx={{ height: 8, width: '60%', bgcolor: 'action.hover', borderRadius: 0.5 }} />
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            cursor: 'pointer',
                            bgcolor: settings.compactView ? 'action.selected' : 'transparent',
                            transition: 'all 0.2s',
                            '&:hover': {
                              bgcolor: settings.compactView ? 'action.selected' : 'action.hover'
                            }
                          }}
                          onClick={() => setSettings({...settings, compactView: true})}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" fontWeight={settings.compactView ? 'bold' : 'regular'}>
                              Compact View
                            </Typography>
                            <Box 
                              sx={{ 
                                width: 20, 
                                height: 20, 
                                borderRadius: '50%', 
                                border: '2px solid',
                                borderColor: 'primary.main',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: settings.compactView ? 1 : 0.3
                              }}
                            >
                              {settings.compactView && (
                                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
                              )}
                            </Box>
                          </Box>
                          
                          {/* Compact view illustration */}
                          <Box sx={{ 
                            height: 60, 
                            bgcolor: 'background.paper', 
                            border: '1px dashed', 
                            borderColor: 'divider',
                            borderRadius: 1,
                            display: 'flex',
                            p: 0.75
                          }}>
                            <Box sx={{ width: 12, bgcolor: 'action.hover', borderRadius: 0.5, mr: 0.75 }} />
                            <Box sx={{ flexGrow: 1 }}>
                              <Box sx={{ height: 6, width: '80%', bgcolor: 'action.hover', borderRadius: 0.5, mb: 0.75 }} />
                              <Box sx={{ height: 6, width: '90%', bgcolor: 'action.hover', borderRadius: 0.5, mb: 0.75 }} />
                              <Box sx={{ height: 6, width: '70%', bgcolor: 'action.hover', borderRadius: 0.5 }} />
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Workflow Section */}
                <Typography 
                  variant="h6" 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontWeight: 'bold',
                    mb: 2,
                    pb: 1,
                    borderBottom: `1px solid ${theme.palette.divider}`
                  }}
                >
                  <WorkflowIcon sx={{ mr: 1 }} color="primary" />
                  Workflow Preferences
                </Typography>
                
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography fontWeight="medium" gutterBottom>
                    Default Screen
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Choose which screen should appear first when you log in
                  </Typography>
                  
                  <ToggleButtonGroup
                    value={settings.defaultView}
                    exclusive
                    onChange={handleViewChange}
                    aria-label="default view"
                    size="small"
                    sx={{ mb: 2 }}
                  >
                    <ToggleButton value="dashboard" aria-label="dashboard view">
                      <DashboardIcon sx={{ mr: 1 }} />
                      Dashboard
                    </ToggleButton>
                    <ToggleButton value="orders" aria-label="orders view">
                      <FileCopyIcon sx={{ mr: 1 }} />
                      Orders
                    </ToggleButton>
                    <ToggleButton value="inventory" aria-label="inventory view">
                      <InventoryIcon sx={{ mr: 1 }} />
                      Inventory
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                
                <List disablePadding>
                  <ListItem 
                    sx={{ 
                      px: 2, 
                      py: 1.5, 
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography fontWeight="medium">Order Priority Colors</Typography>
                      } 
                      secondary="Color-code orders based on priority and due dates for better visual tracking"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.orderPriorityColors}
                          onChange={handleToggleChange}
                          name="orderPriorityColors"
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  
                  <ListItem 
                    sx={{ 
                      px: 2, 
                      py: 1.5, 
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography fontWeight="medium">Show Pending Orders</Typography>
                      } 
                      secondary="Display pending orders on the dashboard for quick access"
                    />
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.showPendingOrders}
                          onChange={handleToggleChange}
                          name="showPendingOrders"
                          color="primary"
                        />
                      }
                      label=""
                    />
                  </ListItem>
                  
                  <ListItem 
                    sx={{ 
                      px: 2, 
                      py: 1.5, 
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography fontWeight="medium">Auto Logout</Typography>
                      } 
                      secondary="Automatically log out after a period of inactivity for security"
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.autoLogout}
                            onChange={handleToggleChange}
                            name="autoLogout"
                            color="primary"
                          />
                        }
                        label=""
                      />
                      {settings.autoLogout && (
                        <FormControl sx={{ width: 120, ml: 1 }}>
                          <Select
                            value={settings.logoutTime.toString()}
                            onChange={handleSelectChange}
                            name="logoutTime"
                            size="small"
                          >
                            <MenuItem value="15">15 minutes</MenuItem>
                            <MenuItem value="30">30 minutes</MenuItem>
                            <MenuItem value="60">1 hour</MenuItem>
                            <MenuItem value="120">2 hours</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    </Box>
                  </ListItem>
                </List>

                {submitError && (
                  <Alert 
                    severity="error" 
                    sx={{ mt: 2, mb: 1 }}
                    onClose={() => setSubmitError(null)}
                  >
                    {submitError}
                  </Alert>
                )}
                
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    type="submit"
                    size="large"
                    disabled={isSubmitting}
                    sx={{ 
                      px: 4, 
                      py: 1.25,
                      borderRadius: 2,
                      boxShadow: (theme) => `0 4px 14px 0 ${theme.palette.primary.main}40`
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Settings'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Notification display area - shows active notifications based on settings */}
      {settings.appNotifications && (
        <Box 
          sx={{ 
            position: 'fixed', 
            top: 20, 
            right: 20, 
            zIndex: 9999,
            display: success ? 'block' : 'none'
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 2,
              backgroundColor: settings.theme === 'green' ? '#e8f5e9' : 
                              settings.theme === 'purple' ? '#f3e5f5' :
                              settings.theme === 'teal' ? '#e0f2f1' :
                              settings.theme === 'orange' ? '#fff3e0' : '#e3f2fd',
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              minWidth: 300,
              maxWidth: 400,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <NotificationsIcon color="primary" sx={{ mr: 2 }} />
            <Box>
              <Typography variant="subtitle1" fontWeight="medium">Settings Updated</Typography>
              <Typography variant="body2">Your preferences have been saved successfully</Typography>
            </Box>
          </Paper>
        </Box>
      )}

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
          Settings saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;