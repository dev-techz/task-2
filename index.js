const { body, validationResult } = require('express-validator'); // Validate isEmail, isPassword is in correct format
const express = require('express');                              // Import Express
const mongoose = require('mongoose');                            // Import Moongoes For database connectivity
const bcrypt = require('bcryptjs');                              // Encrypt the password 
const jwt = require('jsonwebtoken');                             // Generate the token for the browser
const fetchuser = require('./middleware/fetchuser')
const app = express();                                           // Import express methods
const port = 4000;                                               // Secure the port no. for backend
var cors = require('cors')


app.use(express.json());                                         // Give Support of JSON to get & post
app.use(cors());

//Create a Connection to MongoDB database 
mongoose.connect("mongodb+srv://dev:33858627@note-taker.rbodlx7.mongodb.net/note-taker");

// Schema for creating user model
const Users = mongoose.model('Users', {
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Route 1 : Create an endpoint at ip:4000/ for checking connection to backend
app.get('/', (req, res) => {
  res.send('api working')

})

// Route 2 : Create an endpoint at ip:4000/auth for regestring the user in data base & sending token
app.post('/signup',
  body('email').isEmail(),                                    // checks email is valid or not
  body('name').isLength({ min: 2 }),                          // check the length of name is more than 2 char or not
  body('password').isLength({ min: 8 }),                      // check the length of password is min8 char or not
  async (req, res) => {
    const errors = validationResult(req);
    let success =false;
    if (!errors.isEmpty()) {
      return res.status(400).json({success:success, errors: "Enter Valid email/password" });
    }
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
      return res.status(400).json({ success:success,errors: "existing user found with this email" });
    }
    const salt = bcrypt.genSaltSync(10);
    const hash = await bcrypt.hashSync(req.body.password, salt);
    const user = new Users({
      name: req.body.name,
      email: req.body.email,
      password: hash
    });
    user.save().then(() => console.log("User Saved"));
    const data = {
      user: {
        id: user.id
      }
    }
    const token = jwt.sign(data, 'secret_dev');
    success =true;
    res.json({success, token })
  })

// Route 3 : Create an endpoint at ip:4000/login for login the user and giving token
app.post('/login', body('email').isEmail(), body('password').isLength({ min: 8 }), async (req, res) => {
  const errors = validationResult(req);
  let success = false;
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: "enter valid email/password" });
  }
  let user = await Users.findOne({ email: req.body.email });
  if (user) {
    const passCompare = await bcrypt.compare(req.body.password, user.password);
    if (passCompare) {
      const data = {
        user: {
          id: user.id
        }
      }
      success = true;
      const token = jwt.sign(data, 'secret_dev');
      res.json({ success, token });
    }
    else {
      return res.status(400).json({ success: success, errors: "please try with correct email/password" })
    }
  }
  else {
    return res.status(400).json({ success: success, errors: "please try with correct email/password" })
  }

})

// Print the current active port on console
app.listen(port, () => {
  console.log(`Note-Taker listening on port ${port}`)
})