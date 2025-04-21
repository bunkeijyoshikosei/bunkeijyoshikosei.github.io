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

    fetch(csvUrl)
        .then(response => response.text())
        .then(processCSV)
        .catch(error => {
            console.error('データ取得エラー:', error);
            document.querySelector('.loading').innerHTML = '<p>動画データの読み込みに失敗しました。</p>';
        });
});
