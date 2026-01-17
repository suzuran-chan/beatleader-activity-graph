interface Score {
  timepost: number; // Unix timestamp
}

interface ScoreResponse {
  data: Score[];
  metadata: {
    itemsPerPage: number;
    page: number;
    total: number;
  };
}

// リクエスト間の遅延用ユーティリティ
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 過去1年間のスコアを取得し、日付ごとのカウントを返す
export const fetchPlayerHistory = async (playerId: string): Promise<Record<string, number>> => {
  const scores: Score[] = [];
  let page = 1;
  // 現在時刻から365日前 (秒単位)
  const oneYearAgo = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
  let keepFetching = true;

  // 1年前のデータに到達するまで取得
  while (keepFetching) {
    try {
      const response = await fetch(
        `https://api.beatleader.xyz/player/${playerId}/scores?sortBy=date&page=${page}&count=100`
      );

      // レート制限時はリトライ
      if (response.status === 429) {
        console.log("Rate limited, waiting 2 seconds...");
        await delay(2000);
        continue;
      }

      if (!response.ok) break;

      const json: ScoreResponse = await response.json();
      const newScores = json.data;

      if (!newScores || newScores.length === 0) break;

      scores.push(...newScores);

      // 取得した最後のスコアが1年前より古ければ終了
      const lastScoreTime = Number(newScores[newScores.length - 1].timepost);
      if (lastScoreTime < oneYearAgo) {
        keepFetching = false;
      } else {
        page++;
        // レート制限を避けるため、リクエスト間に遅延を入れる
        await delay(200);
      }
    } catch (e) {
      console.error("Fetch error:", e);
      break;
    }
  }

  // 日付ごとのカウントに集計 (YYYY-MM-DD: count)
  const dailyCounts: Record<string, number> = {};
  
  scores.forEach(score => {
    // Unix timestamp (秒) をミリ秒に変換
    const date = new Date(Number(score.timepost) * 1000);
    // ユーザーのローカルタイムで日付を取得 (YYYY-MM-DD形式)
    const key = date.toLocaleDateString('en-CA');

    dailyCounts[key] = (dailyCounts[key] || 0) + 1;
  });

  return dailyCounts;
};