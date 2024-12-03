const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const app = express();

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// In-memory storage for menu items and orders
let menu = [];
let orders = [];

// Valid categories for menu items
const validCategories = ['Starter', 'Main Course', 'Dessert', 'Beverage'];

// Helper function to validate price
const validatePrice = (price) => price > 0;

// Add Menu Item (POST /menu)
app.post('/menu', (req, res) => {
  const { name, price, category } = req.body;

  // Validate price
  if (!validatePrice(price)) {
    return res.status(400).json({ error: 'Price must be a positive number.' });
  }

  // Validate category
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category.' });
  }

  const newItem = { id: menu.length + 1, name, price, category };
  menu.push(newItem);
  res.status(201).json(newItem);
});

// Get Menu (GET /menu)
app.get('/menu', (req, res) => {
  res.status(200).json(menu);
});

// Remove Menu Item (DELETE /menu/:id)
app.delete('/menu/:id', (req, res) => {
  const itemId = parseInt(req.params.id, 10);
  menu = menu.filter(item => item.id !== itemId);
  res.status(200).json({ message: 'Item removed successfully' });
});

// Place Order (POST /orders)
app.post('/orders', (req, res) => {
  const { items } = req.body;

  // Validate that all item IDs exist in the menu
  const invalidItems = items.filter(itemId => !menu.some(item => item.id === itemId));
  if (invalidItems.length > 0) {
    return res.status(400).json({ error: `Invalid item IDs: ${invalidItems.join(', ')}` });
  }

  const newOrder = {
    id: orders.length + 1,
    items: items.map(itemId => menu.find(item => item.id === itemId)),
    status: 'Preparing'
  };
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

// Get Order Details (GET /orders/:id)
app.get('/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id, 10);
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  res.status(200).json(order);
});

// CRON job to simulate status updates (every 10 seconds)
cron.schedule('*/10 * * * * *', () => {
  orders.forEach(order => {
    if (order.status === 'Preparing') {
      order.status = 'Out for Delivery';
    } else if (order.status === 'Out for Delivery') {
      order.status = 'Delivered';
    }
  });
  console.log('Order statuses updated');
});

// Start server on port 3004
app.listen(3004, () => {
  console.log('Server is running on http://localhost:3004');
});
