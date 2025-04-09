"use client";

import { APIProvider, Map, Marker, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import Cookies from "js-cookie";

interface Package {
  id: string;
  weight: number;
  price: number;
  status: string;
  description: string;

  sender_name: string;
  sender_phone: string;
  sender_address: string;
  sender_latitude: string;
  sender_longitude: string;

  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
  receiver_latitude: string;
  receiver_longitude: string;

  createdAt: string;
  updatedAt: string;
}


interface ApiResponse {
  data: Package[];
}

export default function Home() {
  const [pendingPackages, setPendingPackages] = useState<Package[]>([]);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await axios.get<ApiResponse>("https://api.dynamits.id/api/v1/packages");

        if (response.data && Array.isArray(response.data.data)) {
          const filteredPackages = response.data.data
            .filter((pkg) => pkg.status === "pending")
            .filter((pkg) => pkg.sender_latitude && pkg.sender_longitude);

          setPendingPackages(filteredPackages);
        } else {
          console.error("Unexpected API response format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching packages:", error);
      }
    };

    fetchPackages();
  }, []);

  // Track driver's location
  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setDriverLocation({ lat: latitude, lng: longitude });
        },
        (err) => {
          console.error("Failed to get location:", err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000,
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const updatePackageStatus = async (pkg: Package, newStatus: string) => {

    const userCookie = Cookies.get("user");

    if (!userCookie) {
      console.error("❌ 'user' cookie not found.");
      return;
    }

    let driverId: string | undefined;
    try {
      const user = JSON.parse(userCookie);
      driverId = user.driverId;
    } catch (err) {
      console.error("❌ Failed to parse 'user' cookie:", err);
      return;
    }

    if (!driverId) {
      console.error("❌ driverId not found in user cookie.");
      return;
    }

    try {
      const response = await axios.put(`https://api.dynamits.id/api/v1/packages/${pkg.id}`, {
        senderName: pkg.sender_name,
        senderAddress: pkg.sender_address,
        senderPhone: pkg.sender_phone,
        senderLatitude: pkg.sender_latitude,
        senderLongitude: pkg.sender_longitude,

        receiverName: pkg.receiver_name,
        receiverAddress: pkg.receiver_address,
        receiverPhone: pkg.receiver_phone,
        receiverLatitude: pkg.receiver_latitude,
        receiverLongitude: pkg.receiver_longitude,

        packageWeight: pkg.weight,
        packagePrice: pkg.price,
        packageDescription: pkg.description,

        status: newStatus,
      });

      console.log("Package updated:", response.data);

      const orderRes = await axios.post(`https://api.dynamits.id/api/v1/orders`, {
        packageId: pkg.id,
        driverId: driverId,
      });
  
      console.log(`✅ Order created:`, orderRes.data);

      // Refetch updated list after taking the order
      const updatedPackages = await axios.get<ApiResponse>("https://api.dynamits.id/api/v1/packages");
      const filtered = updatedPackages.data.data
        .filter((p) => p.status === "pending")
        .filter((p) => p.sender_latitude && p.sender_longitude);

      setPendingPackages(filtered);
    } catch (err) {
      console.error("Failed to update package:", err);
    }
  };

  useEffect(() => {
    if (selectedPackage) {
      updatePackageStatus(selectedPackage, "shipping");
      setSelectedPackage(null);
    }
  }, [selectedPackage]);

  return (
    <div className="flex h-screen w-screen">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_MAPS_API || ""}>
        <div className="flex-grow">
          <Map
            defaultCenter={{ lat: -7.250445, lng: 112.768845 }}
            defaultZoom={13}
            mapId="bd607af67d5b8861"
            style={{ width: "100%", height: "100%" }}
          >
            <ClusteredMarkers packages={pendingPackages} onSelect={setSelectedPackage} />

            {driverLocation && <DriverLiveMarker location={driverLocation} />}
          </Map>
        </div>
      </APIProvider>
    </div>
  );
}

function ClusteredMarkers({ packages, onSelect }: { packages: Package[]; onSelect: (pkg: Package) => void }) {

  const map = useMap();
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  useEffect(() => {
    if (!map || packages.length === 0) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (!infoWindowRef.current) {
      infoWindowRef.current = new google.maps.InfoWindow();
    }

    const infoWindow = infoWindowRef.current;

    const markers = packages.map((pkg) => {
      const marker = new google.maps.Marker({
        position: {
          lat: parseFloat(pkg.sender_latitude),
          lng: parseFloat(pkg.sender_longitude),
        },
        map,
        icon: {
          url: "https://cdn-icons-png.flaticon.com/128/679/679821.png",
          scaledSize: new google.maps.Size(25, 25),
        },
      });

      marker.addListener("click", () => {
        const contentHtml = `
          <div style="font-size: 14px; line-height: 1.4; max-width: 250px">
            <strong>📦 Package ID:</strong> ${pkg.id}<br/>
            <strong>Status:</strong> ${pkg.status}<br/>
            <strong>Description:</strong> ${pkg.description}<br/>
            <strong>Sender Address:</strong><br/> ${pkg.sender_address}<br/>
            <strong>Receiver Address:</strong><br/> ${pkg.receiver_address}<br/><br/>
            <button 
            id="take-order-btn-${pkg.id}"
            style="
              background-color: #2563EB;
              color: white;
              padding: 6px 12px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 13px;
            "
            >Take Order</button>
          </div>
        `;
        infoWindow.setContent(contentHtml);
        infoWindow.open(map, marker);

        google.maps.event.addListenerOnce(infoWindow, "domready", () => {
          const btn = document.getElementById(`take-order-btn-${pkg.id}`);
          if (btn) {
            btn.addEventListener("click", () => {
              onSelect(pkg);
            });
          }
        });
      });

      markersRef.current.push(marker);
      return marker;
    });

    const markerCluster = new MarkerClusterer({ markers, map });

    return () => {
      markerCluster.clearMarkers();
      markers.forEach((marker) => marker.setMap(null));
    };
  }, [map, packages]);

  return null;
}

function DriverLiveMarker({ location }: { location: { lat: number; lng: number } }) {
  const map = useMap();
  const hasPannedRef = useRef(false);

  useEffect(() => {
    if (map && location && !hasPannedRef.current) {
      map.panTo(location);
      hasPannedRef.current = true;
    }
  }, [map, location]);

  return (
    <Marker
      position={location}
      icon={{
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#4285F4",
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: "white",
      }}
    />
  );
}