const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();

const port = process.env.PORT || 2626;


// middlewares:
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));

// mongodb connection:
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.we6nhxz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const jobCollection = client.db('CareerCanvas').collection('jobs');

    app.get('/postedJobs/:email', async(req, res) => {
      const email = req.params.email;
      const query = {email: email};
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/jobs', async(req, res) => {
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.send(result);
    });

  }
   finally {

  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send(`CareerCanvas Server is Running`);
});

app.listen(port, () => {
    console.log(`Hello from port : ${port}`);
})

