document.addEventListener('DOMContentLoaded', function() {
    // Google SpreadsheetのURL（youtube.jsと同じURLを使用）
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIHlNKRZGlEO27QAiMDSx1PF99gQ47shvjWtPia3HA2rxabhiISilyR4_NvHh-ojOAofR3MIhUNMzo/pub?output=csv';
    
    // 動画数を表示する要素
    const videoCountElement = document.getElementById('video-count');
    
    // CSVデータから公開動画数を取得する関数
    function fetchVideoCount() {
        console.log('動画数取得処理を開始します');
        
        // 現在の日付を取得（フィルタリング用）
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const currentDateString = `${year}${month}${day}`;
        
        console.log(`現在日付: ${currentDateString}`);
        
        fetch(csvUrl)
            .then(response => {
                console.log('Spreadsheetレスポンス状態:', response.status);
                if (!response.ok) {
                    throw new Error(`Spreadsheetデータの取得に失敗しました (${response.status})`);
                }
                return response.text();
            })
            .then(csvText => {
                console.log('CSV取得成功、長さ:', csvText.length);
                
                // PapaParseが既に読み込まれているか確認
                if (typeof Papa === 'undefined') {
                    console.log('PapaParseを読み込みます');
                    return new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js';
                        script.onload = () => resolve(csvText);
                        script.onerror = () => reject(new Error('PapaParseの読み込みに失敗しました'));
                        document.head.appendChild(script);
                    });
                }
                return csvText;
            })
            .then(csvText => {
                console.log('CSVの処理を開始します');
                processCSV(csvText);
            })
            .catch(error => {
                console.error('動画数の取得エラー:', error);
                // エラー時はデフォルト値を表示（すでにHTMLに設定されている値）
            });
    }
    
    // CSVデータを処理して公開動画数をカウントする関数
    function processCSV(csvText) {
        if (typeof Papa === 'undefined') {
            console.error('PapaParseが読み込まれていません');
            return;
        }
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                console.log('CSV解析完了:', results);
                
                // 現在の日付を取得
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                const day = String(now.getDate()).padStart(2, '0');
                const currentDateString = `${year}${month}${day}`;
                
                // published=trueかつ現在日付以前の動画をカウント
                const publishedVideos = results.data.filter(video => {
                    // 大文字小文字を区別せずに比較
                    const isPublished = 
                        video.published === 'true' || 
                        video.published === 'TRUE' ||
                        video.published === true;
                    
                    return isPublished && 
                        video.date && 
                        video.date.trim() !== '' && 
                        video.date <= currentDateString;
                });
                
                const videoCount = publishedVideos.length;
                console.log(`公開済み動画数: ${videoCount}`, publishedVideos);
                
                // 動画数を表示
                if (videoCountElement) {
                    videoCountElement.textContent = videoCount;
                    console.log(`動画数を更新しました: ${videoCount}`);
                } else {
                    console.error('video-count要素が見つかりません');
                }
            },
            error: function(error) {
                console.error('CSV解析エラー:', error);
            }
        });
    }
    
    // 動画数を取得
    if (videoCountElement) {
        console.log('video-count要素を検出、動画数取得処理を開始します');
        fetchVideoCount();
    } else {
        console.error('video-count要素が見つかりません');
        // 要素が存在しない場合は早期に処理を終了
    }
});