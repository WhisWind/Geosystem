FROM python:3.11-slim

RUN pip install torch==2.1.0 --index-url https://download.pytorch.org/whl/cpu --no-cache-dir

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app_aplication ./app_aplication
RUN mkdir -p /app/app_aplication/data/results

EXPOSE 8000

CMD ["uvicorn", "app_aplication.main:app", "--host", "0.0.0.0", "--port", "8000"]
