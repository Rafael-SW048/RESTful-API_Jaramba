FROM node:latest

WORKDIR /API-App

COPY  . .

RUN npm install

# Check if port is specified in .env file
ARG PORT
ENV PORT=$PORT
RUN if [ -f .env ]; then export $(cat .env | xargs) && if [ ! -z "$PORT" ]; then echo "PORT=$PORT"; else echo "PORT=3000"; fi >> .env; fi

EXPOSE $PORT

# CMD [ "npm", "start"]