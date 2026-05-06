FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund 2>&1 || npm install 2>&1 || true

FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY --from=builder /app/node_modules ./node_modules
COPY . .
USER node
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
