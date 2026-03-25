FROM python:3.12-slim

# Install LibreOffice and Poppler for PPTX->PDF->PNG conversion
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-impress \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/

# Create directories for uploads and output
RUN mkdir -p /app/uploads /app/output

EXPOSE 8100

CMD ["uvicorn", "src.server:app", "--host", "0.0.0.0", "--port", "8100"]
