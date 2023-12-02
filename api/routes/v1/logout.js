const express = require('express');
const router = express.Router();
const RevokedToken = require('../../models/revokedTokens');

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Log out a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token of the user
 *                 example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *     responses:
 *       200:
 *         description: The user was successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the user was logged out
 *                   example: 'Logged out successfully'
 *       400:
 *         description: There was a problem with the request body
 */
const mongoose = require('mongoose');

router.post('/logout', async (req, res) => {
  console.log('Received a POST request at /logout');
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Token is missing' });
  }

  try {
    // Add the token to the revoked tokens list
    const revokedToken = new RevokedToken({ token: refreshToken });
    await revokedToken.save();

    res.status(200).json({ 
      message: 'Logged out successfully',
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'An error occurred during logout', 
      error: err, });
  } 
});

module.exports = router;
