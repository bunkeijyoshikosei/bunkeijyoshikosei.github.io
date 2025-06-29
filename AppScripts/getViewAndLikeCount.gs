/**
 * Sheet1 の A2:ラスト に書かれた video URL から
 * YouTube Data API を呼び出して viewCount, likeCount を更新する
 */
/**
 * YouTube 動画の再生数と高評価数を
 * スプレッドシートの viewCount/likeCount 列に書き込む
 */
/**
 * YouTube 動画の再生数と高評価数を
 * スプレッドシートの viewCount/likeCount 列に書き込む
 * — ログ出力を強化してデバッグしやすくしています —
 */
function updateYouTubeStats() {
  const SHEET_NAME = "youtube_link"; // ← シート名を変更
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`シート「${SHEET_NAME}」が見つかりません`);

  const values = sheet.getDataRange().getValues();
  const header = values[0];
  const urlCol  = header.indexOf("url");
  const viewCol = header.indexOf("viewCount");
  const likeCol = header.indexOf("likeCount");
  if (urlCol < 0 || viewCol < 0 || likeCol < 0) {
    throw new Error("url, viewCount, likeCount 列のいずれかが見つかりません");
  }

  // 行番号＋動画IDリスト作成
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const url = values[i][urlCol];
    if (!url) continue;
    const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m) rows.push({ row: i + 1, videoId: m[1] });
    else Logger.log(`動画ID抽出失敗: 行${i+1} → ${url}`);
  }
  if (rows.length === 0) {
    Logger.log("動画IDが一件も見つかりませんでした");
    return;
  }
  Logger.log(`対象動画件数: ${rows.length}`);

  const apiKey = PropertiesService.getScriptProperties()
    .getProperty("YOUTUBE_API_KEY");
  if (!apiKey) throw new Error("YOUTUBE_API_KEY が設定されていません");

  const BASE_URL = "https://www.googleapis.com/youtube/v3/videos";

  for (let start = 0; start < rows.length; start += 50) {
    const chunk = rows.slice(start, start + 50);
    const ids   = chunk.map(o => o.videoId).join(",");
    const reqUrl = `${BASE_URL}?part=statistics&id=${encodeURIComponent(ids)}&key=${apiKey}`;

    // --- 追加ログ ---
    Logger.log("Request URL: " + reqUrl);

    const res = UrlFetchApp.fetch(reqUrl, { muteHttpExceptions: true });
    const code = res.getResponseCode();
    const body = res.getContentText();

    Logger.log(`Response code: ${code}`);
    Logger.log(`Response body: ${body}`);

    let json;
    try {
      json = JSON.parse(body);
    } catch (e) {
      Logger.log("JSON parse error: " + e);
      continue;
    }

    if (!json.items || json.items.length === 0) {
      Logger.log(`統計情報がありません — Full JSON: ${JSON.stringify(json)}`);
      continue;
    }

    // 統計情報を書き込み
    const statsMap = json.items.reduce((map, item) => {
      map[item.id] = item.statistics;
      return map;
    }, {});

    chunk.forEach(({ row, videoId }) => {
      const stats = statsMap[videoId];
      if (stats) {
        sheet.getRange(row, viewCol + 1).setValue(stats.viewCount);
        sheet.getRange(row, likeCol + 1).setValue(stats.likeCount);
      } else {
        Logger.log(`統計情報が見つかりません: ${videoId}`);
      }
    });
  }

  Logger.log("=== updateYouTubeStats 完了 ===");
}

