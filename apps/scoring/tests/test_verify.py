from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

sample_card = {
    "numbers": [
        [1, 16, 31, 46, 61],
        [2, 17, 32, 47, 62],
        [3, 18, 0, 48, 63],
        [4, 19, 34, 49, 64],
        [5, 20, 35, 50, 65]
    ]
}

def test_score_verify_no_lines():
    res = client.post("/score/verify", json={
        "card": sample_card,
        "marked": [1, 2],
        "draws": [1, 2]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert data["line_count"] == 0

def test_score_verify_row_complete():
    res = client.post("/score/verify", json={
        "card": sample_card,
        "marked": [1, 16, 31, 46, 61],
        "draws": [1, 16, 31, 46, 61]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["line_count"] == 1
    assert "row" in data["lines"]
    assert data["score"] == 100

def test_score_verify_with_center_free_space():
    # Row 2 passes through free space (0)
    res = client.post("/score/verify", json={
        "card": sample_card,
        "marked": [3, 18, 48, 63],
        "draws": [3, 18, 48, 63]
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is True
    assert data["line_count"] == 1
    assert data["score"] == 100

def test_score_verify_rejects_undrawn_numbers():
    # Marked [1, 16, 31, 46, 61] but 61 was never drawn!
    res = client.post("/score/verify", json={
        "card": sample_card,
        "marked": [1, 16, 31, 46, 61],
        "draws": [1, 16, 31, 46] # 61 not drawn
    })
    assert res.status_code == 200
    data = res.json()
    assert data["valid"] is False
    assert data["line_count"] == 0
