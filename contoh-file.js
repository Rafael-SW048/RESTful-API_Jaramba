{
  _id: ObjectId, // Unique identifier
  licencePlate: String, // License plate of the vehicle
  type: String, // Type of the vehicle
  route: {
    start: String, // Starting point of the route
    finish: String, // Finishing point of the route
  },
  routeNumber: Number, // Route number
  active: Boolean, // Status indicating whether the fleet is active (true) or inactive (false)
  driverId: ObjectId, // Reference to the driver currently driving the fleet (if applicable)
}

{
  _id: ObjectId, // Unique identifier
  username: String, // User's username for authentication
  password: String, // Encrypted or hashed password for authentication
  nama: String, // Name of the user
  umur: Number, // Age of the user
  roles: [String], // Array of roles (e.g., "driver", "admin", "user")
  boundedFleets: [ObjectId], // Array of fleet IDs associated with the user (if applicable)
  active: Boolean,  // Status indicating whether the driver is active (true) or inactive (false)
}

{
  _id: ObjectId, // Unique identifier
  fleetId: ObjectId, // Reference to the associated fleet
  driverId: ObjectId, // Reference to the associated driver (if applicable)
  location: {
    lat: Number, // Latitude coordinate
    lon: Number, // Longitude coordinate
  },
  timestamp: String, // Timestamp indicating the time of the location update
}
