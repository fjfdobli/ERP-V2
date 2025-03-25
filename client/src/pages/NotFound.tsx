import React from 'react';
import { Box, Typography, Button, Paper, Container, Grid } from '@mui/material';
import { SentimentDissatisfied as SadIcon, Home as HomeIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md">
      <Paper 
        elevation={3}
        sx={{
          py: 8,
          px: 4,
          mt: 8,
          mb: 8,
          borderRadius: 2,
          textAlign: 'center',
          borderTop: '8px solid #3f51b5'
        }}
      >
        <SadIcon sx={{ fontSize: 100, color: '#3f51b5', mb: 2 }} />
        
        <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
          404
        </Typography>
        
        <Typography variant="h5" gutterBottom color="textSecondary">
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="textSecondary" paragraph sx={{ maxWidth: '500px', mx: 'auto', mt: 2 }}>
          Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
        </Typography>
        
        <Box sx={{ borderTop: '1px solid #eaeaea', pt: 4, mt: 4 }}>
          <Typography variant="subtitle1" gutterBottom>
            You may want to:
          </Typography>
          
          <Grid container spacing={2} justifyContent="center" sx={{ mt: 2 }}>
            <Grid item>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<HomeIcon />}
                onClick={() => navigate('/')}
              >
                Return to Dashboard
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default NotFound;