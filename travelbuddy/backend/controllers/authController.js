import bcrypt from 'bcryptjs';
import User from '../models/Profile.js';
import { generateToken } from '../utils/generateToken.js';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function ensureAdmin() {
  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (!existing) {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await User.create({ username: 'Admin', email: ADMIN_EMAIL, password: hashed, isAdmin: true });
  } else if (!existing.isAdmin) {
    await User.findByIdAndUpdate(existing._id, { isAdmin: true });
  }
}

export async function signup(req, res) {
  const { username, email, password } = req.body;
  try {
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase())
      return res.status(400).json({ msg: 'This email is reserved' });

    if (await User.exists({ email }))
      return res.status(400).json({ msg: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, password: hashed });
    const token = await generateToken({ id: user.id, isAdmin: false });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  try {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ msg: 'Invalid email address' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(404).json({ msg: 'User does not exist with this email' });

    if (!await bcrypt.compare(password, user.password))
      return res.status(401).json({ msg: 'Incorrect password' });

    const token = await generateToken({ id: user.id, isAdmin: !!user.isAdmin });
    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
}
