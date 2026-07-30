FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY server.js eslint.config.js ./

EXPOSE 3310

CMD ["npm", "start"]