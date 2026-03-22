FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir locust
COPY locustfile.py .

CMD locust -f locustfile.py --web-host 0.0.0.0 --web-port ${PORT:-8080}