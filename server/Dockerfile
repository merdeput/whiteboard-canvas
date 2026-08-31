FROM node:22-slim

ENV NODE_ENV=production
HEALTHCHECK --interval=5s --timeout=3s --start-period=2s --retries=5 CMD node -e "require('http').get('http://localhost:3001/health', r => process.exit(r.statusCode===200?0:1))"

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

USER node

EXPOSE 3001

CMD ["node", "src/index.js"]
