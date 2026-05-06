FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund || npm install || true

FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 5000
CMD ["dumb-init", "--", "node", "server.js"]
