import { LegacyRef, memo, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  ZoomControl,
  useMapEvent,
} from "react-leaflet";
import { Icon, LatLngLiteral, Map, Point } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { useSelector } from "react-redux";

type MapType = "roadmap" | "satellite" | "hybrid" | "terrain";

type MapLocation = LatLngLiteral & { id: string };

type MapProps = {
  center: LatLngLiteral;
  expanded: boolean;
  setLocation: (e: any) => void;
};

export const MapElement: React.FC<MapProps> = memo(
  ({ center, expanded, setLocation }) => {
    const addressDetails = useSelector(
      (state: StateInterface) => state.cart.addressDetails
    );
    const [mapType, setMapType] = useState<MapType>("roadmap");

    const getUrl = () => {
      const mapTypeUrls: Record<MapType, string> = {
        roadmap: "http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}",
        satellite: "http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}",
        hybrid: "http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}",
        terrain: "http://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}",
      };
      return mapTypeUrls[mapType];
    };

    const HandlClick = () => {
      const map = useMap();

      useEffect(() => {
        if (center) {
          map.panTo(center, { animate: true });
          map.setZoom(map.getZoom() + 1, { animate: true });
        }
      }, [center, expanded]);

      useMapEvent("click", (e) => {
        if (expanded)
          setLocation({
            latitude: e.latlng.lat,
            longitude: e.latlng.lng,
          });
      });
      return <></>;
    };
    let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#f64f64" version="1.1" id="Capa_1" width="30px" height="30px" viewBox="0 0 395.71 395.71" xml:space="preserve">
<g>
	<path d="M197.849,0C122.131,0,60.531,61.609,60.531,137.329c0,72.887,124.591,243.177,129.896,250.388l4.951,6.738   c0.579,0.792,1.501,1.255,2.471,1.255c0.985,0,1.901-0.463,2.486-1.255l4.948-6.738c5.308-7.211,129.896-177.501,129.896-250.388   C335.179,61.609,273.569,0,197.849,0z M197.849,88.138c27.13,0,49.191,22.062,49.191,49.191c0,27.115-22.062,49.191-49.191,49.191   c-27.114,0-49.191-22.076-49.191-49.191C148.658,110.2,170.734,88.138,197.849,88.138z"/>
</g>
</svg>`;
    const ref = useRef<Map>();
    useEffect(() => {
      if (ref.current) {
        setTimeout(() => {
          ref.current.invalidateSize();
        }, 2000);
      }
    }, [expanded]);
    const iconPerson = new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(iconSvg)}`,
      //   iconRetinaUrl: require("./markerIcon.svg"),
      iconAnchor: null,
      popupAnchor: null,
      shadowUrl: null,
      shadowSize: null,
      shadowAnchor: null,
      iconSize: new Point(30, 30),
    });

    return (
      <>
        <div
          style={{
            width: "100%",
            height: "100vh",
            borderRadius: "20px",
            overflow: "hidden",
            maxHeight: expanded ? "100%" : "79px",
          }}
        >
          <MapContainer
            center={(center?.lat && center) || { lat: 39.1667, lng: 35.6667 }}
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
              addressDetails.location.longitude && (
                <Marker
                  icon={iconPerson}
                  position={{
                    lat: addressDetails.location.latitude,
                    lng: addressDetails.location.longitude,
                  }}
                ></Marker>
              )}
            <ZoomControl position="topright" />
          </MapContainer>
        </div>
      </>
    );
  }
);
