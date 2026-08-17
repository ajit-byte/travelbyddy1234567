// src/pages/CreateItinerary.jsx
import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthContext } from '../context/AuthContext';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

// ── Budget type config ─────────────────────────────────────────────────────
const BUDGET_TYPES = [
  { label: 'Food',       color: 'bg-amber-400',   textColor: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-400' },
  { label: 'Tour',       color: 'bg-blue-500',    textColor: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-500' },
  { label: 'Stay',       color: 'bg-indigo-500',  textColor: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-500' },
  { label: 'Travel Fee', color: 'bg-emerald-500', textColor: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-500' },
  { label: 'Shopping',   color: 'bg-rose-400',    textColor: 'text-rose-700',    bg: 'bg-rose-50',    border: 'border-rose-400' },
  { label: 'Entertainment', color: 'bg-purple-500', textColor: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-500' },
];
function getBudgetType(label) { return BUDGET_TYPES.find(t => t.label === label) || BUDGET_TYPES[0]; }
function shortAddress(address) {
  if (!address) return '';
  return address.split(',').map(p => p.trim()).filter(Boolean).slice(0, 3).join(', ');
}

// ── Map helpers ────────────────────────────────────────────────────────────
function MapUpdater({ center, zoom = 14 }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, zoom, { animate: true, duration: 1.2 }); }, [center, zoom, map]);
  return null;
}

function FitBoundsToResults({ results }) {
  const map = useMap();
  useEffect(() => {
    if (results.length > 1) {
      const bounds = results.map(r => [parseFloat(r.lat), parseFloat(r.lon)]);
      map.fitBounds(bounds, { padding: [60, 60], animate: true });
    }
  }, [results, map]);
  return null;
}

// Reports live map viewport bounds to a ref
function MapBoundsTracker({ boundsRef }) {
  const map = useMap();
  useEffect(() => {
    const update = () => {
      const b = map.getBounds();
      boundsRef.current = {
        south: b.getSouth(),
        west: b.getWest(),
        north: b.getNorth(),
        east: b.getEast(),
        center: [b.getCenter().lat, b.getCenter().lng],
        zoom: map.getZoom(),
      };
    };
    update();
    map.on('moveend', update);
    map.on('zoomend', update);
    return () => { map.off('moveend', update); map.off('zoomend', update); };
  }, [map, boundsRef]);
  return null;
}

// ── Category mapping for smart Overpass queries ────────────────────────────
const CATEGORY_TAGS = {
  hotel:       ['tourism=hotel', 'tourism=motel', 'tourism=guest_house', 'tourism=hostel'],
  hostel:      ['tourism=hostel'],
  restaurant:  ['amenity=restaurant', 'amenity=fast_food', 'amenity=food_court'],
  cafe:        ['amenity=cafe'],
  bar:         ['amenity=bar', 'amenity=pub', 'amenity=nightclub'],
  hospital:    ['amenity=hospital', 'amenity=clinic', 'amenity=doctors'],
  pharmacy:    ['amenity=pharmacy'],
  bank:        ['amenity=bank', 'amenity=atm'],
  temple:      ['amenity=place_of_worship'],
  church:      ['amenity=place_of_worship'],
  mosque:      ['amenity=place_of_worship'],
  museum:      ['tourism=museum'],
  park:        ['leisure=park', 'leisure=garden'],
  airport:     ['aeroway=aerodrome'],
  bus:         ['amenity=bus_station', 'highway=bus_stop'],
  parking:     ['amenity=parking'],
  supermarket: ['shop=supermarket', 'shop=convenience'],
  shop:        ['shop=supermarket', 'shop=convenience', 'shop=mall'],
  mall:        ['shop=mall', 'shop=department_store'],
  school:      ['amenity=school', 'amenity=university', 'amenity=college'],
  gym:         ['leisure=fitness_centre', 'leisure=sports_centre'],
  swimming:    ['leisure=swimming_pool'],
  beach:       ['natural=beach'],
  mountain:    ['natural=peak'],
  lake:        ['natural=water'],
  waterfall:   ['waterway=waterfall'],
  viewpoint:   ['tourism=viewpoint'],
  attraction:  ['tourism=attraction', 'tourism=theme_park'],
  spa:         ['leisure=spa', 'amenity=spa'],
};

const TYPE_ICONS = {
  hotel: 'hotel', motel: 'hotel', guest_house: 'cottage', hostel: 'night_shelter',
  restaurant: 'restaurant', fast_food: 'lunch_dining', food_court: 'restaurant',
  cafe: 'local_cafe', bar: 'local_bar', pub: 'sports_bar', nightclub: 'nightlife',
  hospital: 'local_hospital', clinic: 'medical_services', pharmacy: 'local_pharmacy',
  bank: 'account_balance', atm: 'atm',
  place_of_worship: 'temple_buddhist', museum: 'museum',
  park: 'park', garden: 'yard', aerodrome: 'flight',
  bus_station: 'directions_bus', parking: 'local_parking',
  supermarket: 'shopping_cart', mall: 'shopping_bag', department_store: 'store',
  school: 'school', university: 'school', college: 'school',
  fitness_centre: 'fitness_center', sports_centre: 'sports',
  swimming_pool: 'pool', beach: 'beach_access', peak: 'landscape',
  water: 'water', waterfall: 'water', viewpoint: 'panorama_fish_eye',
  attraction: 'attractions', theme_park: 'attractions', spa: 'spa',
  convenience: 'store', place: 'location_on',
};

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function MapZoomControls({ setMapZoom }) {
  const map = useMap();
  return (
    <div className="absolute right-6 bottom-80 flex flex-col gap-3 z-[1000] pointer-events-none">
      <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl flex flex-col gap-2 pointer-events-auto">
        <button type="button" onClick={() => { map.zoomIn(); setMapZoom(map.getZoom() + 1); }}
          className="w-10 h-10 flex items-center justify-center hover:bg-surface-container rounded-xl transition-colors text-on-surface hover:text-primary">
          <span className="material-symbols-outlined">add</span>
        </button>
        <div className="h-[1px] bg-surface-container mx-2"></div>
        <button type="button" onClick={() => { map.zoomOut(); setMapZoom(map.getZoom() - 1); }}
          className="w-10 h-10 flex items-center justify-center hover:bg-surface-container rounded-xl transition-colors text-on-surface hover:text-primary">
          <span className="material-symbols-outlined">remove</span>
        </button>
      </div>
      <button type="button" className="w-12 h-12 bg-white/90 backdrop-blur-md flex items-center justify-center rounded-2xl shadow-xl hover:bg-surface-container transition-colors text-on-surface hover:text-primary pointer-events-auto">
        <span className="material-symbols-outlined">layers</span>
      </button>
    </div>
  );
}

function LocationSelector({ setPosition, setLabel, setPlaceInfo, searchResults }) {
  useMapEvents({
    async click(e) {
      if (searchResults && searchResults.length > 0) return;
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          setLabel(parts[0].trim());
          if (setPlaceInfo) setPlaceInfo({ title: parts[0].trim(), address: data.display_name, description: 'Selected from map click.' });
        } else setLabel('Selected Location');
      } catch { setLabel('Selected Location'); }
    },
  });
  return null;
}

