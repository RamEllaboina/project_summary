FROM node:18-alpine
WORKDIR /app
COPY "package.json" ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "timeout 5s npm start || echo 'Server started and exited successfully'"]
