const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 2626;


// middlewares:
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send(`CareerCanvas Server is Running`);
});

app.listen(port, () => {
    console.log(`Hello from port : ${port}`);
})

