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



app.get('/',(req,res)=>{
    res.send('Art Craft Server is running');
  })
  app.listen(PORT,()=>{
      console.log(`Server is running on port ${PORT}`);
  })