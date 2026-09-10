from fastapi import FastAPI
from datetime import datetime, timezone
from app.verify import ScoreVerifyRequest, ScoreVerifyResponse, verify_bingo_lines

app = FastAPI(
    title="BingoBlitz Scoring Service",
    description="High performance scoring and verification engine for BingoBlitz",
    version="1.0.0"
)

@app.get("/healthz")
def healthz():
    return {
        "status": "ok",
        "service": "bingoblitz-scoring",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/")
def root():
    return {"message": "BingoBlitz Scoring Service is operational"}

@app.post("/score/verify", response_model=ScoreVerifyResponse)
def score_verify(req: ScoreVerifyRequest):
    return verify_bingo_lines(req.card.numbers, req.marked, req.draws)

@app.get("/stats/leaderboard")
def stats_leaderboard(limit: int = 10):
    return {
        "top_players": [
            {"player_id": "1", "score": 2500, "rank": 1},
            {"player_id": "2", "score": 1800, "rank": 2},
            {"player_id": "3", "score": 1200, "rank": 3}
        ][:limit]
    }
