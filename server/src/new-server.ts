import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://iyjfpkcxwljfkxbjagbd.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || ''; // Add your service role key here
const supabase = createClient(supabaseUrl, supabaseKey);

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Initialize Express app
const app = express();
const PORT = 9999;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Authentication middleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  
  try {
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    
    req.user = data.user;
    next();
  } catch (error: any) {
    return res.status(401).json({ success: false, error: error.message });
  }
};

// Basic route
app.get('/', (req: Request, res: Response) => {
  res.send('Printing Press ERP API is running');
});

// Test route
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working!' });
});

// Test Supabase connection
app.get('/api/test-db', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('clients').select('count');
    
    if (error) {
      return res.status(400).json({ 
        success: false, 
        message: 'Failed to connect to database', 
        error: error.message 
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Successfully connected to Supabase database',
      data
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// ================ AUTH ROUTES ================

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName
        }
      }
    });
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(201).json({
      success: true,
      message: 'User created successfully. Please check your email for confirmation.',
      data: {
        user: data.user
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return res.status(401).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user
    }
  });
});

// ================ CLIENTS ROUTES ================

app.get('/api/clients', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*');
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/clients/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/clients', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, contactPerson, email, phone, address, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    
    const { data, error } = await supabase
      .from('clients')
      .insert([{ 
        name, 
        contactPerson, 
        email, 
        phone, 
        address, 
        notes,
        createdBy: req.user.id
      }])
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(201).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/clients/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, email, phone, address, notes } = req.body;
    
    const { data, error } = await supabase
      .from('clients')
      .update({ 
        name, 
        contactPerson, 
        email, 
        phone, 
        address, 
        notes, 
        updatedAt: new Date() 
      })
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/clients/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Client deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ================ ORDERS ROUTES ================

app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*, clients(name)');
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('orders')
      .select('*, clients(name), orderItems(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/orders', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { clientId, title, description, status, deadline, items } = req.body;
    
    if (!clientId || !title) {
      return res.status(400).json({ success: false, error: 'Client ID and title are required' });
    }
    
    // Generate a unique order ID (e.g., ORD-2025-00001)
    const orderIdPrefix = 'ORD-' + new Date().getFullYear() + '-';
    const { data: lastOrder, error: countError } = await supabase
      .from('orders')
      .select('orderId')
      .ilike('orderId', orderIdPrefix + '%')
      .order('orderId', { ascending: false })
      .limit(1);
    
    let nextOrderNumber = 1;
    if (!countError && lastOrder && lastOrder.length > 0) {
      const lastOrderNumber = parseInt(lastOrder[0].orderId.split('-')[2]);
      nextOrderNumber = lastOrderNumber + 1;
    }
    
    const orderId = orderIdPrefix + nextOrderNumber.toString().padStart(5, '0');
    
    // Calculate total amount
    let totalAmount = 0;
    if (items && items.length > 0) {
      totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    }
    
    // Create order
    const { data, error } = await supabase
      .from('orders')
      .insert([{ 
        orderId, 
        clientId, 
        title, 
        description, 
        status: status || 'Pending', 
        totalAmount,
        amountPaid: 0,
        deadline,
        createdBy: req.user.id
      }])
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    // Create order items if provided
    if (items && items.length > 0 && data && data.length > 0) {
      const orderItems = items.map((item: any) => ({
        orderId: data[0].id,
        ...item
      }));
      
      const { error: itemsError } = await supabase
        .from('orderItems')
        .insert(orderItems);
      
      if (itemsError) {
        return res.status(400).json({ 
          success: false, 
          error: 'Order created but failed to add items: ' + itemsError.message 
        });
      }
    }
    
    return res.status(201).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/orders/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { clientId, title, description, status, deadline } = req.body;
    
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        clientId, 
        title, 
        description, 
        status, 
        deadline, 
        updatedAt: new Date() 
      })
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/orders/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updatedAt: new Date() })
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/orders/:id/items', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const item = req.body;
    
    if (!item.itemName || !item.quantity || !item.unitPrice) {
      return res.status(400).json({ 
        success: false, 
        error: 'Item name, quantity, and unit price are required' 
      });
    }
    
    const { data, error } = await supabase
      .from('orderItems')
      .insert([{ ...item, orderId: id }])
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    // Update order total amount
    const { data: orderItems } = await supabase
      .from('orderItems')
      .select('quantity, unitPrice')
      .eq('orderId', id);
    
    if (orderItems) {
      const totalAmount = orderItems.reduce(
        (sum: number, item: any) => sum + (item.quantity * item.unitPrice), 
        0
      );
      
      await supabase
        .from('orders')
        .update({ totalAmount, updatedAt: new Date() })
        .eq('id', id);
    }
    
    return res.status(201).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Process an order (update status and inventory)
