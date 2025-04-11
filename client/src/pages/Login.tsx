import React, { useState, useEffect, CSSProperties } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { login, clearError, sendEmailVerificationCode, verifyEmailCode } from '../redux/slices/authSlice';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  InputAdornment, 
  IconButton, 
  Grid, 
  Divider,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock,
  Phone
} from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';
import { supabase } from '../supabaseClient';

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
      id={`login-tabpanel-${index}`}
      aria-labelledby={`login-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const Login = () => {
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Verification states
  const [loginMethod, setLoginMethod] = useState(0); // 0 for email, 1 for phone
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Forgot password states
  const [forgotPasswordDialog, setForgotPasswordDialog] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState('');
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [dispatch, isAuthenticated, navigate]);

  // Validate phone number (Philippines format)
  const validatePhoneNumber = (phone: string) => {
    // Basic Philippines phone number validation
    // Formats: +639XX XXX XXXX or 09XX XXX XXXX
    const regex = /^(\+?63|0)?[9]\d{9}$/;
    const isValid = regex.test(phone.replace(/\s/g, ''));
    
    if (!isValid) {
      setPhoneError('Please enter a valid Philippines phone number');
      return false;
    }
    
    setPhoneError('');
    return true;
  };

  // Format phone number with +63 prefix if needed
  const formatPhoneNumber = (phone: string) => {
    const cleanedNumber = phone.replace(/\s/g, '').replace(/^0/, '');
    
    if (cleanedNumber.startsWith('9') && cleanedNumber.length === 10) {
      return `+63${cleanedNumber}`;
    } else if (cleanedNumber.startsWith('63') && cleanedNumber.length === 12) {
      return `+${cleanedNumber}`;
    } else if (cleanedNumber.startsWith('+63') && cleanedNumber.length === 13) {
      return cleanedNumber;
    }
    
    return phone;
  };

  // Handle phone number input change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
    validatePhoneNumber(value);
  };

  // Handle login method change (email/phone)
  const handleLoginMethodChange = (event: React.SyntheticEvent, newValue: number) => {
    setLoginMethod(newValue);
    setVerificationError('');
  };

  // Handle initial login form submission
  const handleInitialSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (loginMethod === 1 && !validatePhoneNumber(phoneNumber)) {
      return;
    }
    
    try {
      // For email login, we can directly attempt login
      if (loginMethod === 0) {
        const resultAction = await dispatch(login({ email, password }));
        
        if (login.rejected.match(resultAction)) {
          // Check if the error is due to email verification
          const errorMsg = resultAction.payload as string;
          if (errorMsg.toLowerCase().includes('email') && errorMsg.toLowerCase().includes('verify')) {
            setShowVerification(true);
            await handleSendVerificationCode();
          }
        }
      } else {
        // For phone login
        const formattedPhone = formatPhoneNumber(phoneNumber);
        // In a real implementation, you'd have a phoneLogin function in authSlice
        // For now, we'll just show a message that this isn't implemented
        setSnackbar({
          open: true,
          message: 'Phone login requires Twilio integration. Please use email login.',
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Send verification code
  const handleSendVerificationCode = async () => {
    setVerificationLoading(true);
    setVerificationError('');
    
    try {
      if (loginMethod === 0) {
        const resultAction = await dispatch(sendEmailVerificationCode(email));
        if (sendEmailVerificationCode.rejected.match(resultAction)) {
          setVerificationError(resultAction.payload as string);
        }
      } else {
        // Phone verification would be implemented here
        const formattedPhone = formatPhoneNumber(phoneNumber);
        setSnackbar({
          open: true,
          message: 'SMS verification requires Twilio integration.',
          severity: 'info'
        });
      }
    } catch (error) {
      setVerificationError('Failed to send verification code. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Verify code and login
  const handleVerifyAndLogin = async () => {
    setVerificationLoading(true);
    
    try {
      if (loginMethod === 0) {
        const verifyAction = await dispatch(verifyEmailCode({ 
          email, 
          code: verificationCode 
        }));
        
        if (verifyEmailCode.fulfilled.match(verifyAction)) {
          // Now try to login again
          await dispatch(login({ email, password }));
        } else if (verifyEmailCode.rejected.match(verifyAction)) {
          setVerificationError(verifyAction.payload as string);
        }
      } else {
        // Phone verification would be implemented here
        setSnackbar({
          open: true,
          message: 'Phone verification requires Twilio integration.',
          severity: 'info'
        });
      }
    } catch (error) {
      setVerificationError('Verification failed. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    setResetPasswordLoading(true);
    setResetPasswordError('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotPasswordEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        throw error;
      }
      
      setResetPasswordSuccess(true);
    } catch (error: any) {
      setResetPasswordError(error.message || 'Failed to send password reset email');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  const bgSvgCode = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
      <defs>
        <pattern id="subtlePattern" patternUnits="userSpaceOnUse" width="100" height="100">
          <rect width="100" height="100" fill="#f8f9fa"/>
          <rect width="100" height="100" fill="#f0f2f5" opacity="0.4"/>
          <path d="M0 50 L100 50 M50 0 L50 100" stroke="#e9ecef" stroke-width="0.5" opacity="0.5"/>
        </pattern>
      </defs>
      <rect width="1200" height="800" fill="url(#subtlePattern)"/>
      
      <g opacity="0.65" transform="translate(120,150)">
        <rect x="0" y="0" width="60" height="45" rx="4" fill="#e0e0e0" stroke="#cccccc" stroke-width="1"/>
        <rect x="5" y="5" width="50" height="20" rx="2" fill="#f5f5f5" stroke="#e0e0e0" stroke-width="0.5"/>
        <rect x="15" y="30" width="30" height="5" rx="1" fill="#e0e0e0"/>
      </g>
    </svg>
  `;

  const backgroundStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#f8f9fa',
    backgroundImage: `url("data:image/svg+xml;charset=utf8,${encodeURIComponent(bgSvgCode)}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: -1,
    opacity: 0.8
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: { xs: 2, md: 4 },
        position: 'relative'
      }}
    >
      {/* Background div */}
      <div style={backgroundStyle}></div>
      
      <Container maxWidth="sm">
        <Paper 
          elevation={6} 
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <Grid container>
            <Grid item xs={12}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                py: 3,
                px: 4,
                textAlign: 'center'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <PrintIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h4" component="h1" fontWeight="bold">
                 Opzon's Printing Press
                </Typography>
              </Box>
              <Typography variant="subtitle1">Enterprise Resource Planning System
              </Typography>
            </Grid>
            
            <Grid item xs={12} sx={{ p: 4 }}>
              <Typography variant="h5" component="h2" gutterBottom fontWeight="medium">
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please sign in to your account to continue
              </Typography>
              
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              {!showVerification ? (
                <>
                  <Tabs 
                    value={loginMethod} 
                    onChange={handleLoginMethodChange} 
                    sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
                  >
                    <Tab 
                      icon={<Email />} 
                      label="Email" 
                      id="login-tab-0"
                      aria-controls="login-tabpanel-0"
                    />
                    <Tab 
                      icon={<Phone />} 
                      label="Phone" 
                      id="login-tab-1"
                      aria-controls="login-tabpanel-1"
                    />
                  </Tabs>
                  
                  <Box component="form" onSubmit={handleInitialSubmit}>
                    <TabPanel value={loginMethod} index={0}>
                      <TextField
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Email color="primary" />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 3 }}
                      />
                    </TabPanel>
                    
                    <TabPanel value={loginMethod} index={1}>
                      <TextField
                        required
                        fullWidth
                        id="phoneNumber"
                        label="Phone Number"
                        name="phoneNumber"
                        autoComplete="tel"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        error={!!phoneError}
                        helperText={phoneError || "Format: +63 9XX XXX XXXX or 09XX XXX XXXX"}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Phone color="primary" />
                              <Typography variant="body2" sx={{ ml: 0.5 }}>
                                +63
                              </Typography>
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 3 }}
                      />
                    </TabPanel>
                    
                    <TextField
                      required
                      fullWidth
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="primary" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{ mb: 1 }}
                    />
                    
                    {/* Forgot Password Link */}
                    <Box sx={{ textAlign: 'right', mb: 2 }}>
                      <Button
                        color="primary"
                        onClick={() => setForgotPasswordDialog(true)}
                        sx={{ fontWeight: 'medium', textTransform: 'none' }}
                      >
                        Forgot Password?
                      </Button>
                    </Box>
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{ 
                        mt: 1, 
                        mb: 3,
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </Box>
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  {loginMethod === 0 ? (
                    <Email sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  ) : (
                    <Phone sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  )}
                  
                  <Typography variant="h6" gutterBottom>
                    Verification Required
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    {loginMethod === 0 
                      ? `We've sent a verification code to ${email}`
                      : `We've sent a verification code to ${formatPhoneNumber(phoneNumber)}`
                    }
                  </Typography>
                  
                  {verificationError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {verificationError}
                    </Alert>
                  )}
                  
                  <FormControl fullWidth variant="outlined" sx={{ mt: 1, mb: 3 }}>
                    <InputLabel htmlFor="verification-code">Verification Code</InputLabel>
                    <OutlinedInput
                      id="verification-code"
                      label="Verification Code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      inputProps={{ maxLength: 6 }}
                    />
                  </FormControl>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button 
                      variant="outlined"
                      onClick={() => setShowVerification(false)}
                    >
                      Back
                    </Button>
                    
                    <Button
                      variant="outlined" 
                      onClick={handleSendVerificationCode}
                      disabled={verificationLoading}
                    >
                      Resend Code
                    </Button>
                    
                    <Button 
                      variant="contained"
                      onClick={handleVerifyAndLogin}
                      disabled={verificationCode.length !== 6 || verificationLoading}
                    >
                      {verificationLoading ? <CircularProgress size={24} /> : 'Verify & Login'}
                    </Button>
                  </Box>
                </Box>
              )}
              
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2">
                  Don't have an account?{' '}
                  <Link to="/register" style={{ textDecoration: 'none', color: 'primary.main' }}>
                    <Button color="primary" sx={{ fontWeight: 'bold' }}>
                      Sign Up
                    </Button>
                  </Link>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="black">
            © {new Date().getFullYear()} Opzon's Printing Press. All rights reserved.
          </Typography>
        </Box>
      </Container>
      
      {/* Forgot Password Dialog */}
      <Dialog 
        open={forgotPasswordDialog} 
        onClose={() => {
          if (!resetPasswordLoading) {
            setForgotPasswordDialog(false);
            setResetPasswordSuccess(false);
            setResetPasswordError('');
          }
        }}
      >
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {resetPasswordSuccess ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              Password reset instructions have been sent to your email.
            </Alert>
          ) : (
            <>
              <Typography variant="body2" paragraph sx={{ mt: 1 }}>
                Enter your email address and we'll send you instructions to reset your password.
              </Typography>
              
              {resetPasswordError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {resetPasswordError}
                </Alert>
              )}
              
              <TextField
                fullWidth
                required
                margin="normal"
                id="reset-email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => {
              setForgotPasswordDialog(false);
              setResetPasswordSuccess(false);
              setResetPasswordError('');
            }}
          >
            {resetPasswordSuccess ? 'Close' : 'Cancel'}
          </Button>
          
          {!resetPasswordSuccess && (
            <Button 
              onClick={handleForgotPassword} 
              variant="contained"
              disabled={!forgotPasswordEmail || resetPasswordLoading}
            >
              {resetPasswordLoading ? <CircularProgress size={24} /> : 'Reset Password'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;