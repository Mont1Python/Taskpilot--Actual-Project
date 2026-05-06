FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps 2>&1 | grep -E "added|up to date" || true
COPY . .
RUN npm run build 2>&1

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/build ./build
COPY package*.json ./
RUN npm install -g serve && npm cache clean --force
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1
CMD ["serve", "-s", "build", "-l", "3000"]
