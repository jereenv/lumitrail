/**
 * Google Maps basemap style — a declarative recolor that gives cleared
 * (explored) areas a soft, hand-styled look instead of raw Google Maps:
 * pale land, cream/white roads, soft-blue water, green parks, and hidden
 * clutter (business pins, transit, most local labels). Applied on Android via
 * `<MapView customMapStyle={mapStyle}>`; iOS' Apple Maps ignores it and shows a
 * clean default, which is acceptable for the current Android-first target.
 */
export interface MapStyleElement {
  featureType?: string;
  elementType?: string;
  stylers: Record<string, string | number>[];
}

export const mapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#eef4e8' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5b6b5a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }, { weight: 2 }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#c7e3b7' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e4e9de' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#ffe6a8' }] },
  { featureType: 'road.local', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#a9d8e6' }] },
];
