# RESTful-API_Jaramba

**DON'T FORGET TO CHANGE THE SENSITIVE DATA IN THE .env FILE**

## Prerequisites
Before running the project, make sure you have the following installed:
- Node.js and npm: `sudo apt-get install nodejs npm`
- Docker and Docker Compose: `sudo apt-get install docker docker-compose`

## Installation
1. `sudo apt-get update`
2. `sudo apt-get install docker-ce docker-ce-cli containerd.io`
3. `sudo apt-get install docker-compose`

## Setup
1. Clone the repository: `git clone https://github.com/Rafael-SW048/RESTful-API_Jaramba.git` or `git pull origin main` for updates
2. Navigate to the project directory: `cd RESTful-API_Jaramba`
3. Install dependencies: `npm install`

## Seeding the Database
To seed the database with initial data for testing, run the `seedDatabase.js` script:
1. `node seedDatabase.js`

## Running the Project
To run the project, follow these steps:
1. Start the MongoDB server and dashboard containers: `docker-compose up -d`
2. Start the project: `npm start`

## Running in the Background
If you want to run the project in the background, you can use PM2:
1. Install PM2 globally: `npm install -g pm2`
2. Start the project with PM2: `pm2 start server.js`
3. Set PM2 to start on system boot: `pm2 startup`
4. Save the current process list for automatic startup: `pm2 save`

## Stopping the Project
To stop the project, you can use PM2 or Ctrl+C in the terminal:
- Using PM2: `pm2 stop server.js`
- Ctrl+C in the terminal

## Running as a Container
To run the project as a container, follow these steps:
1. Clone the docker-compose.yml file
2. Start the containers: `docker-compose up -d`

## API Documentation
For requests to the API, you can use the following endpoints:
- [API Documentation](http://localhost:3000/api-docs/#/)