app.post('/api/orders/:id/process', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Update order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({ status, updatedAt: new Date() })
      .eq('id', id)
      .select('*, orderItems(*)')
      .single();
    
    if (orderError) {
      return res.status(400).json({ success: false, error: orderError.message });
    }
    
    // If status is "In Progress", update inventory
    if (status === 'In Progress' && order?.orderItems) {
      // For each item, reduce inventory quantity
      for (const item of order.orderItems) {
        // Find matching inventory items based on specifications
        const { data: inventoryItems, error: invError } = await supabase
          .from('inventory')
          .select('*')
          .eq('itemType', item.itemType)
          .eq('paperType', item.paperType)
          .single();
        
        if (!invError && inventoryItems) {
          // Update inventory quantity
          const newQuantity = Math.max(0, inventoryItems.quantity - item.quantity);
          await supabase
            .from('inventory')
            .update({ quantity: newQuantity, updatedAt: new Date() })
            .eq('id', inventoryItems.id);
          
          // Record transaction
          await supabase
            .from('inventoryTransactions')
            .insert([{
              inventoryId: inventoryItems.id,
              transactionType: 'Order Usage',
              quantity: item.quantity,
              orderId: id,
              createdBy: req.user.id
            }]);
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ================ INVENTORY ROUTES ================

app.get('/api/inventory', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, suppliers(name)');
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/inventory/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('inventory')
      .select('*, suppliers(name)')
      .eq('id', id)
      .single();
    
    if (error) {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/inventory/low-stock', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('inventory')
      .select('*, suppliers(name)')
      .lt('quantity', 'minStockLevel');
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/inventory', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { itemName, itemType, sku, quantity, unitPrice, minStockLevel, supplierId } = req.body;
    
    if (!itemName || !itemType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Item name and type are required' 
      });
    }
    
    const { data, error } = await supabase
      .from('inventory')
      .insert([{ 
        itemName, 
        itemType, 
        sku, 
        quantity: quantity || 0, 
        unitPrice: unitPrice || 0,
        minStockLevel: minStockLevel || 10,
        supplierId
      }])
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(201).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/inventory/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { itemName, itemType, sku, quantity, unitPrice, minStockLevel, supplierId } = req.body;
    
    const { data, error } = await supabase
      .from('inventory')
      .update({ 
        itemName, 
        itemType, 
        sku, 
        quantity, 
        unitPrice, 
        minStockLevel, 
        supplierId,
        updatedAt: new Date() 
      })
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/inventory/:id/transactions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { transactionType, quantity, orderId } = req.body;
    
    if (!transactionType || !quantity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Transaction type and quantity are required' 
      });
    }
    
    // Get current inventory item
    const { data: inventoryItem, error: getError } = await supabase
      .from('inventory')
      .select('*')
      .eq('id', id)
      .single();
    
    if (getError) {
      return res.status(404).json({ success: false, error: 'Inventory item not found' });
    }
    
    // Calculate new quantity
    let newQuantity = inventoryItem.quantity;
    if (transactionType === 'Restock' || transactionType === 'Adjustment Increase') {
      newQuantity += quantity;
    } else if (transactionType === 'Order Usage' || transactionType === 'Adjustment Decrease') {
      newQuantity = Math.max(0, newQuantity - quantity);
    }
    
    // Update inventory quantity
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ quantity: newQuantity, updatedAt: new Date() })
      .eq('id', id);
    
    if (updateError) {
      return res.status(400).json({ success: false, error: updateError.message });
    }
    
    // Record transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('inventoryTransactions')
      .insert([{
        inventoryId: id,
        transactionType,
        quantity,
        orderId,
        createdBy: req.user.id
      }])
      .select();
    
    if (transactionError) {
      return res.status(400).json({ success: false, error: transactionError.message });
    }
    
    return res.status(201).json({
      success: true,
      data: {
        transaction: transaction[0],
        newQuantity
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ================ SUPPLIERS ROUTES ================

app.get('/api/suppliers', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*');
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/suppliers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/suppliers', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, contactPerson, email, phone, address, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }
    
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{ 
        name, 
        contactPerson, 
        email, 
        phone, 
        address, 
        notes,
        createdBy: req.user.id
      }])
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(201).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/suppliers/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, contactPerson, email, phone, address, notes } = req.body;
    
    const { data, error } = await supabase
      .from('suppliers')
      .update({ 
        name, 
        contactPerson, 
        email, 
        phone, 
        address, 
        notes, 
        updatedAt: new Date() 
      })
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/suppliers/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ================ EMPLOYEES ROUTES ================

app.get('/api/employees', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*');
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/employees/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Continuing EMPLOYEES ROUTES
app.post('/api/employees', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, phone, position, department, baseSalary, joiningDate } = req.body;
    
    if (!firstName || !lastName || !position || !baseSalary) {
      return res.status(400).json({ 
        success: false, 
        error: 'First name, last name, position, and base salary are required' 
      });
    }
    
    // Generate a unique employee ID (e.g., EMP-001)
    const { data: lastEmployee, error: countError } = await supabase
      .from('employees')
      .select('employeeId')
      .order('employeeId', { ascending: false })
      .limit(1);
    
    let nextEmployeeNumber = 1;
    if (!countError && lastEmployee && lastEmployee.length > 0) {
      const lastNumber = parseInt(lastEmployee[0].employeeId.split('-')[1]);
      nextEmployeeNumber = lastNumber + 1;
    }
    
    const employeeId = 'EMP-' + nextEmployeeNumber.toString().padStart(3, '0');
    
    const { data, error } = await supabase
      .from('employees')
      .insert([{ 
        employeeId,
        firstName, 
        lastName, 
        email, 
        phone, 
        position, 
        department, 
        baseSalary,
        joiningDate: joiningDate || new Date(),
        createdBy: req.user.id
      }])
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(201).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/employees/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phone, position, department, baseSalary, joiningDate } = req.body;
    
    const { data, error } = await supabase
      .from('employees')
      .update({ 
        firstName, 
        lastName, 
        email, 
        phone, 
        position, 
        department, 
        baseSalary,
        joiningDate,
        updatedAt: new Date() 
      })
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/employees/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ================ ATTENDANCE ROUTES ================

app.get('/api/attendance', async (req: Request, res: Response) => {
  try {
    const { date, employeeId } = req.query;
    let query = supabase.from('attendance').select('*, employees(firstName, lastName)');
    
    if (date) {
      query = query.eq('attendanceDate', date);
    }
    
    if (employeeId) {
      query = query.eq('employeeId', employeeId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/attendance', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { employeeId, attendanceDate, morningPresent, afternoonPresent, notes } = req.body;
    
    if (!employeeId || !attendanceDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Employee ID and date are required' 
      });
    }
    
    // Check if attendance record already exists for this employee and date
    const { data: existingRecord, error: checkError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employeeId', employeeId)
      .eq('attendanceDate', attendanceDate)
      .maybeSingle();
    
    if (existingRecord) {
      return res.status(400).json({ 
        success: false, 
        error: 'Attendance record already exists for this employee and date' 
      });
    }
    
    const { data, error } = await supabase
      .from('attendance')
      .insert([{ 
        employeeId, 
        attendanceDate, 
        morningPresent: morningPresent || false, 
        afternoonPresent: afternoonPresent || false,
        status: 'Recorded',
        notes,
        createdBy: req.user.id
      }])
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(201).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/attendance/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { morningPresent, afternoonPresent, morningIn, morningOut, afternoonIn, afternoonOut, status, notes } = req.body;
    
    const { data, error } = await supabase
      .from('attendance')
      .update({ 
        morningPresent, 
        afternoonPresent, 
        morningIn, 
        morningOut, 
        afternoonIn, 
        afternoonOut,
        status,
        notes,
        updatedAt: new Date() 
      })
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ================ MACHINERY ROUTES ================

app.get('/api/machinery', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('machinery')
      .select('*');
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/machinery/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('machinery')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/machinery', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, model, serialNumber, status, purchaseDate, warrantyUntil, specifications } = req.body;
    
    if (!name || !model) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and model are required' 
      });
    }
    
    const { data, error } = await supabase
      .from('machinery')
      .insert([{ 
        name, 
        model, 
        serialNumber, 
        status: status || 'Operational', 
        purchaseDate, 
        warrantyUntil,
        specifications
      }])
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(201).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/machinery/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }
    
    const { data, error } = await supabase
      .from('machinery')
      .update({ status, updatedAt: new Date() })
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(200).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/machinery/:id/maintenance', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { maintenanceDate, maintenanceType, description, cost, performedBy } = req.body;
    
    if (!maintenanceDate || !maintenanceType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maintenance date and type are required' 
      });
    }
    
    const { data, error } = await supabase
      .from('maintenanceLogs')
      .insert([{ 
        machineryId: id, 
        maintenanceDate, 
        maintenanceType, 
        description, 
        cost: cost || 0,
        performedBy,
        createdBy: req.user.id
      }])
      .select();
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    return res.status(201).json({
      success: true,
      data: data[0]
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ================ REPORTS ROUTES ================

app.get('/api/reports/sales', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = supabase.from('orders').select('*');
    
    if (startDate) {
      query = query.gte('createdAt', startDate);
    }
    
    if (endDate) {
      query = query.lte('createdAt', endDate);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    // Calculate totals
    const totalOrders = data.length;
    const totalSales = data.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
    const totalPaid = data.reduce((sum: number, order: any) => sum + (order.amountPaid || 0), 0);
    const outstanding = totalSales - totalPaid;
    
    // Group by status
    const statusCounts: Record<string, number> = {};
    data.forEach((order: any) => {
      if (order.status) {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalSales,
        totalPaid,
        outstanding,
        statusCounts,
        orders: data
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/reports/inventory', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Get all inventory items
    const { data: inventory, error: inventoryError } = await supabase
      .from('inventory')
      .select('*');
    
    if (inventoryError) {
      return res.status(400).json({ success: false, error: inventoryError.message });
    }
    
    // Get low stock items
    const { data: lowStock, error: lowStockError } = await supabase
      .from('inventory')
      .select('*')
      .lt('quantity', 'minStockLevel');
    
    if (lowStockError) {
      return res.status(400).json({ success: false, error: lowStockError.message });
    }
    
    // Calculate inventory value
    const totalItems = inventory.length;
    const totalValue = inventory.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    const lowStockCount = lowStock.length;
    
    return res.status(200).json({
      success: true,
      data: {
        totalItems,
        totalValue,
        lowStockCount,
        lowStockItems: lowStock,
        inventory
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;