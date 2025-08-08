# モック API サーバー

## qr 発行

```shell
http POST http://localhost:4000/api/qr
```

## 支払い

```shell
http POST http://localhost:4000/api/payment reservation_id={reservation_id}
```

## 秘密鍵と公開鍵の作成

```shell
# 秘密鍵
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048

# 公開鍵
openssl rsa -pubout -in private.pem -out public.pem

# 公開鍵をBase64化して、handlerで読めるようにする。→ 配置 serverless-infra/authorizer
base64 -w 0 public.pem
```

## 環境変数の設定

```env
APPSYNC_API_URL=XXXXXXXXXXXXXXXXXXXXXX
```
