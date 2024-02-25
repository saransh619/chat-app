import User from '../models/user.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cookie from 'cookie';
const signup = async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    const jsonResponse = { message: 'User registered successfully' };

    if (req.accepts('json')) {
      res.status(201).json(jsonResponse);
    } else {
      res.redirect('/login');
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    // Check if the user is already authenticated (has a valid token)
    if (req.cookies.token && req.cookies.userId) {
      // Redirect to the chat page if already authenticated
      return res.redirect('/api/chat');
    }

    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, { expiresIn: '1h' });

    res.cookie('token', token, { httpOnly: true });
    res.cookie('userId', user._id.toString(), { httpOnly: true });

    const jsonResponse = { message: 'Login successfull', token, userId: user._id };

    if (req.accepts('json')) {
      res.status(200).json(jsonResponse);
    } else {
      res.redirect('/api/chat');
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const logout = (req, res) => {
  // Clear the cookies
  res.clearCookie('token');
  res.clearCookie('userId');

  // Redirect to the login page
  res.redirect('/login');
};


export default { signup, login, logout };