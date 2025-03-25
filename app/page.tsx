"use client";

import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";
import { useEffect, useState } from "react";
import axios from "axios";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

interface Package {
  id: string;
  sender_latitude: string;
  sender_longitude: string;
  status: string;
}

interface ApiResponse {
  data: {
    id: string;
    sender_latitude: string;
    sender_longitude: string;
    status: string;
  }[];
}

export default function Home() {
  const [pendingPackages, setPendingPackages] = useState<Package[]>([]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await axios.get<ApiResponse>("https://api.dynamits.id/api/v1/packages");

        if (response.data && Array.isArray(response.data.data)) {
          const filteredPackages = response.data.data
            .filter((pkg) => pkg.status === "pending")
            .filter((pkg) => pkg.sender_latitude && pkg.sender_longitude)
            .map((pkg) => ({
              id: pkg.id,
              sender_latitude: pkg.sender_latitude,
              sender_longitude: pkg.sender_longitude,
              status: pkg.status,
            }));

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
            <ClusteredMarkers packages={pendingPackages} />
          </Map>
        </div>
      </APIProvider>
    </div>
  );
}

function ClusteredMarkers({ packages }: { packages: Package[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || packages.length === 0) return;

    const markers = packages.map((pkg) => {
      return new google.maps.Marker({
        position: {
          lat: parseFloat(pkg.sender_latitude),
          lng: parseFloat(pkg.sender_longitude),
        },
        map: map,
      });
    });

    const markerCluster = new MarkerClusterer({ markers, map });

    return () => {
      markerCluster.clearMarkers();
    };
  }, [map, packages]);

  return null;
}
