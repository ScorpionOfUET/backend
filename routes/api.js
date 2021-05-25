const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const bcrypt = require('bcrypt');

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

const multer = require('multer');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let uploadError = new Error('invalid image type');

        if (isValid) {
            uploadError = null;
        }
        cb(uploadError, 'public/upload');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
        cb(null, `${fileName}-${Date.now()}.${extension}`);
    },
});

const uploadOptions = multer({ storage: storage });
function imageProcesser(image) {
   console.log(image);
   return image;
}
// Main
var noAuthPath = ['POST /signup', 'GET /product', 'GET /category', 'POST /login'];
var adminOnly = [];

router.use((req,res,next) => {
   var path = req.method + " " + req.url;
   console.log(path);
   for(var i=0;i<noAuthPath.length;i++) if(path.startsWith(noAuthPath[i])) return next();
	if(db == null) {
      res.status(500).send('Server initializing. Pls wait.')
      return;
   }

   const jwtToken = (req.headers.authorization || '').split(' ')[1] || ''
   if(jwtToken) {
      jwt.verify(jwtToken, process.env.SECRET, (err,data) => {
         if(err) {
            res.status(403).send(err);
            return;
         }
         req._id = data._id;
         req.isAdmin = data.isAdmin;
         if((req.method == "PUT" && !req.url.startsWith("/user")) || req.method == "DELETE") if(req.isAdmin == false) {
            res.status(403).send(err);
            return;
         }
         return next();
      })
   }
   else res.status(403).send("Unauthorize JWT");
})


router.get("/",(req,res) => {
	console.log(req._id);
   res.send({
      _id : req._id,
      isAdmin : req.isAdmin
   });
})

//CATEGORY

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
      name: req.body.name,
      color : req.body.color,
      icon : req.body.icon,
      image : imageProcesser(req.body.image)
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

router.delete("/category/:id", (req,res) => {

   db.collection('category').deleteOne({
      _id : ObjectId(req.params.id)
   })
   .then(result => {
      res.send(result);
   })
   .catch(err => {
      res.status(500).send(err);
   })
})

router.put("/category/:id", (req,res) => {
   db.collection('category').update({
      _id : ObjectId(req.params.id)
   }, {
      $set : {
         name : req.body.name,
         color : req.body.color,
         icon : req.body.icon,
         image : imageProcesser(req.body.image)
      }
   })
   .then(result => res.send(result))
   .catch(err => res.status(500).send(err));
})

//PRODUCT

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

