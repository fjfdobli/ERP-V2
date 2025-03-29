import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { updateUserSettings } from '../redux/slices/authSlice';
import { Box, Card, CardContent, Typography, Switch, Divider, List, ListItem, ListItemText, ListItemIcon, Button, FormControlLabel, Alert, Snackbar, Select, MenuItem, FormControl, SelectChangeEvent } from '@mui/material';
import { Save as SaveIcon, Notifications as NotificationsIcon, Visibility as VisibilityIcon, Language as LanguageIcon, ColorLens as ThemeIcon, Security as SecurityIcon } from '@mui/icons-material';

interface UserSettings {
  emailNotifications: boolean;
  appNotifications: boolean;
  darkMode: boolean;
  language: string;
  theme: string;
  twoFactorAuth: boolean;
}

const defaultSettings: UserSettings = {
  emailNotifications: true,
  appNotifications: true,
  darkMode: false,
  language: 'en',
  theme: 'default',
  twoFactorAuth: false
};

const SettingsPage: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [success, setSuccess] = useState(false);

  useEffect(() => { 
    if (user?.settings) {
      setSettings({
        ...defaultSettings,
        ...user.settings
      });
    }
  }, [user]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateUserSettings(settings));
    setSuccess(true);
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="medium">
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Customize your application preferences
      </Typography>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Email Notifications" 
                  secondary="Receive notifications about orders and inventory via email"
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
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="App Notifications" 
                  secondary="Receive in-app notifications"
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
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <VisibilityIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Dark Mode" 
                  secondary="Enable dark mode for the application"
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

              <ListItem>
                <ListItemIcon>
                  <ThemeIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Theme" 
                  secondary="Choose your preferred color theme"
                />
                <FormControl sx={{ minWidth: 150 }}>
                  <Select
                    value={settings.theme}
                    onChange={handleSelectChange}
                    name="theme"
                    size="small"
                  >
                    <MenuItem value="default">Default</MenuItem>
                    <MenuItem value="blue">Blue</MenuItem>
                    <MenuItem value="green">Green</MenuItem>
                    <MenuItem value="purple">Purple</MenuItem>
                  </Select>
                </FormControl>
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <LanguageIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Language" 
                  secondary="Choose your preferred language"
                />
                <FormControl sx={{ minWidth: 150 }}>
                  <Select
                    value={settings.language}
                    onChange={handleSelectChange}
                    name="language"
                    size="small"
                  >
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="es">Spanish</MenuItem>
                    <MenuItem value="fr">French</MenuItem>
                    <MenuItem value="de">German</MenuItem>
                  </Select>
                </FormControl>
              </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Security
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <SecurityIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Two-Factor Authentication" 
                  secondary="Enable two-factor authentication for added security"
                />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={settings.twoFactorAuth}
                      onChange={handleToggleChange}
                      name="twoFactorAuth"
                      color="primary"
                    />
                  }
                  label=""
                />
              </ListItem>
            </List>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                type="submit"
              >
                Save Settings
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Settings saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SettingsPage;