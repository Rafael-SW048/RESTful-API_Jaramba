FROM node:latest

WORKDIR /API-App

COPY  . .

RUN npm install

# Check if ports are specified in .env file
ARG HTTP_PORT
ARG HTTPS_PORT
ENV HTTP_PORT=$HTTP_PORT
ENV HTTPS_PORT=$HTTPS_PORT
RUN if [ -f .env ]; then export $(cat .env | xargs); fi
RUN if [ -z "$HTTP_PORT" ]; then echo "HTTP_PORT=3000" >> .env; fi
RUN if [ -z "$HTTPS_PORT" ]; then echo "HTTPS_PORT=3001" >> .env; fi

EXPOSE $HTTP_PORT
EXPOSE $HTTPS_PORT

CMD [ "npm", "start" ]