const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')

const app = express();

const port = process.env.PORT || 2626;


// middlewares:
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://careercanvas-2cb5c.web.app'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));
app.use(cookieParser())

// middleware for verifying:
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if(!token){
    return res.status(401).send({message: 'Not authorized'});
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err) {return res.status(401).send({message: 'Unauthorized'});}
    req.user = decoded;
    next();
    
  })
}

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
    

    const jobCollection     = client.db('CareerCanvas').collection('jobs');
    const bidCollection     = client.db('CareerCanvas').collection('bids');
    const commentCollection = client.db('CareerCanvas').collection('comments');

    // auth related endpoint:
    app.post('/jwt', async(req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
      res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true: false,
        sameSite: process.env.NODE_ENV === "production" ? "none": "strict",
      })
      .send({success: true});
    });

    app.post('/logout', async(req, res) => {
      res.
      clearCookie("token", {
        maxAge: 0,
        secure: process.env.NODE_ENV === "production" ? true: false,
        sameSite: process.env.NODE_ENV === "production" ? "none": "strict",
      })
      .send({success: true});
    })


    // job related endpoints:

    app.get('/postedJobs/:email', verifyToken, async(req, res) => {
      const email = req.params.email;
      const query = {email: email};
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/jobs/:categories',  async(req, res) => {
      const categories = req.params.categories;
      const query = {categories: categories};
      const cursor = jobCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/postedJobs/find/:id', async(req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await jobCollection.findOne(query);
      res.send(result);
    });

    app.get('/bids/find/:email',verifyToken, async(req, res) => {
      const email = req.params.email;
      const query = {bidderEmail: email};
      const cursor = bidCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/bidRequests/:email', verifyToken, async(req, res) => {
      const email = req.params.email;
      const query = {buyerEmail: email};
      const cursor = bidCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/jobs',verifyToken, async(req, res) => {
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.send(result);
    });

    app.post('/bids',verifyToken, async(req, res) => {
      const bid = req.body;
      const result = await bidCollection.insertOne(bid);
      res.send(result);
    });

    app.post('/comments', async(req, res) => {
      const comment = req.body;
      const result = await commentCollection.insertOne(comment);
      res.send(result);
    })

    app.delete('/postedJobs/:id',verifyToken, async(req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = {_id: new ObjectId(id)};
      const result = await jobCollection.deleteOne(query);
      res.send(result);
    });

    

    app.put('/jobs/update/:id',verifyToken, async(req, res) => {
      const id = req.params.id;
      const updatedInfo = req.body;
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const updatedDoc = {
        $set: {
          categories: updatedInfo.categories,
          minPrice: updatedInfo.minPrice,
          maxPrice: updatedInfo.maxPrice,
          title: updatedInfo.title,
          description: updatedInfo.description,
          deadline: updatedInfo.deadline
        }
      };
      const result = await jobCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    });

    app.put(`/bidRequests/status/:id`,verifyToken, async(req, res) => {
      const id = req.params.id;
      const {status} = req.body;
      const filter = {_id: new ObjectId(id)};
      const options = {upsert: true};
      const updatedDoc = {
        $set: {
          status: status
        }
      };
      const result = await bidCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    })
    
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

