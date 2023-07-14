const express = require('express');
const app = express();

app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const adminAuth = (req, res, next) => {
  const {username, password } = req.headers;
  const admin = ADMINS.find( ad => ad.username === username && ad.password === password);
  if(admin) {
    next();
  } else {
    res.status(403).json({ message: 'Admin is not authenticated' });
  }
}

const userAuth = (req, res, next) => {
  const {username, password } = req.headers;
  const user = USERS.find( us => us.username === username && us.password === password);
  if(user) {
    req.user = user;
    next();
  } else {
    res.status(403).json({ message: 'User authentication failed' });
  }
}

// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const admin = req.body;
  const existingAdmin = ADMINS.find(ad => ad.username === admin.username);
  if(existingAdmin) {
    res.status(403).json({ message: "Admin already exists" });
  } else {
    ADMINS.push(admin);
    res.json({ message: 'Admin created successfully' });
  }
});

app.post('/admin/login', adminAuth, (req, res) => {
  // logic to log in admin
  res.json({ message: 'Logged in successfully' })
});

app.post('/admin/courses', adminAuth, (req, res) => {
  // logic to create a course
  const course = req.body;
  if (!course.title && !course.description && !course.price) {
    return res.json(411).send({ 'message': 'Please fill all the inputs!!!' })
  } else {
    course.id = Date.now();
    COURSES.push(course);
    res.json({ message: 'Course created successfully', courseId: course.id });
  }
});

app.put('/admin/courses/:courseId',adminAuth, (req, res) => {
  // logic to edit a course
  const courseId = parseInt(req.params.courseId);
  const course = COURSES.find(c => c.id === courseId);
  if(course) {
    Object.assign(course, req.body);
    res.json({ message: 'Course updated successfully!' });
  } else {
    res.status(404).json({ message: 'Course not found!' });
  }
});

app.get('/admin/courses', adminAuth, (req, res) => {
  // logic to get all courses
  res.json({ courses: COURSES });
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const user = {...req.body, purchasedCourses: []};
  USERS.push(user);
  res.json({ message: 'User created successfully' });
});

app.post('/users/login', userAuth, (req, res) => {
  // logic to log in user
  res.json({ message: 'Logged in successfully' })
});

app.get('/users/courses', userAuth, (req, res) => {
  // logic to list all courses
  res.json({ courses: COURSES.filter(c => c.published) });
});

app.post('/users/courses/:courseId', userAuth, (req, res) => {
  // logic to purchase a course
  const courseId = parseInt(req.params.courseId);
  const course = COURSES.find(c => c.id === courseId && c.published);
  if(course){
    req.user.purchasedCourses.push(courseId);
    res.json({ message: "Course purchased successfully!" })
  } else {
    res.status(404).json({ message: "Course not found or not available" })
  }
});

app.get('/users/purchasedCourses', userAuth, (req, res) => {
  // logic to view purchased courses
  const purchasedCourses = COURSES.filter(course => req.user.purchasedCourses.includes(course.id));
  res.json({ purchasedCourses });
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
