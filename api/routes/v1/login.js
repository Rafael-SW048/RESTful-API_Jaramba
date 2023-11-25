const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../../models/users'); // adjust the path as needed

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usernameOrEmail
 *               - password
 *             properties:
 *               usernameOrEmail:
 *                 type: string
 *                 description: The user's username or email
 *                 example: 'Driver123'
 *               password:
 *                 type: string
 *                 description: The user's password
 *                 example: 'Password123'
 *     responses:
 *       200:
 *         description: The user was successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the user was logged in
 *                   example: 'Logged in successfully'
 *                 accessToken:
 *                   type: string
 *                   description: The access token for the user
 *                   example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *                 refreshToken:
 *                   type: string
 *                   description: The refresh token for the user
 *                   example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *       400:
 *         description: There was a problem with the request body
 *       401:
 *         description: Invalid username or password
 *       500:
 *         description: There was an error on the server
 */
router.post('/', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Input validation
    if (!usernameOrEmail || !password) {
      console.log('Username: ', usernameOrEmail, 'Password: ', password)
      return res.status(400).json({ message: 'Username or password is missing' });
    }

    // Find the user by username or email
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
    });

    // If the user is not found or the password is incorrect, send a 401 response
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // If the username and password are correct, create a token and send a 200 response
    const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '14d' });

    // Store the refresh token in the database
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({ 
      message: 'Logged in successfully',
      accessToken: accessToken,
      refreshToken: refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;