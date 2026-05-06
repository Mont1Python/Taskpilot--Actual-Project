FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache ansible openssh-client
COPY package*.json ./
RUN npm install --production --no-audit --no-fund || npm install --production || npm install || true
COPY app.js ./
COPY public/ ./public/
COPY playbooks/ ./playbooks/
EXPOSE 3000
CMD ["npm", "start"]
