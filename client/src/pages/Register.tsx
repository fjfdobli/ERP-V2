import React, { useState, useEffect, CSSProperties } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { register, sendEmailVerificationCode, sendPhoneVerificationCode, verifyEmailCode, verifyPhoneCode } from '../redux/slices/authSlice';
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
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  FormControl,
  OutlinedInput,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock, 
  Person, 
  ArrowBack, 
  Phone,
  CheckCircle
} from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';
import { supabase } from '../supabaseClient';

const Register = () => {
  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Error states
  const [passwordError, setPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  // Verification states
  const [activeStep, setActiveStep] = useState(0);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [emailVerificationDialog, setEmailVerificationDialog] = useState(false);
  const [phoneVerificationDialog, setPhoneVerificationDialog] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [registrationComplete, setRegistrationComplete] = useState(false);
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Registration steps
  const steps = ['Account Information', 'Verify Email', 'Verify Phone', 'Complete'];

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

  // Handle account information submission (Step 1)
  const handleAccountInfoSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate password
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    
    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      return;
    }
    
    setPasswordError('');
    setActiveStep(1);
    handleSendEmailVerificationCode();
  };

  // Send email verification code
  const handleSendEmailVerificationCode = async () => {
    setVerificationLoading(true);
    setVerificationError('');
    
    try {
      const resultAction = await dispatch(sendEmailVerificationCode(email));
      if (sendEmailVerificationCode.fulfilled.match(resultAction)) {
        setEmailVerificationDialog(true);
      } else if (sendEmailVerificationCode.rejected.match(resultAction)) {
        setVerificationError(resultAction.payload as string);
      }
    } catch (error) {
      setVerificationError('Failed to send verification code. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Send phone verification code
  const handleSendPhoneVerificationCode = async () => {
    setVerificationLoading(true);
    setVerificationError('');
    
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const resultAction = await dispatch(sendPhoneVerificationCode(formattedPhone));
      
      if (sendPhoneVerificationCode.fulfilled.match(resultAction)) {
        setPhoneVerificationDialog(true);
      } else if (sendPhoneVerificationCode.rejected.match(resultAction)) {
        setVerificationError(resultAction.payload as string);
      }
    } catch (error) {
      setVerificationError('Failed to send verification code. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Verify email code
  const handleVerifyEmailCode = async () => {
    setVerificationLoading(true);
    setVerificationError('');
    
    try {
      const resultAction = await dispatch(verifyEmailCode({ 
        email, 
        code: emailVerificationCode 
      }));
      
      if (verifyEmailCode.fulfilled.match(resultAction)) {
        setEmailVerified(true);
        setEmailVerificationDialog(false);
        setActiveStep(2);
        handleSendPhoneVerificationCode();
      } else if (verifyEmailCode.rejected.match(resultAction)) {
        setVerificationError(resultAction.payload as string);
      }
    } catch (error) {
      setVerificationError('Failed to verify code. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Verify phone code
  const handleVerifyPhoneCode = async () => {
    setVerificationLoading(true);
    setVerificationError('');
    
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const resultAction = await dispatch(verifyPhoneCode({ 
        phone: formattedPhone, 
        code: phoneVerificationCode 
      }));
      
      if (verifyPhoneCode.fulfilled.match(resultAction)) {
        setPhoneVerified(true);
        setPhoneVerificationDialog(false);
        setActiveStep(3);
      } else if (verifyPhoneCode.rejected.match(resultAction)) {
        setVerificationError(resultAction.payload as string);
      }
    } catch (error) {
      setVerificationError('Failed to verify code. Please try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Final registration submission
  const handleFinalSubmit = async () => {
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const resultAction = await dispatch(register({ 
        firstName, 
        lastName, 
        email, 
        password,
        phone: formattedPhone
      }));
      
      if (register.fulfilled.match(resultAction)) {
        setRegistrationComplete(true);
        // Navigate to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  // Background SVG for decoration
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
      
      <g opacity="0.65" transform="translate(50,50)">
        <path d="M0,0 L40,0 L55,15 L55,70 L0,70 Z" fill="#f0f0f0" stroke="#dddddd" stroke-width="1"/>
        <path d="M40,0 L40,15 L55,15" fill="none" stroke="#dddddd" stroke-width="1"/>
        <line x1="10" y1="25" x2="45" y2="25" stroke="#e0e0e0" stroke-width="1"/>
        <line x1="10" y1="32" x2="45" y2="32" stroke="#e0e0e0" stroke-width="1"/>
        <line x1="10" y1="39" x2="45" y2="39" stroke="#e0e0e0" stroke-width="1"/>
      </g>
      
      <g opacity="0.65" transform="translate(70,420)">
        <rect x="0" y="0" width="50" height="60" rx="3" fill="#f5f5f5" stroke="#e0e0e0" stroke-width="1"/>
        <text x="25" y="25" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle" fill="#d0d0d0">A</text>
        <text x="25" y="45" font-family="Arial" font-size="14" text-anchor="middle" fill="#d9d9d9">a</text>
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
              <Typography variant="subtitle1">
                Enterprise Resource Planning System
              </Typography>
            </Grid>
            
            <Grid item xs={12} sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Button 
                  component={Link} 
                  to="/login" 
                  startIcon={<ArrowBack />}
                  sx={{ mr: 2 }}
                >
                  Back to Login
                </Button>
                <Typography variant="h5" component="h2" fontWeight="medium">
                  Create Account
                </Typography>
              </Box>
              
              {/* Stepper */}
              <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              
              {passwordError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {passwordError}
                </Alert>
              )}
              
              {phoneError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {phoneError}
                </Alert>
              )}
              
              {/* Step 1: Account Information */}
              {activeStep === 0 && (
                <Box component="form" onSubmit={handleAccountInfoSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        id="firstName"
                        label="First Name"
                        name="firstName"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person color="primary" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        id="lastName"
                        label="Last Name"
                        name="lastName"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Person color="primary" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2, mt: 2 }}
                  />
                  
                  <TextField
                    margin="normal"
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
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
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
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ mb: 3 }}
                  />
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    sx={{ 
                      mt: 2, 
                      mb: 2,
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Continue
                  </Button>
                </Box>
              )}
              
              {/* Step 2: Email Verification - Showing instructions */}
              {activeStep === 1 && !emailVerificationDialog && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Email sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Email Verification
                  </Typography>
                  <Typography variant="body1" paragraph>
                    We've sent a verification code to your email address:
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="bold" paragraph>
                    {email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Please check your inbox and spam folder.
                  </Typography>
                  
                  <Box sx={{ mt: 3 }}>
                    {verificationLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          onClick={handleSendEmailVerificationCode}
                          sx={{ mr: 2 }}
                        >
                          Resend Code
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => setEmailVerificationDialog(true)}
                        >
                          Enter Verification Code
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
              )}
              
              {/* Step 3: Phone Verification - Showing instructions */}
              {activeStep === 2 && !phoneVerificationDialog && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Phone sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Phone Verification
                  </Typography>
                  <Typography variant="body1" paragraph>
                    We've sent a verification code to your phone number:
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="bold" paragraph>
                    {formatPhoneNumber(phoneNumber)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Please check your SMS messages.
                  </Typography>
                  
                  <Box sx={{ mt: 3 }}>
                    {verificationLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <>
                        <Button
                          variant="outlined"
                          onClick={handleSendPhoneVerificationCode}
                          sx={{ mr: 2 }}
                        >
                          Resend Code
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => setPhoneVerificationDialog(true)}
                        >
                          Enter Verification Code
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
              )}
              
              {/* Step 4: Completion */}
              {activeStep === 3 && (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CheckCircle sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Verification Complete!
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Your email and phone have been verified.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 3 }}>
                    Click the button below to complete your registration.
                  </Typography>
                  
                  {registrationComplete ? (
                    <>
                      <Alert severity="success" sx={{ mb: 3 }}>
                        Registration successful! Redirecting to login...
                      </Alert>
                      <CircularProgress size={24} />
                    </>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleFinalSubmit}
                      disabled={loading}
                      sx={{ 
                        py: 1.5,
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {loading ? 'Creating Account...' : 'Complete Registration'}
                    </Button>
                  )}
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="black">
            © {new Date().getFullYear()} Opzon's Printing Press. All rights reserved.
          </Typography>
        </Box>
      </Container>
      
      {/* Email Verification Dialog */}
      <Dialog open={emailVerificationDialog} onClose={() => setEmailVerificationDialog(false)}>
        <DialogTitle>Email Verification</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph sx={{ mt: 1 }}>
            Enter the 6-digit code sent to your email:
          </Typography>
          
          {verificationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {verificationError}
            </Alert>
          )}
          
          <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
            <InputLabel htmlFor="email-verification-code">Verification Code</InputLabel>
            <OutlinedInput
              id="email-verification-code"
              label="Verification Code"
              value={emailVerificationCode}
              onChange={(e) => setEmailVerificationCode(e.target.value)}
              inputProps={{ maxLength: 6 }}
            />
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEmailVerificationDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleVerifyEmailCode} 
            variant="contained"
            disabled={emailVerificationCode.length !== 6 || verificationLoading}
          >
            {verificationLoading ? <CircularProgress size={24} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Phone Verification Dialog */}
      <Dialog open={phoneVerificationDialog} onClose={() => setPhoneVerificationDialog(false)}>
        <DialogTitle>Phone Verification</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph sx={{ mt: 1 }}>
            Enter the 6-digit code sent to your phone:
          </Typography>
          
          {verificationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {verificationError}
            </Alert>
          )}
          
          <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
            <InputLabel htmlFor="phone-verification-code">Verification Code</InputLabel>
            <OutlinedInput
              id="phone-verification-code"
              label="Verification Code"
              value={phoneVerificationCode}
              onChange={(e) => setPhoneVerificationCode(e.target.value)}
              inputProps={{ maxLength: 6 }}
            />
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPhoneVerificationDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleVerifyPhoneCode} 
            variant="contained"
            disabled={phoneVerificationCode.length !== 6 || verificationLoading}
          >
            {verificationLoading ? <CircularProgress size={24} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Register;