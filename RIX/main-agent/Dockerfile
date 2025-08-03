# RIX Main Agent Dockerfile - Phase 6: N8N Workflow Management
# Enhanced for comprehensive workflow execution, AI-triggered workflows, and analytics
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for workflow processing
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash rix
RUN chown -R rix:rix /app
USER rix

# Expose port
EXPOSE 8001

# Health check with N8N workflow status validation
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8001/health/ready')"

# Run application with enhanced N8N workflow management
CMD ["python", "main.py"]