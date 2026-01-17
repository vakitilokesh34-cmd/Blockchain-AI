const express = require('express');
const cors = require('cors');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Twilio Status Callback
app.post("/twilio/status", (req, res) => {
  const { MessageSid, MessageStatus, To } = req.body;
  console.log(`[Twilio Webhook] Status Update: SID=${MessageSid}, Status=${MessageStatus}, To=${To}`);
  // In a real app, update the database here
  res.sendStatus(200);
});

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Smart Autonomous University Agent API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
