const express = require('express');
const cors = require('cors');
require('dotenv').config();

const profileRoutes = require('./routes/profiles');

const app = express();

app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});
app.use(express.json());

app.use('/api/profiles', profileRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));