FROM node:latest

WORKDIR /API-App

COPY  . .

RUN npm install

EXPOSE 3000

CMD [ "npm", "start"]