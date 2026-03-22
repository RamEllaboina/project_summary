
FROM python:3.10-slim
WORKDIR /app

COPY . .
# Convert windows line endings to unix just in case
RUN sed -i 's/\r$//' "main.py" || true
CMD ["python", "main.py"]
