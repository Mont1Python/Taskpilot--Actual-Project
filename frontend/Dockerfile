FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund 2>&1 || npm install --legacy-peer-deps 2>&1 || true

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve --no-audit --no-fund
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1
CMD ["serve", "-s", "build", "-l", "3000"]
