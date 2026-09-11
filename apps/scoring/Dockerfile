FROM python:3.14-slim
WORKDIR /app
COPY apps/scoring/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt && useradd --uid 10001 --create-home scoring
COPY apps/scoring/app ./app
USER scoring
EXPOSE 8000
HEALTHCHECK --interval=5s --timeout=4s --retries=10 CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=2)"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
