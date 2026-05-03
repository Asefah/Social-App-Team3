const auth_logic = require('./auth_logic');

const express = require('express');
const app = express();

app.use(express.json());


app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const token = auth_logic.loginUser(email, password);

  if (token) {
    return res.json({ success: true, token });
  }

  res.status(401).json({ success: false });
});



app.listen(5000, () => {
  console.log("Server running on port 5000");
});