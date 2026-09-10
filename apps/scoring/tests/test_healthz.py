from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_healthz():
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "bingoblitz-scoring"
    assert "timestamp" in data

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "BingoBlitz" in response.json()["message"]
