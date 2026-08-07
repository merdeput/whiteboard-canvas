FROM node:24-slim AS build

WORKDIR /app

ARG VITE_API_URL=http://localhost:3001/api
ARG VITE_SERVER_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SERVER_URL=$VITE_SERVER_URL

COPY package*.json ./
RUN npm ci

COPY index.html ./
COPY src ./src
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
