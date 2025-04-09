'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import axios from 'axios'
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Order {
    id: string
    status: string
    driverId: string
    packages: {
        description: string
        sender_name: string
        sender_phone: string
        receiver_name: string
        receiver_phone: string
        sender_address: string
        receiver_address: string
        receiver_latitude: number | string
        receiver_longitude: number | string
    }
}

export default function AssignmentsPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    const [selectedPhone, setSelectedPhone] = useState<{
        name: string
        phone: string
    } | null>(null)

    const openContactOptions = (name: string, phone: string) => {
        setSelectedPhone({ name, phone })
    }

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
                (order) => order.status === 'shipping' && order.driverId === driverId
            )

            setOrders(filtered)
        } catch (err) {
            console.error('Failed to fetch orders:', err)
        } finally {
            setLoading(false)
        }
    }

    const markAsDone = async (orderId: string) => {
        const driverId = getDriverId()
        if (!driverId) return

        try {
            await axios.put(`https://api.dynamits.id/api/v1/orders/${orderId}`, {
                driverId,
                status: 'done',
            })

            setOrders((prev) => prev.filter((order) => order.id !== orderId))
        } catch (err) {
            console.error('Failed to update order status:', err)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    if (loading) return <div className="p-4">Loading assignments...</div>

    if (orders.length === 0)
        return <div className="p-4 text-muted-foreground">No active shipping assignments.</div>

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
                                    <strong>From:</strong> {order.packages.sender_name} (
                                    <button
                                        className="text-blue-600 underline"
                                        onClick={() =>
                                            openContactOptions(order.packages.sender_name, order.packages.sender_phone)
                                        }
                                    >
                                        {order.packages.sender_phone}
                                    </button>
                                    )<br />
                                    {order.packages.sender_address}
                                </div>

                                <div>
                                    <strong>To:</strong> {order.packages.receiver_name} (
                                    <button
                                        className="text-blue-600 underline"
                                        onClick={() =>
                                            openContactOptions(order.packages.receiver_name, order.packages.receiver_phone)
                                        }
                                    >
                                        {order.packages.receiver_phone}
                                    </button>
                                    )<br />
                                    {order.packages.receiver_address}
                                </div>

                                {isValidCoords ? (
                                    <div className="space-y-2">
                                        <div className="rounded-xl overflow-hidden border" style={{ height: '200px' }}>
                                            <Map
                                                zoom={13}
                                                center={{ lat, lng }}
                                                gestureHandling="greedy"
                                                disableDefaultUI
                                                mapId="bd607af67d5b8861"
                                                style={{ width: '100%', height: '100%' }}
                                            >
                                                <Marker position={{ lat, lng }} />
                                            </Map>
                                        </div>

                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button variant="outline" className="w-full">
                                                Navigate with Google Maps
                                            </Button>
                                        </a>
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground italic">
                                        Destination coordinates are unavailable or invalid.
                                    </div>
                                )}

                                <Button
                                    onClick={() => {
                                        const confirmed = window.confirm('Are you sure you want to mark this order as done?')
                                        if (confirmed) markAsDone(order.id)
                                    }}
                                    className="w-full"
                                >
                                    Mark as Done
                                </Button>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {selectedPhone && (
                <div className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-white p-6 rounded-xl space-y-4 w-[300px] text-center shadow-2xl border border-gray-200">
                        <div className="text-lg font-semibold">Contact {selectedPhone.name}</div>
                        <div className="flex flex-col gap-2">
                            <a
                                href={`https://wa.me/${selectedPhone.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-green-500 text-white rounded-lg py-2 hover:bg-green-600"
                            >
                                WhatsApp
                            </a>
                            <a
                                href={`tel:${selectedPhone.phone}`}
                                className="bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600"
                            >
                                Call
                            </a>
                            <a
                                href={`sms:${selectedPhone.phone}`}
                                className="bg-yellow-500 text-white rounded-lg py-2 hover:bg-yellow-600"
                            >
                                Message
                            </a>
                            <button
                                onClick={() => setSelectedPhone(null)}
                                className="mt-2 text-sm text-gray-500 hover:underline"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </APIProvider>
    )
}
