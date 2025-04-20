// 現在の日付をYYYYMMDD形式で取得する関数
function getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    // 月と日は2桁に揃える（1→01, 12→12）
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// 日付をフォーマットする関数
function formatDate(dateStr) {
    if (!dateStr || dateStr.length !== 8) return '';
    
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    
    return `${year}/${month}/${day}`;
}

// YouTubeのURLからビデオIDを抽出する関数
function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// 数値をフォーマットする関数（例: 1000 → 1K, 1000000 → 1M）
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// メインの処理を開始
document.addEventListener('DOMContentLoaded', function() {
    // ページネーション設定
    let VIDEOS_PER_PAGE = 10; // デフォルトは10動画/ページ
    let currentPage = 1;
    let filteredVideos = []; // フィルタリング後の動画リスト
    
    // YouTube Data APIのキー
    // config.jsからAPIキーを読み込む
    let API_KEY = '';
    try {
        const config = window.config || {};
        API_KEY = config.youtubeApiKey || '';
        console.log('API_KEY:', API_KEY);
    } catch (e) {
        console.error('設定ファイルの読み込みに失敗しました:', e);
    }

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
        const loadingElement = container.querySelector('.loading');
        if (loadingElement) {
            loadingElement.remove();
        }
        
        // 現在の日付を取得
        const currentDateString = getCurrentDateString();
        
        // publishedがtrueで、かつ日付が現在日より前または同日の動画のみ表示
        filteredVideos = data.filter(video => {
            // 大文字小文字を区別せずに比較し、複数のフォーマットに対応
            const isPublished = 
                video.published === 'true' || 
                video.published === 'TRUE' ||
                video.published === true;
            
            return isPublished && video.date <= currentDateString;
        });
        
        if (filteredVideos.length === 0) {
            container.innerHTML = '<p class="no-videos">表示できる動画がありません。</p>';
            updatePaginationInfo(0, 0);
            return;
        }
        
        // 日付の降順にソート
        filteredVideos.sort((a, b) => b.date.localeCompare(a.date));
        
        // ページネーションを設定
        setupPagination(filteredVideos);
        
        // 最初のページを表示
        showPage(1);
    }
    
    // 指定したページの動画を表示
    function showPage(page) {
        const container = document.getElementById('video-container');
        // 現在のページを記憶
        currentPage = page;
        
        // 動画コンテナをクリア（ページネーション以外）
        container.innerHTML = '';
        
        // ページに表示する動画の範囲を計算
        const startIndex = (page - 1) * VIDEOS_PER_PAGE;
        const endIndex = Math.min(startIndex + VIDEOS_PER_PAGE, filteredVideos.length);
        
        // 表示する動画を選択
        const videosToShow = filteredVideos.slice(startIndex, endIndex);
        
        // 動画を表示
        videosToShow.forEach(video => {
            // 日付をフォーマット
            const dateStr = formatDate(video.date);
            
            // YouTubeのサムネイルURLを生成
            const youtubeId = getYouTubeId(video.url);
            
            // サムネイル画像のプレースホルダー（動画ID+タイトル文字列から生成する代替画像）
            const placeholderUrl = `https://placehold.co/480x360/333333/FFFFFF?text=${encodeURIComponent(youtubeId)}`;
            
            // iOSデバイス向けに最適化されたサムネイルURLを選択
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
            
            // バックアップサムネイルを設定（複数の選択肢）
            const thumbnailSources = [
                `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`,
                `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
                `https://i.ytimg.com/vi/${youtubeId}/sddefault.jpg`,
                `https://img.youtube.com/vi/${youtubeId}/sddefault.jpg`,
                `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
                `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
                `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`,
                `https://img.youtube.com/vi/${youtubeId}/0.jpg`,
                placeholderUrl
            ];
            
            // iOSデバイス向けに最適なサムネイル形式を優先
            const preferredIndex = isIOS ? 
                (thumbnailSources.findIndex(src => src.includes('hqdefault')) || 0) : 0;
            
            // プレイリストタグを生成
            const playlistTags = createPlaylistTags(video);
            
            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            videoCard.dataset.playlists = getPlaylists(video).join(',');
            videoCard.dataset.videoId = youtubeId; // ビデオIDを保存
            
            // 動画カードのHTMLを生成（統計情報のプレースホルダーを含む）
            videoCard.innerHTML = `
                <a href="${video.url}" target="_blank" class="video-thumbnail">
                    <img src="${thumbnailSources[preferredIndex]}" 
                         alt="${video.title}" 
                         class="thumbnail-img"
                         data-sources="${thumbnailSources.join(',')}"
                         data-current-index="${preferredIndex}"
                         style="z-index:2; position:relative; transform:translateZ(0); -webkit-transform:translateZ(0); backface-visibility:hidden; -webkit-backface-visibility:hidden;"
                         onerror="if(this.dataset.currentIndex < 8) { this.dataset.currentIndex++; this.src=this.dataset.sources.split(',')[parseInt(this.dataset.currentIndex)+1]; }">
                    <div class="video-play-button">
                        <i class="fas fa-play"></i>
                    </div>
                </a>
                <div class="video-info">
                    <h3 class="video-title">${video.title}</h3>
                    <div class="video-meta">
                        <span class="video-date">公開日: ${dateStr}</span>
                        <div class="video-stats">
                            <span class="video-views"><i class="fas fa-eye"></i> <span class="stats-value">読み込み中...</span></span>
                            <span class="video-likes"><i class="fas fa-thumbs-up"></i> <span class="stats-value">読み込み中...</span></span>
                        </div>
                    </div>
                    <div class="video-playlists">
                        ${playlistTags}
                    </div>
                </div>
            `;
            
            container.appendChild(videoCard);
            
            // 動画の統計情報を取得
            if (youtubeId && API_KEY) {
                fetchVideoStats(youtubeId, videoCard);
            }
        });
        
        // ページネーション情報の更新
        updatePaginationInfo(filteredVideos.length, currentPage);
        
        // ページネーションUIの更新
        updatePaginationUI(currentPage);
        
        // iOS向けのサムネイル表示修正を適用
        if (/iPad|iPhone|iPod/.test(navigator.userAgent) || /^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
            setTimeout(function() {
                const thumbnails = document.querySelectorAll('.thumbnail-img');
                thumbnails.forEach(img => {
                    // 3D変換を適用してレンダリングレイヤーを分離
                    img.style.transform = "translateZ(0)";
                    img.style.webkitTransform = "translateZ(0)";
                    img.style.backfaceVisibility = "hidden";
                    img.style.webkitBackfaceVisibility = "hidden";
                });
            }, 100);
        }
    }
    
    // YouTube Data APIを使用して動画の統計情報を取得する関数
   function fetchVideoStats(videoId, videoCard) {
     const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`;
     
     console.log('リクエストURL:', apiUrl);
     
     fetch(apiUrl)
       .then(response => {
         console.log('レスポンスステータス:', response.status);
         if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
         }
         return response.json();
       })
       .then(data => {
         console.log('レスポンスデータ:', data);
         
         if (data.error) {
           console.error('APIエラー:', data.error);
           throw new Error(`API error: ${data.error.message}`);
         }
         
         if (data.items && data.items.length > 0) {
           const stats = data.items[0].statistics;
           const views = stats.viewCount || 0;
           const likes = stats.likeCount || 0;
           
           // 統計情報を表示
           const viewsElement = videoCard.querySelector('.video-views .stats-value');
           const likesElement = videoCard.querySelector('.video-likes .stats-value');
           
           if (viewsElement) viewsElement.textContent = formatNumber(views);
           if (likesElement) likesElement.textContent = formatNumber(likes);
         } else {
           console.error('動画データが見つかりません');
           throw new Error('動画データが見つかりません');
         }
       })
       .catch(error => {
         console.error('統計情報の取得に失敗しました:', error);
         // エラー時は「取得できません」と表示
         const statsElements = videoCard.querySelectorAll('.stats-value');
         statsElements.forEach(el => {
           el.textContent = '取得できません';
         });
       });
   }
    
    // ページネーションを設定する関数
    function setupPagination(videos) {
        const totalPages = Math.ceil(videos.length / VIDEOS_PER_PAGE);
        const paginationElement = document.getElementById('pagination');
        
        // ページネーション要素をクリア
        paginationElement.innerHTML = '';
        
        // 「前へ」ボタン
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '<i class="fas fa-chevron-left"></i> 前へ';
        prevButton.classList.add('prev-button');
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                showPage(currentPage - 1);
            }
        });
        paginationElement.appendChild(prevButton);
        
        // ページ番号ボタン
        const maxDisplayedPages = 5; // 表示するページボタンの最大数
        
        let startPage = Math.max(1, currentPage - Math.floor(maxDisplayedPages / 2));
        let endPage = Math.min(totalPages, startPage + maxDisplayedPages - 1);
        
        // 表示範囲を調整
        if (endPage - startPage + 1 < maxDisplayedPages && startPage > 1) {
            startPage = Math.max(1, endPage - maxDisplayedPages + 1);
        }
        
        // 最初のページへのボタン（必要な場合）
        if (startPage > 1) {
            const firstPageButton = document.createElement('button');
            firstPageButton.textContent = '1';
            firstPageButton.addEventListener('click', () => showPage(1));
            paginationElement.appendChild(firstPageButton);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('button');
                ellipsis.textContent = '...';
                ellipsis.disabled = true;
                paginationElement.appendChild(ellipsis);
            }
        }
        
        // ページ番号ボタン
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            
            pageButton.addEventListener('click', () => showPage(i));
            paginationElement.appendChild(pageButton);
        }
        
        // 最後のページへのボタン（必要な場合）
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('button');
                ellipsis.textContent = '...';
                ellipsis.disabled = true;
                paginationElement.appendChild(ellipsis);
            }
            
            const lastPageButton = document.createElement('button');
            lastPageButton.textContent = totalPages;
            lastPageButton.addEventListener('click', () => showPage(totalPages));
            paginationElement.appendChild(lastPageButton);
        }
        
        // 「次へ」ボタン
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '次へ <i class="fas fa-chevron-right"></i>';
        nextButton.classList.add('next-button');
        nextButton.disabled = currentPage === totalPages || totalPages === 0;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                showPage(currentPage + 1);
            }
        });
        paginationElement.appendChild(nextButton);
    }
    
    // ページネーションUIを更新する関数
    function updatePaginationUI(currentPage) {
        const paginationElement = document.getElementById('pagination');
        const totalPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE);
        
        // 「前へ」ボタンの状態を更新
        const prevButton = paginationElement.querySelector('.prev-button');
        if (prevButton) {
            prevButton.disabled = currentPage === 1 || totalPages === 0;
        }
        
        // ページ番号ボタンの状態を更新
        const pageButtons = paginationElement.querySelectorAll('button:not(.prev-button):not(.next-button)');
        pageButtons.forEach(button => {
            if (!button.textContent.includes('...')) {
                button.classList.toggle('active', parseInt(button.textContent) === currentPage);
            }
        });
        
        // 「次へ」ボタンの状態を更新
        const nextButton = paginationElement.querySelector('.next-button');
        if (nextButton) {
            nextButton.disabled = currentPage === totalPages || totalPages === 0;
        }
    }
    
    // ページネーション情報を更新する関数
    function updatePaginationInfo(totalVideos, currentPage) {
        const pageInfoElement = document.getElementById('page-info');
        const totalPages = Math.ceil(totalVideos / VIDEOS_PER_PAGE);
        
        if (pageInfoElement) {
            pageInfoElement.textContent = `${totalVideos}件の動画 / ページ: ${currentPage}/${totalPages || 1}`;
        }
    }

    // プレイリストでフィルターするためのセットアップ
    function setupFilters(data) {
        const filterSelect = document.getElementById('playlist-filter');
        
        // 現在の日付を取得
        const currentDateString = getCurrentDateString();
        
        // publishedがtrueで、かつ現在日付以前の動画のみフィルタリング
        const publishedVideos = data.filter(video => {
            // 大文字小文字を区別せずに比較し、複数のフォーマットに対応
            const isPublished = 
                video.published === 'true' || 
                video.published === 'TRUE' ||
                video.published === true;
            
            return isPublished && video.date <= currentDateString;
        });
        
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
            
            // プレイリストに基づいて動画をフィルタリング
            if (selectedPlaylist === 'all') {
                // すべての動画を表示（日付フィルター済み）
                filteredVideos = publishedVideos;
            } else {
                // 選択されたプレイリストの動画のみ表示
                filteredVideos = publishedVideos.filter(video => 
                    getPlaylists(video).includes(selectedPlaylist)
                );
            }
            
            // ソート
            filteredVideos.sort((a, b) => b.date.localeCompare(a.date));
            
            // ページネーションを再設定
            setupPagination(filteredVideos);
            
            // 最初のページを表示
            showPage(1);
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

    // サムネイル画像の読み込みを改善するための関数
    function applySafariImageFix() {
        // iOSのSafari検出
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        
        if (isIOS || isSafari) {
            console.log('iOS/Safariデバイスを検出しました。サムネイル修正を適用します。');
            
            // すべてのサムネイル画像を対象に処理
            const thumbnails = document.querySelectorAll('.thumbnail-img');
            
            thumbnails.forEach(img => {
                // iOSでより確実に動作する形式にURLを調整
                let currentSrc = img.src;
                if (currentSrc.includes('maxresdefault') || currentSrc.includes('sddefault')) {
                    // hqdefaultはiOSでの表示確率が高い
                    let newSrc = currentSrc.replace(/maxresdefault|sddefault/, 'hqdefault');
                    img.src = newSrc;
                }
                
                // style属性を追加してiOS固有の問題を修正
                img.style.webkitTransform = 'translateZ(0)';
                img.style.transform = 'translateZ(0)';
                img.style.backfaceVisibility = 'hidden';
                img.style.webkitBackfaceVisibility = 'hidden';
                
                // 読み込みエラー時のフォールバック処理
                img.onerror = function() {
                    console.log('画像読み込みエラー:', this.src);
                    // hqdefaultに切り替える
                    if (!this.src.includes('hqdefault')) {
                        this.src = this.src.replace(/maxresdefault|sddefault|mqdefault|default/, 'hqdefault');
                    }
                    // それでもダメならデフォルト画像
                    else if (!this.src.includes('default.jpg')) {
                        const matches = this.src.match(/\/([a-zA-Z0-9_-]{11})\//);
                        if (matches && matches[1]) {
                            const youtubeId = matches[1];
                            this.src = `https://img.youtube.com/vi/${youtubeId}/0.jpg`;
                        }
                    }
                };
                
                // フォースリロード
                img.setAttribute('loading', 'eager');
            });
        }
    }

    // 表示件数の変更イベントをリッスン
    const itemsPerPageSelect = document.getElementById('items-per-page');
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', function() {
            VIDEOS_PER_PAGE = parseInt(this.value, 10);
            console.log(`表示件数を${VIDEOS_PER_PAGE}件に変更しました`);
            
            // フィルタリング済みの動画リストがある場合は再表示
            if (filteredVideos.length > 0) {
                // ページネーションを再設定
                setupPagination(filteredVideos);
                // 最初のページを表示
                showPage(1);
            }
        });
    }

    // Google Spreadsheetを使用
    fetch(csvUrl)
        .then(response => {
            console.log('Response status:', response.status);
            return response.text();
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
        
    // ページ読み込み後、一定間隔でサムネイルをチェック
    setTimeout(applySafariImageFix, 500);
    setTimeout(applySafariImageFix, 1500);
    setTimeout(applySafariImageFix, 3000);
});