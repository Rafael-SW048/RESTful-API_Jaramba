require('dotenv').config(); // Load environment variables from .env file

const mongoose = require('mongoose');
const User = require('../api/models/users');
const Fleet = require('../api/models/fleets');
const bcrypt = require('bcrypt');

async function registerData() {
  // Connect to the database
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    retryWrites: true,
    dbName: 'jarambaDB',
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });

  // Check if the superadmin user already exists
  const superadminExists = await User.findOne({ username: process.env.SUPERADMIN_USERNAME }).exec();
  if (superadminExists) {
    console.log('The script has already been run. Exiting...');
    return process.exit();;
  }

  // Start a session for the transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Register the SUPER admin users
    const superadmin = new User({
      _id: new mongoose.Types.ObjectId(),
      username: process.env.SUPERADMIN_USERNAME, 
      password: await bcrypt.hash(process.env.SUPERADMIN_PASSWORD, 10),
      email: process.env.SUPERADMIN_USERNAME + '@superadmin.com',
      name: 'admin1',
      age: 30,
      roles: ['admin', 'hcm', 'driver'],
      boundedFleets: [],
      active: true,
    });

    await superadmin.save();

    // Register the admin users
    const admin1 = new User({
      _id: new mongoose.Types.ObjectId(),
      username: process.env.ADMIN1_USERNAME, 
      password: await bcrypt.hash(process.env.ADMIN1_PASSWORD, 10),
      email: process.env.ADMIN1_USERNAME + '@admin.com',
      name: 'admin1',
      age: 30,
      roles: ['admin'],
      boundedFleets: [],
      active: true,
    });

    const admin2 = new User({
      _id: new mongoose.Types.ObjectId(),
      username: process.env.ADMIN2_USERNAME, 
      password: await bcrypt.hash(process.env.ADMIN2_PASSWORD, 10),
      email: process.env.ADMIN2_USERNAME + '@admin.com',
      name: 'admin2',
      age: 30,
      roles: ['admin'],
      boundedFleets: [],
      active: true,
    });

    // Save the admin users to the database
    await admin1.save();
    await admin2.save();

    // Register the HCM users
    const hcm1 = new User({ 
      _id: new mongoose.Types.ObjectId(),
      username: process.env.HCM1_USERNAME, 
      password: await bcrypt.hash(process.env.HCM1_PASSWORD, 10),
      email: process.env.HCM1_USERNAME + '@admin.com',
      name: 'hcm1',
      age: 30,
      roles: ['admin'],
      boundedFleets: [],
      active: false,
    });

    const hcm2 = new User({ 
      _id: new mongoose.Types.ObjectId(),
      username: process.env.HCM2_USERNAME, 
      password: await bcrypt.hash(process.env.HCM2_PASSWORD, 10),
      email: process.env.HCM2_USERNAME + '@admin.com',
      name: 'hcm2',
      age: 30,
      roles: ['admin'],
      boundedFleets: [],
      active: false,
    });

    // Save the hcm users to the database
    await hcm1.save();
    await hcm2.save();

    // Register the driver users
    const driver1 = new User({ 
      _id: new mongoose.Types.ObjectId(),
      username: process.env.DRIVER1_USERNAME, 
      password: await bcrypt.hash(process.env.DRIVER1_PASSWORD, 10),
      email: process.env.DRIVER1_USERNAME + '@driver.com',
      name: 'driver1',
      age: 30,
      roles: ['driver'],
      boundedFleets: [],
      active: false,
    });
    const driver2 = new User({ 
      _id: new mongoose.Types.ObjectId(),
      username: process.env.DRIVER2_USERNAME, 
      password: await bcrypt.hash(process.env.DRIVER2_PASSWORD, 10),
      email: process.env.DRIVER2_USERNAME + '@driver.com',
      name: 'driver2',
      age: 30,
      roles: ['driver'],
      boundedFleets: [],
      active: false,
    });

    // Save the driver users to the database
    await driver1.save();
    await driver2.save();

    // Register the fleets
    const fleet1 = new Fleet({ 
      _id: new mongoose.Types.ObjectId(),
      licencePlate: "BAZZZ 1234 BAZZZ",
      type: 'mclaren 720s',
      route: { start: 'Bandung', finish: 'JAKARTA' },
      routeNumber: 1,
      active: false,
      driverId: null,
    });

    const fleet2 = new Fleet({ 
      _id: new mongoose.Types.ObjectId(),
      licencePlate: "BAZZZ 4321 BAZZZ",
      type: 'lamborghini huracan',
      route: { start: 'JAKARTA', finish: 'BANDUNG' },
      routeNumber: 2,
      active: false,
      driverId: null,
    });

    // Save the fleets to the database
    await fleet1.save();
    await fleet2.save();
  } catch (error) {
    
    // If an error occurred, abort the transaction
    await session.abortTransaction();
    console.error('An error occurred:', error);
  } finally {
    // End the session
    session.endSession();
  }
  // Close the database connection
  await mongoose.connection.close();

  // Exit the process
  process.exit();
}

registerData().catch(console.error);