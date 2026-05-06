FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit --no-fund || npm install --legacy-peer-deps || npm install || true

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
