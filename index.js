const express=require('express');
const app=express()
const cors = require('cors');
const port=process.env.PORT ||5000
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_KEY);

var jwt = require('jsonwebtoken');

app.use(cors())
app.use(express.json())  


  //install stripe
  
// npm install --save stripe

// require("crypto").randomBytes(64).toString("hex")


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
    const reviewCollection = database.collection("review");
    const cartCollection = database.collection("carts");
    const userCollection = database.collection("users");



    // payment gateaway


    // app.post("/createPaymentIntent",async(req,res)=>{

    //   let {price}=req.body
    //   let amount=parseInt(price*100)
    //   // console.log(amount)
    //   const paymentIntent = await stripe.paymentIntents.create({

    //     amount:amount,
    //     currency:"usd",
    //     payment_method_types:["card"]
        
    // })

    // res.send({
    //   clientSecret:paymentIntent.client_secret
    // })


    // })

    //original

    app.post("/createPaymentIntent",async(req,res)=>{

      let {price}=req.body
      let amount=parseInt(price*100)
      console.log(amount)
      const paymentIntent = await stripe.paymentIntents.create({

        amount:amount,
        currency:"usd",
        payment_method_types:["card"]
        
    })

    res.send({
      clientSecret:paymentIntent.client_secret
    })
  })


  // app.post("/createPaymentIntent", async (req, res) => {
  //   try {
  //     let { price } = req.body;
  //     let amount = parseInt(price * 100);
  
  //     console.log("Received Price:", price);
  //     console.log("Calculated Amount:", amount);
  
  //     const paymentIntent = await stripe.paymentIntents.create({
  //       amount: amount,
  //       currency: "usd",
  //       payment_method_types: ["card"],
  //     });
  
  //     console.log("Generated Client Secret:", paymentIntent.client_secret);
  
  //     res.send({
  //       clientSecret: paymentIntent.client_secret,
  //     });
  
  //   } catch (error) {
  //     console.error("Stripe Payment Error:", error);
  //     res.status(500).send({ error: error.message });
  //   }
  // });
  


  

   

    //jwt related APIs

    app.post("/jwt",async(req,res)=>{

      let user=req.body

      let token= jwt.sign( user, process.env.JWT_TOKEN, { expiresIn: '1h' });

      res.send({token})
    })



    let verifyToken=(req,res,next)=>{
      console.log("inside middleware",req.headers.authorization)

      if(!req.headers.authorization){

        return res.status(401).send({message:"unauthorized access"})

      }

      let token= req.headers.authorization.split(' ')[1]

      jwt.verify(token, process.env.JWT_TOKEN, (err, decoded)=> {
        if(err){
          return res.status(401).send({message:"unauthorized access"})
        }

        req.decoded=decoded
        next()
      });
      // next()
      
    }


    // use verify admin after verify token



    let verifyAdmin=async(req,res,next)=>{

      let email=req.decoded.email
      let query={email}

      let user= await userCollection.findOne(query)

      let isAdmin=user?.role==="admin"

      if(!isAdmin){
        return res.status(403).send({message:"forbidden access"})
      }
      next()

    }

    app.get("/users",verifyToken,verifyAdmin,async(req,res)=>{

      // console.log(req.headers)

      let result= await userCollection.find().toArray()
      res.send(result)
    })


    //admin apis


    app.get("/users/admin/:email",verifyToken,async(req,res)=>{

      let email=req.params.email

      if(email !== req.decoded.email){
        return res.status(403).send({message:"forbidden access"})
      }

      let query={email}
      let user= await userCollection.findOne(query)

      let admin=false
      if(user){
        admin= user?.role === "admin"
      }

      res.send({ admin })


    })


     ///   /users/:id dileo hoto

    app.patch("/users/admin/:id",verifyToken,verifyAdmin,async(req,res)=>{

      let idx= req.params.id

      let filter={_id:new ObjectId(idx)}

      const updateDoc = {
        $set: {
          role: "admin"
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result)
    })

    app.delete("/users/:id",verifyToken,verifyAdmin,async(req,res)=>{


      let idx=req.params.id

      let query={_id :new ObjectId(idx)}

      let result=await userCollection.deleteOne(query)

      res.send(result)
    })


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


    app.get("/menu/:id",async(req,res)=>{
      let id= req.params.id
      let filter={_id:new ObjectId(id)}
      let result= await menuCollection.findOne(filter)

      res.send(result)
    })


    app.delete("/menuDelete/:id",verifyToken,verifyAdmin,async(req,res)=>{

      let id=req.params.id

      // let query={_id:new ObjectId(id)}
       let query={_id:new ObjectId(id)}

      let result=await menuCollection.deleteOne(query)
      res.send(result)
    })


    app.post("/menu",verifyToken,verifyAdmin,async(req,res)=>{
      let menuItemData=req.body

      const result = await menuCollection.insertOne(menuItemData);

       res.send(result)


    })

    app.put("/menu/:id",async(req,res)=>{

      let id=req.params.id
      let updateData=req.body

      let filter={_id:new ObjectId(id)}

      const updateDoc = {
        $set: {
          name:updateData.name,
          category:updateData.category,
          price:updateData.recipe,
          recipe:updateData.recipe,
          image:updateData.image
        },
      };

      const result = await menuCollection.updateOne(filter, updateDoc);

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

  