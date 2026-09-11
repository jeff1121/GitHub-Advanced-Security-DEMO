from typing import List, Dict, Any
from pydantic import BaseModel, Field, StrictInt, field_validator

FREE_SPACE = 0

class BingoCardModel(BaseModel):
    numbers: List[List[StrictInt]] = Field(min_length=5, max_length=5)

    @field_validator("numbers")
    @classmethod
    def valid_card(cls, grid):
        if any(len(row) != 5 for row in grid) or grid[2][2] != FREE_SPACE:
            raise ValueError("Card must be 5x5 with a free center")
        for column in range(5):
            values = [grid[row][column] for row in range(5) if (row, column) != (2, 2)]
            if len(set(values)) != len(values) or any(not column * 15 + 1 <= value <= column * 15 + 15 for value in values):
                raise ValueError("Invalid column range or duplicate number")
        return grid

class ScoreVerifyRequest(BaseModel):
    card: BingoCardModel
    marked: List[StrictInt] = Field(max_length=75)
    draws: List[StrictInt] = Field(max_length=75)

    @field_validator("marked", "draws")
    @classmethod
    def valid_numbers(cls, values):
        if any(not 0 <= value <= 75 for value in values):
            raise ValueError("Numbers must be in 0..75")
        return values

class ScoreVerifyResponse(BaseModel):
    valid: bool
    line_count: int
    lines: List[str]
    score: int
    details: Dict[str, Any]

def verify_bingo_lines(card_grid: List[List[int]], marked_numbers: List[int], drawn_numbers: List[int]) -> ScoreVerifyResponse:
    # Free space (0) is automatically marked
    drawn_set = set(drawn_numbers)
    drawn_set.add(FREE_SPACE)

    # Valid marked numbers are only those actually drawn (prevents client cheating)
    valid_marked = set(n for n in marked_numbers if n in drawn_set)
    valid_marked.add(FREE_SPACE)

    completed_rows = []
    completed_cols = []
    completed_diags = []

    # 1. Rows
    for r in range(5):
        if all(card_grid[r][c] in valid_marked for c in range(5)):
            completed_rows.append(r)

    # 2. Columns
    for c in range(5):
        if all(card_grid[r][c] in valid_marked for r in range(5)):
            completed_cols.append(c)

    # 3. Main Diagonal
    if all(card_grid[i][i] in valid_marked for i in range(5)):
        completed_diags.append("main")

    # 4. Anti Diagonal
    if all(card_grid[i][4 - i] in valid_marked for i in range(5)):
        completed_diags.append("anti")

    total_lines = len(completed_rows) + len(completed_cols) + len(completed_diags)
    is_full_house = (len(completed_rows) == 5 and len(completed_cols) == 5 and len(completed_diags) == 2)

    lines = []
    if completed_rows:
        lines.append("row")
    if completed_cols:
        lines.append("col")
    if completed_diags:
        lines.append("diag")
    if is_full_house:
        lines.append("full")

    score = total_lines * 100
    if is_full_house:
        score += 500

    return ScoreVerifyResponse(
        valid=(total_lines > 0),
        line_count=total_lines,
        lines=lines,
        score=score,
        details={
            "rows": completed_rows,
            "cols": completed_cols,
            "diagonals": completed_diags,
            "full_house": is_full_house
        }
    )
