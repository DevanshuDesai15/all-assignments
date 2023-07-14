const express = require('express');
const app = express();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

app.use(express.json());

const secretKey1 = "THIS_IS_ADMIN_SECRET";
const secretKey2 = "THIS_IS_USER_SECRET";

// Mongoose Schemas
const adminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  purchasedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course'}]
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  price: Number,
  imageLink: String,
  published: Boolean
});

// Mongoose Model
const Admin = mongoose.model('Admin', adminSchema);
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);

// Admin Authentication

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, secretKey1, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// User Authentication
const generateUserJWT = (user) => {
  const payload = { username: user.username };
  return jwt.sign(payload, secretKey2, { expiresIn: "1hr" });
};

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(" ")[1];

    jwt.verify(token, secretKey2, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Connect to the MongoDB server
mongoose.connect('mongodb+srv://ddesai21:Devanshu15@cluster0.xuryuj3.mongodb.net/courses', { useNewUrlParser: true, useUnifiedTopology: true});


// Admin routes
app.post('/admin/signup', async (req, res) => {
  // logic to sign up admin
  const {username, password } = req.body;
  const admin = await Admin.findOne({ username });
  if(admin) {
    res.status(403).json({ message: "Admin already exists" });
  } else {
    const newAdmin = new Admin({ username, password });
    await newAdmin.save();
    const token = jwt.sign({ username, role: 'admin' }, secretKey1, {expiresIn: '1hr'});
    res.json({ message: 'Admin created successfully.', token});
  }
});

app.post('/admin/login', async (req, res) => {
  // logic to log in admin
  const { username, password } = req.headers;
  const admin = await Admin.findOne({ username, password });
  if (admin) {
    const token = jwt.sign({ username, role: 'admin' }, secretKey1, {expiresIn: '1hr'});
    res.json({ message: 'Logged In successfully.', token});
  } else {
    res.status(403).json({ message: 'Admin authentication failed' });
  }
});

app.post('/admin/courses', authenticateAdmin, async (req, res) => {
  // logic to create a course
  const course = new Course(req.body);
  await course.save();
  res.json({ message: 'Course created successfully.', courseId: course.id });
});

app.put('/admin/courses/:courseId', authenticateAdmin, async (req, res) => {
  // logic to edit a course
  const course = await Course.findByIdAndUpdate(req.params.courseId, req.body, {new: true});
  if (course) {
    res.json({ message: 'Course updated successfully.' });
  } else {
    res.status(404).json({ message: "Course not found" });
  }
});

app.get('/admin/courses', authenticateAdmin, async (req, res) => {
  // logic to get all courses
  const courses = await Course.find({}); // empty curly braces because to show all courses we can add conditions in them to get specific data
  res.json({ courses });
});

// User routes
app.post('/users/signup', async (req, res) => {
  // logic to sign up user
  const { username, password} = req.body;
  const user = await User.findOne({ username });
  if(user) {
    res.status(403).json({ message: 'User already exists.' });
  } else {
    const newUser = new User({ username, password });
    await newUser.save();
    const token = jwt.sign({ username, role: 'user'}, secretKey2, { expiresIn: '1hr' });
    res.json({ message: 'User created successfully.', token });
  }
});

app.post('/users/login', async (req, res) => {
  // logic to log in user
  const { username, password } = req.headers;
  const user = await User.findOne({ username, password });
  if (user) {
    const token = jwt.sign({ username, role: 'user'}, secretKey2, {expiresIn: '1hr'});
    res.json({ message: 'Logged In Successfully.', token });
  } else {
    res.status(403).json({ message: 'Invalid Username and Password'});
  }
});

app.get('/users/courses', authenticateUser, async (req, res) => {
  // logic to list all courses
  const courses = await Course.find({ published: true });
  res.json({ courses });
});

app.post('/users/courses/:courseId', authenticateUser, async (req, res) => {
  // logic to purchase a course
   const course = await Course.findById(req.params.courseId);
   if(course){
    const user = await User.findOne({ username: req.user.username });
    if (user) {
      user.purchasedCourses.push(course);
      await user.save();
      res.json({ message: 'Course purchased successfully.' });
    } else {
      res.status(403).json({ message: "User not found" });
    }
   } else {
    res.status(404).json({ message: "Course not found" });
   }
});

app.get('/users/purchasedCourses', authenticateUser, async (req, res) => {
  // logic to view purchased courses
  const user = await User.findOne({ username: req.user.username}).populate('purchasedCourses');
  if (user) {
    res.json({ purchasedCourses: user.purchasedCourses || [] });
  } else {
    res.status(403).json({ message: 'User not found'})
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
