'use client'
// サブスクリプションを直接 WebSocket で実装するコンポーネント
import {useEffect, useState} from "react";
import {gql, useSubscription} from "@apollo/client";

const SUBSCRIBE_PAYMENT_STATUS = gql`
  subscription OnPaymentStatusChanged($reservation_id: ID!) {
    onPaymentStatusChanged(reservation_id: $reservation_id) {
      reservation_id
      status
    }
  }
`;


export const WebSocketSubscription = (
  {
    reservationId,
    token,
  }: {
  reservationId: string
  token: string
}) => {
  const [status, setStatus] = useState('更新待ち中...')
  // const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // const wsRef = useRef<WebSocket | null>(null)
  console.log('reservationId:', reservationId)
  // useSubscriptionでサブスクリプションを設定
  const { data, loading, error: subscriptionError } = useSubscription(SUBSCRIBE_PAYMENT_STATUS, {
    variables: { reservation_id: reservationId },
    context: {
      headers: {
        Authorization: token,
      },
    },
    onData: d => console.log("data", d),
    onError: e => console.log("onError", e),
    shouldResubscribe: true,
  })

  // サブスクリプションがエラーを返した場合の処理
  useEffect(() => {
    
    if (subscriptionError) {
      console.log(error)
      console.error('サブスクリプションエラー:', subscriptionError)
      setError(`エラー: ${subscriptionError.message}`)
    }
  }, [subscriptionError])

  // サーバーからのレスポンスを受け取って状態を更新
  useEffect(() => {
    if (data && data.onPaymentStatusChanged) {
      const paymentStatus = data.onPaymentStatusChanged
      setStatus(`ステータス: ${paymentStatus.status}`)
    }
  }, [data])

  return (
    <div className="p-4 border rounded bg-gray-50">
      <div className="flex items-center space-x-2">
        <span className={`inline-block w-3 h-3 rounded-full ${loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`}></span>
        <span>{loading ? '接続状態を確認中...' : '接続済み - 更新待ち'}</span>
      </div>

      <p className="mt-2">{status}</p>

      {error && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded text-sm">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {loading && (
        <p className="mt-2 text-yellow-500">サブスクリプションのデータを待っています...</p>
      )}
    </div>
  )
}