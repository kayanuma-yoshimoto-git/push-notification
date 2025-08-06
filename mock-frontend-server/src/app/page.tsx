'use client'

import { useState} from 'react'
import {ApolloProvider, ApolloClient, NormalizedCacheObject} from '@apollo/client'
import {WebSocketSubscription} from "@/app/_components/WebSocketSubscription";
import {createApolloClient} from "@/app/_lib/createApolloClientByAwsAppsync";


// メインコンポーネント
export default function Home() {
  const [reservationId, setReservationId] = useState('')
  const [token, setToken] = useState('')
  const [client, setClient] = useState<ApolloClient<NormalizedCacheObject> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // QRコード発行処理
  const handleCreateReservation = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch('http://localhost:4000/api/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!res.ok) {
        throw new Error(`HTTPエラー ${res.status}`)
      }

      const data = await res.json()

      if (!data.reservation_id || !data.token) {
        throw new Error('サーバーからの応答が無効です')
      }

      console.log('予約ID:', data.reservation_id)
      console.log('トークン（先頭部分）:', data.token.substring(0, 15) + '...')

      setReservationId(data.reservation_id)
      setToken(data.token)

      // ApolloClientを作成
      const newClient = createApolloClient(data.token)
      setClient(newClient)
    } catch (err) {
      console.error('予約の作成に失敗しました:', err)
      setError(err instanceof Error ? err.message : '予約の作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }
  const handleReconnect = () => {
    if (reservationId && token) {
      const newClient = createApolloClient(token)
      setClient(newClient)
    }
  }

  return (
    <main className="p-8 max-w-full mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🧾 AppSync QR 決済デモ</h1>

      <button
        onClick={handleCreateReservation}
        disabled={isLoading}
        className={`px-4 py-2 rounded ${
          isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        {isLoading ? '処理中...' : '🎫 QRコード発行'}
      </button>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {reservationId && (
        <div className="space-y-4 p-6 border rounded-lg bg-gray-50 shadow-md">
          <div className="flex flex-col">
            <label htmlFor="reservationId" className="text-lg font-semibold text-gray-700">予約ID:</label>
            <input
              type="text"
              id="reservationId"
              value={reservationId}
              onChange={(e) => setReservationId(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="token" className="text-lg font-semibold text-gray-700">トークン:</label>
            <textarea
              id="token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              style={{ minHeight: '150px' }}
            />
          </div>
        </div>
      )}

      {reservationId && token && (
        <button
          onClick={handleReconnect}
          className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-lg mt-4"
        >
          再接続
        </button>
      )}
      {client && reservationId && token && (
        <ApolloProvider client={client}>
          <WebSocketSubscription
            reservationId={reservationId}
            token={token}
          />
        </ApolloProvider>
      )}
    </main>
  )
}