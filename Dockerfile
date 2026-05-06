FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache ansible openssh-client
COPY package*.json ./
RUN npm install --production
COPY app.js ./
COPY public/ ./public/
COPY playbooks/ ./playbooks/
EXPOSE 3000
CMD ["npm", "start"]
