FROM python:3.10-slim

WORKDIR /app

COPY . /app

RUN apt-get install libgomp1
RUN apt-get install ffmpeg
RUN pip install --no-cache-dir -r /app/requirements.txt

EXPOSE 80

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80", "--reload"]