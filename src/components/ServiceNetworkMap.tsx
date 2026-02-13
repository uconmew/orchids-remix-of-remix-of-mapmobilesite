"use client";

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Search, Info, Plus, Minus, X, MapPin, Compass, Car } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "pk.eyJ1IjoibWJ0cyIsImEiOiJjbWsxNDc2ZXcwMjI0M2VvOXZ5MDlwbTQxIn0.vSg1oH_NGLQLGvYxCXElwA";

export interface ServiceCity {
  name: string;
  coordinates: [number, number];
  radius: number;
}

export interface JobData {
  id: string;
  city: string;
  state: string;
  service: string;
  car?: string | null;
  vehicleType?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  elapsedTime?: string;
  technicianNotes?: string;
  bookingDate: string;
  coordinates: [number, number];
  title?: string;
}

export interface MapData {
  totalInstalls: number;
  completedJobs: JobData[];
  activeJobs: JobData[];
  mostRecentJob: JobData | null;
  serviceCities: ServiceCity[];
}

export interface ServiceNetworkMapHandle {
  flyToLocation: (coordinates: [number, number], jobId?: string) => void;
}

const ServiceNetworkMap = forwardRef<ServiceNetworkMapHandle>((props, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [cinematicText, setCinematicText] = useState<string>("");
  const [textVisible, setTextVisible] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [displayedInstalls, setDisplayedInstalls] = useState(0);
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeJobCount, setActiveJobCount] = useState(0);
  const [showSkip, setShowSkip] = useState(true);
  const [serviceCheck, setServiceCheck] = useState<{
    zip: string;
    isServiced: boolean;
    cityName?: string;
    distance?: number;
    coords?: [number, number];
  } | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null);
  const animationStarted = useRef(false);
  const searchMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const animationAbortController = useRef<AbortController | null>(null);

  const renderCinematicText = useCallback((text: string, duration: number = 2500, signal?: AbortSignal) => {
    return new Promise<void>((resolve) => {
      if (signal?.aborted) return resolve();
      setCinematicText(text);
      setTextVisible(true);
      const timer = setTimeout(() => {
        setTextVisible(false);
        setTimeout(() => {
          setCinematicText("");
          resolve();
        }, 500);
      }, duration);
      
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        setTextVisible(false);
        setCinematicText("");
        resolve();
      });
    });
  }, []);

  const handleZoom = useCallback((direction: 'in' | 'out') => {
    if (!map.current) return;
    const currentZoom = map.current.getZoom();
    map.current.zoomTo(direction === 'in' ? currentZoom + 1 : currentZoom - 1, { duration: 300 });
  }, []);

  const checkServiceArea = async (zip: string) => {
    if (!zip.match(/^\d{5}$/)) return;
    
    try {
      const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${zip}.json?access_token=${MAPBOX_TOKEN}&country=us&types=postcode`);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        const coords: [number, number] = [lng, lat];
        
        let servicedCity = null;
        let minDistance = Infinity;
        const serviceCities = mapData?.serviceCities || [];
        
        for (const city of serviceCities) {
          const R = 3958.8;
          const dLat = (city.coordinates[1] - lat) * Math.PI / 180;
          const dLon = (city.coordinates[0] - lng) * Math.PI / 180;
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat * Math.PI / 180) * Math.cos(city.coordinates[1] * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = R * c;
          
          if (distance <= city.radius) {
            servicedCity = city;
            minDistance = distance;
            break;
          }
          if (distance < minDistance) minDistance = distance;
        }
        
        const isServiced = !!servicedCity;
        setServiceCheck({ zip, isServiced, cityName: servicedCity?.name, distance: minDistance, coords });
        
        if (map.current) {
          map.current.flyTo({ center: coords, zoom: 11, pitch: 45, essential: true, duration: 2000 });
          if (searchMarkerRef.current) searchMarkerRef.current.remove();
          
          const el = document.createElement("div");
          el.className = `w-8 h-8 rounded-full border-4 border-white shadow-2xl flex items-center justify-center transition-all duration-500 scale-0`;
          el.style.backgroundColor = isServiced ? "#22c55e" : "#ef4444";
          
          const inner = document.createElement("div");
          inner.className = "w-2 h-2 rounded-full bg-white";
          el.appendChild(inner);
          
          const label = document.createElement("div");
          label.className = "absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-white";
          label.textContent = isServiced ? `SERVICED (${zip})` : `OUTSIDE AREA (${zip})`;
          el.appendChild(label);
          
          const marker = new mapboxgl.Marker({ element: el }).setLngLat(coords).addTo(map.current);
          searchMarkerRef.current = marker;
          setTimeout(() => {
            el.classList.remove('scale-0');
            el.classList.add('scale-100');
          }, 100);
        }
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length < 5) {
      setServiceCheck(null);
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
    }
    if (query.match(/^\d{5}$/)) {
      checkServiceArea(query);
      return;
    }
    if (!query) {
      Array.from(markersRef.current.values()).forEach(m => {
        const el = m.getElement();
        el.style.opacity = "1";
        el.style.pointerEvents = "auto";
      });
      return;
    }
    const lowerQuery = query.toLowerCase();
    Array.from(markersRef.current.values()).forEach(m => {
      const el = m.getElement();
      const searchText = el.getAttribute('data-search') || "";
      if (searchText.includes(lowerQuery)) {
        el.style.opacity = "1";
        el.style.pointerEvents = "auto";
      } else {
        el.style.opacity = "0.1";
        el.style.pointerEvents = "none";
      }
    });
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now.getTime() - past.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  };

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const res = await fetch("/api/map-data");
        const data = await res.json();
        setMapData(data);
        setActiveJobCount(data.activeJobs?.length || 0);
      } catch (error) {
        // Silent fail
      }
    };
    fetchMapData();
    const interval = setInterval(fetchMapData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsIntersecting(true); },
      { threshold: 0.1 }
    );
    observer.observe(mapContainer.current);
    return () => observer.disconnect();
  }, []);

  const addMarker = useCallback((coordinates: [number, number], type: 'city' | 'recent' | 'active' | 'install' = 'install', job?: JobData, initialOpacity = "0") => {
    if (!map.current) return null;

    const el = document.createElement("div");
    el.className = `marker-container relative flex items-center justify-center cursor-pointer transition-all duration-300 marker-ease hover:scale-125`;
    el.style.opacity = initialOpacity;
    el.style.transform = initialOpacity === "0" ? "scale(0.5)" : "scale(1)";
    
    const colors = {
      active: '#ffffff',
      recent: '#f97316',
      install: '#22c55e',
      city: '#a855f7'
    };

    const color = colors[type];

    const dot = document.createElement("div");
    if (type === 'city') {
      dot.className = "w-4 h-4 rounded-full border-2 border-white bg-[#a855f7] shadow-[0_0_20px_rgba(168,85,247,1)] transition-all duration-300";
    } else if (type === 'recent') {
      dot.className = "w-3.5 h-3.5 rounded-full border-2 border-white bg-[#f97316] shadow-[0_0_15px_rgba(249,115,22,0.8)]";
    } else if (type === 'active') {
      dot.className = "w-4 h-4 rounded-full border-2 border-white bg-white shadow-[0_0_20px_rgba(255,255,255,1)] animate-pulse";
    } else {
      dot.className = "w-2.5 h-2.5 rounded-full border border-white/40 bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-all duration-300 hover:scale-150 hover:bg-white";
    }
    el.appendChild(dot);

    const marker = new mapboxgl.Marker({ 
      element: el,
      anchor: 'bottom'
    }).setLngLat(coordinates).addTo(map.current);

    if (initialOpacity === "0") {
      requestAnimationFrame(() => {
        el.style.opacity = "1";
        el.style.transform = "scale(1) translateY(0)";
      });
    }

    const vehicleType = job?.vehicleType || "Automobile";
    const car = job?.car || "Customer Vehicle";
    const service = job?.service || "Installation";
    const rawCity = job?.city || "Unknown";
    const location = rawCity.split(/[\s,]+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).filter(word => word.length > 0).join(' ');

    el.setAttribute('data-search', `${vehicleType} ${service} ${location} ${car}`.toLowerCase());
    
    if (type !== 'city') {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedJob(job || null);
        if (map.current) {
          map.current.flyTo({ center: coordinates, zoom: 14, pitch: 45, duration: 1500 });
        }
      });
    }

    if (job?.id) markersRef.current.set(job.id, marker);
    return marker;
  }, []);

  const addRadiusCircle = useCallback((id: string, coordinates: [number, number], radius: number, color: string) => {
    if (!map.current) return;
    const sourceId = `source-${id}`;
    const layerId = `layer-${id}`;
    if (map.current.getSource(sourceId)) return;

    map.current.addSource(sourceId, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Point', coordinates: coordinates }, properties: { radius: radius } }
    });

    map.current.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          8, ['*', ['get', 'radius'], 2.5],
          12, ['*', ['get', 'radius'], 18],
          16, ['*', ['get', 'radius'], 60]
        ],
        'circle-color': color.replace('0.4', '0.05'),
        'circle-stroke-width': 1.5,
        'circle-stroke-color': color,
        'circle-opacity': 0,
        'circle-stroke-opacity': 0,
        'circle-opacity-transition': { duration: 2500 },
          'circle-stroke-opacity-transition': { duration: 2500 },
        'circle-pitch-alignment': 'map'
      }
    });

    setTimeout(() => {
      if (map.current && map.current.getLayer(layerId)) {
        map.current.setPaintProperty(layerId, 'circle-opacity', 1);
        map.current.setPaintProperty(layerId, 'circle-stroke-opacity', 0.7);
      }
    }, 50);
  }, []);

  const skipIntro = useCallback(() => {
    if (animationAbortController.current) {
      animationAbortController.current.abort();
    }
    setAnimationComplete(true);
    setTextVisible(false);
    setCinematicText("");
    
    if (map.current && mapData) {
      map.current.flyTo({ center: [-104.95, 39.75], zoom: 10, pitch: 45, duration: 500 });
      
      const cities = mapData.serviceCities || [];
        cities.forEach(city => {
          addMarker(city.coordinates, 'city', { city: city.name, id: `city-${city.name}` } as any, "1");
          addRadiusCircle(`city-${city.name.replace(/\s+/g, '-')}`, city.coordinates, city.radius, 'rgba(168, 85, 247, 0.4)');
        });
      
      const completedJobs = mapData.completedJobs || [];
      const mostRecentJob = mapData.mostRecentJob;
      completedJobs.forEach(job => {
        addMarker(job.coordinates, job.id === mostRecentJob?.id ? 'recent' : 'install', job, "1");
      });
      
      const activeJobs = mapData.activeJobs || [];
      activeJobs.forEach(job => {
        addMarker(job.coordinates, 'active', job, "1");
      });
      
      setDisplayedInstalls(mapData.totalInstalls);
    }
  }, [mapData, addMarker, addRadiusCircle]);

  const startAnimation = useCallback(async () => {
    if (!map.current || animationStarted.current || !mapData) return;
    animationStarted.current = true;
    
    setTimeout(() => setShowSkip(false), 5000);

    animationAbortController.current = new AbortController();
    const signal = animationAbortController.current.signal;

    const cities = mapData.serviceCities || [];
    
    const jitterCoord = (coords: [number, number]): [number, number] => {
      return [
        coords[0] + (Math.random() - 0.5) * 0.15,
        coords[1] + (Math.random() - 0.5) * 0.15
      ];
    };

    const completedJobs = (mapData.completedJobs || []).map(job => ({
      ...job,
      coordinates: jitterCoord(job.coordinates)
    }));

    const activeJobs = (mapData.activeJobs || []).map(job => ({
      ...job,
      coordinates: jitterCoord(job.coordinates)
    }));

    const mostRecentJob = mapData.mostRecentJob ? {
      ...mapData.mostRecentJob,
      coordinates: jitterCoord(mapData.mostRecentJob.coordinates)
    } : null;

    // === PHASE 1: Intro text ===
    await renderCinematicText("THE STANDARD OF EXCELLENCE", 2250, signal);
    if (signal.aborted) return;
    await renderCinematicText("WE SERVICE", 1800, signal);
    if (signal.aborted) return;

    // === PHASE 2: City flyovers (10% faster each successive city) ===
    const baseCityDuration = 2222; // base fly duration for first city
    const citySpeedFactor = 0.9;   // each city is 10% faster than previous

    for (let i = 0; i < cities.length; i++) {
      const city = cities[i];
      if (signal.aborted) return;
      
      const scale = Math.pow(citySpeedFactor, i);
      const duration = baseCityDuration * scale;
      const pause = 400 * scale;
      
      map.current.flyTo({ 
        center: city.coordinates, 
        zoom: 11.5, 
        pitch: 45, 
        duration, 
        essential: true,
        easing: (t: number) => {
            return Math.pow(t, 5); 
        }
      });

      setCinematicText(city.name.toUpperCase());
      setTextVisible(true);
      
      const syncPoint = duration * 0.85;
      await new Promise(r => setTimeout(r, syncPoint));
      
      addMarker(city.coordinates, 'city', { city: city.name, id: `city-${city.name}` } as any, "0");
      addRadiusCircle(`city-${city.name.replace(/\s+/g, '-')}`, city.coordinates, city.radius, 'rgba(168, 85, 247, 0.4)');
      
      setTextVisible(false);
      await new Promise(r => setTimeout(r, Math.max(0, duration - syncPoint)));
      await new Promise(r => setTimeout(r, pause));
    }

    // === PHASE 3: Post-city text + overview fly ===
    if (signal.aborted) return;
    await renderCinematicText("UNRIVALED LOCAL PRESENCE", 1500, signal);
    if (signal.aborted) return;
    await renderCinematicText("ACROSS COLORADO", 1200, signal);
    if (signal.aborted) return;
    await renderCinematicText(`${mapData.totalInstalls} TOTAL INSTALLATIONS`, 1500, signal);

    map.current.flyTo({ 
      center: [-104.99, 39.73], 
      zoom: 8.5, 
      pitch: 45, 
      duration: 1500, 
      essential: true,
      easing: (t: number) => Math.pow(t, 4)
    });
    await new Promise(r => setTimeout(r, 1200));

    // === PHASE 4: Marker drops (decay with r=0.9811) ===
    const r = 0.9811;
    let totalDisplayed = 0;
    const jobsToRenderInitially = mostRecentJob ? completedJobs.filter(j => j.id !== mostRecentJob.id) : completedJobs;
    const orderedJobs = [...jobsToRenderInitially].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    for (let i = 0; i < orderedJobs.length; i++) {
      if (signal.aborted) return;
      const job = orderedJobs[i];
      totalDisplayed++;
      setDisplayedInstalls(totalDisplayed);
      addMarker(job.coordinates, job.id === mostRecentJob?.id ? 'recent' : 'install', job, "0");
      
      const delay = 500 * Math.pow(r, i);
      
      await new Promise(r => setTimeout(r, delay));
    }

    // === PHASE 5: Post-install text ===
    if (signal.aborted) return;
    await renderCinematicText("CRAFTSMANSHIP AT SCALE", 2000, signal);
    if (signal.aborted) return;
    await renderCinematicText("ELITE MOBILE SERVICE", 1500, signal);
    if (signal.aborted) return;

    // === PHASE 6: Most recent job ===
    if (mostRecentJob) {
      await renderCinematicText("OUR MOST RECENT", 1500, signal);
      map.current.flyTo({ 
        center: [mostRecentJob.coordinates[0], mostRecentJob.coordinates[1] - 0.01], 
        zoom: 14, 
        pitch: 60, 
        duration: 1500, 
        essential: true,
        easing: (t: number) => Math.pow(t, 4)
      });
      await new Promise(r => setTimeout(r, 1800));
      addMarker(mostRecentJob.coordinates, 'recent', mostRecentJob, "0");
      setDisplayedInstalls(prev => prev + 1);
      await renderCinematicText(`${mostRecentJob.city.toUpperCase()}`, 1500, signal);
    }

    // === PHASE 7: Active jobs ===
    const activeJobsData = mapData.activeJobs || [];
    if (activeJobsData.length > 0) {
      if (signal.aborted) return;
      await renderCinematicText("ALWAYS ON THE MOVE", 1500, signal);
      
      for (const job of activeJobsData) {
        if (signal.aborted) return;
        map.current.flyTo({ 
          center: [job.coordinates[0], job.coordinates[1] - 0.01], 
          zoom: 13, 
          pitch: 55, 
          duration: 1500, 
          essential: true,
          easing: (t: number) => Math.pow(t, 4)
        });
        await new Promise(r => setTimeout(r, 1800));
        addMarker(job.coordinates, 'active', job, "0");
        await renderCinematicText(`${job.city.toUpperCase()} - LIVE`, 1200, signal);
      }
    }

    // === PHASE 8: Outro ===
    if (signal.aborted) return;
    await renderCinematicText("6-FIGURE STANDARDS. PREMIUM RESULTS.", 2000, signal);
    if (signal.aborted) return;
    await renderCinematicText("MAPmobile: Installations Delivered", 2500, signal);

    if (signal.aborted) return;
    map.current.flyTo({ 
      center: [-104.95, 39.75], 
      zoom: 8, 
      pitch: 30, 
      bearing: -5, 
      duration: 2500, 
      essential: true,
      easing: (t: number) => Math.pow(t, 4)
    });
    await new Promise(r => setTimeout(r, 2500));
    setAnimationComplete(true);
  }, [renderCinematicText, addMarker, addRadiusCircle, mapData]);

  useEffect(() => {
    if (!mapContainer.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-104.99, 39.73],
      zoom: 9,
      interactive: true,
      antialias: true
    });
    map.current = mapInstance;
    mapInstance.on("style.load", () => {
      mapInstance.setFog({ color: 'rgb(10, 10, 20)', 'high-color': 'rgb(80, 206, 235)', 'horizon-blend': 0.02, 'space-color': 'rgb(11, 11, 25)', 'star-intensity': 0.6 });
    });
    mapInstance.on("load", () => {
      setMapLoaded(true);
      mapInstance.addControl(new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: false
      }), 'top-right');
    });
    const style = document.createElement('style');
      style.textContent = `
        @keyframes pulse-once-green {
          0% { filter: drop-shadow(0 0 0px rgba(34, 197, 94, 0)); transform: scale(1); background-color: #22c55e; }
          30% { filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.8)); transform: scale(1.2); }
          50% { filter: drop-shadow(0 0 30px rgba(255, 255, 255, 1)); transform: scale(1.4); background-color: #ffffff; }
          70% { filter: drop-shadow(0 0 20px rgba(34, 197, 94, 0.8)); transform: scale(1.2); }
          100% { filter: drop-shadow(0 0 0px rgba(34, 197, 94, 0)); transform: scale(1); background-color: #22c55e; }
        }
        .pulse-once svg {
          animation: pulse-once-green 0.8s ease-in-out forwards;
        }
          .marker-ease {
            transition-timing-function: cubic-bezier(1, 0.409, 1, 1);
          }
      `;

    document.head.appendChild(style);
    return () => {
      Array.from(markersRef.current.values()).forEach(m => m.remove());
      markersRef.current.clear();
      if (map.current) { map.current.remove(); map.current = null; }
      if (document.head.contains(style)) document.head.removeChild(style);
      if (animationAbortController.current) animationAbortController.current.abort();
    };
  }, []);

  useEffect(() => {
    if (!animationComplete || !map.current || !mapData) return;
    const currentJobs = [...(mapData.completedJobs || []), ...(mapData.activeJobs || [])];
    const mostRecentJobId = mapData.mostRecentJob?.id;
    currentJobs.forEach(job => {
      const isInstalled = job.status === 'installed' || job.status === 'completed';
      const isMostRecent = job.id === mostRecentJobId;
      const existingMarker = markersRef.current.get(job.id);
      if (existingMarker) {
        const el = existingMarker.getElement();
        const isCurrentlyWhite = el.querySelector('.bg-white') !== null;
        if (isInstalled && isCurrentlyWhite) {
          existingMarker.remove();
          addMarker(job.coordinates, isMostRecent ? 'recent' : 'install', job, "1");
        }
      } else {
        addMarker(job.coordinates, isInstalled ? (isMostRecent ? 'recent' : 'install') : 'active', job, "1");
      }
    });
    const jobIds = new Set(currentJobs.map(j => j.id));
    for (const [id, marker] of markersRef.current.entries()) {
      if (!id.startsWith('city-') && !jobIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
    setActiveJobCount(mapData.activeJobs?.length || 0);
  }, [mapData, animationComplete, addMarker]);

  useEffect(() => {
    if (mapLoaded && isIntersecting && mapData && !animationStarted.current) {
      startAnimation();
    }
  }, [mapLoaded, isIntersecting, mapData, startAnimation]);

  useImperativeHandle(ref, () => ({
    flyToLocation: (coordinates: [number, number], jobId?: string) => {
      if (!map.current) return;
      map.current.flyTo({ center: coordinates, zoom: 14, pitch: 45, duration: 2000 });
      if (jobId && mapData) {
        const job = [...mapData.completedJobs, ...mapData.activeJobs].find(j => j.id === jobId);
        if (job) setSelectedJob(job);
      }
    }
  }));

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#0a0a14]">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Search & Status Controls */}
      <div className="absolute top-4 left-4 right-4 md:top-6 md:left-6 flex flex-col gap-2 md:gap-3 z-30">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.7, 0, 1, 0.4] }}
          className="flex flex-col gap-2 w-full md:w-64"
        >
          {!animationComplete && animationStarted.current && showSkip && (
            <button 
              onClick={skipIntro}
              className="flex items-center justify-center gap-2 bg-[#50ceeb] hover:bg-[#50ceeb]/90 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-xl transition-all shadow-lg"
            >
              Skip Intro Animation
            </button>
          )}
          <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 md:py-2.5 rounded-xl ring-1 ring-white/5 focus-within:ring-[#50ceeb]/50 transition-all">
            <Search className="w-4 h-4 text-white/40" />
            <input 
              type="text"
              placeholder="City, service or ZIP code..."
              className="bg-transparent border-none outline-none text-sm text-white placeholder:text-white/20 w-full font-mono"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => handleSearch("")} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-3 h-3 text-white/40" />
              </button>
            )}
          </div>

          {serviceCheck && (
            <div className={`p-3 rounded-xl border animate-in fade-in slide-in-from-top-2 duration-300 ${serviceCheck.isServiced ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${serviceCheck.isServiced ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">
                  {serviceCheck.isServiced ? 'Area Serviced' : 'Outside Service Area'}
                </span>
              </div>
              <p className="text-[10px] text-white/60 leading-tight">
                {serviceCheck.isServiced 
                  ? `We provide mobile service to ${serviceCheck.cityName} (${serviceCheck.zip}).`
                  : `ZIP ${serviceCheck.zip} is currently outside our immediate service range.`}
              </p>
            </div>
          )}
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.7, 0, 1, 0.4] }}
          className="flex items-center gap-3 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 md:px-4 md:py-2.5 rounded-xl self-start"
        >
          <div className={`w-2 h-2 rounded-full ${activeJobCount > 0 ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'bg-gray-500'}`} />
          <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider ${activeJobCount > 0 ? 'text-white' : 'text-gray-500'}`}>
            {activeJobCount > 0 ? 'Live Network' : 'Standby'}
          </span>
          <span className="text-[10px] md:text-xs text-white/40 ml-1 md:ml-2">{activeJobCount} Active</span>
        </motion.div>
      </div>

      {/* Map Tools & Legend */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-30 flex flex-col gap-2 md:gap-3 items-end">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.7, 0, 1, 0.4] }}
          className="flex flex-col gap-1 bg-black/60 backdrop-blur-md border border-white/10 p-1 md:p-1.5 rounded-xl"
        >
          <button onClick={() => handleZoom('in')} className="p-2 md:p-2.5 hover:bg-white/10 rounded-lg transition-colors group" title="Zoom In">
            <Plus className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/60 group-hover:text-[#50ceeb] transition-colors" />
          </button>
          <div className="h-px bg-white/10 mx-2" />
          <button onClick={() => handleZoom('out')} className="p-2 md:p-2.5 hover:bg-white/10 rounded-lg transition-colors group" title="Zoom Out">
            <Minus className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/60 group-hover:text-[#50ceeb] transition-colors" />
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.7, 0, 1, 0.4] }}
          className="bg-black/60 backdrop-blur-md border border-white/10 p-2 md:p-2.5 rounded-xl"
        >
           <Compass className="w-5 h-5 md:w-6 md:h-6 text-[#50ceeb]" />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.6, ease: [0.7, 0, 1, 0.4] }}
          className="hidden md:block bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-xl space-y-3 min-w-[160px]"
        >
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#50ceeb] mb-1">Network Key</div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#a855f7] border border-white/50 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
            <span className="text-[11px] font-bold text-[#50ceeb] uppercase">Service City</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#22c55e] border border-white/50" />
            <span className="text-[11px] font-bold text-[#50ceeb] uppercase">Installed</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#f97316] border border-white/50 shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
            <span className="text-[11px] font-bold text-[#50ceeb] uppercase">Recent</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-white border border-white/50 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
            <span className="text-[11px] font-bold text-[#50ceeb] uppercase">Live</span>
          </div>
        </motion.div>
      </div>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
        <div className="text-center">
          <AnimatePresence mode="popLayout">
            {textVisible && cinematicText && (
              <motion.h2 
                key={cinematicText}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ 
                  duration: 0.6,
                  ease: [0.7, 0, 1, 0.4]
                }}
                className="text-4xl md:text-8xl font-black text-white uppercase italic tracking-tighter drop-shadow-[0_0_40px_rgba(255,255,255,0.5)] px-8"
              >
                {cinematicText}
              </motion.h2>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Stats Dashboard */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8, ease: [0.7, 0, 1, 0.4] }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] md:bottom-8 md:w-[calc(100%-4rem)] max-w-2xl z-30"
      >
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 md:p-6 rounded-2xl flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="space-y-0.5 md:space-y-1">
                <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[#50ceeb]/60">Total Installations</div>
                <div className="text-2xl md:text-4xl font-black italic text-[#22c55e] leading-none tabular-nums">
                  {animationComplete ? (mapData?.totalInstalls || 0) : displayedInstalls}
                </div>
            </div>
            <div className="w-px h-8 md:h-10 bg-white/10" />
              <div className="space-y-0.5 md:space-y-1">
                <div className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[#50ceeb]/60">Active Installations</div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="text-sm md:text-lg font-black uppercase italic text-[#50ceeb]">
                    {activeJobCount} LIVE
                  </div>
                </div>
              </div>
          </div>
          <div className="bg-white/5 p-2 md:p-3 rounded-xl border border-white/10 cursor-help" title="Live monitoring of all MAPmobile units in the Front Range area.">
            <Info className="w-4 h-4 md:w-5 md:h-5 text-[#50ceeb]/40" />
          </div>
        </div>
      </motion.div>
      
      {/* Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ ease: [0.7, 0, 1, 0.4] }}
              className="relative w-full max-w-lg bg-[#05050a]/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] p-8 md:p-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#50ceeb]/50 to-transparent" />
              
              <button 
                onClick={() => setSelectedJob(null)}
                className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 z-10"
              >
                <X className="w-5 h-5 text-[#50ceeb]/60" />
              </button>

              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className={`px-4 py-1.5 rounded-full border border-white/5 ${
                    selectedJob.status === 'in_progress' ? 'bg-white/10' : 
                    (selectedJob.id === mapData?.mostRecentJob?.id ? 'bg-orange-500/10' : 'bg-[#22c55e]/10')
                  }`}>
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                      selectedJob.status === 'in_progress' ? 'text-[#50ceeb]' : 
                      (selectedJob.id === mapData?.mostRecentJob?.id ? 'text-orange-500' : 'text-[#22c55e]')
                    }`}>
                      {selectedJob.status === 'in_progress' ? 'Live Installation' : 
                       (selectedJob.id === mapData?.mostRecentJob?.id ? 'Latest Completion' : 'Installation Complete')}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-[#50ceeb]/30 uppercase tracking-widest tabular-nums">
                    {getRelativeTime(selectedJob.createdAt)}
                  </span>
                </div>

                <div className="space-y-3">
                  <h3 className="text-3xl md:text-4xl font-black text-[#50ceeb] leading-tight uppercase italic tracking-tighter">
                    {selectedJob.car || "Customer Vehicle"}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-[#22c55e] uppercase tracking-[0.15em]">{selectedJob.vehicleType || "Automobile"}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                    <span className="text-sm font-black text-[#50ceeb]/50 uppercase tracking-[0.15em]">{selectedJob.service}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 p-6 rounded-3xl bg-white/[0.03] border border-white/5">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-[#50ceeb]/30 uppercase tracking-[0.2em]">Elapsed Time</div>
                    <div className="text-lg font-black text-[#50ceeb] tabular-nums">{selectedJob.elapsedTime || "N/A"}</div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className="text-[10px] font-black text-[#50ceeb]/30 uppercase tracking-[0.2em]">Completion</div>
                    <div className="text-lg font-black text-[#50ceeb] tabular-nums">
                      {selectedJob.updatedAt ? new Date(selectedJob.updatedAt).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "N/A"}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-black text-[#50ceeb]/30 uppercase tracking-[0.2em]">Installation Photos</div>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                    {[
                      "/products/03e66186-e5d6-444b-924d-25325dd714b0.jpg",
                      "/products/03e9f3a9-85be-4e15-85ea-12c81a8c35e9.jpg",
                      "/products/0c22481e-8591-4132-9ac8-ddd1f3f6773f.jpg"
                    ].map((src, i) => (
                      <motion.div 
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        className="relative w-40 h-24 md:w-48 md:h-28 rounded-2xl overflow-hidden border border-white/10 shrink-0 snap-start bg-white/5"
                      >
                        <img src={src} alt="Install View" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-2 left-3 text-[8px] font-black uppercase tracking-widest text-[#50ceeb]/60">View {i + 1}</div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-black text-[#50ceeb]/30 uppercase tracking-[0.2em]">Installer Workflow Notes</div>
                  <div className="text-sm leading-relaxed text-[#50ceeb]/70 bg-white/[0.03] p-6 rounded-3xl border border-white/5 italic relative">
                    <div className="absolute top-4 left-4 opacity-20 text-[#50ceeb]"><Info className="w-5 h-5" /></div>
                    <span className="pl-8 block">"{selectedJob.technicianNotes || "Installation verified. System performing to factory specifications."}"</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center gap-3 text-xs font-black text-[#50ceeb] uppercase tracking-[0.2em]">
                    <div className="p-2 bg-[#50ceeb]/10 rounded-lg">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span>{selectedJob.city}, Colorado Service Area</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#0a0a14] via-transparent to-transparent opacity-60" />
    </div>
  );
});

ServiceNetworkMap.displayName = "ServiceNetworkMap";

export default ServiceNetworkMap;