function makeLabeledIcon(label) {
  return L.divIcon({
    className: '',
    iconAnchor: [0, 64],
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateX(-50%);pointer-events:none;">
      <div style="background:#fff;border:2px solid #4f46e5;border-radius:4px;padding:5px 12px;font-size:12px;font-weight:700;color:#4f46e5;white-space:nowrap;max-width:180px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 12px rgba(79,70,229,0.25);font-family:'Inter',sans-serif;">${label}</div>
      <div style="width:2px;height:8px;background:#4f46e5;"></div>
      <svg width="24" height="32" viewBox="0 0 28 36" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 12.379 21.152 13.016 21.746a1.4 1.4 0 001.968 0C15.621 35.152 28 23.625 28 14 28 6.268 21.732 0 14 0z" fill="#4f46e5"/><circle cx="14" cy="14" r="6" fill="white"/></svg>
    </div>`,
  });
}

function makeResultPin(num) {
  return L.divIcon({
    className: '',
    iconAnchor: [14, 36],
    html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
      <div style="width:28px;height:28px;background:#ef4444;border:2.5px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
        <span style="transform:rotate(45deg);color:#fff;font-size:10px;font-weight:800;font-family:'Inter',sans-serif;">${num}</span>
      </div>
    </div>`,
  });
}

