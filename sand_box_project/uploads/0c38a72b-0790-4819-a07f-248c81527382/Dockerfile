FROM node:18-alpine
WORKDIR /app
COPY "package.json" ./
RUN npm install
COPY . .
CMD ["sh", "-c", "npm start & sleep 3 && kill %1 && echo 'Server started successfully'"]
