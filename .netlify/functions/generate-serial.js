const crypto = require('crypto');

exports.handler = async (event, context) => {
  // CORS ヘッダー設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS リクエスト (プリフライト) への対応
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // POST リクエストのみ許可
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // デバッグログ
    console.log('Function called:', {
      method: event.httpMethod,
      body: event.body,
      hasSecretKey: !!process.env.MEKBU_SECRET_KEY,
      secretKeyLength: process.env.MEKBU_SECRET_KEY ? process.env.MEKBU_SECRET_KEY.length : 0
    });

    // リクエストボディの解析
    if (!event.body) {
      console.error('Request body is empty');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'リクエストボディが空です' 
        })
      };
    }

    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'JSONの解析に失敗しました: ' + parseError.message 
        })
      };
    }

    const { username, orderNumber } = requestData;

    // 入力値検証
    if (!username || !orderNumber) {
      console.log('Missing required fields:', { username: !!username, orderNumber: !!orderNumber });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'ユーザー名と注文番号が必要です' 
        })
      };
    }

    // 入力値のサニタイゼーション
    const cleanUsername = String(username).trim();
    const cleanOrderNumber = String(orderNumber).trim();

    if (cleanUsername.length === 0 || cleanOrderNumber.length === 0) {
      console.log('Empty values after trim:', { cleanUsername, cleanOrderNumber });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: '空の値は許可されていません' 
        })
      };
    }

    // 環境変数からシークレットキーを取得
    const secretKey = process.env.MEKBU_SECRET_KEY;
    if (!secretKey) {
      console.error('MEKBU_SECRET_KEY environment variable not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'サーバー設定エラー: シークレットキーが設定されていません' 
        })
      };
    }

    console.log('Secret key found, length:', secretKey.length);

    // 購入データを構築（Python側と同じ形式）
    const purchaseData = {
      username: cleanUsername,
      orderNumber: cleanOrderNumber,
      timestamp: 1735275600000,  // 固定タイムスタンプ
      product: 'MeKaBu',
      version: '1.0'
    };

    // JSON文字列化（Python側と同じ順序）
    const dataString = JSON.stringify(purchaseData);
    console.log('Data string:', dataString);
    
    // シークレットキーを追加したデータでハッシュ生成
    const dataWithSecret = dataString + secretKey;
    
    // SHA-256ハッシュ生成
    const hash = crypto.createHash('sha256');
    hash.update(dataWithSecret, 'utf8');
    const hashHex = hash.digest('hex');
    const serialNumber = hashHex.substring(0, 12).toUpperCase();

    console.log('Generated serial number:', serialNumber);

    // レスポンス
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        serialNumber: serialNumber,
        username: cleanUsername,
        orderNumber: cleanOrderNumber
      })
    };

  } catch (error) {
    console.error('Error generating serial number:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'シリアルナンバーの生成に失敗しました',
        details: error.message
      })
    };
  }
};