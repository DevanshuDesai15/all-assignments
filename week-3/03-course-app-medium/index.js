const express = require('express');
const jwt = require("jsonwebtoken");
const fs = require('fs'); 
const app = express();

app.use(express.json());

try{
  ADMINS = JSON.parse(fs.readFileSync('admin.json', 'utf-8'));
  USERS = JSON.parse(fs.readFileSync('user.json', 'utf-8'));
  COURSES = JSON.parse(fs.readFileSync('courses.json', 'utf-8'));
} catch {
  let ADMINS = [];
  let USERS = [];
  let COURSES = [];
}
console.log('ADMINS: ', ADMINS);

const secretKey1 = "THIS_IS_ADMIN_SECRET";
const secretKey2 = "THIS_IS_USER_SECRET";

// Admin Authentication
const generateAdminJWT = (user) => {
  const payload = { username: user.username };
  return jwt.sign(payload, secretKey1, { expiresIn: "1hr" });
};

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


// Admin routes
app.post('/admin/signup', (req, res) => {
  // logic to sign up admin
  const {username, password} = req.body;
  const existingAdmin = ADMINS.find((ad) => ad.username === username);
  if (existingAdmin) {
    res.status(403).json({ message: "Admin already exists" });
  } else {
    const newAdmin = {username, password};
    ADMINS.push(newAdmin);
    fs.writeFileSync('admin.json', JSON.stringify(ADMINS));
    const token = generateAdminJWT(newAdmin);
    res.json({ message: "Admin created sucessfully ", token });
  }
});

app.post('/admin/login', (req, res) => {
  // logic to log in admin
  const { username, password } = req.headers;
  const admin = ADMINS.find(
    (ad) => ad.username === username && ad.password === password
  );

  if (admin) {
    const token = generateAdminJWT(admin);
    res.json({ message: "Logged In Successfully", token });
  } else {
    res.status(403).json({ message: "Admin authentication failed" });
  }
});

app.post('/admin/courses', authenticateAdmin, (req, res) => {
  // logic to create a course
  const course = req.body;
  course.id = COURSES.length + 1;
  COURSES.push(course);
  fs.writeFileSync('courses.json', JSON.stringify(COURSES));
  res.json({ message: "Course created successfully", courseId: course.id });
});

app.put('/admin/courses/:courseId', (req, res) => {
  // logic to edit a course
  const courseId = parseInt(req.params.courseId);
  const courseIndex = COURSES.findIndex((c) => c.id === courseId);

  if (courseIndex) {
    Object.assign(courseIndex, req.body);
    fs.writeFileSync('courses.json', JSON.stringify(COURSES));
    res.json({ message: "Course updated successfully" });
  } else {
    res.status(404).json({ message: "Course not found" });
  }
});

app.get('/admin/courses', (req, res) => {
  // logic to get all courses
  res.json({ courses: COURSES });
});

// User routes
app.post('/users/signup', (req, res) => {
  // logic to sign up user
  const user = req.body;
  const existingUser = USERS.find((us) => us.username === user.username);

  if (existingUser) {
    res.status(403).json({ message: "User already exists" });
  } else {
    const newUser = {username, password};
    USERS.push(newUser);
    fs.writeFileSync('user.json', JSON.stringify(USERS));
    const token = generateUserJWT(user);
    res.json({ message: "User created successfully", token });
  }
});

app.post('/users/login', (req, res) => {
  // logic to log in user
  const { username, password } = req.headers;
  const user = USERS.find(
    (us) => us.username === username && us.password === password
  );

  if (user) {
    const token = generateUserJWT(user);
    res.json({ message: "Logged In successfully", token });
  } else {
    res.status(403).json({ message: "User Authentication failed" });
  }
});

app.get('/users/courses', (req, res) => {
  // logic to list all courses
  res.json({ courses: COURSES });
});

app.post('/users/courses/:courseId', (req, res) => {
  // logic to purchase a course
  const courseId = parseInt(req.params.courseId);
  const course = COURSES.find((c) => c.id === courseId);

  if (course) {
    const user = USERS.find((u) => u.username === req.user.username);
    if (user) {
      if (!user.purchasedCourses) {
        user.purchasedCourses = [];
      }
      user.purchasedCourses.push(course);
      fs.writeFileSync('users.json', JSON.stringify(USERS));
      res.json({ message: "Course purchased successfully" });
    } else {
      res.status(403).json({ message: "User not found" });
    }
  } else {
    res.status(404).json({ message: "Course not found" });
  }
});

app.get('/users/purchasedCourses', (req, res) => {
  // logic to view purchased courses
  const user = USERS.find((u) => u.username === req.user.username);
  if (user && user.purchasedCourses) {
    res.json({ purchasedCourses: user.purchasedCourses });
  } else {
    res.status(404).json({ message: "No course purchased" });
  }
});

app.listen(3000, () => {
  console.log('Server is listening on port 3000');
});
