'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import axios from 'axios'
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'

import { Card, CardContent } from '@/components/ui/card'

interface Order {
  id: string
  status: string
  driverId: string
  startedAt: string
  completedAt: string
  packages: {
    description: string
    sender_name: string
    sender_phone: string
    sender_address: string
    receiver_name: string
    receiver_phone: string
    receiver_address: string
    receiver_latitude: number | string
    receiver_longitude: number | string
  }
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const getDriverId = () => {
    const userCookie = Cookies.get('user')
    try {
      const parsed = userCookie ? JSON.parse(userCookie) : null
      return parsed?.driverId || null
    } catch (e) {
      console.error('Failed to parse user cookie:', e)
      return null
    }
  }

  const fetchOrders = async () => {
    const driverId = getDriverId()
    if (!driverId) return

    try {
      const res = await axios.get('https://api.dynamits.id/api/v1/orders')
      const allOrders = res.data.data as Order[]

      const filtered = allOrders.filter(
        (order) => order.status === 'done' && order.driverId === driverId
      )

      setOrders(filtered)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString()
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  if (loading) return <div className="p-4">Loading history...</div>

  if (orders.length === 0)
    return <div className="p-4 text-muted-foreground">No completed orders found.</div>

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_MAPS_API || ''}>
      <div className="p-4 grid gap-4">
        {orders.map((order) => {
          const lat = Number(order.packages.receiver_latitude)
          const lng = Number(order.packages.receiver_longitude)
          const isValidCoords = !isNaN(lat) && !isNaN(lng)

          return (
            <Card key={order.id}>
              <CardContent className="p-4 space-y-4">
                <div><strong>Package:</strong> {order.packages.description}</div>

                <div>
                  <strong>From:</strong> {order.packages.sender_name} ({order.packages.sender_phone})<br />
                  {order.packages.sender_address}
                </div>

                <div>
                  <strong>To:</strong> {order.packages.receiver_name} ({order.packages.receiver_phone})<br />
                  {order.packages.receiver_address}
                </div>

                <div className="text-sm text-muted-foreground">
                  <div><strong>Started:</strong> {formatDate(order.startedAt)}</div>
                  <div><strong>Arrived at:</strong> {formatDate(order.completedAt)}</div>
                </div>

                {isValidCoords && (
                  <div className="rounded-xl overflow-hidden border" style={{ height: '200px' }}>
                    <Map
                      zoom={13}
                      defaultCenter={{ lat, lng }}
                      gestureHandling="greedy"
                      disableDefaultUI
                      mapId="bd607af67d5b8861"
                      style={{ width: '100%', height: '100%' }}
                    >
                      <Marker position={{ lat, lng }} />
                    </Map>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </APIProvider>
  )
}
