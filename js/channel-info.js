document.addEventListener('DOMContentLoaded', function() {
    // Google SpreadsheetのURL（youtube.jsと同じURLを使用）
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIHlNKRZGlEO27QAiMDSx1PF99gQ47shvjWtPia3HA2rxabhiISilyR4_NvHh-ojOAofR3MIhUNMzo/pub?output=csv';
    
    // 動画数を表示する要素
    const videoCountElement = document.getElementById('video-count');
    
    // CSVデータから公開動画数を取得する関数
    function fetchVideoCount() {
        fetch(csvUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Spreadsheetデータの取得に失敗しました');
                }
                return response.text();
            })
            .then(csvText => {
                // PapaParseを使ってCSVを解析
                if (typeof Papa === 'undefined') {
                    // PapaParseが読み込まれていない場合は読み込む
                    const script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js';
                    script.onload = function() {
                        processCSV(csvText);
                    };
                    document.head.appendChild(script);
                } else {
                    processCSV(csvText);
                }
            })
            .catch(error => {
                console.error('動画数の取得エラー:', error);
                // エラー時はデフォルト値を表示（すでにHTMLに設定されている値）
            });
    }
    
    // CSVデータを処理して公開動画数をカウントする関数
    function processCSV(csvText) {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                // published=trueの動画をカウント
                const publishedVideos = results.data.filter(video => video.published === 'TRUE');
                const videoCount = publishedVideos.length;
                
                // 動画数を表示
                if (videoCountElement) {
                    videoCountElement.textContent = videoCount;
                }
            },
            error: function(error) {
                console.error('CSV解析エラー:', error);
            }
        });
    }
    
    // 動画数を取得
    if (videoCountElement) {
        fetchVideoCount();
    }
});