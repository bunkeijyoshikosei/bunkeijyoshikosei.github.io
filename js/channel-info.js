document.addEventListener('DOMContentLoaded', function () {
    console.log('channel-info.jsが読み込まれました');
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQGRTW9B0KAIWwf0ZciRQ00rZui90nLoBvFwcDC898VvJxl0kZlfNYemczk1yru0k3YbVHD9EYNfH9u/pub?output=csv';

    fetch(csvUrl)
        .then(response => response.text())
        .then(csvText => {
            const lines = csvText.trim().split('\n');
            const headers = lines[0].split(',');
            const data = lines[1] ? lines[1].split(',') : [];

            const subscriberIndex = headers.indexOf('subscriberCount');
            const videoIndex = headers.indexOf('videoCount');

            if (subscriberIndex !== -1 && data[subscriberIndex]) {
                const subCount = Number(data[subscriberIndex]).toLocaleString();
                const subText = `${subCount} 人のチャンネル登録者`;
                const subscriberElem = document.getElementById('subscriber-count');
                if (subscriberElem) subscriberElem.textContent = subText;
            }

            if (videoIndex !== -1 && data[videoIndex]) {
                const videoCount = Number(data[videoIndex]).toLocaleString();
                const videoElem = document.getElementById('video-count');
                if (videoElem) videoElem.textContent = `${videoCount} 本の動画`;
            }
        })
        .catch(error => {
            console.error('チャンネル情報の読み込みに失敗しました:', error);
        });
});
