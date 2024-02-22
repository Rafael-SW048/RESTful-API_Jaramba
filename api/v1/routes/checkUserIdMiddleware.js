const jwt = require('jsonwebtoken');
function checkUserIdMiddleware() { 
  return async (req, res, next) => {
    try {
      let userId = req.params.userId; // Assuming the user ID is passed as a route parameter

      if (!userId) {
        userId = req.userInfo._id; // If the user ID is not passed as a route parameter, use the user ID from the JWT payload
      }

      // Check if the user ID is authorized to change the data
      if (userId === req.user._id.toString() || req.user.roles.includes('admin')) {
        next(); // User ID is authorized, proceed to the next middleware or route handler
      } else {
        res.status(403).json({ error: 'Unauthorized: You are not allowed to perform this action.' }); // User ID is not authorized, send a 403 Forbidden response with an informative error message
      }
    } catch (err) {
      res.status(500).json({ 
        message: 'Internal Server Error: An error occurred while checking the user ID. Please try again.', 
        error: err,
        userId: req.userInfo
       });
    }
  }
}

module.exports = checkUserIdMiddleware;
