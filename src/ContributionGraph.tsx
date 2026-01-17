import React, { useEffect, useState } from 'react';
import { fetchPlayerHistory } from './api';

type DailyScores = {
  [key: string]: number; // "YYYY-MM-DD": count
};

interface ContributionGraphProps {
  playerId: string;
  onDateClick?: (date: string) => void;
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({ playerId, onDateClick }) => {
  const [dailyScores, setDailyScores] = useState<DailyScores>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchPlayerHistory(playerId);
        setDailyScores(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (playerId) {
      getData();
    }
  }, [playerId]);

  const getContributionData = () => {
    const data: { date: string; count: number }[] = [];
    const now = new Date();
    const japanNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
    
    // 365日前から開始
    const startDate = new Date(japanNow);
    startDate.setDate(startDate.getDate() - 365);
    
    const currentDate = new Date(startDate);

    while (currentDate.getTime() <= japanNow.getTime()) {
      const yyyy = currentDate.getFullYear();
      const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
      const dd = String(currentDate.getDate()).padStart(2, '0');
      const formattedDate = `${yyyy}-${mm}-${dd}`;
      
      data.push({
        date: formattedDate,
        count: dailyScores[formattedDate] || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return data;
  };

  const contributionData = getContributionData();

  const getScoreColor = (count: number): string => {
    if (count >= 10) return '#22c55e'; // green-500
    if (count >= 5) return '#16a34a'; // green-600
    if (count >= 3) return '#15803d'; // green-700
    if (count >= 1) return '#166534'; // green-800
    return '#2a2a2a'; // 背景色
  };

  // 週ごとのデータ生成
  const weeks: { date: string; count: number }[][] = [];
  let currentWeek: { date: string; count: number }[] = [];
  
  // 開始日の曜日パディング
  const firstDate = new Date(contributionData[0].date);
  const firstDay = firstDate.getDay(); // 0:Sun
  
  for (let i = 0; i < firstDay; i++) {
    currentWeek.push({ date: '', count: -1 });
  }

  contributionData.forEach((day) => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: '', count: -1 });
    }
    weeks.push(currentWeek);
  }

  // 月ラベルの計算（1日がある週のインデックスと月名）
  const monthLabels: { weekIndex: number; month: string }[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  weeks.forEach((week, weekIndex) => {
    week.forEach((day) => {
      if (day.date && day.date.endsWith('-01')) {
        const month = parseInt(day.date.split('-')[1], 10) - 1;
        monthLabels.push({ weekIndex, month: monthNames[month] });
      }
    });
  });

  if (isLoading) {
    // スケルトンローダー: グラフの形を模したプレースホルダー
    const skeletonWeeks = Array.from({ length: 53 }, () => Array(7).fill(0));

    return (
      <div className="w-full">
        {/* タイトルのスケルトン */}
        <div className="h-7 w-48 bg-gray-700 rounded animate-pulse mb-4"></div>
        <div className="w-full bg-[#161616] p-6 rounded-lg flex flex-col justify-center items-center">
          <div className="flex flex-col gap-[3px]">
            {/* 月ラベルのスケルトン */}
            <div className="flex flex-row gap-[3px] h-[16px] items-center">
              {/* 曜日ラベル分のスペーサー */}
              <div className="w-[30px] mr-2"></div>
              {skeletonWeeks.map((_, wIndex) => (
                <div
                  key={wIndex}
                  className={`w-[14px] h-3 rounded ${wIndex % 4 === 0 ? 'bg-gray-700 animate-pulse' : ''}`}
                />
              ))}
            </div>
            {/* グラフ本体のスケルトン */}
            <div className="flex flex-row gap-[3px]">
              {/* 曜日ラベルのスケルトン */}
              <div className="flex flex-col gap-[3px] mr-2 w-[30px]">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((_, i) => (
                  <div key={i} className="h-[14px] w-6 bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
              {/* グリッドのスケルトン */}
              {skeletonWeeks.map((week, wIndex) => (
                <div key={wIndex} className="flex flex-col gap-[3px]">
                  {week.map((_, dIndex) => (
                    <div
                      key={dIndex}
                      className="w-[14px] h-[14px] rounded-[2px] bg-gray-700 animate-pulse"
                      style={{ animationDelay: `${(wIndex * 7 + dIndex) * 5}ms` }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[350px] flex items-center justify-center bg-[#181818] rounded-lg text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full">
      <h2 className="text-white text-lg font-bold mb-4">Yearly Play History</h2>
      <div className="w-full bg-[#161616] p-6 rounded-lg flex flex-col justify-center items-center">
        <div className="flex flex-col gap-[3px]">
          {/* 月ラベル行 */}
          <div className="flex flex-row gap-[3px] h-[16px] items-center">
            {/* 曜日ラベル分のスペーサー */}
            <div className="w-[30px] mr-2"></div>
            {weeks.map((_, wIndex) => {
              const label = monthLabels.find((l) => l.weekIndex === wIndex);
              return (
                <div
                  key={wIndex}
                  className="w-[14px] text-[11px] text-gray-400 text-left"
                >
                  {label ? label.month : ''}
                </div>
              );
            })}
          </div>
          {/* グラフ本体 */}
          <div className="flex flex-row gap-[3px]">
            <div className="flex flex-col gap-[3px] text-[11px] text-gray-400 mr-2 w-[30px]">
              <span className="h-[14px] flex items-center">Sun</span>
              <span className="h-[14px] flex items-center">Mon</span>
              <span className="h-[14px] flex items-center">Tue</span>
              <span className="h-[14px] flex items-center">Wed</span>
              <span className="h-[14px] flex items-center">Thu</span>
              <span className="h-[14px] flex items-center">Fri</span>
              <span className="h-[14px] flex items-center">Sat</span>
            </div>
            {weeks.map((week, wIndex) => (
              <div key={wIndex} className="flex flex-col gap-[3px]">
                {week.map((day, dIndex) => (
                  <div
                    key={dIndex}
                    className="w-[14px] h-[14px] rounded-[2px] cursor-pointer hover:ring-1 hover:ring-white/50"
                    style={{ backgroundColor: day.count === -1 ? 'transparent' : getScoreColor(day.count) }}
                    title={day.count !== -1 ? `${day.date}: ${day.count} plays` : ''}
                    onClick={() => day.count !== -1 && onDateClick && onDateClick(day.date)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph;