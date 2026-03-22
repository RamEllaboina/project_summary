FROM node:18-alpine
WORKDIR /app
COPY "package.json" ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "npm start & sleep 3 && curl -f http://localhost:3000 && echo 'Server started successfully' && exit 0"]
