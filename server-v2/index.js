const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js'); 

const supabaseUrl ='https://iyjfpkcxwljfkxbjagbd.supabase.co';
const supabaseKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5amZwa2N4d2xqZmt4YmphZ2JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2Njg5NzUsImV4cCI6MjA1ODI0NDk3NX0.0fJgoMe23ZPE1Rgz70RFwV31c3qRGnt1Cciz-x_F0io';

const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Example route
app.get('/', (req, res) => {
  res.send('API is running');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});



app.get('/api/clients', async (req, res) => {
try {
    const { data, error } = await supabase
    .from('clients')
    .select('*')

    if (error) throw error;

    res.status(200).json(data);
} catch (error) {
    console.error(`Error fetching client with ID ${id}:`, error);
    res.status(500).json({ message: error.message });
}
});