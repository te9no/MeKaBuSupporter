exports.handler = async (event, context) => {
  // CORS ヘッダー設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  try {
    // デバッグ情報を収集
    const debugInfo = {
      timestamp: new Date().toISOString(),
      httpMethod: event.httpMethod,
      headers: event.headers,
      queryStringParameters: event.queryStringParameters,
      body: event.body,
      path: event.path,
      environment: {
        NODE_VERSION: process.env.NODE_VERSION,
        NETLIFY_DEV: process.env.NETLIFY_DEV,
        AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME,
        MEKBU_SECRET_KEY_EXISTS: !!process.env.MEKBU_SECRET_KEY,
        MEKBU_SECRET_KEY_LENGTH: process.env.MEKBU_SECRET_KEY ? process.env.MEKBU_SECRET_KEY.length : 0
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(debugInfo, null, 2)
    };

  } catch (error) {
    console.error('Debug function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Debug function failed',
        message: error.message,
        stack: error.stack
      })
    };
  }
};