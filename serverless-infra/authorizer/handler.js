const jwt = require('jsonwebtoken');
const fs = require('fs');

const base64Key = fs.readFileSync("./authorizer/publicKey.base64", 'utf-8')
const publicKey = Buffer.from(base64Key, 'base64').toString('utf-8');

exports.handler = async (event) => {
  console.log("Lambda関数が実行されました");
  console.log("リクエストの詳細:", event);
  const token = event.authorizationToken;
  console.log("トークン:", token);

  const eventJsonString = JSON.stringify(event, null, 2);
  console.log(eventJsonString)
  const queryString = event.requestContext.queryString;

  if(queryString && !queryString.includes('mutation UpdatePaymentStatus')) {
    console.log('テストモード: 常に認証を許可します。');

    return {
      "isAuthorized": true,
    };
  }

  if (!token) throw new Error(`'Unauthorized: トークンがありません, ${token}'`);

  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] })
    console.log("デコードされたトークン:", decoded);
    console.log("decoded.reservation_id !== event.requestContext.variables.reservation_id", decoded.reservation_id !== event.requestContext.variables.reservation_id)
    if (decoded.reservation_id !== event.requestContext.variables.reservation_id) {
      throw new Error('Token expired');
    }
    console.log("処理が正常に完了しました");
    return {
      "isAuthorized": true,
    };
  } catch (err) {
    console.error('JWT verify failed', err);
    throw new Error(`'Unauthorized: トークンの検証に失敗しました, ${JSON.stringify(event)}'`);
  }
};