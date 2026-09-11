from fastapi import FastAPI, HTTPException
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
    raise HTTPException(status_code=501, detail="Use the API leaderboard; scoring storage is not implemented")
