FROM python:3.11-slim

WORKDIR /app

# install system dependencies needed for opencv and paddleocr
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    git \
    && rm -rf /var/lib/apt/lists/*

# copy requirements first — Docker caches this layer
COPY requirements.txt .

# install Python packages
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# copy all backend code
COPY . .

# create necessary folders
RUN mkdir -p uploads outputs models

# expose port
EXPOSE 7860

# start server — HF Spaces uses port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]