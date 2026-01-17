import React from 'react';
import ReactDOM from 'react-dom/client';
import ContributionGraph from './ContributionGraph';
import './index.css';

console.log("🚀 Extension: Script loaded");

// Reactのルートとコンテナを保持する変数
let reactRoot: ReactDOM.Root | null = null;
let injectionContainer: HTMLDivElement | null = null;
let currentPlayerId: string = ''; // 現在表示しているプレイヤーID

// URLからPlayerIDを取得する関数
const getPlayerId = (): string => {
  const pathParts = window.location.pathname.split('/');
  // URLが /u/12345... の形式であることを想定
  const uIndex = pathParts.indexOf('u');
  if (uIndex !== -1 && pathParts.length > uIndex + 1) {
    return pathParts[uIndex + 1];
  }
  return '';
};

const initExtension = () => {
  console.log("🚀 Extension: initExtension called");

  const playerId = getPlayerId();
  if (!playerId) return;

  // 1. ボタンを挿入する場所（コンテナ）を探す
  const switcherContainer = document.querySelector('.chart-switcher .switch-types');
  if (!switcherContainer) return;

  // すでにボタンがある場合は作成しない
  if (document.getElementById('my-activity-btn')) {
    // ただし、ID変数は更新しておく
    currentPlayerId = playerId;
    return;
  }

  // 2. 既存のボタンをコピーして新しいボタンを作る
  const existingButton = switcherContainer.querySelector('button');
  if (!existingButton) return;

  const newButton = document.createElement('button');
  newButton.className = existingButton.className;
  newButton.classList.remove('primary'); // 初期状態は非アクティブ
  newButton.classList.add('default', 'not-selected');
  newButton.id = 'my-activity-btn';
  
  // スタイルをコピー
  const styleString = existingButton.getAttribute('style');
  if (styleString) {
    newButton.setAttribute('style', styleString);
    newButton.style.setProperty('--btn-bg-color', '#dbdbdb'); 
    newButton.style.setProperty('--btn-color', '#444');
  }

  newButton.innerHTML = `
    <i class="fas fa-calendar-alt svelte-kkfmrh" style="margin-right: 0.5em;"></i>
    <span>Activity</span>
  `;

  switcherContainer.appendChild(newButton);
  console.log("🚀 Extension: Button added");

  // 3. グラフを表示するエリアを作成
  const chartSection = document.querySelector('.beatleader-swipe-card .chart');
  if (!chartSection) return;

  injectionContainer = document.createElement('div');
  injectionContainer.id = 'my-extension-root';
  injectionContainer.style.display = 'none'; // 初期は非表示
  chartSection.appendChild(injectionContainer);

  // Reactアプリをマウント
  reactRoot = ReactDOM.createRoot(injectionContainer);
  reactRoot.render(
    <React.StrictMode>
      <ContributionGraph playerId={playerId} />
    </React.StrictMode>
  );

  // 4. クリックイベントの設定
  newButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // 他のボタンを非アクティブにする
    const allButtons = switcherContainer.querySelectorAll('button');
    allButtons.forEach(btn => {
      if (btn === newButton) {
        // 自分をアクティブに
        btn.classList.remove('default', 'not-selected');
        btn.classList.add('primary');
        btn.style.setProperty('--btn-bg-color', 'var(--bg-color, #fff)'); 
        btn.style.setProperty('--btn-color', 'var(--color, #000)');
      } else {
        // 他を非アクティブに
        btn.classList.remove('primary');
        btn.classList.add('default', 'not-selected');
        btn.style.setProperty('--btn-bg-color', '#dbdbdb'); 
        btn.style.setProperty('--btn-color', '#444');
      }
    });

    // 元のチャートを隠して、自分のグラフを表示
    const originalChart = chartSection.querySelector('section.chart') as HTMLElement;
    if (originalChart) originalChart.style.display = 'none';
    if (injectionContainer) injectionContainer.style.display = 'block';
  });

  // 既存のボタンが押されたら元に戻すイベントを追加
  const originalButtons = switcherContainer.querySelectorAll('button:not(#my-activity-btn)');
  originalButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      newButton.classList.remove('primary');
      newButton.classList.add('default', 'not-selected');
      newButton.style.setProperty('--btn-bg-color', '#dbdbdb');
      newButton.style.setProperty('--btn-color', '#444');

      const originalChart = chartSection.querySelector('section.chart') as HTMLElement;
      if (originalChart) originalChart.style.display = 'block';
      if (injectionContainer) injectionContainer.style.display = 'none';
    });
  });

  // 最後に現在のプレイヤーIDを記録（これでエラーが消えます）
  currentPlayerId = playerId;
};

// 5. ページの変化を監視する（SPA対応）
const observer = new MutationObserver(() => {
  const newPlayerId = getPlayerId();
  
  // プレイヤーが変わった場合（例: 別の人のプロフィールに移動した）
  if (newPlayerId && newPlayerId !== currentPlayerId) {
    console.log(`🚀 Player changed: ${currentPlayerId} -> ${newPlayerId}`);
    
    // 古い要素をお掃除
    const oldBtn = document.getElementById('my-activity-btn');
    if (oldBtn) oldBtn.remove();
    
    const oldRoot = document.getElementById('my-extension-root');
    if (oldRoot) oldRoot.remove();
    
    // 現在のIDをリセットして再初期化
    currentPlayerId = '';
    initExtension();
    return;
  }

  // 同じプレイヤーだが、画面描画のタイミングでボタンが消えてしまった場合
  const container = document.querySelector('.chart-switcher .switch-types');
  if (container && !document.getElementById('my-activity-btn')) {
    initExtension();
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// 初回実行
setTimeout(initExtension, 1000);