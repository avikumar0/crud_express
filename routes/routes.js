const express = require('express');
const router = express.Router();
const User = require('../models/user');
const multer = require('multer');
const fs = require('fs');
const { log } = require('console');

//image upload
var storage = multer.diskStorage({
    destination : function (req,file,cb) {
        cb(null,"./uploads");
    },
    filename: function (req,file,cb){
        cb(null, file.filename+"_"+ Date.now() + "_"+ file.originalname);
    },
});

var upload = multer({
    storage: storage,
}).single("image");

// Insert an user in database
router.post('/add', upload, async (req, res) => {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      pincode: req.body.pincode,
      image: req.file.filename,
    });
  
    try {
      await user.save();
      req.session.message = {
        type: 'success',
        message: 'User added successfully',
      };
      res.redirect('/');
    } catch (error) {
      res.json({ message: error.message, type: 'danger' });
    }
});

//Get all users
router.get('/admin', async (req, res) => {
    try {
      const users = await User.find().exec();
      res.render('index', {
        title: 'Admin Page',
        users: users,
      });
    } catch (error) {
      res.json({ message: error.message });
    }
});

router.get('/admin',(req,res)=>{
    res.render("index", { title : "Home Page" });
});

router.get('/',(req,res)=>{
  res.render("home");
});

//Adding user routes
router.get('/add',(req,res)=>{
    res.render('add_users',{title: "Add Users"});
});

//edit user route
router.get('/edit/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id);
    if (user == null) {
      res.redirect('/');
    } else {
      res.render('edit_users', {
        title: "Edit User",
        user: user,
      });
    }
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

//update user route
router.post('/update/:id', upload, async (req, res) => {
  const id = req.params.id;
  let new_image = null;
  if (req.file) {
    new_image = req.file.filename;
    try {
      fs.unlinkSync('./uploads/' + req.body.old_image);
    } catch (err) {
      console.log(err);
    }
  } else {
    new_image = req.body.old_image;
  }

  try {
    const result = await User.findByIdAndUpdate(id, {
      name: req.body.name,
      email: req.body.email,
      pincode: req.body.pincode,
      image: new_image,
    });
    req.session.message = {
      type: 'success',
      message: "User Updated Successfully",
    };
    res.redirect('/');
  } catch (err) {
    res.json({ message: err.message });
  }
});

//Delete user route
router.get('/delete/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await User.findByIdAndRemove(id);
    if (result.image !== '') {
      try {
        fs.unlinkSync('./uploads/' + result.image);
      } catch (err) {
        console.log(err);
      }
    }
    req.session.message = {
      type: "info",
      message: "User Deleted succesfully",
    };
    res.redirect('/');
  } catch (err) {
    res.json({ message: err.message });
  }
});

module.exports =router;