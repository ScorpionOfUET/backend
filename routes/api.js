var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');

// DB related init
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const uri = "mongodb+srv://Viet:" + process.env.DBPASSWORD + "@mobile.hreew.mongodb.net/Project%200?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
var db = null;
client.connect(err => {
   console.log(err);
   if(err) return;
   db = client.db("Mobile");
   console.log("Connected");
});

var Product = require('./schemas/Product');

// Main
var noAuthPath = ['/signup', '/product'];
router.use((req,res,next) => {
   for(var i=0;i<noAuthPath.length;i++) if(req.url.startsWith(noAuthPath[i])) return next();
	if(db == null) {
      res.status(500).send('Server initializing. Pls wait.')
      return;
   }

   const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
   const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

   if (login && password) {
      db.collection('user').find({email : login}).toArray((err,result) => {
         if(err) {
            res.set('WWW-Authenticate', 'Basic realm="401"')
            res.status(401).send(err)
            return
         }

         if(result.length == 0) {
            res.set('WWW-Authenticate', 'Basic realm="401"')
            res.status(401).send('Username not found')
            return
         } else {
            bcrypt.compare(password, result[0].passwordHash, (err,hashCorrect) => {
               if(err) {
                  res.status(500).send('Decryption fault')
                  return
               }

               if(hashCorrect == false) {
                  res.set('WWW-Authenticate', 'Basic realm="401"')
                  res.status(401).send('Incorrect password')
                  return
               }
               else {
                  req.userID = result[0]._id;
                  return next();
               }
            })
         }
      })
   }
   else {
  	   res.set('WWW-Authenticate', 'Basic realm="401"')
  	   res.status(401).send('Authentication required.')
      return;
   }
})

router.get("/",(req,res) => {
	console.log(req.userID);
   res.send(req.userID);
})

router.post("/signup", (req,res) => {
   db.collection('user').find({email:req.body.email}).toArray((err,result) => {
      console.log(err);
      if(err) {
         res.status(500).send(err)
         return
      }

      if(result.length == 1) {
         res.set('WWW-Authenticate', 'Basic realm="401"')
         res.status(401).send('User exsist')
         return
      }

      bcrypt.hash(req.body.password, 12, (err,hash) => {
         if(err) {
            res.status(500).send('Hash error')
            return
         }

         db.collection('user').insertOne({
            name : req.body.name,
            email : req.body.email,
            passwordHash : hash
         })
         .then(result => {
            res.send(result);
         })
         .catch(err => {
            res.status(500).send(err);
         })
      })
   })
})

router.get("/category", (req,res) => {
   db.collection('category').find({}).toArray((err,result) => {
      if(err) {
         res.set('WWW-Authenticate', 'Basic realm="401"')
         res.status(401).send('DB error')
         return
      }

      res.send({categories:result})
   })
})

router.get("/category/:id", (req,res) => {
   db.collection('category').find({_id:ObjectId(req.params.id)}).toArray((err,result) => {
      if(err) {
         res.set('WWW-Authenticate', 'Basic realm="401"')
         res.status(401).send('DB error')
         return
      }

      res.send(result);
   })
})

router.post("/category/create", (req,res) => {
   db.collection('category').insert({
      name: req.body.name
   })
   .then(result => {
      res.send("Complete")
   })
   .catch(err => {
      res.set('WWW-Authenticate', 'Basic realm="401"')
      res.status(401).send(err)
      return
   })
})

router.get("/order", (req,res) => {
   db.collection('order').find({user : req.userID}).toArray((err, result) => {
      if(err) {
         res.status(500).send('DB error');
         return
      }

      res.send(result);
   })
})

router.get("/order/:id", (req,res) => {
   db.collection('order').find({user : req.userID, _id : ObjectId(req.params.id)}).toArray((err, result) => {
      if(err) {
         res.status(500).send('DB error');
         return
      }

      res.send(result);
   })
})

router.post("/order/create", (req,res) => {

})

router.post("/order/delete/:id", (req,res) => {

})

router.get("/product", (req,res) => {
   db.collection('product').find({}).toArray((err,result) => {
      if(err) {
         res.status(500).send("DB error");
         return
      }

      res.send(result);
   })
})

router.get("/product/:id", (req,res) => {
   db.collection('product').find({_id:ObjectId(req.params.id)}).toArray((err,result) => {
      if(err) {
         res.status(500).send("DB error");
         return
      }

      res.send(result);
   })
})

router.post("/product/create", (req,res) => {
   console.log(req.body.image);
   db.collection('product').insert({
      name : req.body.name,
      description : req.body.description,
      richDescription : req.body.richDescription,
      image : req.body.image,
      images : req.body.images,
      brand : req.body.brand,
      price : req.body.price,
      category : req.body.category,
      countInStock: req.body.countInStock,
      rating : 0,
      isFeatured : req.body.isFeatured,
      dateCreated : new Date()
   })
   .then(result => {
      res.send(result);
   })
   .catch(err => res.status(500).send(err));
})

router.get("/order", (req,res) => {
   db.collection('order').find({user : req.userID}).toArray((err, result) => {
      if(err) {
         res.status(500).send(err);
      }

      res.send(result);
   })
})

router.get("/order/:id", (req,res) => {
   db.collection('order').find({user : req.userID, _id : ObjectId(req.params.id)}).toArray((err,result) => {
      if(err) {
         res.status(500).send(err);
      }
      res.send(result);
   })
})

router.post("/order/create", (req,res) => {
   db.collection('order').insert({
      orderItems : req.body.orderItems,
      shippingAddress1 : req.body.shippingAddress1,
      shippingAddress2 : req.body.shippingAddress2,
      city : req.body.city,
      zip : req.body.zip,
      country : req.body.country,
      phone : req.body.phone,
      status : "On delivery",
      totalPrice : req.body.totalPrice,
      user : req.userID,
      dateOrdered : new Date()
   })
   .then(result => {
      res.send(result);
   })
   .catch(err => res.status(500).send(err));
})



module.exports = router;