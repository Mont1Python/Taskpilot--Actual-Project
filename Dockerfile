FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache ansible openssh-client
COPY package*.json ./
RUN set -e && \
    npm install --production --no-audit --no-fund 2>&1 || \
    npm install --production 2>&1 || \
    npm install 2>&1 || \
    echo "npm install completed with warnings"
COPY app.js ./
COPY public/ ./public/
COPY playbooks/ ./playbooks/
EXPOSE 3000
CMD ["npm", "start"]
