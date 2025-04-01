import React, { useState, useEffect, CSSProperties } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import { register, clearError } from '../redux/slices/authSlice';
import { Box, Container, Paper, Typography, TextField, Button, Alert, InputAdornment, IconButton, Grid } from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person, ArrowBack } from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [dispatch, isAuthenticated, navigate]);


const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        return;
    }
    
    if (password.length < 8) {
        setPasswordError('Password must be at least 8 characters');
        return;
    }
    
    setPasswordError('');
    dispatch(register({ firstName, lastName, email, password }));
};

  const bgSvgCode = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
  <defs>
    <pattern id="paperTexture" patternUnits="userSpaceOnUse" width="100" height="100">
      <rect width="100" height="100" fill="#f8f9fa"/>
      <rect width="100" height="100" fill="#f0f2f5" opacity="0.3"/>
      <path d="M0 50 L100 50 M50 0 L50 100" stroke="#e9ecef" stroke-width="0.5" opacity="0.4"/>
    </pattern>
    
    <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d0d0d0"/>
      <stop offset="50%" stop-color="#a0a0a0"/>
      <stop offset="100%" stop-color="#d0d0d0"/>
    </linearGradient>
    
    <linearGradient id="highlightGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    
    <linearGradient id="cmykGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00AEEF" stop-opacity="0.7"/>
      <stop offset="33%" stop-color="#EC008C" stop-opacity="0.7"/>
      <stop offset="66%" stop-color="#FFF200" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#00A651" stop-opacity="0.7"/>
    </linearGradient>
    
    <pattern id="paperStackPattern" patternUnits="userSpaceOnUse" width="30" height="10">
      <rect width="30" height="1" fill="#f0f0f0" y="0"/>
      <rect width="30" height="1" fill="#e8e8e8" y="1"/>
      <rect width="30" height="1" fill="#f0f0f0" y="2"/>
      <rect width="30" height="1" fill="#e8e8e8" y="3"/>
      <rect width="30" height="1" fill="#f0f0f0" y="4"/>
      <rect width="30" height="1" fill="#e8e8e8" y="5"/>
      <rect width="30" height="1" fill="#f0f0f0" y="6"/>
      <rect width="30" height="1" fill="#e8e8e8" y="7"/>
      <rect width="30" height="1" fill="#f0f0f0" y="8"/>
      <rect width="30" height="1" fill="#e8e8e8" y="9"/>
    </pattern>
  </defs>
  
  <rect width="1200" height="800" fill="url(#paperTexture)"/>
  
  <g transform="translate(50, 500) scale(0.8)" opacity="0.6">
    <rect x="0" y="0" width="280" height="150" rx="5" fill="url(#metalGradient)" stroke="#707070" stroke-width="1"/>
    <rect x="-30" y="30" width="30" height="90" fill="#c0c0c0" stroke="#707070" stroke-width="1"/>
    <rect x="-30" y="30" width="30" height="90" fill="url(#paperStackPattern)"/>
    <rect x="20" y="20" width="80" height="40" rx="3" fill="#303030" stroke="#202020" stroke-width="1"/>
    <rect x="30" y="30" width="60" height="20" rx="2" fill="#404040"/>
    <circle cx="40" cy="40" r="5" fill="#00ff00"/>
    <circle cx="60" cy="40" r="5" fill="#ff0000"/>
    <circle cx="80" cy="40" r="5" fill="#ffff00"/>
    <rect x="120" y="30" width="140" height="90" rx="3" fill="#a0a0a0" stroke="#808080" stroke-width="1"/>
    <ellipse cx="150" cy="50" rx="20" ry="10" fill="#909090" stroke="#707070" stroke-width="1"/>
    <ellipse cx="190" cy="50" rx="20" ry="10" fill="#909090" stroke="#707070" stroke-width="1"/>
    <ellipse cx="230" cy="50" rx="20" ry="10" fill="#909090" stroke="#707070" stroke-width="1"/>
    <ellipse cx="150" cy="80" rx="20" ry="10" fill="#909090" stroke="#707070" stroke-width="1"/>
    <ellipse cx="190" cy="80" rx="20" ry="10" fill="#909090" stroke="#707070" stroke-width="1"/>
    <ellipse cx="230" cy="80" rx="20" ry="10" fill="#909090" stroke="#707070" stroke-width="1"/>
    <rect x="120" y="95" width="140" height="5" fill="url(#cmykGradient)" opacity="0.5"/>
    <rect x="280" y="60" width="70" height="10" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="290" y="70" width="70" height="10" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="300" y="80" width="70" height="10" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="10" y="150" width="260" height="20" rx="2" fill="#808080" stroke="#606060" stroke-width="1"/>
    <rect x="30" y="170" width="30" height="50" fill="#707070" stroke="#505050" stroke-width="1"/>
    <rect x="220" y="170" width="30" height="50" fill="#707070" stroke="#505050" stroke-width="1"/>
  </g>
  
  <g transform="translate(800, 100) scale(0.7)" opacity="0.6">
    <rect x="0" y="0" width="200" height="150" rx="10" fill="#e0e0e0" stroke="#c0c0c0" stroke-width="1"/>
    <rect x="20" y="30" width="160" height="100" rx="5" fill="#d0d0d0" stroke="#b0b0b0" stroke-width="1"/>
    <rect x="30" y="40" width="140" height="80" rx="3" fill="#f0f0f0" stroke="#d0d0d0" stroke-width="1"/>
    <rect x="50" y="5" width="100" height="20" rx="2" fill="#202020" stroke="#000000" stroke-width="1"/>
    <rect x="55" y="8" width="90" height="14" rx="1" fill="#3498db"/>
    <rect x="60" y="11" width="40" height="4" rx="1" fill="#ffffff" opacity="0.7"/>
    <rect x="60" y="17" width="30" height="2" rx="1" fill="#ffffff" opacity="0.5"/>
    <rect x="40" y="50" width="120" height="10" fill="#a0a0a0" stroke="#909090" stroke-width="1"/>
    <rect x="60" y="50" width="20" height="10" fill="#404040" stroke="#303030" stroke-width="1"/>
    <rect x="62" y="60" width="16" height="5" fill="#303030"/>
    <circle cx="65" cy="62" r="1" fill="#00aaff"/>
    <circle cx="70" cy="62" r="1" fill="#ff00aa"/>
    <circle cx="75" cy="62" r="1" fill="#ffaa00"/>
    <rect x="30" y="130" width="140" height="20" fill="#c0c0c0" stroke="#a0a0a0" stroke-width="1"/>
    <rect x="40" y="125" width="120" height="5" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5"/>
    <rect x="40" y="120" width="120" height="5" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5"/>
    <rect x="40" y="115" width="120" height="5" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5"/>
    <rect x="200" y="60" width="50" height="80" fill="#d0d0d0" stroke="#b0b0b0" stroke-width="1"/>
    <rect x="200" y="70" width="50" height="5" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5"/>
    <rect x="200" y="80" width="50" height="5" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5"/>
    <rect x="200" y="90" width="50" height="5" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5"/>
    <path d="M0 140 C-20 140, -20 160, -40 160" fill="none" stroke="#505050" stroke-width="2"/>
  </g>
  
  <g transform="translate(500, 300) rotate(-5)" opacity="0.6">
    <rect x="0" y="0" width="120" height="5" fill="#c0c0c0" stroke="#a0a0a0" stroke-width="0.5"/>
    <rect x="0" y="5" width="120" height="5" fill="#d0d0d0" stroke="#b0b0b0" stroke-width="0.5"/>
    <rect x="0" y="10" width="120" height="5" fill="#e0e0e0" stroke="#c0c0c0" stroke-width="0.5"/>
    <rect x="0" y="15" width="120" height="5" fill="#f0f0f0" stroke="#d0d0d0" stroke-width="0.5"/>
    <rect x="-10" y="20" width="140" height="80" fill="#e0e0e0" stroke="#c0c0c0" stroke-width="0.5"/>
    <rect x="10" y="30" width="100" height="60" fill="#d0d0d0" stroke="#b0b0b0" stroke-width="0.5"/>
    <text x="60" y="65" font-family="Arial" font-size="12" text-anchor="middle" fill="#505050">PRINT PLATE</text>
    <rect x="20" y="35" width="80" height="2" fill="#a0a0a0"/>
    <rect x="20" y="45" width="60" height="2" fill="#a0a0a0"/>
    <rect x="20" y="75" width="40" height="2" fill="#a0a0a0"/>
  </g>
  
  <g transform="translate(150, 150) rotate(5)" opacity="0.6">
    <rect x="0" y="0" width="150" height="100" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="5" y="-5" width="150" height="100" fill="#f8f8f8" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="10" y="-10" width="150" height="100" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="15" y="-15" width="150" height="100" fill="#ffffff" stroke="#e0e0e0" stroke-width="1"/>
    <rect x="25" y="-5" width="130" height="80" fill="#f0f0f0" stroke="#e0e0e0" stroke-width="0.5"/>
    <rect x="35" y="5" width="110" height="5" fill="#d0d0d0"/>
    <rect x="35" y="15" width="90" height="5" fill="#d0d0d0"/>
    <rect x="35" y="25" width="100" height="5" fill="#d0d0d0"/>
    <rect x="35" y="35" width="70" height="5" fill="#d0d0d0"/>
    <rect x="35" y="55" width="10" height="10" fill="#00AEEF" opacity="0.7"/>
    <rect x="50" y="55" width="10" height="10" fill="#EC008C" opacity="0.7"/>
    <rect x="65" y="55" width="10" height="10" fill="#FFF200" opacity="0.7"/>
    <rect x="80" y="55" width="10" height="10" fill="#00A651" opacity="0.7"/>
    <path d="M25 -15 L25 -10 M15 -5 L20 -5" stroke="#000000" stroke-width="0.5"/>
    <path d="M165 -15 L165 -10 M160 -5 L170 -5" stroke="#000000" stroke-width="0.5"/>
    <path d="M25 85 L25 80 M15 75 L20 75" stroke="#000000" stroke-width="0.5"/>
    <path d="M165 85 L165 80 M160 75 L170 75" stroke="#000000" stroke-width="0.5"/>
  </g>
  
  <g transform="translate(750, 550) scale(0.9)" opacity="0.6">
    <rect x="0" y="0" width="300" height="80" rx="5" fill="#404040" stroke="#303030" stroke-width="1"/>
    <rect x="-20" y="20" width="20" height="40" fill="#e0e0e0" stroke="#c0c0c0" stroke-width="1"/>
    <ellipse cx="-10" cy="20" rx="10" ry="5" fill="#ffffff" stroke="#d0d0d0" stroke-width="1"/>
    <ellipse cx="-10" cy="60" rx="10" ry="5" fill="#ffffff" stroke="#d0d0d0" stroke-width="1"/>
    <rect x="-15" y="20" width="10" height="40" fill="url(#paperStackPattern)"/>
    <rect x="10" y="10" width="280" height="60" rx="3" fill="#303030" stroke="#202020" stroke-width="1"/>
    <rect x="15" y="15" width="270" height="5" fill="#a0a0a0" stroke="#808080" stroke-width="0.5"/>
    <rect x="100" y="15" width="30" height="10" fill="#808080" stroke="#606060" stroke-width="1"/>
    <rect x="105" y="25" width="20" height="5" fill="#505050"/>
    <circle cx="110" cy="28" r="1" fill="#00aaff"/>
    <circle cx="115" cy="28" r="1" fill="#ff00aa"/>
    <circle cx="120" cy="28" r="1" fill="#ffaa00"/>
    <rect x="0" y="40" width="300" height="2" fill="#ffffff" opacity="0.3"/>
    <rect x="240" y="25" width="40" height="25" rx="2" fill="#202020" stroke="#101010" stroke-width="1"/>
    <rect x="245" y="30" width="30" height="15" rx="1" fill="#303030"/>
    <circle cx="250" cy="45" r="2" fill="#00ff00"/>
    <circle cx="260" cy="45" r="2" fill="#ff0000"/>
    <circle cx="270" cy="45" r="2" fill="#0000ff"/>
    <rect x="300" y="40" width="60" height="2" fill="#ffffff"/>
    <rect x="300" y="38" width="50" height="2" fill="#ffffff"/>
    <rect x="300" y="36" width="40" height="2" fill="#ffffff"/>
    <rect x="30" y="80" width="30" height="40" fill="#505050" stroke="#404040" stroke-width="1"/>
    <rect x="240" y="80" width="30" height="40" fill="#505050" stroke="#404040" stroke-width="1"/>
  </g>
  
  <g transform="translate(150, 400)" opacity="0.6">
    <rect x="0" y="0" width="25" height="40" rx="3" fill="#00AEEF" opacity="0.8"/>
    <rect x="5" y="-5" width="15" height="5" rx="1" fill="#00AEEF" opacity="0.8"/>
    <rect x="8" y="-10" width="9" height="5" rx="2" fill="#000000" opacity="0.8"/>
    <rect x="30" y="0" width="25" height="40" rx="3" fill="#EC008C" opacity="0.8"/>
    <rect x="35" y="-5" width="15" height="5" rx="1" fill="#EC008C" opacity="0.8"/>
    <rect x="38" y="-10" width="9" height="5" rx="2" fill="#000000" opacity="0.8"/>
    <rect x="60" y="0" width="25" height="40" rx="3" fill="#FFF200" opacity="0.8"/>
    <rect x="65" y="-5" width="15" height="5" rx="1" fill="#FFF200" opacity="0.8"/>
    <rect x="68" y="-10" width="9" height="5" rx="2" fill="#000000" opacity="0.8"/>
    <rect x="90" y="0" width="25" height="40" rx="3" fill="#000000" opacity="0.8"/>
    <rect x="95" y="-5" width="15" height="5" rx="1" fill="#000000" opacity="0.8"/>
    <rect x="98" y="-10" width="9" height="5" rx="2" fill="#000000" opacity="0.8"/>
  </g>
  
  <g transform="translate(850, 350)" opacity="0.6">
    <rect x="0" y="0" width="120" height="80" rx="3" fill="#404040" stroke="#303030" stroke-width="1"/>
    <rect x="5" y="5" width="110" height="65" fill="#202020" stroke="#101010" stroke-width="1"/>
    <rect x="10" y="10" width="100" height="55" fill="#ffffff"/>
    <rect x="15" y="15" width="90" height="45" fill="#f0f0f0"/>
    <rect x="20" y="20" width="20" height="20" fill="#e0e0e0"/>
    <rect x="45" y="20" width="50" height="5" fill="#c0c0c0"/>
    <rect x="45" y="30" width="40" height="5" fill="#c0c0c0"/>
    <rect x="20" y="45" width="75" height="10" fill="#d0d0d0"/>
    <rect x="50" y="80" width="20" height="10" fill="#505050" stroke="#404040" stroke-width="1"/>
    <rect x="40" y="90" width="40" height="5" rx="1" fill="#606060" stroke="#505050" stroke-width="1"/>
    <rect x="20" y="100" width="80" height="20" rx="2" fill="#505050" stroke="#404040" stroke-width="1"/>
    <rect x="25" y="105" width="70" height="10" rx="1" fill="#404040" stroke="#303030" stroke-width="0.5"/>
    <ellipse cx="120" cy="110" rx="10" ry="15" fill="#505050" stroke="#404040" stroke-width="1"/>
  </g>
  
  <g transform="translate(400, 650)" opacity="0.6">
    <rect x="0" y="0" width="200" height="40" fill="#707070" stroke="#606060" stroke-width="1"/>
    <line x1="10" y1="0" x2="10" y2="40" stroke="#606060" stroke-width="1"/>
    <line x1="30" y1="0" x2="30" y2="40" stroke="#606060" stroke-width="1"/>
    <line x1="50" y1="0" x2="50" y2="40" stroke="#606060" stroke-width="1"/>
    <line x1="70" y1="0" x2="70" y2="40" stroke="#606060" stroke-width="1"/>
    <line x1="90" y1="0" x2="90" y2="40" stroke="#606060" stroke-width="1"/>
    <line x1="110" y1="0" x2="110" y2="40" stroke="#606060" stroke-width="1"/>
    <line x1="130" y1="0" x2="130" y2="40" stroke="#606060" stroke-width="1"/>
    <line x1="150" y1="0" x2="150" y2="40" stroke="#606060" stroke-width="1"/>
    <line x1="170" y1="0" x2="170" y2="40" stroke="#606060" stroke-width="1"/>
    <line x1="190" y1="0" x2="190" y2="40" stroke="#606060" stroke-width="1"/>
    <rect x="20" y="-5" width="40" height="30" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5" transform="rotate(5, 40, 10)"/>
    <rect x="80" y="-2" width="30" height="20" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5" transform="rotate(-3, 95, 8)"/>
    <rect x="130" y="-3" width="50" height="35" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5" transform="rotate(2, 155, 14)"/>
    <rect x="-10" y="40" width="220" height="10" rx="5" fill="#505050" stroke="#404040" stroke-width="1"/>
    <circle cx="0" cy="45" r="5" fill="#606060" stroke="#505050" stroke-width="0.5"/>
    <circle cx="200" cy="45" r="5" fill="#606060" stroke="#505050" stroke-width="0.5"/>
  </g>
  
  <rect width="1200" height="800" fill="url(#cmykGradient)" opacity="0.02"/>
  
  <g opacity="0.5">
    <rect x="300" y="200" width="70" height="90" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5" transform="rotate(15, 335, 245)"/>
    <rect x="650" y="450" width="80" height="60" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5" transform="rotate(-10, 690, 480)"/>
    <rect x="900" y="250" width="60" height="80" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5" transform="rotate(5, 930, 290)"/>
    <rect x="450" y="150" width="90" height="60" fill="#ffffff" stroke="#e0e0e0" stroke-width="0.5" transform="rotate(-5, 495, 180)"/>
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
              
              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
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
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>
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
    </Box>
  );
};

export default Register;