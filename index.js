const express =require('express');
const app = express();
const cors=require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');

//env port or 5000 port
const PORT =  process.env.PORT || 5000;
//middleware
app.use(cors());
app.use(express.json());
require('dotenv').config();


//verify token
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).send({ error: true, message: 'Unauthorized Access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).send({ error: true, message: 'Unauthorized Access' })
      }
      req.decoded = decoded;
      next();
    })
    }







const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lkb5wuy.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect((err) => {
        if (err) {
          console.log(err);
          return;
          } 
      });

      //find collection
      const classesCollection=client.db("artandcraft").collection("classes");
      const usersCollection = client.db("artandcraft").collection("users");

       //get all classes
         app.get('/classes',async(req,res)=>{
            const query =classesCollection.find();
            const allClasses=await query.toArray();
            res.json(allClasses);
        }
        )


        //get all users
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });
    
        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);
    
            if (existingUser) {
            return res.send({ message: 'User already exists' })
            }
    
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


        // route admin 

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
      
            if (req.decoded.email !== email) {
              res.send({ admin: false })
            }
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' }
            res.send(result);
          })
      
          app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
              $set: {
                role: 'admin'
              },
            };
      
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
      
          })


  
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);




app.get('/',(req,res)=>{
    res.send('Art Craft Server is running');
  })
  app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
}) 