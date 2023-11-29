
function checkUserIdMiddleware() { 
  return (req, res, next) => {
    const userId = req.params.userId; // Assuming the user ID is passed as a route parameter
    // Check if the user ID is authorized to change the data


    if (userId === req.user._id.toString() || req.user.roles.includes('admin')) {
      next(); // User ID is authorized, proceed to the next middleware or route handler
    } else {
      res.status(403).json({ error: 'Unauthorized: You are not allowed to perform this action.' }); // User ID is not authorized, send a 403 Forbidden response with an informative error message
    }
  }
}

module.exports = checkUserIdMiddleware;
