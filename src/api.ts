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

// 過去1年間のスコアを取得し、日付ごとのカウントを返す
export const fetchPlayerHistory = async (playerId: string): Promise<Record<string, number>> => {
  const scores: Score[] = [];
  let page = 1;
  // 現在時刻から365日前 (秒単位)
  const oneYearAgo = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60;
  let keepFetching = true;

  // 最大20ページまたは1年前のデータに到達するまで取得
  while (keepFetching && page <= 20) {
    try {
      const response = await fetch(
        `https://api.beatleader.xyz/player/${playerId}/scores?sortBy=date&page=${page}&count=50`
      );
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
    // 日本時間での日付取得を簡易的に行う場合
    const jstDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    
    const yyyy = jstDate.getFullYear();
    const mm = String(jstDate.getMonth() + 1).padStart(2, '0');
    const dd = String(jstDate.getDate()).padStart(2, '0');
    const key = `${yyyy}-${mm}-${dd}`;
    
    dailyCounts[key] = (dailyCounts[key] || 0) + 1;
  });

  return dailyCounts;
};