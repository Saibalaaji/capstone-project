FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (needed for psycopg2 and other native extensions)
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Run with Gunicorn and Eventlet worker for WebSocket support
CMD ["gunicorn", "-k", "eventlet", "-w", "1", "-b", "0.0.0.0:5000", "app:create_app()"]
