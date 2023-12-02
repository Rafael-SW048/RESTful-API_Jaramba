const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const User = require('../../models/users');


function authenticateTokenAndAuthorization(roles) {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token == null) {
        return res.status(401).json({ error: 'No token provided' });
      }


      jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
          return res.status(403).json({ message: 'Failed to authenticate token', error: err});
        }

        // Check if the user exists in the database
        const dbUser = await User.findById(user.userId).exec();
        if (!dbUser) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Check if the user's role is authorized
        const authorized = dbUser.roles.some(role => roles.includes(role));
        if (!authorized) {
          return res.status(403).json({ error: 'User is not authorized' });
        }

        // Create a user object without sensitive information
        const userInfo = {
          _id: dbUser._id,
          username: dbUser.username,
          email: dbUser.email,
          name: dbUser.name,
          age: dbUser.age,
          roles: dbUser.roles,
          boundedFleets: dbUser.boundedFleets,
          active: dbUser.active
        };

        req.user = userInfo;
        next();
      });
    } catch (err) {
      return res.status(500).json({ 
        message: 'Internal server error',
        error: err });
    }
  };
}

module.exports = authenticateTokenAndAuthorization;