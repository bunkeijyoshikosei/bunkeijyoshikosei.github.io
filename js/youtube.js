document.addEventListener('DOMContentLoaded', function() {
    // CSVデータのURL
    // Google Spreadsheetを公開してCSVとして取得するURL
    // 注意: pubhtmlではなく、/pub?output=csvが必要
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIHlNKRZGlEO27QAiMDSx1PF99gQ47shvjWtPia3HA2rxabhiISilyR4_NvHh-ojOAofR3MIhUNMzo/pub?output=csv';
    
    // テスト用のデータ（実際の実装では削除または置き換える）
    const testData = `title,published,url,date,image,play_list1,play_list2,play_list3,,memo
ChatGPTに痩せる方法聞いてみた,true,https://youtu.be/SvB5e4zzBRY,20250407,ダイエット,文系女子高生のCharGPT相談,,,,チャンネル作成
ChatGPTに人間の仕事を奪うつもりか聞いてみた,true,https://youtu.be/0nFS0AtBkXo,20250408,仕事相談,文系女子高生のCharGPT相談,,,,
金欠Kが格安コーデを相談する,true,https://youtu.be/RsR9WJf0h-Q,20250409,ディズニーコーデ,文系女子高生のCharGPT相談,,,,
数学、マジ分からんのでChatGPTに勉強法聞いてみた,true,https://youtu.be/ArT3yZ-x5X0,20250410,数学入門,文系女子高生のCharGPT相談,,,,
雨の日に傘を忘れた。自分を全肯定してくれるAIに泣きついてみた,true,https://youtu.be/wMKNKx1HId8,20250411,雨の日の相談,文系女子高生のCharGPT相談,,,,
AIに宿題をやらせる方法【禁断の質問】,true,https://youtu.be/3xwkWaTbEOY,20250412,宿題,文系女子高生のCharGPT相談,,,,
文系？理系？どっちも好きなんだけど,true,https://youtu.be/zXZ8Khom_Zk,20250413,文系理系,文系女子高生のCharGPT相談,,,,
学校だるい。理由なく休みたい。どう言い訳すれば？,true,https://youtu.be/-G5yF8ZCMe0,20250414,学校休みたい,文系女子高生のCharGPT相談,,,,
タイトル,false,https://youtu.be/SvB5e4zzBRY,20250415,none,文系女子高生のCharGPT相談,,,,
タイトル,false,https://youtu.be/SvB5e4zzBRY,20250416,none,文系女子高生のCharGPT相談,,,,`;

    // CSVを解析して動画を表示する関数
    function processCSV(csvText) {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                displayVideos(results.data);
                setupFilters(results.data);
            },
            error: function(error) {
                console.error('CSV解析エラー:', error);
                document.querySelector('.loading').innerHTML = '<p>動画データの読み込みに失敗しました。</p>';
            }
        });
    }

    // 動画を表示する関数
    function displayVideos(data) {
        const container = document.getElementById('video-container');
        // ローディング表示を削除
        container.querySelector('.loading').remove();
        
        // publishedがtrueの動画のみ表示
        const publishedVideos = data.filter(video => video.published === 'TRUE');
        
        if (publishedVideos.length === 0) {
            container.innerHTML = '<p class="no-videos">表示できる動画がありません。</p>';
            return;
        }
        
        // 日付の降順にソート
        publishedVideos.sort((a, b) => b.date.localeCompare(a.date));
        
        publishedVideos.forEach(video => {
            // 日付をフォーマット
            const dateStr = formatDate(video.date);
            
            // YouTubeのサムネイルURLを生成
            const youtubeId = getYouTubeId(video.url);
            
            // サムネイル画像のプレースホルダー（動画ID+タイトル文字列から生成する代替画像）
            const placeholderUrl = `https://placehold.co/480x360/333333/FFFFFF?text=${encodeURIComponent(youtubeId)}`;
            
            // バックアップサムネイルを設定（複数の選択肢）
            const thumbnailSources = [
                `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`,
                `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
                `https://i.ytimg.com/vi/${youtubeId}/sddefault.jpg`,
                `https://img.youtube.com/vi/${youtubeId}/0.jpg`,
                placeholderUrl
            ];
            
            // プレイリストタグを生成
            const playlistTags = createPlaylistTags(video);
            
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            videoCard.dataset.playlists = getPlaylists(video).join(',');
            videoCard.innerHTML = `
                <a href="${video.url}" target="_blank" class="video-thumbnail">
                    <img src="${thumbnailSources[0]}" 
                         alt="${video.title}" 
                         class="thumbnail-img"
                         data-sources="${thumbnailSources.join(',')}"
                         data-current-index="0">
                    <div class="video-play-button">
                        <i class="fas fa-play"></i>
                    </div>
                </a>
                <div class="video-info">
                    <h3 class="video-title">${video.title}</h3>
                    <div class="video-meta">
                        <span class="video-date">公開日: ${dateStr}</span>
                    </div>
                    <div class="video-playlists">
                        ${playlistTags}
                    </div>
                </div>
            `;
            
            container.appendChild(videoCard);
        });
    }

    // プレイリストでフィルターするためのセットアップ
    function setupFilters(data) {
        const filterSelect = document.getElementById('playlist-filter');
        const publishedVideos = data.filter(video => video.published === 'TRUE');
        
        // すべてのプレイリストを収集
        const allPlaylists = new Set();
        publishedVideos.forEach(video => {
            getPlaylists(video).forEach(playlist => {
                if (playlist) allPlaylists.add(playlist);
            });
        });
        
        // プレイリストの選択肢を追加
        allPlaylists.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist;
            option.textContent = playlist;
            filterSelect.appendChild(option);
        });
        
        // フィルターの変更イベントをリッスン
        filterSelect.addEventListener('change', function() {
            const selectedPlaylist = this.value;
            const videoCards = document.querySelectorAll('.video-card');
            
            videoCards.forEach(card => {
                if (selectedPlaylist === 'all' || card.dataset.playlists.includes(selectedPlaylist)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // ビデオからプレイリストを取得する関数
    function getPlaylists(video) {
        return [video.play_list1, video.play_list2, video.play_list3].filter(Boolean);
    }

    // プレイリストタグのHTMLを生成する関数
    function createPlaylistTags(video) {
        const playlists = getPlaylists(video);
        return playlists.map(playlist => 
            `<span class="video-playlist">${playlist}</span>`
        ).join('');
    }

    // YouTubeのURLからビデオIDを抽出する関数
    function getYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // 日付をフォーマットする関数
    function formatDate(dateStr) {
        if (!dateStr || dateStr.length !== 8) return '';
        
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        
        return `${year}/${month}/${day}`;
    }

    // テスト用データを処理（コメントアウト）
    // processCSV(testData);
    
    // Google Spreadsheetを使用
    fetch(csvUrl)
        .then(response => {
            console.log('Response status:', response.status);
            return response.text(); // ここでreturnが必要
        })
        .then(text => {
            console.log('CSV data received, length:', text.length);
            processCSV(text);
        })
        .catch(error => {
            console.error('データ取得エラー:', error);
            document.querySelector('.loading').innerHTML = '<p>動画データの読み込みに失敗しました。</p>';
            // フォールバックとしてテストデータを使用
            console.log('フォールバック: テストデータを使用します');
            processCSV(testData);
        });
});