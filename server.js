const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pets = [
  { id: 1, name: 'Fido' },
  { id: 2, name: 'Mittens' },
  { id: 3, name: 'Rex' },
];

let counter = 0
// GET /pet/custom
app.get('/pet/custom', (req, res) => {
  counter++;
  if (counter % 7 === 0) {
    res.status(404).json({ error: 'Simulated server error' });
  } else {
    res.json(pets[counter % pets.length]);
  }
});

// Start server
const port = 3000;
app.listen(port, () => {
    console.log(`Stub server running at http://localhost:${port}`);
});