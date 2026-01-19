export class ScoreService {
  private static instance: ScoreService;
  private currentScore: number = 0;
  private highScore: number = 0;

  private constructor() {}

  static getInstance(): ScoreService {
    if (!ScoreService.instance) {
      ScoreService.instance = new ScoreService();
    }
    return ScoreService.instance;
  }

  addScore(points: number): void {
    this.currentScore += points;
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
    }
  }

  getCurrentScore(): number {
    return this.currentScore;
  }

  getHighScore(): number {
    return this.highScore;
  }

  resetScore(): void {
    this.currentScore = 0;
  }

  formatScore(score: number): string {
    if (score >= 1000000000000) {
      return `${(score / 1000000000000).toFixed(1)}T`;
    } else if (score >= 1000000000) {
      return `${(score / 1000000000).toFixed(1)}B`;
    } else if (score >= 1000000) {
      return `${(score / 1000000).toFixed(1)}M`;
    } else if (score >= 1000) {
      return `${(score / 1000).toFixed(1)}K`;
    }
    return score.toString();
  }
}

export const scoreService = ScoreService.getInstance();
