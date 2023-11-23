const express = require('express');
const router = express.Router();
const RevokedToken = require('../../models/revokedTokens');

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Token is missing' });
  }

  // Add the token to the revoked tokens list
  const revokedToken = new RevokedToken({ token: refreshToken });
  await revokedToken.save();

  res.status(200).json({ 
    message: 'Logged out successfully',
  });
});

module.exports = router;