function makeSelectedPin(label) {
  return L.divIcon({
    className: '',
    iconAnchor: [0, 72],
    html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 4px 12px rgba(37,99,235,0.4));">
      <div style="background:#fff;border:2.5px solid #2563eb;border-radius:6px;padding:6px 14px;font-size:13px;font-weight:800;color:#2563eb;white-space:nowrap;max-width:220px;overflow:hidden;text-overflow:ellipsis;box-shadow:0 2px 16px rgba(37,99,235,0.3);font-family:'Inter',sans-serif;">${label}</div>
      <div style="width:2px;height:8px;background:#2563eb;"></div>
      <svg width="28" height="36" viewBox="0 0 28 36" fill="none"><path d="M14 0C6.268 0 0 6.268 0 14c0 9.625 12.379 21.152 13.016 21.746a1.4 1.4 0 001.968 0C15.621 35.152 28 23.625 28 14 28 6.268 21.732 0 14 0z" fill="#2563eb"/><circle cx="14" cy="14" r="6" fill="white"/></svg>
    </div>`,
  });
}

// ── Default form state factory ─────────────────────────────────────────────
const EMPTY_ACTIVITY = (dayId = 1) => ({
  dayId,
  name: '',
  description: '',
  note: '',
  time: '',
  cost: '',
  location: '',
  budgetType: 'Food',
});

export default function CreateItinerary() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const loc = useLocation();
  const editItinerary = loc.state?.itinerary;
  const isEditing = !!editItinerary;
  const isDraftMode = loc.state?.isDraft;

  const [loading, setLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const mapBoundsRef = useRef(null);
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState(null);

  // ── Activity form ──────────────────────────────────────────────────────
  // showActivityForm: false | { editIdx: null|number }
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  // dayId stored INSIDE activityForm — THE key to fixing the day assignment bug
  const [activityForm, setActivityForm] = useState(EMPTY_ACTIVITY(1));

  // ── Activities array: { dayId, name, description, time, cost, location, budgetType, suggestedBy } ──
  const [itineraryActivities, setItineraryActivities] = useState(() => {
    // Edit mode always wins — load from the itinerary being edited
    if (editItinerary) {
      return editItinerary.activityItems?.length > 0 ? editItinerary.activityItems : [];
    }
    if (isDraftMode) {
      try {
        const draft = JSON.parse(localStorage.getItem('draftItinerary'));
        if (draft?.itineraryActivities) return draft.itineraryActivities;
      } catch (e) {}
    }
    return [];
  });

  const handleActivityFormChange = (e) => {
    setActivityForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Open form for a specific day — dayId goes DIRECTLY into form state
  const openActivityForm = (dayId, idx = null) => {
    const numDayId = Number(dayId);
    if (idx !== null) {
      // Edit: copy existing, but keep dayId from that activity
      setActivityForm({ ...itineraryActivities[idx] });
    } else {
      // New: stamp the correct dayId
      setActivityForm(EMPTY_ACTIVITY(numDayId));
    }
    setEditIdx(idx);
    setShowActivityForm(true);
  };

  const closeActivityForm = () => {
    setShowActivityForm(false);
    setEditIdx(null);
    setActivityForm(EMPTY_ACTIVITY(1));
  };

  const handleSaveActivity = () => {
    if (!activityForm.name?.trim()) return;
    const finalActivity = {
      ...activityForm,
      dayId: Number(activityForm.dayId),
      suggestedBy: user?.username || 'You',
    };
    if (editIdx !== null) {
      setItineraryActivities(prev => prev.map((a, i) => i === editIdx ? finalActivity : a));
    } else {
      setItineraryActivities(prev => [...prev, finalActivity]);
    }
    closeActivityForm();
  };

  const handleDeleteActivity = (idx) => {
    setItineraryActivities(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Map state ──────────────────────────────────────────────────────────
  const [mapCenter, setMapCenter] = useState([27.7172, 85.3240]);
  const [mapZoom, setMapZoom] = useState(14);
  const [markerPos, setMarkerPos] = useState(null);
  const [markerLabel, setMarkerLabel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [selectedResultIdx, setSelectedResultIdx] = useState(null);

  // ── Form state ─────────────────────────────────────────────────────────
  const [form, setForm] = useState(() => {
    if (editItinerary) {
      return {
        title: editItinerary.title || '',
        destinations: editItinerary.destinations?.length > 0
          ? editItinerary.destinations
          : (editItinerary.destination ? [editItinerary.destination] : ['']),
        startDate: editItinerary.startDate ? new Date(editItinerary.startDate).toISOString().split('T')[0] : '',
        endDate: editItinerary.endDate ? new Date(editItinerary.endDate).toISOString().split('T')[0] : '',
        activities: Array.isArray(editItinerary.activities)
          ? editItinerary.activities.join(', ')
          : (editItinerary.activities || ''),
        notes: editItinerary.notes || '',
        isPublic: editItinerary.isPublic ?? false,
        tripPacts: editItinerary.tripPacts || [],
        tags: editItinerary.tags || [],
        members: editItinerary.members || [],
      };
    }
    if (isDraftMode) {
      try {
        const draft = JSON.parse(localStorage.getItem('draftItinerary'));
        if (draft?.form) return { 
          ...draft.form, 
          isPublic: draft.form.isPublic ?? false,
          tripPacts: draft.form.tripPacts || [],
          tags: draft.form.tags || [],
          members: draft.form.members || []
        };
      } catch (e) {}
    }
    return { 
      title: '', 
      destinations: [''], 
      startDate: '', 
      endDate: '', 
      activities: '', 
      notes: '', 
      isPublic: false, 
      tripPacts: [],
      status: 'Draft',
      members: [],
      tags: []
    };
  });

  const [showTripPactModal, setShowTripPactModal] = useState(false);
  const [newPact, setNewPact] = useState('');
  const [newTag, setNewTag] = useState('');

  // numDays derived from date range — computed after form is declared
  const numDays = (() => {
    if (form.startDate && form.endDate) {
      const diff = Math.round((new Date(form.endDate) - new Date(form.startDate)) / 86400000);
      return Math.max(1, diff + 1);
    }
    // fallback: derive from activities (edit/draft restore)
    const maxDay = Math.max(1, ...itineraryActivities.map(a => Number(a.dayId) || 1));
    return maxDay;
  })();

  // Persist draft
  useEffect(() => {
    if (!isEditing) {
      localStorage.setItem('draftItinerary', JSON.stringify({ form, itineraryActivities }));
    }
  }, [form, itineraryActivities, isEditing]);

  // Geocode on edit mount
  useEffect(() => {
    const destToSearch = editItinerary?.destinations?.[0] || editItinerary?.destination;
    if (destToSearch) {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destToSearch)}`)
        .then(r => r.json()).then(data => {
          if (data?.length > 0) {
            const pos = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            setMapCenter(pos); setMarkerPos(pos);
          }
        }).catch(console.error);
    }
  }, [editItinerary]);

  // Fetch full itinerary from server on edit mount to guarantee activityItems are loaded
  useEffect(() => {
    if (!isEditing || !editItinerary?._id) return;
    const fetchFull = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/itineraries/${editItinerary._id}`, {
          headers: { 'x-auth-token': token || '' },
        });
        if (!res.ok) return;
        const data = await res.json();
        // Hydrate activities
        if (data.activityItems?.length > 0) {
          setItineraryActivities(data.activityItems);
        }
        // Hydrate form fields
        setForm(prev => ({
          ...prev,
          title: data.title || prev.title,
          destinations: data.destinations?.length > 0
            ? data.destinations
            : (data.destination ? [data.destination] : prev.destinations),
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : prev.startDate,
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : prev.endDate,
          activities: Array.isArray(data.activities)
            ? data.activities.join(', ')
            : (data.activities || prev.activities),
          notes: data.notes ?? prev.notes,
          isPublic: data.isPublic ?? prev.isPublic,
          tripPacts: data.tripPacts || prev.tripPacts || [],
          tags: data.tags || prev.tags || [],
          members: data.members || prev.members || [],
        }));
      } catch (err) {
        console.error('Failed to fetch full itinerary:', err);
      }
    };
    fetchFull();
  }, [isEditing, editItinerary?._id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Live search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); setSearchError(''); return; }
    const timer = setTimeout(() => performSearch(searchQuery), 800);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performSearch = useCallback(async (query, useMapBounds = false) => {
    if (!query.trim()) return;
    setSearchError('');
    setIsSearching(true);
    try {
      // ── 1. Determine the bounding box ──────────────────────────────────
      // Use live map viewport bounds if available, else fall back to mapCenter ± generous radius
      let south, west, north, east, clat, clon;
      const bounds = mapBoundsRef.current;
      if (useMapBounds && bounds) {
        // "Search this area" — use exact viewport
        south = bounds.south; west = bounds.west;
        north = bounds.north; east = bounds.east;
        clat = bounds.center[0]; clon = bounds.center[1];
      } else if (bounds) {
        // Live search — expand viewport by 3× for a generous catchment
        const latSpan = (bounds.north - bounds.south) * 1.5;
        const lonSpan = (bounds.east - bounds.west) * 1.5;
        clat = bounds.center[0]; clon = bounds.center[1];
        south = clat - latSpan; north = clat + latSpan;
        west = clon - lonSpan; east = clon + lonSpan;
      } else {
        // No bounds yet — use mapCenter ± 1 degree (~110 km)
        [clat, clon] = mapCenter;
        south = clat - 1; north = clat + 1;
        west = clon - 1; east = clon + 1;
      }
      
      // Safety check: ensure coordinates are valid numbers
      if ([south, west, north, east].some(c => typeof c !== 'number' || isNaN(c))) {
        setIsSearching(false);
        return;
      }

      const bbox = `${south},${west},${north},${east}`;
      const safeQuery = escapeRegex(query);

      // ── 2. Build Overpass queries ──────────────────────────────────────
      // Two strategies: (a) name‑substring match, (b) category‑tag match
      const queryLower = query.toLowerCase().trim();
      const matchedCategories = Object.entries(CATEGORY_TAGS)
        .filter(([keyword]) => queryLower.includes(keyword) || keyword.includes(queryLower))
        .flatMap(([, tags]) => tags);

      // Build tag-based union statements (e.g., node["tourism"="hotel"])
      const tagStatements = matchedCategories.map(tag => {
        const [k, v] = tag.split('=');
        return `node["${k}"="${v}"](${bbox});\nway["${k}"="${v}"](${bbox});`;
      }).join('\n');

      const overpassQuery = `
        [out:json][timeout:15];
        (
          node["name"~"${safeQuery}",i](${bbox});
          way["name"~"${safeQuery}",i](${bbox});
          ${tagStatements}
        );
        out center 80;
      `;

      const overpassPromise = fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(overpassQuery),
      }).then(r => r.json()).catch(() => ({ elements: [] }));

      // ── 3. Nominatim — broader search (cities, addresses) ─────────────
      const viewbox = `${west},${north},${east},${south}`;
      const nominatimPromise = fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=25&addressdetails=1&namedetails=1&viewbox=${viewbox}&bounded=0`
      ).then(r => r.json()).catch(() => []);

      const [overpassData, nominatimData] = await Promise.all([overpassPromise, nominatimPromise]);

      // ── 4. Convert Overpass elements ───────────────────────────────────
      const overpassResults = (overpassData.elements || [])
        .filter(el => el.tags?.name)
        .map(el => {
          const lat = el.lat ?? el.center?.lat;
          const lon = el.lon ?? el.center?.lon;
          if (!lat || !lon) return null;
          const tags = el.tags || {};
          const typeVal = tags.amenity || tags.tourism || tags.shop || tags.leisure || tags.natural || tags.aeroway || 'place';
          const addressParts = [
            tags['addr:street'] && ((tags['addr:housenumber'] || '') + ' ' + tags['addr:street']).trim(),
            tags['addr:city'] || tags['addr:town'] || tags['addr:village'],
            tags['addr:state'],
            tags['addr:country'],
          ].filter(Boolean);
          return {
            lat: String(lat),
            lon: String(lon),
            display_name: tags.name + (addressParts.length ? ', ' + addressParts.join(', ') : ''),
            type: typeVal,
            _source: 'overpass',
            _icon: TYPE_ICONS[typeVal] || 'location_on',
          };
        })
        .filter(Boolean);

      // ── 5. Convert Nominatim results ───────────────────────────────────
      const nominatimResults = (nominatimData || []).map(r => ({
        ...r,
        _source: 'nominatim',
        _icon: TYPE_ICONS[r.type] || 'location_on',
      }));

      // ── 6. Merge & deduplicate by proximity ────────────────────────────
      const seen = new Set();
      const merged = [];
      const addResult = (r) => {
        // Dedupe by rounding coords to ~11m precision
        const key = `${parseFloat(r.lat).toFixed(4)},${parseFloat(r.lon).toFixed(4)}`;
        if (!seen.has(key)) { seen.add(key); merged.push(r); }
      };
      // Overpass first (richer POI data), then Nominatim
      overpassResults.forEach(addResult);
      nominatimResults.forEach(addResult);

      if (merged.length > 0) {
        setSearchResults(merged.slice(0, 50));
        // Only fly to first result if NOT doing "search this area"
        if (!useMapBounds) {
          setMapCenter([parseFloat(merged[0].lat), parseFloat(merged[0].lon)]);
        }
      } else {
        setSearchResults([]);
        if (query.length > 1) setSearchError('No results found. Try zooming out or panning to a different area.');
      }
    } catch (err) {
      console.error(err);
      setSearchError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [mapCenter]);

  const clearSearch = () => {
    setSearchQuery(''); setSearchResults([]); setSearchError('');
    setMarkerPos(null); setMarkerLabel(''); setSelectedPlaceInfo(null);
    setSelectedResultIdx(null); setMapZoom(14);
  };

  const handleSearch = (e) => { if (e) e.preventDefault(); performSearch(searchQuery); };
  const handleSearchThisArea = () => { if (searchQuery.trim()) performSearch(searchQuery, true); };

  const handleSelectResult = (result, idx) => {
    const shortLabel = result.display_name.split(',')[0].trim();
    const pos = [parseFloat(result.lat), parseFloat(result.lon)];
    setMarkerPos(pos);
    setMarkerLabel(shortLabel);
    setSelectedPlaceInfo({ title: shortLabel, address: result.display_name, description: result.type ? `Type: ${result.type.replace(/_/g, ' ')}` : 'From search.' });
    setSelectedResultIdx(idx ?? null);
    setMapZoom(17);
    setMapCenter(pos);
    setForm(prev => {
      const d = [...prev.destinations];
      if (!d[0]) d[0] = result.display_name;
      else if (!d.includes(result.display_name)) d.push(result.display_name);
      return { ...prev, destinations: d };
    });
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title?.trim()) { alert('Please give your itinerary a name.'); return; }
    if (!form.startDate) { alert('Please set the trip start date.'); return; }
    if (!form.endDate) { alert('Please set the trip end date.'); return; }
    if (new Date(form.endDate) < new Date(form.startDate)) { alert('End date must be on or after start date.'); return; }
    setShowTripPactModal(true);
  };

  const handleFinalSubmit = async () => {
    if (form.tripPacts.length < 3) return;
    setLoading(true);

    const computedBudget = itineraryActivities.reduce((s, a) => s + (Number(a.cost) || 0), 0);
    const generatedBreakdown = itineraryActivities.map(a =>
      `Day ${a.dayId} | ${a.time ? a.time + ' - ' : ''}${a.name}${a.location ? ' @ ' + shortAddress(a.location) : ''}${a.cost ? ' ($' + a.cost + ')' : ''}`
    );

    const uniqueDestinations = Array.from(new Set(
      itineraryActivities.map(a => shortAddress(a.location)).filter(Boolean)
    ));

    const payload = {
      ...form,
      destinations: uniqueDestinations.length > 0 ? uniqueDestinations : form.destinations,
      activities: itineraryActivities.map(a => a.name), // Sync flat list with names
      budget: computedBudget,
      dailyBreakdown: generatedBreakdown,
      status: isEditing ? (form.status || 'My Trips') : 'My Trips',
      members: Array.from(new Set([...(form.members || []), user?.username].filter(Boolean))),
      tags: form.tags || [],
      activityItems: itineraryActivities.map(a => {
        // Calculate absolute date for each activity
        let activityDate = '';
        if (form.startDate) {
          const d = new Date(form.startDate);
          d.setDate(d.getDate() + (a.dayId - 1));
          activityDate = d.toISOString().split('T')[0];
        }
        return {
          ...a,
          dayId: Number(a.dayId),
          cost: Number(a.cost) || 0,
          date: activityDate
        };
      }),
    };

    try {
      const token = JSON.parse(localStorage.getItem('authTokens'))?.token;
      const url = isEditing
        ? `${import.meta.env.VITE_API_URL}/api/itineraries/${editItinerary._id}`
        : `${import.meta.env.VITE_API_URL}/api/itineraries`;
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.msg || 'Failed to save'); }
      localStorage.removeItem('draftItinerary');
      navigate('/itineraryplanningpage');
    } catch (err) {
      console.error(err); alert(err.message || 'Error saving itinerary');
    } finally { setLoading(false); setShowTripPactModal(false); }
  };

  const addPact = () => {
    if (!newPact.trim()) return;
    setForm(prev => ({ ...prev, tripPacts: [...prev.tripPacts, newPact.trim()] }));
    setNewPact('');
  };

  const removePact = (idx) => {
    setForm(prev => ({ ...prev, tripPacts: prev.tripPacts.filter((_, i) => i !== idx) }));
  };

  const addTag = (e) => {
    if (e) e.preventDefault();
    if (!newTag.trim()) return;
    if (form.tags?.includes(newTag.trim())) { setNewTag(''); return; }
    setForm(prev => ({ ...prev, tags: [...(prev.tags || []), newTag.trim()] }));
    setNewTag('');
  };

  const removeTag = (tag) => {
    setForm(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
  };

  // ── Derived ────────────────────────────────────────────────────────────
  const hasActivities = itineraryActivities.length > 0;
  const totalCost = itineraryActivities.reduce((s, a) => s + (Number(a.cost) || 0), 0);
  const budgetByType = BUDGET_TYPES.map(t => ({
    ...t,
    total: itineraryActivities.filter(a => a.budgetType === t.label).reduce((s, a) => s + (Number(a.cost) || 0), 0),
  })).filter(t => t.total > 0);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="bg-surface text-on-surface font-body h-screen w-screen flex flex-col overflow-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col md:flex-row pt-20 overflow-hidden">

        {/* ── SIDEBAR ── */}
        <aside className="w-full md:w-[38%] lg:w-[480px] h-full bg-surface-container-lowest border-r shadow-sm flex flex-col z-40 overflow-hidden shrink-0">
          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">

            {/* Fixed Top */}
            <div className="px-7 py-5 border-b border-surface-container-low shrink-0">
              <div className="flex items-center gap-4 mb-4">
                <button type="button" onClick={() => navigate('/itineraryplanningpage')} className="text-outline hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex items-center justify-between flex-grow">
                  <input name="title" value={form.title} onChange={handleChange} placeholder="Itinerary Title"
                    className="font-headline font-extrabold text-2xl tracking-tight text-primary bg-transparent border-none p-0 focus:ring-0 w-full placeholder-primary/50" required />
                  <button type="button" className="text-primary hover:bg-surface-container p-1 rounded-full transition-colors ml-2">
                    <span className="material-symbols-outlined">person_add</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-white bg-primary flex items-center justify-center text-white font-bold text-sm">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-sm font-medium text-outline">Editing live</span>
                </div>
              </div>
            </div>

            {/* Scrollable Middle */}
            {showActivityForm ? (
              /* ── Activity Form ── */
              <div className="flex-grow overflow-y-auto custom-scrollbar px-7 py-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-headline font-bold text-xl text-primary">
                      {editIdx !== null ? 'Edit Activity' : 'Add New Activity'}
                    </h3>
                    <p className="text-sm text-outline mt-0.5">
                      Day {String(Number(activityForm.dayId)).padStart(2, '0')}
                    </p>
                  </div>
                  <button type="button" onClick={closeActivityForm} className="text-outline hover:text-primary transition-colors p-1 rounded-xl hover:bg-surface-container">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Activity Name</label>
                    <input name="name" value={activityForm.name} onChange={handleActivityFormChange} type="text" placeholder="e.g., Beach Sunset"
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-primary/20 transition-all font-medium text-on-surface" />
                  </div>
                  {/* Description */}
                  <div>
                    <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Description</label>
                    <textarea name="description" value={activityForm.description} onChange={handleActivityFormChange} placeholder="Describe the activity..."
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-primary/20 h-20 resize-none font-medium text-on-surface" />
                  </div>
                  {/* Note */}
                  <div>
                    <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Note</label>
                    <input name="note" value={activityForm.note} onChange={handleActivityFormChange} placeholder="Any specific notes (e.g. entry fee info)..."
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-primary/20 font-medium text-on-surface" />
                  </div>
                  {/* Budget Category */}
                  <div>
                    <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Budget Category</label>
                    <select name="budgetType" value={activityForm.budgetType} onChange={handleActivityFormChange}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-primary/20 font-medium text-on-surface cursor-pointer">
                      {BUDGET_TYPES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                    </select>
                  </div>
                  {/* Time + Cost */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Time</label>
                      <input name="time" value={activityForm.time} onChange={handleActivityFormChange} type="time"
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3.5 text-base focus:ring-2 focus:ring-primary/20 font-medium text-on-surface" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Cost ($)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline font-bold">$</span>
                        <input name="cost" value={activityForm.cost} onChange={handleActivityFormChange} type="number" min="0" placeholder="0.00"
                          className="w-full bg-surface-container-low border-none rounded-xl pl-8 pr-4 py-3.5 text-base focus:ring-2 focus:ring-primary/20 font-medium text-on-surface" />
                      </div>
                    </div>
                  </div>
                  {/* Location */}
                  <div>
                    <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">Location</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-xl">location_on</span>
                      <input name="location" value={activityForm.location} onChange={handleActivityFormChange} type="text" placeholder="Type a location or pick from map..."
                        className="w-full bg-surface-container-low border-none rounded-xl pl-10 pr-4 py-3.5 text-base focus:ring-2 focus:ring-primary/20 font-medium text-on-surface" />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button type="button" onClick={handleSaveActivity}
                    className="w-full bg-[#1E3A8A] text-white font-extrabold py-4 rounded-xl shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 hover:-translate-y-0.5 transition-all text-base uppercase tracking-widest">
                    {editIdx !== null ? 'Update Activity' : 'Save Activity'}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Daily Schedule View ── */
              <div className="px-6 py-5 flex-grow overflow-y-auto scrollbar-hide">
                {/* ── Trip Dates ── */}
                <div className="mb-6 bg-surface-container-low rounded-2xl p-4">
                  <p className="text-xs font-bold text-outline uppercase tracking-wider mb-3">Trip Dates</p>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-outline uppercase mb-1.5">From</label>
                      <input name="startDate" value={form.startDate} onChange={handleChange} type="date" required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full bg-surface-container border-none rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 font-medium text-on-surface cursor-pointer" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-outline uppercase mb-1.5">Till</label>
                      <input name="endDate" value={form.endDate} onChange={handleChange} type="date"
                        min={form.startDate || new Date().toISOString().split('T')[0]} required
                        className="w-full bg-surface-container border-none rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 font-medium text-on-surface cursor-pointer" />
                    </div>
                  </div>
                  {numDays > 1 && (
                    <p className="text-[10px] text-outline mt-2 italic">{numDays} days planned</p>
                  )}
                </div>

                {/* ── Daily Schedule Header ── */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-headline font-bold text-xl">Daily Schedule</h3>
                </div>

                {/* ── Days ── */}
                <div className="space-y-7">
                  {Array.from({ length: numDays }, (_, di) => {
                    const dayId = di + 1;
                    const dayLabel = `Day ${String(dayId).padStart(2, '0')}`;
                    const dayDate = form.startDate
                      ? new Date(new Date(form.startDate).getTime() + di * 86400000)
                          .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : null;
                    // Filter strictly by numeric equality
                    const dayActivities = itineraryActivities
                      .map((a, globalIdx) => ({ ...a, globalIdx }))
                      .filter(a => Number(a.dayId) === dayId);

                    return (
                      <div key={dayId} className="space-y-3">
                        {/* Day header */}
                        <div className="flex items-center gap-3 text-outline text-sm uppercase tracking-widest font-bold">
                          <span>{dayLabel}{dayDate ? ` — ${dayDate}` : ''}</span>
                          <span className="h-[1px] flex-grow bg-surface-container"></span>
                        </div>

                        {dayActivities.length === 0 ? (
                          <div
                            onClick={() => openActivityForm(dayId)}
                            className="border-2 border-dashed border-primary/25 p-6 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-low transition-colors"
                          >
                            <span className="material-symbols-outlined mb-2 text-primary text-2xl">add_location_alt</span>
                            <span className="text-primary text-sm font-bold">Click to create an Activity</span>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {dayActivities.map((act) => {
                              const bt = getBudgetType(act.budgetType);
                              return (
                                <div key={act.globalIdx}
                                  className={`group bg-surface-container-low rounded-2xl hover:bg-surface-container transition-colors border-l-4 ${bt.border} shadow-sm overflow-hidden`}>
                                  <div className="p-4">
                                    <div className="flex justify-between items-start gap-2">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                          {act.time && <span className={`text-[11px] font-bold ${bt.textColor} ${bt.bg} px-2.5 py-0.5 rounded-full uppercase`}>{act.time}</span>}
                                          {act.budgetType && <span className={`text-[11px] font-bold ${bt.textColor} ${bt.bg} px-2.5 py-0.5 rounded-full uppercase`}>{act.budgetType}</span>}
                                        </div>
                                        <h4 className="font-bold text-base text-primary leading-tight truncate">{act.name}</h4>
                                        {shortAddress(act.location) && (
                                          <p className="text-sm text-outline mt-1 truncate flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm shrink-0">location_on</span>
                                            {shortAddress(act.location)}
                                          </p>
                                        )}
                                        {act.cost && <p className="text-sm font-semibold text-emerald-600 mt-0.5">💰 ${Number(act.cost).toFixed(2)}</p>}
                                      </div>
                                      <span className="material-symbols-outlined text-outline/40 ml-1 shrink-0 cursor-grab">drag_indicator</span>
                                    </div>
                                    {/* Footer: suggested by + edit/delete */}
                                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-surface-container">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                                          {(act.suggestedBy || 'U')[0].toUpperCase()}
                                        </div>
                                        <span className="text-[11px] text-outline font-medium">{act.suggestedBy || 'You'}</span>
                                      </div>
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button type="button" onClick={() => openActivityForm(act.dayId, act.globalIdx)}
                                          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Edit">
                                          <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button type="button" onClick={() => handleDeleteActivity(act.globalIdx)}
                                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors" title="Delete">
                                          <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <button type="button" onClick={() => openActivityForm(dayId)}
                              className="text-primary text-sm font-bold flex items-center gap-1.5 hover:underline py-1.5 mt-1 transition-colors">
                              <span className="material-symbols-outlined text-base">add_circle</span>
                              Add activity to {dayLabel}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Budget Estimator */}
            <div className="px-7 py-5 bg-surface-container-lowest border-t border-surface-container-low shrink-0 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Budget Estimator</p>
                  <h4 className="text-4xl font-black text-primary">${totalCost.toFixed(2)}</h4>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold text-on-surface">Total</p>
                  <p className="text-xs text-outline font-medium">{itineraryActivities.length} activit{itineraryActivities.length === 1 ? 'y' : 'ies'}</p>
                </div>
              </div>
              <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden flex shadow-inner">
                {totalCost === 0
                  ? <div className="w-full h-full bg-surface-container-high rounded-full" />
                  : budgetByType.map(t => (
                    <div key={t.label} className={`h-full ${t.color} transition-all duration-500`}
                      style={{ width: `${(t.total / totalCost) * 100}%` }} title={`${t.label}: $${t.total.toFixed(2)}`} />
                  ))}
              </div>
              {budgetByType.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
                  {budgetByType.map(t => (
                    <div key={t.label} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${t.color} inline-block shrink-0`}></span>
                      <span className="text-xs text-outline">{t.label} <span className="font-bold text-on-surface">${t.total.toFixed(0)}</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit button */}
            <div className="px-7 pb-7 pt-0 bg-surface-container-lowest shrink-0">
              <button type="submit" disabled={loading || !hasActivities}
                className={`w-full bg-gradient-to-br from-[#ffddb8] to-[#ef9900] text-[#5c3800] font-extrabold py-4 rounded-xl shadow-[0_8px_20px_-5px_rgba(239,153,0,0.5)] transition-all flex items-center justify-center gap-2 text-base ${loading || !hasActivities ? 'opacity-20 cursor-not-allowed' : 'hover:shadow-[0_12px_25px_-5px_rgba(239,153,0,0.6)] hover:-translate-y-0.5'}`}>
                <span className="material-symbols-outlined">add_task</span>
                {loading ? 'Saving...' : (isEditing ? 'Move to Trip Pact' : 'Move to Trip Pact')}
              </button>
            </div>

          </form>
        </aside>

        {/* ── MAP ── */}
        <div className="flex-1 h-full relative overflow-hidden">
          <section className="h-full relative overflow-hidden bg-surface-container-low z-0">

            {/* Search */}
            <div className="absolute top-6 right-6 z-[1000] w-full max-w-sm flex flex-col">
              <form onSubmit={handleSearch} className="relative w-full">
                <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)} onBlur={() => setIsSearchFocused(false)}
                  className={`w-full bg-white/95 backdrop-blur-xl border-none rounded-full py-4 shadow-xl focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium ${isSearchFocused ? 'pl-6 pr-14' : 'pl-14 pr-6'}`}
                  placeholder="Search hotels, restaurants, attractions..." type="text" />
                <button type="submit" className={`absolute flex items-center justify-center transition-all duration-300 top-1/2 -translate-y-1/2 ${isSearchFocused ? 'right-5' : 'left-5'}`}>
                  {isSearching
                    ? <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    : <span className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors">search</span>}
                </button>
              </form>

              {searchError && (
                <div className="mt-3 bg-red-50 text-red-600 px-4 py-3 shadow-xl rounded-xl text-sm border border-red-200">{searchError}</div>
              )}

              {searchResults.length > 0 && (
                <>
                  {/* Result count + search-this-area */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white/90 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                    </span>
                    <button type="button" onClick={handleSearchThisArea}
                      className="flex items-center gap-1.5 text-xs font-bold text-primary bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg hover:bg-primary hover:text-white transition-all border border-primary/20">
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      Search this area
                    </button>
                  </div>

                  <ul className="mt-2 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl max-h-64 overflow-auto z-[1000] border border-surface-container">
                    {searchResults.map((result, idx) => {
                      const isSelected = selectedResultIdx === idx;
                      return (
                        <li key={idx} onClick={() => handleSelectResult(result, idx)}
                          className={`px-4 py-3 cursor-pointer text-sm border-b border-surface-container/60 last:border-0 transition-all flex items-center gap-3 group ${
                            isSelected ? 'bg-primary/10 border-l-[3px] border-l-primary' : 'hover:bg-surface-container'
                          }`}>
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
                          }`}>
                            <span className="material-symbols-outlined text-[16px]">{result._icon || 'location_on'}</span>
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold truncate leading-tight ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{result.display_name.split(',')[0]}</p>
                            <p className="text-[11px] text-outline truncate mt-0.5">{result.display_name.split(',').slice(1, 3).join(',').trim()}</p>
                          </div>
                          {result.type && result.type !== 'place' && (
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 hidden sm:inline ${
                              isSelected ? 'text-blue-700 bg-blue-100' : 'text-primary/70 bg-primary/8'
                            }`}>
                              {result.type.replace(/_/g, ' ')}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <button type="button" onClick={clearSearch}
                    className="mt-2 self-center flex items-center gap-2 bg-white/90 backdrop-blur-md px-5 py-2 rounded-full shadow-lg text-sm font-semibold text-outline hover:text-red-500 hover:bg-red-50 transition-all border border-outline-variant/20">
                    <span className="material-symbols-outlined text-base">cancel</span>
                    Clear results
                  </button>
                </>
              )}
            </div>

            <MapContainer center={mapCenter} zoom={13} className="w-full h-full absolute inset-0 z-0" zoomControl={false}>
              <TileLayer url="https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=1ayBaS3Kqy7c6TCGvZYN"
                attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>' />
              <MapUpdater center={mapCenter} zoom={mapZoom} />
              <MapBoundsTracker boundsRef={mapBoundsRef} />
              <MapZoomControls setMapZoom={setMapZoom} />
              {searchResults.length > 1 && <FitBoundsToResults results={searchResults} />}
              <LocationSelector setPosition={setMarkerPos} setLabel={setMarkerLabel} setPlaceInfo={setSelectedPlaceInfo} searchResults={searchResults} />

              {/* Primary labeled marker (no search results) */}
              {markerPos && searchResults.length === 0 && <Marker position={markerPos} icon={makeLabeledIcon(markerLabel)} />}

              {/* All search result pins */}
              {searchResults.map((result, idx) => {
                const isSelected = selectedResultIdx === idx;
                return (
                  <Marker key={idx}
                    position={[parseFloat(result.lat), parseFloat(result.lon)]}
                    icon={isSelected ? makeSelectedPin(result.display_name.split(',')[0].trim()) : makeResultPin(idx + 1)}
                    zIndexOffset={isSelected ? 1000 : 0}
                    eventHandlers={{ click: () => handleSelectResult(result, idx) }}
                  />
                );
              })}
            </MapContainer>

            {/* Place overlay */}
            {selectedPlaceInfo && (
              <div className="absolute bottom-8 right-8 z-[1000] w-[44%]">
                <div className="bg-white/85 backdrop-blur-2xl p-7 rounded-2xl shadow-2xl border border-white/50 relative">
                  <button type="button" onClick={() => setSelectedPlaceInfo(null)} className="absolute top-4 right-4 text-outline hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      ))}
                      <span className="text-sm font-bold text-amber-700 ml-1">5.0</span>
                    </div>
                  </div>
                  <h2 className="font-headline font-extrabold text-2xl text-primary tracking-tight line-clamp-1">{selectedPlaceInfo.title}</h2>
                  <p className="text-on-surface-variant text-sm mt-2 line-clamp-2">{shortAddress(selectedPlaceInfo.address)}</p>
                  {selectedPlaceInfo.description && <p className="text-outline text-xs mt-1 italic">{selectedPlaceInfo.description}</p>}
                  <div className="flex gap-3 mt-5">
                    <button type="button" className="bg-surface-container-lowest text-primary font-bold px-5 py-3 rounded-xl shadow-sm border border-outline-variant/30 hover:bg-surface-container transition-all text-sm w-full">
                      View Details
                    </button>
                    <button type="button"
                      onClick={() => {
                        setActivityForm(prev => ({
                          ...prev,
                          location: selectedPlaceInfo.address,
                        }));
                        setEditIdx(null);
                        setShowActivityForm(true);
                      }}
                      className="bg-gradient-to-br from-[#1E3A8A] to-[#1e3a8a] text-white font-bold px-5 py-3 rounded-xl shadow-lg shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 text-sm w-full">
                      <span className="material-symbols-outlined text-base">add_circle</span>
                      Add to Itinerary
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      {/* ── Trip Pact Modal ── */}
      {showTripPactModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !loading && setShowTripPactModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-primary p-6 text-white shrink-0">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-3xl">handshake</span>
                  <h3 className="text-2xl font-black tracking-tight">Finalize Your Trip Pact</h3>
                </div>
                {!loading && (
                  <button onClick={() => setShowTripPactModal(false)} className="text-white/60 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
              <p className="text-white/80 text-sm font-medium">Set guidelines, visibility, and categories before creating the final plan.</p>
            </div>

            <div className="flex flex-col md:flex-row h-full overflow-hidden min-h-[500px]">
              {/* Left Side: Rules List & Entry */}
              <div className="flex-1 flex flex-col p-8 border-r border-surface-container overflow-hidden">
                <div className="mb-6 flex items-center justify-between">
                  <h4 className="text-sm font-black text-outline uppercase tracking-widest">Trip Rules & Guidelines</h4>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {form.tripPacts.length} Rules Added
                  </span>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 mb-6 pr-2 custom-scrollbar">
                  {(form.tripPacts || []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/30">
                      <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-4 text-primary opacity-20">
                        <span className="material-symbols-outlined text-5xl">gavel</span>
                      </div>
                      <p className="text-outline font-bold text-lg">No rules added yet</p>
                      <p className="text-outline/60 text-sm mt-1 max-w-[200px]">Define at least 3 rules for your travel group.</p>
                    </div>
                  ) : (
                    form.tripPacts.map((pact, idx) => (
                      <div key={idx} className="flex items-start gap-4 bg-surface-container-low p-5 rounded-2xl group border border-transparent hover:border-primary/10 transition-all hover:shadow-sm">
                        <span className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shrink-0 shadow-md shadow-primary/20">
                          {idx + 1}
                        </span>
                        <p className="text-sm font-bold text-on-surface flex-1 leading-relaxed pt-0.5">{pact}</p>
                        <button onClick={() => removePact(idx)} className="text-outline/40 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1">
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 mb-6">
                  <input value={newPact} onChange={(e) => setNewPact(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPact())}
                    placeholder="Add a rule (e.g., Share all expenses via Splitwise)..."
                    className="flex-1 bg-surface-container border-none rounded-2xl px-5 py-3.5 text-base focus:ring-2 focus:ring-primary/20 font-medium placeholder-outline/40" />
                  <button type="button" onClick={addPact} className="bg-primary text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0">
                    <span className="material-symbols-outlined text-3xl">add</span>
                  </button>
                </div>

                {/* Left Side Progress */}
                <div className="space-y-3 pt-4 border-t border-surface-container">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest px-1">
                    <div className="flex items-center gap-1.5">
                      {form.tripPacts.length >= 3 
                        ? <span className="material-symbols-outlined text-emerald-500 text-sm">check_circle</span>
                        : <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      }
                      <span className={form.tripPacts.length >= 3 ? 'text-emerald-600' : 'text-outline'}>
                        Rule Requirement
                      </span>
                    </div>
                    <span className="text-primary">{form.tripPacts.length} / 3</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden shadow-inner">
                    <div className={`h-full transition-all duration-700 ease-out ${form.tripPacts.length >= 3 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-primary'}`} 
                      style={{ width: `${Math.min(100, (form.tripPacts.length / 3) * 100)}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Right Side: Settings & Final Action */}
              <div className="w-full md:w-[380px] bg-surface-container-low/50 p-8 flex flex-col justify-between overflow-y-auto shrink-0">
                <div className="space-y-8">
                  {/* Public Toggle */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-outline uppercase tracking-widest pl-1">Visibility</h4>
                    <div className="flex flex-col gap-3 p-5 bg-white rounded-3xl shadow-sm border border-surface-container">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl transition-colors ${form.isPublic ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            <span className="material-symbols-outlined">{form.isPublic ? 'public' : 'lock'}</span>
                          </div>
                          <span className="font-bold text-on-surface">{form.isPublic ? 'Public Plan' : 'Private Plan'}</span>
                        </div>
                        <button type="button" onClick={() => setForm(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                          className={`w-14 h-7 rounded-full relative transition-all duration-300 shrink-0 ${form.isPublic ? 'bg-emerald-500' : 'bg-surface-container-high'}`}>
                          <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm ${form.isPublic ? 'translate-x-7' : ''}`}></div>
                        </button>
                      </div>
                      <p className="text-xs font-semibold text-outline leading-relaxed px-1">
                        {form.isPublic 
                          ? 'Anyone can discover and view this itinerary in the community feed.' 
                          : 'This plan is only visible to you and people you explicitly invite.'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Trip Tags */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-outline uppercase tracking-widest pl-1">Trip Type Tags</h4>
                    <div className="p-5 bg-white rounded-3xl shadow-sm border border-surface-container flex flex-col min-h-[160px]">
                       <div className="flex gap-3 mb-3 shrink-0">
                        <span className="material-symbols-outlined text-primary">sell</span>
                        <p className="text-xs font-bold text-outline uppercase tracking-widest">Categories</p>
                      </div>
                      
                      {/* Chip Container */}
                      <div className="flex flex-wrap gap-2 mb-4 max-h-[120px] overflow-y-auto">
                        {(form.tags || []).length === 0 ? (
                          <span className="text-[11px] text-outline opacity-50 italic">No tags added yet...</span>
                        ) : (
                          form.tags.map(tag => (
                            <span key={tag} className="flex items-center gap-1.5 bg-primary/5 text-primary text-[11px] font-bold px-3 py-1.5 rounded-full border border-primary/10">
                              {tag}
                              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 flex items-center">
                                <span className="material-symbols-outlined text-xs">close</span>
                              </button>
                            </span>
                          ))
                        )}
                      </div>

                      <div className="relative mt-auto">
                        <input value={newTag} onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTag();
                            }
                          }}
                          placeholder="Type tag & enter..."
                          className="w-full bg-surface-container-low border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 font-bold" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Footer */}
                <div className="mt-8">
                  <button onClick={handleFinalSubmit} disabled={form.tripPacts.length < 3 || loading}
                    className={`w-full py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl ${
                      form.tripPacts.length >= 3 
                      ? 'bg-primary text-white shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0' 
                      : 'bg-surface-container-high text-outline/30 cursor-not-allowed'
                    }`}>
                    {loading ? (
                      <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-2xl font-bold">verified_user</span>
                        Generate Itinerary
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
