const jwt = require('jsonwebtoken');
function checkUserIdMiddleware() { 
  return async (req, res, next) => {
    try {
      let userId = req.params.userId; // Assuming the user ID is passed as a route parameter

      if (!userId) {
        userId = req.user
      }

      // Check if the user ID is authorized to change the data
      if (userId === req.user._id.toString() || req.user.roles.includes('admin')) {
        next(); // User ID is authorized, proceed to the next middleware or route handler
      } else {
        res.status(403).json({ error: 'Unauthorized: You are not allowed to perform this action.' }); // User ID is not authorized, send a 403 Forbidden response with an informative error message
      }
    } catch (err) {
      res.status(500).json({ 
        message: 'Internal Server Error', 
        error: err });
    }
  }
}

module.exports = checkUserIdMiddleware;
