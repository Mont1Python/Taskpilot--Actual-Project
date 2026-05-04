FROM node:18-alpine

WORKDIR /app

# Install ansible
RUN apk add --no-cache ansible openssh-client

# Copy files
COPY package*.json ./
RUN npm install

COPY app.js ./
COPY public/ ./public/

EXPOSE 3000

CMD ["npm", "start"]
