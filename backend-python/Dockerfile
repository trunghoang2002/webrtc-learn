FROM python:3.10-slim

WORKDIR /app

COPY . /app

RUN apt-get install libgomp1
RUN apt-get install ffmpeg
RUN apt-get install gcc
RUN apt-get install g++
RUN pip install --upgrade pip
# Install Rust compiler (to build sudachipy for Mac)
RUN curl --proto '=https' --tlsv1.2 -sSf "https://sh.rustup.rs" | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN pip install --no-cache-dir -r /app/requirements.txt

EXPOSE 80

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80", "--reload"]