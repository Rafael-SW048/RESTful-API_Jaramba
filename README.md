# RESTful-API_Jaramba
 
To run the project, you need to type the following command in the terminal:
1. `git clone https://github.com/Rafael-SW048/RESTful-API_Jaramba.git`
2. `cd RESTful-API_Jaramba`
3. `npm install`
4. `npm start`

If you want to run the project in the background, you can use the following command:
1. `npm install -g pm2`
2. `pm2 start server.js`
3. `pm2 startup`
4. `pm2 save`

If you want to stop the project, you can use the following command:
1. `pm2 stop server.js` or ctrl + c in the terminal

If you want to run the project as a container, you can use the following command:
1. Clone the docker-compose.yml file
2. `docker-compose up -d`