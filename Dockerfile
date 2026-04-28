FROM node:latest

RUN mkdir -p /usr/src/bot
WORKDIR /usr/src/bot
ENV NODE_PATH=./dist

COPY package.json /usr/src/bot
COPY tsconfig.json  /usr/src/bot

RUN npm install

COPY ./src/ /usr/src/bot/src

RUN npm run build

WORKDIR /usr/src/bot/dist

EXPOSE 8080

CMD ["node", "index.js"]
