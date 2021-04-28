var express = require('express');
var router = express.Router();

router.use((req,res,next) => {
	const auth = {login: 'yourlogin', password: 'yourpassword'} 

  	const b64auth = (req.headers.authorization || '').split(' ')[1] || ''
  	const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':')

  	if (login && password) {
    	return next()
  	}
  	else {
  		res.set('WWW-Authenticate', 'Basic realm="401"')
  		res.status(401).send('Authentication required.')
  	}
})

router.get("/",(req,res) => {
	console.log(req);
	console.log(res);
})


module.exports = router;