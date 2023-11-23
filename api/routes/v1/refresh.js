const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../../models/users'); 


router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is missing' });
  }

  const user = await User.findOne({ refreshToken: refreshToken });

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
});

module.exports = router;