import crypto from 'crypto';

export class BingoDrawer {
  private remainingNumbers: number[];
  private drawnNumbers: number[];
  private currentSequence: number;

  constructor() {
    this.remainingNumbers = Array.from({ length: 75 }, (_, i) => i + 1);
    this.drawnNumbers = [];
    this.currentSequence = 0;
    this.shuffleRemaining();
  }

  /**
   * Phase 2: Safe CSPRNG shuffling using crypto.randomInt
   * (In Phase 3, BE-06 will replace this with Math.random())
   */
  private shuffleRemaining(): void {
    for (let i = this.remainingNumbers.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [this.remainingNumbers[i], this.remainingNumbers[j]] = [
        this.remainingNumbers[j],
        this.remainingNumbers[i]
      ];
    }
  }

  /**
   * Draw the next number.
   * Returns { sequence, number } or null if all 75 numbers have been drawn.
   */
  public drawNext(): { sequence: number; number: number } | null {
    if (this.remainingNumbers.length === 0) {
      return null;
    }

    const nextNumber = this.remainingNumbers.pop()!;
    this.currentSequence += 1;
    this.drawnNumbers.push(nextNumber);

    return {
      sequence: this.currentSequence,
      number: nextNumber
    };
  }

  public getDrawnNumbers(): number[] {
    return [...this.drawnNumbers];
  }

  public getRemainingCount(): number {
    return this.remainingNumbers.length;
  }

  public isComplete(): boolean {
    return this.remainingNumbers.length === 0;
  }
}
