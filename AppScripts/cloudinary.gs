// スプレッドシートの設定
const SHEET_NAME = 'youtube_link';

// Cloudinaryの設定
const CLOUDINARY_CLOUD_NAME = PropertiesService.getScriptProperties()
    .getProperty("CLOUDINARY_CLOUD_NAME");
const CLOUDINARY_API_KEY = PropertiesService.getScriptProperties()
    .getProperty("CLOUDINARY_API_KEY");
const CLOUDINARY_API_SECRET = PropertiesService.getScriptProperties()
    .getProperty("CLOUDINARY_API_SECRET");
const CLOUDINARY_UPLOAD_PRESET = 'youtube_thumbnails'; // アップロードプリセット名
const CLOUDINARY_BASE_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}`;

// 現在の日付をYYYYMMDD形式で取得する関数
function getCurrentDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// ビデオが公開済みかどうかを判定する関数（日付のみ比較）
function isVideoPublished(videoDate) {
  console.log(`isVideoPublished呼び出し: videoDate=${videoDate}, 型=${typeof videoDate}`);
  
  // videoDateがDateオブジェクトの場合
  if (videoDate instanceof Date) {
    const currentDate = new Date();
    // 日付のみを比較（時刻は無視）
    const videoDateOnly = new Date(videoDate.getFullYear(), videoDate.getMonth(), videoDate.getDate());
    const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const result = videoDateOnly <= currentDateOnly;
    console.log(`Dateオブジェクト比較: ${videoDateOnly.toISOString()} <= ${currentDateOnly.toISOString()} = ${result}`);
    return result;
  }
  
  // videoDateが数値の場合（スプレッドシートの日付）
  if (typeof videoDate === 'number') {
    // YYYYMMDD形式の数値を文字列に変換してから日付に変換
    const dateString = String(videoDate);
    if (dateString.length === 8) {
      const year = parseInt(dateString.substring(0, 4));
      const month = parseInt(dateString.substring(4, 6)) - 1; // 月は0ベース
      const day = parseInt(dateString.substring(6, 8));
      const dateObj = new Date(year, month, day);
      const currentDate = new Date();
      // 日付のみを比較（時刻は無視）
      const videoDateOnly = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
      const result = videoDateOnly <= currentDateOnly;
      console.log(`数値比較: ${videoDate} → ${videoDateOnly.toISOString()} <= ${currentDateOnly.toISOString()} = ${result}`);
      return result;
    } else {
      console.log(`数値の形式が不正: ${videoDate}`);
      return false;
    }
  }
  
  // videoDateが文字列の場合
  if (typeof videoDate === 'string') {
    if (!videoDate || videoDate.length !== 8) {
      console.log(`文字列が無効: ${videoDate}`);
      return false;
    }
    const currentDateString = getCurrentDateString();
    const result = videoDate <= currentDateString;
    console.log(`文字列比較: ${videoDate} <= ${currentDateString} = ${result}`);
    return result;
  }
  
  // その他の場合はfalse
  console.log(`未対応の型: ${typeof videoDate}`);
  return false;
}

// 特殊文字を処理する関数
function convertToFullWidth(str) {
  // 前後の空白を削除
  let result = str.trim();
  
  // 特殊文字を削除
  result = result.replace(/[:\/?#[\]@!$&'()*+,;=]/g, '');
  
  // スペースをアンダースコアに変換
  result = result.replace(/\s+/g, '_');
  
  // 連続するアンダースコアを1つに
  result = result.replace(/_+/g, '_');
  
  return result;
}

function processVideos() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const titleIndex = headers.indexOf('title');
  const urlIndex = headers.indexOf('url');
  const dateIndex = headers.indexOf('date');
  const processedIndex = headers.indexOf('processed');

  // ヘッダー行を除いて処理
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const title = row[titleIndex];
    const url = row[urlIndex];
    const date = row[dateIndex];
    const processed = row[processedIndex];

    // 処理済みの場合はスキップ
    if (processed === '✓') {
      console.log(`${title}をパスします。`)
      continue;
    }

    // 公開日が現在日付より後の場合はスキップ
    console.log(`${title}の日付チェック開始: ${date}`);
    const isPublished = isVideoPublished(date);
    console.log(`${title}の日付チェック結果: ${isPublished}`);
    
    if (!isPublished) {
      let dateInfo = `${date} (型: ${typeof date})`;
      if (typeof date === 'number') {
        const dateObj = new Date(date);
        dateInfo += ` → ${dateObj.toISOString().split('T')[0]}`;
      }
      console.log(`${title}は公開日が未来のためスキップします。公開日: ${dateInfo}`)
      continue;
    }
    
    console.log(`${title}は公開済みのため処理を続行します`);

    try {
      // Cloudinaryのフォルダー存在確認
      if (checkFolderExists(title)) {
        markAsProcessed(sheet, i + 1, processedIndex + 1);
        continue;
      }

      // YouTubeサムネイルURLの取得
      const videoId = extractYouTubeId(url);
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

      // Cloudinaryへのアップロード
      uploadToCloudinary(thumbnailUrl, title);

    } catch (error) {
      console.error(`エラー: ${title} - ${error.message}`);
    }
  }
}

function checkFolderExists(title) {
  const convertedTitle = convertToFullWidth(title);
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/youtube/bunkeijyoshikosei/${convertedTitle}/thumbnail.jpg`;
  
  const options = {
    method: 'GET',
    muteHttpExceptions: true,
    followRedirects: false
  };

  try {
    const response = UrlFetchApp.fetch(baseUrl, options);
    const exists = response.getResponseCode() === 200;
    
    if (exists) {
      console.log(`画像 "${baseUrl}" は既に存在します`);
    } else {
      console.log(`画像 "${baseUrl}" は存在しません`);
    }
    
    return exists;
  } catch (error) {
    console.error(`URLチェックエラー: ${error.message}`);
    return false;
  }
}

function extractYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function uploadToCloudinary(thumbnailUrl, title) {
  const convertedTitle = convertToFullWidth(title);
  const folderPath = `youtube/bunkeijyoshikosei/${convertedTitle}`;
  
  // アップロードのオプション
  const options = {
    method: 'POST',
    payload: {
      file: thumbnailUrl,
      folder: folderPath,
      public_id: 'thumbnail',
      upload_preset: CLOUDINARY_UPLOAD_PRESET
    }
  };

  // アップロード実行
  const response = UrlFetchApp.fetch(
    `${CLOUDINARY_BASE_URL}/image/upload`,
    options
  );
  
  const result = JSON.parse(response.getContentText());
  console.log(`アップロード成功: ${result.secure_url}`);
}

function markAsProcessed(sheet, row, column) {
  sheet.getRange(row, column).setValue('✓');
}