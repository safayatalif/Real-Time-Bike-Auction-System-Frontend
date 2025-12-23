FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Nginx Production Stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Custom nginx config to handle React Router? Usually necessary.
# For simplicity, we can just use default if simple, or add a config.
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