router.post("/product/create", uploadOptions.single('image'),(req,res) => {
   console.log(req.body.image);
   const file = req.file;
   if (!file) return res.status(400).send('No image in the request');
   const fileName = file.filename;
   const basePath = `${req.protocol}://${req.get('host')}/public/upload/` + fileName;
   db.collection('product').insert({
      name : req.body.name,
      description : req.body.description,
      richDescription : req.body.richDescription,
      image : basePath,
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

router.delete("/product/:id", (req,res) => {
   db.collection('product').deleteOne({
      _id : ObjectId(req.params.id)
   })
   .then(result => {
      res.send(result);
   })
   .catch(err => {
      res.status(500).send(err);
   })
})

router.put("/product/:id", (req,res) => {
   db.collection('product').update({
      _id : ObjectId(req.params.id)
   }, {
      $set: {
         name : req.body.name,
         description : req.body.description,
         richDescription : req.body.richDescription,
         image : imageProcesser(req.body.image),
         images : imagesProceser(req.body.images),
         brand : req.body.brand,
         price : req.body.price,
         category : req.body.category,
         countInStock: req.body.countInStock,
         rating : 0,
         isFeatured : req.body.isFeatured,
         dateCreated : new Date()
      }
   })
})

//ORDER
router.get("/order", (req,res) => {
   db.collection('order').find({}).toArray((err, result) => {
      if(err) {
         res.status(500).send(err);
         return;
      }
      res.send(result);
   })
})

router.get("/order/:id", (req,res) => {
   db.collection('order').find({
      _id : ObjectId(req.params.id)}).toArray((err,result) => {
      if(err) {
         res.status(500).send(err);
         return
      }
      res.send(result);
   })
})

router.post("/order/create", (req,res) => {
   var price = 0;
   var products = req.body.products
   for(var i = 0 ;i<products.length; i++) {
      price += products[i].product.price * products[i].quantity
      var leftQuantity = products[i].product.countInStock - products[i].quantity
      products[i] = {
         product : products[i].product._id,
         quantity : products[i].quantity
      }

      db.collection('product').update({_id : products[i].product}, {
         $set: {
            countInStock : leftQuantity
         }
      })
      .catch(err => {
         console.log(err);
      })
   }
   db.collection('order').insert({
      products : products,
      shippingAddress1 : req.body.shippingAddress1,
      shippingAddress2 : req.body.shippingAddress2,
      city : req.body.city,
      phone : req.body.phone,
      status : req.body.status,
      totalPrice : price,
      user : req._id,
      dateOrdered : new Date()
   })
   .then(result => {
      db.collection('order').find({_id : ObjectId(result.ops[0]._id)}).toArray((err,result) => {
         if(err) return;
         res.send(result);
      })
   })
   .catch(err => res.status(500).send(err));
})

router.delete("/order/:id", (req,res) => {
   db.collection('order').deleteOne({
      _id :ObjectId(req.params.id)
   })
   .then(result => {
      res.send(result);
   })
   .catch(err => res.status(500).send(500));
})

router.put("/order/:id", (req,res) => {
   db.collection('order').update({
      _id : ObjectId(req.params.id)
   }, {
      $set: {
         status : req.body.status
      }
   })
   .then(result => {
      res.send(result);
   })
   .catch(err => res.status(500).send(err));
})

//USER
router.get("/user", (req,res) => {
   db.collection('user').find({}).toArray((err,result) => {
      if(err) res.status(500).send(err);
      res.send(result);
   })
})

router.get("/user/:id", (req,res) => {
   db.collection('user').find({
      _id:ObjectId(req.params.id)
   }).toArray((err,result) => {
      if(err) {
         res.status(500).send(err);
         return
      }
      res.send(result);
   })
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
            passwordHash : hash,
            address : req.body.address,
            city : req.body.city,
            phone : req.body.phone,
            isAdmin : false
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


router.post("/login", (req,res) => {
   const login = req.body.email
   const password = req.body.password

   console.log(login)
   console.log(password)

   if (login && password) {
      db.collection('user').find({email : login}).toArray((err,result) => {
         if(err) {
            res.set('WWW-Authenticate', 'Basic realm="401"')
            res.status(401).send(err)
            return
         }

         if(result.length == 0) {
            res.set('WWW-Authenticate', 'Basic realm="401"')
            res.status(403).send('Username not found')
            return
         } else {
            bcrypt.compare(password, result[0].passwordHash, (err,hashCorrect) => {
               if(err) {
                  res.status(500).send('Decryption fault')
                  return
               }

               if(hashCorrect == false) {
                  res.set('WWW-Authenticate', 'Basic realm="401"')
                  res.status(403).send('Incorrect password')
                  return
               }
               else {
                  req._id = result[0]._id;
                  req.isAdmin = result[0].isAdmin;
                  const token = jwt.sign({_id : result[0]._id, isAdmin : result[0].isAdmin}, process.env.SECRET);
                  res.send(token);
                  return;
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

router.get("/token", (req,res) => {
   db.collection('user').find({_id : ObjectId(req._id)}).toArray((err, result) => {
      if(err) {
         res.status(500).send(err);
         return
      }
      result[0].passwordHash = undefined;
      res.send(result[0]);
   })
})

router.put("/user/password", (req,res) => {
   db.collection('user').find({_id : ObjectId(req._id)}).toArray((err,result) => {
      if(err) {res.status(500).send(err); return}
      var user = result[0];
      bcrypt.compare(req.body.oldPassword, user.passwordHash, (err,result) => {
         if(err) {
            res.status(500).send(err);
            return
         }
         if(result == false) {
            res.status(403).send("Wrong password")
            return
         }
         bcrypt.hash(req.body.newPassword, 12, (err,hash) => {
            if(err) {res.status(500).send(err);return}

            db.collection('user').update({
               _id : ObjectId(req._id)
            }, {
               $set : {
                  passwordHash : hash
               }
            })
            .then(result => {
               res.send(result);
            })
            .catch(err => res.status(500).send(err));
         })
      })
   })
})

router.put("/user/info", (req,res) => {
   db.collection('user').update({
      _id : ObjectId(req._id)
   }, {
      $set:{
         name : req.body.name,
         address : req.body.address,
         city : req.body.city,
         phone : req.body.phone
      }
   })
   .then(result => {
      res.send(result);
   })
   .catch(err => res.status(500).send(err));
})

router.delete("/user/:id", (req,res) =>{
   db.collection('user').deleteOne({
      _id : ObjectId(req.params.id)
   })
   .then(rseult => {
      db.collection('order').deleteMany({
         user : req.params.id
      })
      .then(result => {
         res.send("Done");
      })
      .catch(err => res.status(500).send(err));
   })
   .catch(err => res.status(500).send(err));
})

module.exports = router;