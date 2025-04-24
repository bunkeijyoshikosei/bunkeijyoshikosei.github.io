// import config from './config.js';

// 現在の日付をYYYYMMDD形式で取得する関数
function getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
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
document.addEventListener('DOMContentLoaded', function () {
    let VIDEOS_PER_PAGE = 10;
    let currentPage = 1;
    let filteredVideos = [];

    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTIHlNKRZGlEO27QAiMDSx1PF99gQ47shvjWtPia3HA2rxabhiISilyR4_NvHh-ojOAofR3MIhUNMzo/pub?output=csv';

    function processCSV(csvText) {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                displayVideos(results.data);
                setupFilters(results.data);
                updatePagination();
            },
            error: function (error) {
                console.error('CSV解析エラー:', error);
                document.querySelector('.loading').innerHTML = '<p>動画データの読み込みに失敗しました。</p>';
            }
        });
    }

    function displayVideos(data) {
        const container = document.getElementById('video-container');
        const loadingElement = container.querySelector('.loading');
        if (loadingElement) loadingElement.remove();

        const currentDateString = getCurrentDateString();

        filteredVideos = data.filter(video => {
            const isPublished = video.published === 'true' || video.published === 'TRUE' || video.published === true;
            return isPublished && video.date <= currentDateString;
        });

        if (filteredVideos.length === 0) {
            container.innerHTML = '<p class="no-videos">表示できる動画がありません。</p>';
            return;
        }

        filteredVideos.sort((a, b) => b.date.localeCompare(a.date));
        showPage(1);
    }

    function showPage(page) {
        const container = document.getElementById('video-container');
        currentPage = page;
        container.innerHTML = '';

        const startIndex = (page - 1) * VIDEOS_PER_PAGE;
        const endIndex = Math.min(startIndex + VIDEOS_PER_PAGE, filteredVideos.length);
        const videosToShow = filteredVideos.slice(startIndex, endIndex);

        videosToShow.forEach(video => {
            const dateStr = formatDate(video.date);
            const youtubeId = getYouTubeId(video.url);
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

            const thumbnailSources = [
                `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg`,
                `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
                `https://i.ytimg.com/vi/${youtubeId}/sddefault.jpg`,
                `https://img.youtube.com/vi/${youtubeId}/sddefault.jpg`,
                `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
                `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,
                `https://i.ytimg.com/vi/${youtubeId}/mqdefault.jpg`,
                `https://img.youtube.com/vi/${youtubeId}/0.jpg`,
                `https://placehold.co/480x360/333333/FFFFFF?text=${encodeURIComponent(youtubeId)}`
            ];

            const preferredIndex = isIOS ? (thumbnailSources.findIndex(src => src.includes('hqdefault')) || 0) : 0;
            const playlistTags = createPlaylistTags(video);

            const views = formatNumber(video.viewCount || 0);
            const likes = formatNumber(video.likeCount || 0);

            const videoCard = document.createElement('div');
            videoCard.className = 'video-card';
            videoCard.dataset.playlists = getPlaylists(video).join(',');
            videoCard.dataset.videoId = youtubeId;

            videoCard.innerHTML = `
                <a href="${video.url}" target="_blank" class="video-thumbnail">
                    <img src="${thumbnailSources[preferredIndex]}"
                         alt="${video.title}"
                         class="thumbnail-img"
                         data-sources="${thumbnailSources.join(',')}"
                         data-current-index="${preferredIndex}">
                    <div class="video-play-button">
                        <i class="fas fa-play"></i>
                    </div>
                </a>
                <div class="video-info">
                    <h3 class="video-title">${video.title}</h3>
                    <div class="video-meta">
                        <span class="video-date">公開日: ${dateStr}</span>
                        <div class="video-stats">
                            <span class="video-views"><i class="fas fa-eye"></i> ${views}</span>
                            <span class="video-likes"><i class="fas fa-thumbs-up"></i> ${likes}</span>
                        </div>
                    </div>
                    <div class="video-playlists">
                        ${playlistTags}
                    </div>
                </div>
            `;

            container.appendChild(videoCard);
        });
    }

    function getPlaylists(video) {
        return [video.play_list1, video.play_list2, video.play_list3].filter(Boolean);
    }

    function createPlaylistTags(video) {
        const playlists = getPlaylists(video);
        return playlists.map(playlist => `<span class="video-playlist">${playlist}</span>`).join('');
    }

    function setupFilters(data) {
        const playlistFilter = document.getElementById('playlist-filter');
        const itemsPerPageSelect = document.getElementById('items-per-page');
        const currentDateElement = document.getElementById('current-date');
        
        // 現在の日付を表示
        const currentDate = new Date();
        currentDateElement.textContent = `${currentDate.getFullYear()}/${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(currentDate.getDate()).padStart(2, '0')}`;
        
        // プレイリストの一覧を取得
        const playlists = new Set();
        data.forEach(video => {
            if (video.play_list1) playlists.add(video.play_list1);
            if (video.play_list2) playlists.add(video.play_list2);
            if (video.play_list3) playlists.add(video.play_list3);
        });
        
        // プレイリストの選択肢を追加
        playlists.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist;
            option.textContent = playlist;
            playlistFilter.appendChild(option);
        });
        
        // フィルターの変更イベント
        playlistFilter.addEventListener('change', () => {
            const selectedPlaylist = playlistFilter.value;
            if (selectedPlaylist === 'all') {
                filteredVideos = data.filter(video => {
                    const isPublished = video.published === 'true' || video.published === 'TRUE' || video.published === true;
                    return isPublished && video.date <= getCurrentDateString();
                });
            } else {
                filteredVideos = data.filter(video => {
                    const isPublished = video.published === 'true' || video.published === 'TRUE' || video.published === true;
                    const hasPlaylist = video.play_list1 === selectedPlaylist || 
                                      video.play_list2 === selectedPlaylist || 
                                      video.play_list3 === selectedPlaylist;
                    return isPublished && video.date <= getCurrentDateString() && hasPlaylist;
                });
            }
            filteredVideos.sort((a, b) => b.date.localeCompare(a.date));
            showPage(1);
            updatePagination();
        });
        
        // 表示件数の変更イベント
        itemsPerPageSelect.addEventListener('change', () => {
            VIDEOS_PER_PAGE = parseInt(itemsPerPageSelect.value, 10);
            showPage(1);
            updatePagination();
        });
    }

    function updatePagination() {
        const pagination = document.getElementById('pagination');
        const pageInfo = document.getElementById('page-info');
        
        if (!pagination || !pageInfo) return;
        
        pagination.innerHTML = '';
        const totalPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE);
        
        // ページ情報の更新
        pageInfo.textContent = `${filteredVideos.length}件の動画 / ページ: ${currentPage}/${totalPages}`;
        
        // 前のページボタン
        const prevButton = document.createElement('button');
        prevButton.textContent = '前へ';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                showPage(currentPage - 1);
                updatePagination();
            }
        });
        pagination.appendChild(prevButton);
        
        // ページ番号ボタン
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.className = currentPage === i ? 'active' : '';
            pageButton.addEventListener('click', () => {
                showPage(i);
                updatePagination();
            });
            pagination.appendChild(pageButton);
        }
        
        // 次のページボタン
        const nextButton = document.createElement('button');
        nextButton.textContent = '次へ';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                showPage(currentPage + 1);
                updatePagination();
            }
        });
        pagination.appendChild(nextButton);
    }

    fetch(csvUrl)
        .then(response => response.text())
        .then(processCSV)
        .catch(error => {
            console.error('データ取得エラー:', error);
            document.querySelector('.loading').innerHTML = '<p>動画データの読み込みに失敗しました。</p>';
        });
});
