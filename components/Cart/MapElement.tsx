import { memo, useEffect, useRef, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Polygon,
} from "@react-google-maps/api";

import { useAppStore } from "store";

import { translateFunction } from "utils/functions";
import Spinner from "components/global/Spinner";
import {
  showSuccessNotification,
  showErrorNotification,
} from "@/store/notifications/reducer";
type MapProps = {
  center: {
    lat: number | string;
    lng: number | string;
  };
  expanded: boolean;
  setLocation: (location: { latitude: number; longitude: number }) => void;
  cordinates: { lat: any; lon: any }[];
};

export const MapElement: React.FC<MapProps> = memo(
  ({ center, expanded, setLocation, cordinates }) => {
    const [mapReady, setMapReady] = useState(!cordinates);
    const [locationLoading, setLocationLoading] = useState(false);

    const { addressDetails, language, setAddressDetails } = useAppStore();
    const { isLoaded } = useJsApiLoader({
      id: "google-map-script",
      googleMapsApiKey: "AIzaSyCq5Gi3oBlQv5qbaX2w_piuYmXpGHVwxnM",
      language: language,
      preventGoogleFontsLoading: true,
    });
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [polygon, setPolygon] = useState<google.maps.Polygon | null>(null);
    useEffect(() => {
      if (
        map &&
        center?.lat &&
        center?.lng &&
        typeof center.lat !== "string" &&
        typeof center.lng !== "string"
      ) {
        // @ts-ignore
        map.panTo(center);
      }
    }, [center, map]);
    let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#f64f64" version="1.1" id="Capa_1" width="30px" height="30px" viewBox="0 0 395.71 395.71" xml:space="preserve">
    <g>
      <path d="M197.849,0C122.131,0,60.531,61.609,60.531,137.329c0,72.887,124.591,243.177,129.896,250.388l4.951,6.738   c0.579,0.792,1.501,1.255,2.471,1.255c0.985,0,1.901-0.463,2.486-1.255l4.948-6.738c5.308-7.211,129.896-177.501,129.896-250.388   C335.179,61.609,273.569,0,197.849,0z M197.849,88.138c27.13,0,49.191,22.062,49.191,49.191c0,27.115-22.062,49.191-49.191,49.191   c-27.114,0-49.191-22.076-49.191-49.191C148.658,110.2,170.734,88.138,197.849,88.138z"/>
    </g>
    </svg>`;
    const polygonPath =
      cordinates?.map((coord) => ({
        lat: Number(coord.lat),
        lng: Number(coord.lon),
      })) || [];

    // Check if a point is inside the polygon
    const isPointInPolygon = (point: google.maps.LatLng) => {
      if (!polygon) return true; // If no polygon, allow all points
      return google.maps.geometry.poly.containsLocation(point, polygon);
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
      if (map.getZoom() < 10) {
        showSuccessNotification(
          translateFunction("Please Be Accurate and select your Location")
        );

        return;
      }
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const point = new google.maps.LatLng(lat, lng);

        // Only set location if point is inside polygon or no polygon exists
        if (isPointInPolygon(point)) {
          setLocation({
            latitude: lat,
            longitude: lng,
          });

          if (map) {
            map.panTo({ lat, lng });
          }
        } else {
          showErrorNotification(
            translateFunction(
              "Pick Your Deleivery Location Inside Your Country"
            )
          );
        }
      }
    };

    const handleGetLocation = () => {
      setLocationLoading(true);
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            let point = new window.google.maps.LatLng(
              position.coords.latitude,
              position.coords.longitude
            );
            if (isPointInPolygon(point)) {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });

              if (map) {
                map.panTo({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                });
              }
            } else {
              showErrorNotification(
                translateFunction(
                  "Your Current Location is Not belong to Country Bounds"
                )
              );
            }
            setTimeout(() => {
              setLocationLoading(false);
            }, 1000);
          },
          (error) => {
            setLocationLoading(false);
            console.error("Error getting location:", error);
            showErrorNotification(
              translateFunction("Error getting your location")
            );
          }
        );
      } else {
        setLocationLoading(false);
        showErrorNotification(
          translateFunction("Geolocation is not supported by your browser")
        );
      }
    };

    const defaultCenter = {
      lat: 39.1667,
      lng: 35.6667,
    };

    return (
      <>
        <div
          className="flex justify-center items-center relative"
          style={{
            width: "100%",
            height: "100vh",
            borderRadius: "20px",
            overflow: "hidden",
            maxHeight: expanded ? "100%" : "79px",
          }}
        >
          {/* <MapContainer
          center={
            // @ts-ignore
            (center?.lat !== "null" && center) || {
              lat: 39.1667,
              lng: 35.6667,
            }
          }
          zoom={13}
          ref={ref}
          trackResize={true}
          minZoom={5}
          zoomControl={false}
          attributionControl={false}
          style={{ width: "100%", height: "100%" }}
        >
          <TileLayer url={getUrl()} />
          <HandlClick />
          {addressDetails.location.latitude &&
            addressDetails.location.latitude !== "null" &&
            addressDetails.location.longitude &&
            addressDetails.location.longitude !== "null" && (
              <Marker
                icon={iconPerson}
                position={{
                  lat: addressDetails.location.latitude,
                  lng: addressDetails.location.longitude,
                }}
              ></Marker>
            )}
          <ZoomControl position="topright" />
        </MapContainer> */}
          {isLoaded && (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={
                center?.lat !== "null" && center?.lng !== "null"
                  ? { lat: Number(center.lat), lng: Number(center.lng) }
                  : defaultCenter
              }
              onClick={handleMapClick}
              clickableIcons={false}
              zoom={6}
              options={{
                streetViewControl: false,
                gestureHandling: "greedy",
                fullscreenControl: false,
                mapTypeControl: false,
                zoomControl: true,
                cameraControl: false,
                zoomControlOptions: {
                  position: google.maps.ControlPosition.RIGHT_TOP,
                },
              }}
              onLoad={(m) => {
                if (
                  center?.lat &&
                  center?.lng &&
                  typeof center.lat !== "string" &&
                  typeof center.lng !== "string"
                ) {
                  // @ts-ignore
                  const point = new window.google.maps.LatLng(
                    center.lat,
                    center.lng
                  );
                  m.setCenter(point);
                }
                setMap(m);
              }}
              onUnmount={() => {
                setMap(null);
                setPolygon(null);
              }}
            >
              {/* Draw polygon if coordinates exist */}
              {polygonPath.length > 0 && (
                <Polygon
                  paths={polygonPath}
                  options={{
                    fillColor: "#FF0000",
                    fillOpacity: 0.05,
                    strokeColor: "#FF0000",
                    strokeOpacity: 1,
                    strokeWeight: 2,
                  }}
                  onLoad={(poly) => {
                    setPolygon(poly);
                    setMapReady(true);
                  }}
                  onClick={handleMapClick}
                />
              )}

              {/* Existing marker */}
              {addressDetails.location.latitude &&
                addressDetails.location.longitude && (
                  <Marker
                    position={{
                      lat: Number(addressDetails.location.latitude),
                      lng: Number(addressDetails.location.longitude),
                    }}
                    icon={{
                      url: `data:image/svg+xml;base64,${btoa(iconSvg)}`,
                      scaledSize: new window.google.maps.Size(30, 30),
                    }}
                  />
                )}
            </GoogleMap>
          )}
          {!isLoaded && !mapReady && <Spinner />}

          {expanded && isLoaded && mapReady && (
            <button
              onClick={handleGetLocation}
              className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
              style={{ zIndex: 1000 }}
            >
              {locationLoading ? (
                <Spinner />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#5d5d5d"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8zm0 10a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </>
    );
  }
);
