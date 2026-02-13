export interface JobLocation {
  id: string;
  lat: number;
  lng: number;
  city: string;
  service: string;
  time: string;
}

export const jobLocations: JobLocation[] = [
  {
    id: "1",
    lat: 39.7392,
    lng: -104.9903,
    city: "Denver",
    service: "Remote Start",
    time: "2 min ago"
  },
  {
    id: "2",
    lat: 39.7294,
    lng: -104.8319,
    city: "Aurora",
    service: "Security System",
    time: "5 min ago"
  },
  {
    id: "3",
    lat: 39.7047,
    lng: -105.0814,
    city: "Lakewood",
    service: "Audio Upgrade",
    time: "12 min ago"
  },
  {
    id: "4",
    lat: 39.8028,
    lng: -105.0875,
    city: "Arvada",
    service: "Dash Cam",
    time: "15 min ago"
  },
  {
    id: "5",
    lat: 39.8367,
    lng: -105.0372,
    city: "Westminster",
    service: "Backup Camera",
    time: "20 min ago"
  },
  {
    id: "6",
    lat: 39.8683,
    lng: -104.9719,
    city: "Thornton",
    service: "LED Lighting",
    time: "35 min ago"
  },
  {
    id: "7",
    lat: 39.5792,
    lng: -104.8769,
    city: "Centennial",
    service: "Marine Audio",
    time: "45 min ago"
  },
  {
    id: "8",
    lat: 40.0150,
    lng: -105.2705,
    city: "Boulder",
    service: "Remote Start",
    time: "1 hour ago"
  }
];
