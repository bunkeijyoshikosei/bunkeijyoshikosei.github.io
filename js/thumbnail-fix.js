/**
 * サムネイル画像の表示を改善するためのスクリプト
 * iOSやSafariでの表示問題を解決します
 */

// 現在の日付を表示する関数
function displayCurrentDate() {
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = now.toLocaleDateString('ja-JP', options);
    }
}

// サムネイルの読み込み状態をチェックする関数
function checkThumbnails() {
    const thumbnails = document.querySelectorAll('.thumbnail-img');
    thumbnails.forEach(img => {
        // 画像の読み込みに失敗した場合
        if (img.complete && (img.naturalHeight === 0 || !img.naturalWidth)) {
            console.log(`サムネイル読み込み失敗: ${img.src}`);
            // デフォルトのサムネイルを表示
            img.src = 'https://placehold.co/480x360/333333/FFFFFF?text=No+Thumbnail';
        }
    });
}

// iOSデバイス検出
function isIOSDevice() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Safariブラウザ検出
function isSafariBrowser() {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

// サムネイルの修正を適用
function fixThumbnails() {
    const thumbnails = document.querySelectorAll('.thumbnail-img');
    if(thumbnails.length === 0) {
        // まだサムネイルが読み込まれていない場合は再試行
        setTimeout(fixThumbnails, 500);
        return;
    }
    
    console.log('サムネイル修正を適用: ' + thumbnails.length + '件');
    
    thumbnails.forEach(img => {
        // z-indexを強制的に適用
        img.style.zIndex = "2";
        img.style.position = "relative";
        // 3D変換を適用してレンダリングレイヤーを分離
        img.style.transform = "translateZ(0)";
        img.style.webkitTransform = "translateZ(0)";
        img.style.backfaceVisibility = "hidden";
        img.style.webkitBackfaceVisibility = "hidden";
        
        // 読み込みエラー時に別のフォーマットを試す
        img.onerror = function() {
            console.log('画像読み込みエラー: ' + this.src);
            if(this.src.includes('maxresdefault')) {
                this.src = this.src.replace('maxresdefault', 'hqdefault');
            } else if(this.src.includes('sddefault')) {
                this.src = this.src.replace('sddefault', 'hqdefault');
            } else if(this.src.includes('mqdefault')) {
                this.src = this.src.replace('mqdefault', 'default');
            }
        };
    });
}

// DOMContentLoadedイベントで初期化
document.addEventListener('DOMContentLoaded', function() {
    // 現在の日付を表示
    displayCurrentDate();
    
    // サムネイルの読み込み状態をチェック
    setTimeout(checkThumbnails, 1000);  // 1秒後
    setTimeout(checkThumbnails, 3000);  // 3秒後
    setTimeout(checkThumbnails, 6000);  // 6秒後
    
    // iOSまたはSafariの場合のみサムネイル修正を適用
    if(isIOSDevice() || isSafariBrowser()) {
        console.log('iOS/Safariデバイスを検出。サムネイル修正を適用します。');
        // 複数回チェックを実行
        setTimeout(fixThumbnails, 500);
        setTimeout(fixThumbnails, 1500);
        setTimeout(fixThumbnails, 3000);
    }
}); 