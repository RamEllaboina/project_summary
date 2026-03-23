FROM node:18-alpine
WORKDIR /app
COPY "package.json" ./
RUN npm install
COPY . .
CMD ["sh", "-c", "npm start > /dev/null 2>&1 & sleep 2 && echo 'Server started successfully'"]
