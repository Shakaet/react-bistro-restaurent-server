const express=require('express');
const app=express()
const cors = require('cors');
const port=process.env.PORT ||5000
require('dotenv').config()

app.use(cors())
app.use(express.json())  


app.get("/",async(req,res)=>{
    res.send("boss is sitting")
})


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bnqcs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();


    const database = client.db("Bistro-restaurant");
    const menuCollection = database.collection("menu");
    const reviewCollection = database.collection("menu");
    const cartCollection = database.collection("carts");
    const userCollection = database.collection("users");


   app.post("/users",async(req,res)=>{
    let data=req.body


    // insert email if user doesnt exists:
    // it can do this many ways (1.unique email, 2. upsert 3. simple checking)

    let query={email:data.email}


    let existingUser=await userCollection.findOne(query)

    if(existingUser){
      
      return res.send({message:"user already existed",insertedId:null})
    }
    
      const result = await userCollection.insertOne(data);
      res.send(result)
    
    
   })


    app.get("/menu",async(req,res)=>{
        let result= await menuCollection.find().toArray()
        
        res.send(result)
    })

    app.get("/reviews",async(req,res)=>{
      let result= await reviewCollection.find().toArray()
      
      res.send(result)
  })


  app.post("/carts",async(req,res)=>{


    let cartData=req.body
    console.log(cartData)
    const result = await cartCollection.insertOne(cartData);

    res.send(result)
  })

  app.get("/carts/:email",async(req,res)=>{

    let email=req.params.email
    let query={email}

    const result = await cartCollection.find(query).toArray();
    res.send(result)
  })


  app.delete("/cart/:id",async(req,res)=>{

    let idx=req.params.id

    let query={_id:new ObjectId(idx)}
    const result = await cartCollection.deleteOne(query);
    res.send(result)
  })
    // // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port,()=>{

    console.log(`Bistro boss is sitting on port ${port}`)
})

  