FROM python:3.10-slim
WORKDIR /app
COPY . .
EXPOSE 3000
# Keep server running in foreground and don't exit
CMD ["python", "-m", "http.server", "3000", "--bind", "0.0.0.0"]
