const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/users'); 

/**
 * @swagger
 * /refresh:
 *   post:
 *     summary: Refresh the access token
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
 *         description: The access token was successfully refreshed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: A message indicating the access token was refreshed
 *                   example: 'Access token refreshed successfully'
 *                 accessToken:
 *                   type: string
 *                   description: The new access token for the user
 *                   example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 *       400:
 *         description: There was a problem with the request body
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', async (req, res) => {
  try {
    console.log('Received a POST request at /refresh');
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is missing' });
    }

    const user = await User.findOne({ refreshToken: refreshToken }).exec();

    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, payload) => {
      if (err) {
        return res.status(401).json({ message: 'Invalid refresh token' });
      }

      const accessToken = jwt.sign({ userId: payload.userId }, process.env.JWT_SECRET, { expiresIn: '1d' });

      res.status(200).json({ 
        message: 'Access token refreshed successfully',
        accessToken: accessToken,
      });
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Internal server error', 
      error: err });
  }
});

module.exports = router;