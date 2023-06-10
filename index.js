const express =require('express');
const app = express();
const cors=require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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
      const cartCollection = client.db("artandcraft").collection("carts");

        app.post('/jwt',(req,res)=>{
          const user=req.body;
          const token=jwt.sign(user,process.env.ACCESS_TOKEN_SECRET, 
             {expiresIn:'1h'});
          res.send({token});
        })



       //get all classes
        app.get('/classes', async (req, res) => {
            const limit = parseInt(req.query.limit);
            console.log(req.query);
        
            const query = classesCollection.find();
        
            if (limit > 0) {
              query.sort({ EnrolledStudents: -1 }).limit(limit);
            }
        
            const allClasses = await query.toArray();
        
            const pipeline = [
              {
                $group: {
                  _id: "$email",
                  totalEnrolledStudents: { $sum: "$EnrolledStudents" },
                  image: { $first: "$image" },
                  instructor: { $first: "$instructor" },
                  classes: { $addToSet: "$name" }
                }
              },
              {
                $project: {
                  _id: 0,
                  email: "$_id",
                  totalEnrolledStudents: 1,
                  image: 1,
                  instructor: 1,
                  classes: 1
                }
              },
              { $sort: { totalEnrolledStudents: -1 } }
            ];
            

        
            //console.log('pipeline', pipeline);
        
            const result = await classesCollection.aggregate(pipeline).toArray();
           // console.log('result', result);
        
            res.json({
              classes: allClasses,
              popularInstructors: result
            });
          })
          
        //post classes
        app.post('/classes', async (req, res) => {
            const classes = req.body;
            const result = await classesCollection.insertOne(classes);
            res.send(result);
        });

        //update single classes by id
        app.patch('/classes/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {};
            console.log(req.body);

            if (req.body.EnrolledStudents || req.body.availableSeats) {
              updateDoc.$set = {
                EnrolledStudents: req.body.EnrolledStudents,
                availableSeats: req.body.availableSeats
              };
            }
            if (req.body.status) {
              updateDoc.$set = { status: req.body.status };
            }


            const result = await classesCollection.updateOne(filter, updateDoc);
            console.log("updating",result);
            res.send(result);
          });

        //get all users
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        //get single user by email
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            res.send(user);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            user.role = "student";
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
      
          //update admin
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

          //update instructor
          app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
              $set: {
                role: 'instructor'
              },
            };
      
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
          })


        //cart

       // cart collection apis
        app.get('/carts', async (req, res) => {
        const email = req.query.email;
  
        if (!email) {
          res.send([]);
        }
  
        const decodedEmail = req.decoded.email;
        if (email !== decodedEmail) {
          return res.status(403).send({ error: true, message: 'forbidden access' })
        }
  
        const query = { email: email };
        const result = await cartCollection.find(query).toArray();
        res.send(result);
      });
  
      app.post('/carts', async (req, res) => {
        const item = req.body;
        const result = await cartCollection.insertOne(item);
        res.send(result);
      })

      app.delete('/carts/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await cartCollection.deleteOne(query);
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