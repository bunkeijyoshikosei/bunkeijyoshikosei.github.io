function sanitizePathName(title) {
  // 指定された特殊文字を削除
  const specialChars = /[:/?#[\]@!$&'()+,;=]/g;
  return title
    .replace(specialChars, '')  // 特殊文字を削除
    .replace(/\s+/g, '_')      // スペースをアンダースコアに変換
    .replace(/_+/g, '_')       // 連続するアンダースコアを1つに
    .trim();                   // 前後の空白を削除
}

function uploadToCloudinary(thumbnailUrl, title) {
  const sanitizedTitle = sanitizePathName(title);
  const folderPath = `youtube/bunkeijyoshikosei/${sanitizedTitle}`;
  
  // 各サイズの画像を個別にアップロード
  const sizes = [
    { name: 'thumbnail_large', preset: 'youtube_thumbnails_large' },
    { name: 'thumbnail_middle', preset: 'youtube_thumbnails_middle' },
    { name: 'thumbnail_small', preset: 'youtube_thumbnails_small' }
  ];

  sizes.forEach(size => {
    const options = {
      method: 'POST',
      payload: {
        file: thumbnailUrl,
        folder: folderPath,
        public_id: size.name,
        upload_preset: size.preset
      }
    };

    try {
      const response = UrlFetchApp.fetch(
        `${CLOUDINARY_BASE_URL}/image/upload`,
        options
      );
      
      const result = JSON.parse(response.getContentText());
      console.log(`${size.name} アップロード成功: ${result.secure_url}`);
    } catch (error) {
      console.error(`${size.name} アップロードエラー: ${error.message}`);
    }
  });
}

function checkFolderExists(title) {
  const sanitizedTitle = sanitizePathName(title);
  const encodedTitle = encodeURIComponent(sanitizedTitle);
  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/youtube/bunkeijyoshikosei/${encodedTitle}/thumbnail_large.jpg`;
  
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