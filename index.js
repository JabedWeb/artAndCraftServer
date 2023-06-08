const express =require('express');
const app = express();
const cors=require('cors');
const e = require('express');
//env port or 5000 port
const PORT =  process.env.PORT || 5000;

//middleware
app.use(cors());

app.use(express.json());

require('dotenv').config();



const { MongoClient, ServerApiVersion } = require('mongodb');



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

      //find database
      const artandcraft=client.db("artandcraft");

      //find collection
       const classes=artandcraft.collection("classes");

       //get all classes
         app.get('/classes',async(req,res)=>{
            const query =classes.find();
            const allClasses=await query.toArray();
            res.json(allClasses);
        }
        )


  
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