import { INTERNATIONAL_WEBCAMS } from './internationalWebcams';
import { FAMELACK_INTERNATIONAL_WEBCAMS, FAMELACK_US_WEBCAMS } from './famelackWebcams';
import { LIVE_ENVIRONMENT_WEBCAMS } from './liveEnvironmentWebcams';

export type WebcamCategory =
  | 'Calle' | 'Plaza' | 'Panorámica' | 'Puerto' | 'Aeropuerto' | 'Tráfico' | 'Tren' | 'Infraestructura' | 'Parque'
  | 'Costa' | 'Naturaleza' | 'Fauna' | 'Monumento';

export interface Webcam {
  id: string;
  name: string;
  locality?: string;
  area: string;
  country: string;
  category: WebcamCategory;
  videoId?: string;
  /** Direct HLS manifest; used only while this camera is selected. */
  streamUrl?: string;
  provider: string;
  sourceUrl: string;
  attribution?: string;
  /** Approximate location of the view, not the camera installation. */
  coordinates: [number, number];
}

// Public YouTube broadcasts, verified 2026-10-20: isLiveNow=true,
// playabilityStatus=OK and playableInEmbed=true. No Data API or API key.
// Preserve the provider's player, controls and attribution.
export const SPAIN_WEBCAMS: Webcam[] = [
  {
    id: 'alcudiamar', name: 'Mallorca · Puerto de Alcúdia', area: 'Illes Balears', country: 'ES', category: 'Puerto',
    coordinates: [3.13, 39.84], videoId: 'KXXb5g5577M', provider: 'Webcam Alcudiamar',
    sourceUrl: 'https://www.alcudiamar.es/es/webcam',
  },
  {
    id: 'lanzarote-airport', name: 'Lanzarote · Aeropuerto', area: 'Canarias', country: 'ES', category: 'Aeropuerto',
    coordinates: [-13.61, 28.95], videoId: 'Snb-CD0ubEA', provider: 'WingCam',
    sourceUrl: 'https://www.youtube.com/watch?v=Snb-CD0ubEA',
    attribution: 'Este vídeo fue capturado por una cámara de seguimiento automático emitiendo en directo en el canal de YouTube de Flightradar24.',
  },
  {
    id: 'tenerife-airport', name: 'Tenerife · Aeropuerto Norte', area: 'Canarias', country: 'ES', category: 'Aeropuerto',
    coordinates: [-16.34, 28.48], videoId: 'yrx0fvj-4QI', provider: 'LanzaroteWebcam',
    sourceUrl: 'https://www.youtube.com/watch?v=yrx0fvj-4QI',
  },
];

// 257 additions from a static 2026-10-19 public directory snapshot marked live and embeddable.
// The directory status can change; locality pins are approximate and there is no runtime polling.
const CURATED_USA_WEBCAMS: Webcam[] = [
  {
    id: 'las-vegas-fremont', name: 'Las Vegas · Fremont Street', area: 'Nevada', country: 'US', category: 'Calle',
    coordinates: [-115.143, 36.17], videoId: 'ZvYvZLfPatQ', provider: 'Justin Clouse · Fremont Cam',
    sourceUrl: 'https://www.fremontcam.com/',
  },
  {
    id: 'jackson-town-square', name: 'Jackson · Town Square', area: 'Wyoming', country: 'US', category: 'Plaza',
    coordinates: [-110.762, 43.48], videoId: 'B_waF26In9o', provider: 'See Jackson Hole',
    sourceUrl: 'https://www.youtube.com/@SeeJH',
  },
  {
    id: 'new-york-brooklyn', name: 'Nueva York · Brooklyn y Manhattan', area: 'New York', country: 'US', category: 'Panorámica',
    coordinates: [-73.993, 40.698], videoId: '1kvGNR_A3DY', provider: 'St. George Tower',
    sourceUrl: 'https://www.youtube.com/@StGeorgeTower',
  },
  {
    id: 'portsmouth-market-square', name: 'Portsmouth · Market Square', area: 'New Hampshire', country: 'US', category: 'Plaza',
    coordinates: [-70.757, 43.077], videoId: 'u_Rui4z-f2A', provider: 'Boston and Maine Live · Popovers on the Square',
    sourceUrl: 'https://www.youtube.com/@BostonAndMaineLive',
  },
  {
    id: 'dover-foxcroft-main-street', name: 'Dover-Foxcroft · Main Street', area: 'Maine', country: 'US', category: 'Calle',
    coordinates: [-69.226, 45.184], videoId: 'KpabZIjvpyY', provider: 'Boston and Maine Live · Center Theatre',
    sourceUrl: 'https://www.centertheatre.org/',
  },
  {
    id: 'boston-fenway', name: 'Boston · Lansdowne Street / Fenway', area: 'Massachusetts', country: 'US', category: 'Calle',
    coordinates: [-71.099, 42.347], videoId: 'FLipW4Y3Y0s', provider: 'Boston and Maine Live · New Día Fenway',
    sourceUrl: 'https://www.youtube.com/@BostonAndMaineLive',
  },
  {
    id: "us-camera-W_UF7ZGCeXY", name: "Brown-Kopel Eng Student Achievement Center - Analytical, Innovation and Manufacturing Laboratory", locality: "Auburn", area: "Alabama", country: 'US', category: "Infraestructura",
    coordinates: [-85.49096, 32.60712], videoId: "W_UF7ZGCeXY", provider: "Auburn University Facilities Management",
    sourceUrl: "https://www.youtube.com/watch?v=W_UF7ZGCeXY",
  },
  {
    id: "us-camera-iQPgyQYfVjQ", name: "🔴 LIVE CAM: USS Alabama Battleship in Mobile, AL", locality: "Mobile", area: "Alabama", country: 'US', category: "Puerto",
    coordinates: [-88.05, 30.68], videoId: "iQPgyQYfVjQ", provider: "FOX10 News",
    sourceUrl: "https://www.youtube.com/watch?v=iQPgyQYfVjQ",
  },
  {
    id: "us-camera-5WN2PJ_Qxjs", name: "City of Auburn Toomer's Corner Webcam", locality: "Auburn", area: "Alabama", country: 'US', category: "Plaza",
    coordinates: [-85.49096, 32.60712], videoId: "5WN2PJ_Qxjs", provider: "CityofAuburnAL",
    sourceUrl: "https://www.youtube.com/watch?v=5WN2PJ_Qxjs",
  },
  {
    id: "us-camera-mNlMCr5eeXs", name: "🔴 LIVE CAM: Downtown Mobile, AL from Dauphin's Resturant", locality: "Mobile", area: "Alabama", country: 'US', category: "Panorámica",
    coordinates: [-88.05, 30.68], videoId: "mNlMCr5eeXs", provider: "FOX10 News",
    sourceUrl: "https://www.youtube.com/watch?v=mNlMCr5eeXs",
  },
  {
    id: "us-camera-QkBL9SJI8iM", name: "🔴 LIVE CAM: Bankhead Tunnel in Downtown Mobile, AL", locality: "Mobile", area: "Alabama", country: 'US', category: "Tráfico",
    coordinates: [-88.05, 30.68], videoId: "QkBL9SJI8iM", provider: "FOX10 News",
    sourceUrl: "https://www.youtube.com/watch?v=QkBL9SJI8iM",
  },
  {
    id: "us-camera-rjASdnpfONo", name: "🔴 LIVE CAM: Downtown Mobile, AL from The Admiral Hotel", locality: "Mobile", area: "Alabama", country: 'US', category: "Tráfico",
    coordinates: [-88.05, 30.68], videoId: "rjASdnpfONo", provider: "FOX10 News",
    sourceUrl: "https://www.youtube.com/watch?v=rjASdnpfONo",
  },
  {
    id: "us-camera-5YG01nZOygQ", name: "Decatur, Alabama, USA | LIVE Train Camera (Fixed View – West)", locality: "Decatur", area: "Alabama", country: 'US', category: "Tren",
    coordinates: [-86.9899, 34.57299], videoId: "5YG01nZOygQ", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=5YG01nZOygQ",
  },
  {
    id: "us-camera-KUM6HBnv_fw", name: "🔴 LIVE Trains Railcam | Birmingham, Alabama (CSX/NS Diamond)", locality: "Birmingham", area: "Alabama", country: 'US', category: "Tren",
    coordinates: [-86.79704, 33.52717], videoId: "KUM6HBnv_fw", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=KUM6HBnv_fw",
  },
  {
    id: "us-camera-8ft5kUvq27U", name: "🔴 LIVE Trains Railcam | Birmingham, Alabama (PTZ)", locality: "Birmingham", area: "Alabama", country: 'US', category: "Tren",
    coordinates: [-86.79704, 33.52717], videoId: "8ft5kUvq27U", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=8ft5kUvq27U",
  },
  {
    id: "us-camera-oSVroy5lN30", name: "🔴TN River Bridge - Bridgeport, AL", locality: "Bridgeport", area: "Alabama", country: 'US', category: "Tren",
    coordinates: [-85.72377, 34.94931], videoId: "oSVroy5lN30", provider: "Iron Rail Cams",
    sourceUrl: "https://www.youtube.com/watch?v=oSVroy5lN30",
  },
  {
    id: "us-camera-61pi8UjLOlo", name: "Lake Hood Seaplane Base, Anchorage, Alaska, USA | StreamTime LIVE", locality: "Anchorage", area: "Alaska", country: 'US', category: "Aeropuerto",
    coordinates: [-149.28433, 61.17425], videoId: "61pi8UjLOlo", provider: "StreamTime Live",
    sourceUrl: "https://www.youtube.com/watch?v=61pi8UjLOlo",
  },
  {
    id: "us-camera-WMSiw_Hyac8", name: "Anchorage, Alaska, USA | LIVE Train Camera (Fixed View – North)", locality: "Anchorage", area: "Alaska", country: 'US', category: "Tren",
    coordinates: [-149.28433, 61.17425], videoId: "WMSiw_Hyac8", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=WMSiw_Hyac8",
  },
  {
    id: "us-camera-wqyIz1eIXWs", name: "🔴LIVE 24/7 Goodyear Ballpark Plaza Cam", locality: "Goodyear", area: "Arizona", country: 'US', category: "Plaza",
    coordinates: [-112.36647, 33.25403], videoId: "wqyIz1eIXWs", provider: "City of Goodyear",
    sourceUrl: "https://www.youtube.com/watch?v=wqyIz1eIXWs",
  },
  {
    id: "us-camera-T1xu3QXxlDY", name: "Tucson Live Stream", locality: "Tucson", area: "Arizona", country: 'US', category: "Panorámica",
    coordinates: [-110.8919, 32.2069], videoId: "T1xu3QXxlDY", provider: "Tucson Live Stream",
    sourceUrl: "https://www.youtube.com/watch?v=T1xu3QXxlDY",
  },
  {
    id: "us-camera-7xdHH9KMSVk", name: "Flagstaff, Arizona, USA | LIVE Train Camera (PTZ)", locality: "Flagstaff", area: "Arizona", country: 'US', category: "Tren",
    coordinates: [-111.6505, 35.1981], videoId: "7xdHH9KMSVk", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=7xdHH9KMSVk",
  },
  {
    id: "us-camera-h8-J3JGU7g4", name: "Kingman, AZ | BNSF Seligman Sub, MP 516.5 - PTZ (Chat) | SouthWest RailCams LIVE", locality: "Kingman", area: "Arizona", country: 'US', category: "Tren",
    coordinates: [-114.01053, 35.21699], videoId: "h8-J3JGU7g4", provider: "SouthWest RailCams",
    sourceUrl: "https://www.youtube.com/watch?v=h8-J3JGU7g4",
  },
  {
    id: "us-camera-q5BQRwSh41Q", name: "Tucson, Arizona, USA | LIVE Train Camera (PTZ)", locality: "Tucson", area: "Arizona", country: 'US', category: "Tren",
    coordinates: [-110.8919, 32.2069], videoId: "q5BQRwSh41Q", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=q5BQRwSh41Q",
  },
  {
    id: "us-camera-6s1KTevqrNY", name: "Texarkana, Arkansas, USA | LIVE Train Camera (PTZ)", locality: "Texarkana", area: "Arkansas", country: 'US', category: "Tren",
    coordinates: [-93.98712, 33.43634], videoId: "6s1KTevqrNY", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=6s1KTevqrNY",
  },
  {
    id: "us-camera-t0J6D3XAVh8", name: "Auburn Airport Camera - KAUN, Auburn, CA - CTAF", locality: "Auburn", area: "California", country: 'US', category: "Aeropuerto",
    coordinates: [-121.07674, 38.89507], videoId: "t0J6D3XAVh8", provider: "Andy SixPilot",
    sourceUrl: "https://www.youtube.com/watch?v=t0J6D3XAVh8",
  },
  {
    id: "us-camera-TSISjkPA-E0", name: "🔴Live SFO Plane Spotting | Real-Time Aircraft Tracking and ATC Audio at San Francisco Airport (KSFO)", locality: "San Francisco", area: "California", country: 'US', category: "Aeropuerto",
    coordinates: [-122.375, 37.619], videoId: "TSISjkPA-E0", provider: "Luftra Aviation",
    sourceUrl: "https://www.youtube.com/watch?v=TSISjkPA-E0",
  },
  {
    id: "us-camera-_li9Rpd3Y40", name: "South Lake Tahoe Airport Live Webcam - North", locality: "South Lake Tahoe", area: "California", country: 'US', category: "Aeropuerto",
    coordinates: [-119.981, 38.92822], videoId: "_li9Rpd3Y40", provider: "SeeTahoe",
    sourceUrl: "https://www.youtube.com/watch?v=_li9Rpd3Y40",
  },
  {
    id: "us-camera-Gq1kM9PqNg4", name: "South Lake Tahoe Airport Live Webcam - South", locality: "South Lake Tahoe", area: "California", country: 'US', category: "Aeropuerto",
    coordinates: [-119.981, 38.92822], videoId: "Gq1kM9PqNg4", provider: "SeeTahoe",
    sourceUrl: "https://www.youtube.com/watch?v=Gq1kM9PqNg4",
  },
  {
    id: "us-camera-TCGyi19a6J4", name: "LIVE Catalina Island West End Overlook Cam | explore.org", locality: "Two Harbors (Catalina Island)", area: "California", country: 'US', category: "Puerto",
    coordinates: [-118.513, 33.4229], videoId: "TCGyi19a6J4", provider: "Explore Big Surf, Beaches and Sunsets",
    sourceUrl: "https://www.youtube.com/watch?v=TCGyi19a6J4",
  },
  {
    id: "us-camera-jpTWh9bKULw", name: "Morro Bay Yacht Club - See.Cam", locality: "Morro Bay", area: "California", country: 'US', category: "Puerto",
    coordinates: [-120.85862, 35.37191], videoId: "jpTWh9bKULw", provider: "SeeCam",
    sourceUrl: "https://www.youtube.com/watch?v=jpTWh9bKULw",
  },
  {
    id: "us-camera-AShvF9ILGkc", name: "City of Orange Plaza Camera", locality: "Orange", area: "California", country: 'US', category: "Plaza",
    coordinates: [-117.86127, 33.78697], videoId: "AShvF9ILGkc", provider: "City of Orange, CA",
    sourceUrl: "https://www.youtube.com/watch?v=AShvF9ILGkc",
  },
  {
    id: "us-camera-cvP_F-c2Upw", name: "The Rooftop Bar | Oceanside, CA | San Diego Web Cam", locality: "Oceanside", area: "California", country: 'US', category: "Plaza",
    coordinates: [-117.3067, 33.22471], videoId: "cvP_F-c2Upw", provider: "San Diego Web Cam",
    sourceUrl: "https://www.youtube.com/watch?v=cvP_F-c2Upw",
  },
  {
    id: "us-camera-G8RIAgPxaMc", name: "San Francisco Live Camera | 24/7 Stream", locality: "San Francisco", area: "California", country: 'US', category: "Panorámica",
    coordinates: [-122.3996, 37.7843], videoId: "G8RIAgPxaMc", provider: "ABC7 News Bay Area",
    sourceUrl: "https://www.youtube.com/watch?v=G8RIAgPxaMc",
  },
  {
    id: "us-camera-sTF-6_xinUU", name: "⭕Live Traffic Camera Feed, Car Spotting, and Police Scanner - Fresno, California", locality: "Fresno", area: "California", country: 'US', category: "Tráfico",
    coordinates: [-119.79618, 36.7827], videoId: "sTF-6_xinUU", provider: "Friant Roulette",
    sourceUrl: "https://www.youtube.com/watch?v=sTF-6_xinUU",
  },
  {
    id: "us-camera-KES0RUIXg8s", name: "Old Courthouse Square - Santa Rosa", locality: "Santa Rosa", area: "California", country: 'US', category: "Tráfico",
    coordinates: [-122.70618, 38.44582], videoId: "KES0RUIXg8s", provider: "City of Santa Rosa, California",
    sourceUrl: "https://www.youtube.com/watch?v=KES0RUIXg8s",
  },
  {
    id: "us-camera-CXYr04BWvmc", name: "San Francisco-Oakland Bay Bridge Live Camera | 24/7 Stream", locality: "San Francisco", area: "California", country: 'US', category: "Tráfico",
    coordinates: [-122.3996, 37.7843], videoId: "CXYr04BWvmc", provider: "ABC7 News Bay Area",
    sourceUrl: "https://www.youtube.com/watch?v=CXYr04BWvmc",
  },
  {
    id: "us-camera-Hsh-46qLpQE", name: "Barstow, CA | BNSF Needles Sub MP 744.5 - PTZ (Chat) | SouthWest RailCams LIVE", locality: "Barstow", area: "California", country: 'US', category: "Tren",
    coordinates: [-117.03897, 34.86929], videoId: "Hsh-46qLpQE", provider: "SouthWest RailCams",
    sourceUrl: "https://www.youtube.com/watch?v=Hsh-46qLpQE",
  },
  {
    id: "us-camera-_DUQnPjPC_8", name: "BNSF Railway Yard in Barstow, California, USA | LIVE Train Camera (PTZ)", locality: "Barstow", area: "California", country: 'US', category: "Tren",
    coordinates: [-117.03897, 34.86929], videoId: "_DUQnPjPC_8", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=_DUQnPjPC_8",
  },
  {
    id: "us-camera-sg3kp4pn9fU", name: "Needles, CA | BNSF Needles Sub, MP 578 - PTZ (Chat) | SouthWest RailCams LIVE", locality: "Needles", area: "California", country: 'US', category: "Tren",
    coordinates: [-114.62664, 34.81356], videoId: "sg3kp4pn9fU", provider: "SouthWest RailCams",
    sourceUrl: "https://www.youtube.com/watch?v=sg3kp4pn9fU",
  },
  {
    id: "us-camera--g1qAvXyIyQ", name: "San Juan Capistrano, USA | LIVE Train Camera (PTZ)", locality: "San Juan Capistrano", area: "California", country: 'US', category: "Tren",
    coordinates: [-117.65439, 33.50089], videoId: "-g1qAvXyIyQ", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=-g1qAvXyIyQ",
  },
  {
    id: "us-camera-keqeiohUVnw", name: "Tehachapi Live Train Cams at Giumarra Vineyards 🍇 in Edison CA.", locality: "Tehachapi", area: "California", country: 'US', category: "Tren",
    coordinates: [-118.44604, 35.14296], videoId: "keqeiohUVnw", provider: "Tehachapi Live Train Cams",
    sourceUrl: "https://www.youtube.com/watch?v=keqeiohUVnw",
  },
  {
    id: "us-camera-8Et9fVZld7E", name: "Downtown Telluride Live Camera", locality: "Telluride", area: "Colorado", country: 'US', category: "Calle",
    coordinates: [-107.81815, 37.94023], videoId: "8Et9fVZld7E", provider: "Alpine Lodging Telluride Youtube",
    sourceUrl: "https://www.youtube.com/watch?v=8Et9fVZld7E",
  },
  {
    id: "us-camera-2UJDLWcSADk", name: "Steamboat Square Cam", locality: "Steamboat Springs", area: "Colorado", country: 'US', category: "Plaza",
    coordinates: [-106.82292, 40.47558], videoId: "2UJDLWcSADk", provider: "Steamboat Resort",
    sourceUrl: "https://www.youtube.com/watch?v=2UJDLWcSADk",
  },
  {
    id: "us-camera-NrQRxAGQYWM", name: "Live View of Nederland, CO from Busey Brews Smokehouse & Brewery", locality: "Nederland", area: "Colorado", country: 'US', category: "Panorámica",
    coordinates: [-105.50586, 39.96381], videoId: "NrQRxAGQYWM", provider: "Boulder Flatiron Cam",
    sourceUrl: "https://www.youtube.com/watch?v=NrQRxAGQYWM",
  },
  {
    id: "us-camera-nUdVtKcprJU", name: "Big 10 Curve at Arvada, Colorado, USA | LIVE Train Camera (PTZ)", locality: "Arvada", area: "Colorado", country: 'US', category: "Tren",
    coordinates: [-105.15027, 39.83377], videoId: "nUdVtKcprJU", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=nUdVtKcprJU",
  },
  {
    id: "us-camera-MLuxiq6Uke8", name: "Colorado Model Railroad Museum, Greeley, CO, USA | Virtual Railfan LIVE !", locality: "Greeley", area: "Colorado", country: 'US', category: "Tren",
    coordinates: [-104.77289, 40.41721], videoId: "MLuxiq6Uke8", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=MLuxiq6Uke8",
  },
  {
    id: "us-camera-q2Dxx5704fQ", name: "Miami International Airport (MIA) Live Cam | Embassy Suites by Hilton Miami International Airport", locality: "Miami", area: "Florida", country: 'US', category: "Aeropuerto",
    coordinates: [-80.28, 25.79], videoId: "q2Dxx5704fQ", provider: "Ozolio Live",
    sourceUrl: "https://www.youtube.com/watch?v=q2Dxx5704fQ",
  },
  {
    id: "us-camera-BP9AtblEpXE", name: "[LIVE] Bagatelle Key West Duval Street Cam", locality: "Key West", area: "Florida", country: 'US', category: "Calle",
    coordinates: [-81.77554, 24.56506], videoId: "BP9AtblEpXE", provider: "Seek Florida Keys",
    sourceUrl: "https://www.youtube.com/watch?v=BP9AtblEpXE",
  },
  {
    id: "us-camera-lcVm-Izrpa0", name: "[LIVE] Irish Kevin's Duval Street", locality: "Key West", area: "Florida", country: 'US', category: "Calle",
    coordinates: [-81.77554, 24.56506], videoId: "lcVm-Izrpa0", provider: "Seek Florida Keys",
    sourceUrl: "https://www.youtube.com/watch?v=lcVm-Izrpa0",
  },
  {
    id: "us-camera-zAXQjQZUhB0", name: "[LIVE] Nine One Five Key West Cam", locality: "Key West", area: "Florida", country: 'US', category: "Calle",
    coordinates: [-81.77554, 24.56506], videoId: "zAXQjQZUhB0", provider: "Seek Florida Keys",
    sourceUrl: "https://www.youtube.com/watch?v=zAXQjQZUhB0",
  },
  {
    id: "us-camera-sKcmQQqzQcM", name: "🔴LIVE: Winter Garden, Florida Webcam", locality: "Winter Garden", area: "Florida", country: 'US', category: "Calle",
    coordinates: [-81.59704, 28.54122], videoId: "sKcmQQqzQcM", provider: "Winter Garden Heritage Foundation",
    sourceUrl: "https://www.youtube.com/watch?v=sKcmQQqzQcM",
  },
  {
    id: "us-camera-m2h9w_wVfCI", name: "A live view of the boat ramp in Ponce Inlet", locality: "Ponce Inlet", area: "Florida", country: 'US', category: "Puerto",
    coordinates: [-80.9299, 29.08783], videoId: "m2h9w_wVfCI", provider: "Town of Ponce Inlet",
    sourceUrl: "https://www.youtube.com/watch?v=m2h9w_wVfCI",
  },
  {
    id: "us-camera-Y5ypYTZs-7o", name: "Key West Bight Marina Live WebCam - Key West, Florida Keys", locality: "Key West", area: "Florida", country: 'US', category: "Puerto",
    coordinates: [-81.77554, 24.56506], videoId: "Y5ypYTZs-7o", provider: "FloridaKeysTV",
    sourceUrl: "https://www.youtube.com/watch?v=Y5ypYTZs-7o",
  },
  {
    id: "us-camera-8Rw-tZTeBjU", name: "🔴 LIVE Cruise Port Key West", locality: "Key West", area: "Florida", country: 'US', category: "Puerto",
    coordinates: [-81.77554, 24.56506], videoId: "8Rw-tZTeBjU", provider: "BLC Streams",
    sourceUrl: "https://www.youtube.com/watch?v=8Rw-tZTeBjU",
  },
  {
    id: "us-camera-iHJbTrQSZys", name: "LIVE - Key West Harbor Webcam from PTZtv.", locality: "Key West", area: "Florida", country: 'US', category: "Puerto",
    coordinates: [-81.77554, 24.56506], videoId: "iHJbTrQSZys", provider: "PTZtv",
    sourceUrl: "https://www.youtube.com/watch?v=iHJbTrQSZys",
  },
  {
    id: "us-camera-Wwl0slIHKXE", name: "Port Everglades Traffic Cam.02", locality: "Fort Lauderdale", area: "Florida", country: 'US', category: "Puerto",
    coordinates: [-80.12, 26.08], videoId: "Wwl0slIHKXE", provider: "Port Everglades Traffic Cam",
    sourceUrl: "https://www.youtube.com/watch?v=Wwl0slIHKXE",
  },
  {
    id: "us-camera-Lpm-C_Gz6yM", name: "Port Everglades Traffic Cam.03", locality: "Fort Lauderdale", area: "Florida", country: 'US', category: "Puerto",
    coordinates: [-80.12, 26.08], videoId: "Lpm-C_Gz6yM", provider: "Port Everglades Traffic Cam",
    sourceUrl: "https://www.youtube.com/watch?v=Lpm-C_Gz6yM",
  },
  {
    id: "us-camera-S8afSTXKkdw", name: "Vilano Boat Ramp LIVE 24/7 | St. Augustine, Florida", locality: "St. Augustine", area: "Florida", country: 'US', category: "Puerto",
    coordinates: [-81.31163, 29.89597], videoId: "S8afSTXKkdw", provider: "St. Augustine Live",
    sourceUrl: "https://www.youtube.com/watch?v=S8afSTXKkdw",
  },
  {
    id: "us-camera-EsWV4O2ishg", name: "Cinquez Dog Park - Center Cam", locality: "Jupiter", area: "Florida", country: 'US', category: "Parque",
    coordinates: [-80.11937, 26.92047], videoId: "EsWV4O2ishg", provider: "Town of Jupiter",
    sourceUrl: "https://www.youtube.com/watch?v=EsWV4O2ishg",
  },
  {
    id: "us-camera-ElTwWE430jU", name: "Cinquez Dog Park - East Cam", locality: "Jupiter", area: "Florida", country: 'US', category: "Parque",
    coordinates: [-80.11937, 26.92047], videoId: "ElTwWE430jU", provider: "Town of Jupiter",
    sourceUrl: "https://www.youtube.com/watch?v=ElTwWE430jU",
  },
  {
    id: "us-camera-r5Y9tlij_TQ", name: "Ponce Inlet Boat Ramp Parking Lot Camera 1", locality: "Ponce Inlet", area: "Florida", country: 'US', category: "Tráfico",
    coordinates: [-80.9299, 29.08783], videoId: "r5Y9tlij_TQ", provider: "Town of Ponce Inlet",
    sourceUrl: "https://www.youtube.com/watch?v=r5Y9tlij_TQ",
  },
  {
    id: "us-camera-yLutXUkuHBI", name: "Ponce Inlet Boat Ramp Parking Lot Camera 2", locality: "Ponce Inlet", area: "Florida", country: 'US', category: "Tráfico",
    coordinates: [-80.9299, 29.08783], videoId: "yLutXUkuHBI", provider: "Town of Ponce Inlet",
    sourceUrl: "https://www.youtube.com/watch?v=yLutXUkuHBI",
  },
  {
    id: "us-camera-_tam0-UVAcY", name: "Ft. Lauderdale Axis Experience Center LIVE", locality: "Fort Lauderdale", area: "Florida", country: 'US', category: "Panorámica",
    coordinates: [-80.1418, 26.1361], videoId: "_tam0-UVAcY", provider: "CamStreamer",
    sourceUrl: "https://www.youtube.com/watch?v=_tam0-UVAcY",
  },
  {
    id: "us-camera-pXx3YQVSUGg", name: "LIVE - Fort Lauderdale Beach", locality: "Fort Lauderdale", area: "Florida", country: 'US', category: "Panorámica",
    coordinates: [-80.1418, 26.1361], videoId: "pXx3YQVSUGg", provider: "PTZtv",
    sourceUrl: "https://www.youtube.com/watch?v=pXx3YQVSUGg",
  },
  {
    id: "us-camera-sQH2EGuPT6E", name: "Miami 4K Aerial 🇺🇸 🚤 Luxury Yachts, Skyline Views & Deep House Paradise", locality: "Miami", area: "Florida", country: 'US', category: "Panorámica",
    coordinates: [-80.20861, 25.77516], videoId: "sQH2EGuPT6E", provider: "Deep Tides",
    sourceUrl: "https://www.youtube.com/watch?v=sQH2EGuPT6E",
  },
  {
    id: "us-camera-67-73mgWDf0", name: "Port Everglades Traffic Cam.01", locality: "Fort Lauderdale", area: "Florida", country: 'US', category: "Tráfico",
    coordinates: [-80.12, 26.08], videoId: "67-73mgWDf0", provider: "Port Everglades Traffic Cam",
    sourceUrl: "https://www.youtube.com/watch?v=67-73mgWDf0",
  },
  {
    id: "us-camera-IVSoVgGXDoU", name: "Plant City, Florida, USA | LIVE Train Camera (PTZ)", locality: "Plant City", area: "Florida", country: 'US', category: "Tren",
    coordinates: [-82.11677, 28.01568], videoId: "IVSoVgGXDoU", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=IVSoVgGXDoU",
  },
  {
    id: "us-camera-ITR6OmVukhc", name: "ATL Axis Experience Center Live Stream", locality: "Atlanta", area: "Georgia", country: 'US', category: "Panorámica",
    coordinates: [-84.42267, 33.76291], videoId: "ITR6OmVukhc", provider: "FLL AEC",
    sourceUrl: "https://www.youtube.com/watch?v=ITR6OmVukhc",
  },
  {
    id: "us-camera-7k7RTdANPqM", name: "ATL Axis Experience Center Live Stream", locality: "Atlanta", area: "Georgia", country: 'US', category: "Panorámica",
    coordinates: [-84.42267, 33.76291], videoId: "7k7RTdANPqM", provider: "CamStreamer",
    sourceUrl: "https://www.youtube.com/watch?v=7k7RTdANPqM",
  },
  {
    id: "us-camera-Ux0rtJXPPQ0", name: "Austell, Georgia, USA | LIVE Train Camera (PTZ)", locality: "Austell", area: "Georgia", country: 'US', category: "Tren",
    coordinates: [-84.64377, 33.81977], videoId: "Ux0rtJXPPQ0", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=Ux0rtJXPPQ0",
  },
  {
    id: "us-camera-ll3X1mH_g9Q", name: "Cordele, Georgia, USA | LIVE Train Camera (Fixed View – Diamond)", locality: "Cordele", area: "Georgia", country: 'US', category: "Tren",
    coordinates: [-83.77008, 31.95609], videoId: "ll3X1mH_g9Q", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=ll3X1mH_g9Q",
  },
  {
    id: "us-camera-Sj-TMZX_4_s", name: "Cordele, Georgia, USA | LIVE Train Camera (PTZ)", locality: "Cordele", area: "Georgia", country: 'US', category: "Tren",
    coordinates: [-83.77008, 31.95609], videoId: "Sj-TMZX_4_s", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=Sj-TMZX_4_s",
  },
  {
    id: "us-camera-QwbkUOoiTKs", name: "Cornelia, GA | NS Greenville District MP 559.9 | SouthWest RailCams LIVE", locality: "Cornelia", area: "Georgia", country: 'US', category: "Tren",
    coordinates: [-83.53013, 34.5171], videoId: "QwbkUOoiTKs", provider: "SouthWest RailCams",
    sourceUrl: "https://www.youtube.com/watch?v=QwbkUOoiTKs",
  },
  {
    id: "us-camera-FHYqepozgiQ", name: "Folkston, Georgia, USA | LIVE Train Camera (Depot PTZ)", locality: "Folkston", area: "Georgia", country: 'US', category: "Tren",
    coordinates: [-82.00734, 30.83907], videoId: "FHYqepozgiQ", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=FHYqepozgiQ",
  },
  {
    id: "us-camera-1AOrlYblQR8", name: "Jesup, Georgia, USA | LIVE Train Camera | Virtual Railfan (PTZ)", locality: "Jesup", area: "Georgia", country: 'US', category: "Tren",
    coordinates: [-81.8957, 31.59457], videoId: "1AOrlYblQR8", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=1AOrlYblQR8",
  },
  {
    id: "us-camera-bCIIn4c5LrM", name: "Waycross, Georgia, USA | LIVE Train Camera (PTZ)", locality: "Waycross", area: "Georgia", country: 'US', category: "Tren",
    coordinates: [-82.35766, 31.21101], videoId: "bCIIn4c5LrM", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=bCIIn4c5LrM",
  },
  {
    id: "us-camera-o4fKtgPVpoU", name: "Dornan's in Grand Teton National Park - SeeJH.com", locality: "Teton", area: "Idaho", country: 'US', category: "Parque",
    coordinates: [-110.7139, 43.6558], videoId: "o4fKtgPVpoU", provider: "See Jackson Hole",
    sourceUrl: "https://www.youtube.com/watch?v=o4fKtgPVpoU",
  },
  {
    id: "us-camera-EiUyBIcG4fQ", name: "EarthCam Live: Midway Airport (Chicago, IL)", locality: "Chicago", area: "Illinois", country: 'US', category: "Aeropuerto",
    coordinates: [-87.6352, 41.848], videoId: "EiUyBIcG4fQ", provider: "EarthCam",
    sourceUrl: "https://www.youtube.com/watch?v=EiUyBIcG4fQ",
  },
  {
    id: "us-camera-67BCsiW-1Io", name: "Midway Airport | Chicago, IL USA | StreamTime LIVE 4K", locality: "Chicago", area: "Illinois", country: 'US', category: "Aeropuerto",
    coordinates: [-87.6352, 41.848], videoId: "67BCsiW-1Io", provider: "StreamTime Live",
    sourceUrl: "https://www.youtube.com/watch?v=67BCsiW-1Io",
  },
  {
    id: "us-camera-dmEq_ddk0kw", name: "Live Stream - Construction Hotel Chicago", locality: "Chicago", area: "Illinois", country: 'US', category: "Infraestructura",
    coordinates: [-87.6352, 41.848], videoId: "dmEq_ddk0kw", provider: "WestCord Hotels",
    sourceUrl: "https://www.youtube.com/watch?v=dmEq_ddk0kw",
  },
  {
    id: "us-camera-O0UGT7AT3aw", name: "EarthCam Live: Chicago Skydeck Cam (Chicago, IL)", locality: "Chicago", area: "Illinois", country: 'US', category: "Panorámica",
    coordinates: [-87.6352, 41.848], videoId: "O0UGT7AT3aw", provider: "EarthCam",
    sourceUrl: "https://www.youtube.com/watch?v=O0UGT7AT3aw",
  },
  {
    id: "us-camera-auWahQLydIk", name: "Village of Tilton Rt1 & Ramp Road", locality: "Tilton", area: "Illinois", country: 'US', category: "Tráfico",
    coordinates: [-87.64215, 40.09498], videoId: "auWahQLydIk", provider: "Village of Tilton Traffic Camera",
    sourceUrl: "https://www.youtube.com/watch?v=auWahQLydIk",
  },
  {
    id: "us-camera-grl50cJ7Fq0", name: "Chicago & North Western Power House Live Webcam (CTA) - Chicago, IL #SteelHighway", locality: "Chicago", area: "Illinois", country: 'US', category: "Tren",
    coordinates: [-87.6352, 41.848], videoId: "grl50cJ7Fq0", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=grl50cJ7Fq0",
  },
  {
    id: "us-camera-6M6rK0ssjYg", name: "Chicago & North Western Power House Live Webcam (East) - Chicago, IL #SteelHighway", locality: "Chicago", area: "Illinois", country: 'US', category: "Tren",
    coordinates: [-87.6352, 41.848], videoId: "6M6rK0ssjYg", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=6M6rK0ssjYg",
  },
  {
    id: "us-camera-InQ0-b4DkCw", name: "Chicago & North Western Power House Live Webcam (North) - Chicago, IL #SteelHighway", locality: "Chicago", area: "Illinois", country: 'US', category: "Tren",
    coordinates: [-87.6352, 41.848], videoId: "InQ0-b4DkCw", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=InQ0-b4DkCw",
  },
  {
    id: "us-camera-QFeaOHhvZ3U", name: "East Dubuque Live Railcam - East Dubuque, IL #SteelHighway", locality: "East Dubuque", area: "Illinois", country: 'US', category: "Tren",
    coordinates: [-90.62424, 42.48834], videoId: "QFeaOHhvZ3U", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=QFeaOHhvZ3U",
  },
  {
    id: "us-camera-On1MRt0NqFs", name: "Galesburg, Illinois, USA | LIVE Train Camera (PTZ)", locality: "Galesburg", area: "Illinois", country: 'US', category: "Tren",
    coordinates: [-90.37656, 40.95022], videoId: "On1MRt0NqFs", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=On1MRt0NqFs",
  },
  {
    id: "us-camera-GKjSoXuZ0hU", name: "🔴 LIVE Trains Railcam | Blue Island, Illinois PTZ", locality: "Blue Island", area: "Illinois", country: 'US', category: "Tren",
    coordinates: [-87.68113, 41.65757], videoId: "GKjSoXuZ0hU", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=GKjSoXuZ0hU",
  },
  {
    id: "us-camera-RDxBH2S1hxs", name: "🔴 LIVE Trains Railcam | Blue Island, Illinois (South Cam)", locality: "Blue Island", area: "Illinois", country: 'US', category: "Tren",
    coordinates: [-87.68113, 41.65757], videoId: "RDxBH2S1hxs", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=RDxBH2S1hxs",
  },
  {
    id: "us-camera-4rsRk0MyC4g", name: "Otto's Tavern LIVE Railcam - Lombard, IL", locality: "Lombard", area: "Illinois", country: 'US', category: "Tren",
    coordinates: [-88.01549, 41.87384], videoId: "4rsRk0MyC4g", provider: "Tavern League Of Railfans",
    sourceUrl: "https://www.youtube.com/watch?v=4rsRk0MyC4g",
  },
  {
    id: "us-camera-a__yfG4PnxY", name: "Quincy, Illinois, USA | LIVE Train Camera (Fixed View – East)", locality: "Quincy", area: "Illinois", country: 'US', category: "Tren",
    coordinates: [-91.3793, 39.93368], videoId: "a__yfG4PnxY", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=a__yfG4PnxY",
  },
  {
    id: "us-camera-LhNpn9L5ndM", name: "Rochelle, Illinois, USA | LIVE Train Camera (PTZ)", locality: "Rochelle", area: "Illinois", country: 'US', category: "Tren",
    coordinates: [-89.06226, 41.91978], videoId: "LhNpn9L5ndM", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=LhNpn9L5ndM",
  },
  {
    id: "us-camera-KujkE2C43BU", name: "Dyer, IN - Weather Camera", locality: "Dyer", area: "Indiana", country: 'US', category: "Panorámica",
    coordinates: [-87.50901, 41.4978], videoId: "KujkE2C43BU", provider: "Indiana Weather Network",
    sourceUrl: "https://www.youtube.com/watch?v=KujkE2C43BU",
  },
  {
    id: "us-camera-BDb_sSL-K5k", name: "Chesterton, Indiana, USA | LIVE Train Camera (Fixed View – East)", locality: "Chesterton", area: "Indiana", country: 'US', category: "Tren",
    coordinates: [-87.055, 41.59982], videoId: "BDb_sSL-K5k", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=BDb_sSL-K5k",
  },
  {
    id: "us-camera-YR1PdWaSxgk", name: "Elkhart, Indiana, USA | LIVE Train Camera (PTZ)", locality: "Elkhart", area: "Indiana", country: 'US', category: "Tren",
    coordinates: [-85.95543, 41.69521], videoId: "YR1PdWaSxgk", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=YR1PdWaSxgk",
  },
  {
    id: "us-camera-jRvnO7D-FpA", name: "Princeton, Indiana, USA | LIVE Train Camera (Fixed View – South)", locality: "Princeton", area: "Indiana", country: 'US', category: "Tren",
    coordinates: [-87.58694, 38.35315], videoId: "jRvnO7D-FpA", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=jRvnO7D-FpA",
  },
  {
    id: "us-camera-VEzUlucGSDI", name: "Clarence Sundstop Live Railcam - Clarence, Iowa #SteelHighway", locality: "Clarence", area: "Iowa", country: 'US', category: "Tren",
    coordinates: [-91.05792, 41.88575], videoId: "VEzUlucGSDI", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=VEzUlucGSDI",
  },
  {
    id: "us-camera-L6eG4ahJc_Q", name: "Fort Madison, Iowa, USA | LIVE Train Camera (PTZ)", locality: "Fort Madison", area: "Iowa", country: 'US', category: "Tren",
    coordinates: [-91.34626, 40.62146], videoId: "L6eG4ahJc_Q", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=L6eG4ahJc_Q",
  },
  {
    id: "us-camera-2raya-ESaig", name: "Mount Pleasant Coffee Depot Live Railcam (Downtown) - Mt Pleasant, IA #SteelHighway", locality: "Mount Pleasant", area: "Iowa", country: 'US', category: "Tren",
    coordinates: [-91.54716, 40.9622], videoId: "2raya-ESaig", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=2raya-ESaig",
  },
  {
    id: "us-camera-jld8d8xgMbc", name: "Muscatine Merrill Hotel Live Railcam - Muscatine, IA #SteelHighway", locality: "Muscatine", area: "Iowa", country: 'US', category: "Tren",
    coordinates: [-91.06729, 41.41936], videoId: "jld8d8xgMbc", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=jld8d8xgMbc",
  },
  {
    id: "us-camera-qZ3c9t3oKYo", name: "Ottumwa Main Street Donuts Live Railcam (BNSF) - Ottumwa, IA #SteelHighway", locality: "Ottumwa", area: "Iowa", country: 'US', category: "Tren",
    coordinates: [-92.42326, 41.02225], videoId: "qZ3c9t3oKYo", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=qZ3c9t3oKYo",
  },
  {
    id: "us-camera-9e2vtFJk73E", name: "Washington Depot Live Railcam - Washington, IA #SteelHighway", locality: "Washington", area: "Iowa", country: 'US', category: "Tren",
    coordinates: [-91.69367, 41.29791], videoId: "9e2vtFJk73E", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=9e2vtFJk73E",
  },
  {
    id: "us-camera-mYXToi9g62c", name: "Woodbine Main Street Live Railcam - Woodbine, IA #steelhighway", locality: "Woodbine", area: "Iowa", country: 'US', category: "Tren",
    coordinates: [-95.71106, 41.73634], videoId: "mYXToi9g62c", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=mYXToi9g62c",
  },
  {
    id: "us-camera-tRXZ-T3nBj8", name: "Wichita State University - Crossland Stadium Construction Camera", locality: "Wichita", area: "Kansas", country: 'US', category: "Infraestructura",
    coordinates: [-97.3277, 37.6763], videoId: "tRXZ-T3nBj8", provider: "WSUTV",
    sourceUrl: "https://www.youtube.com/watch?v=tRXZ-T3nBj8",
  },
  {
    id: "us-camera-iN7u2jKbDm0", name: "Wichita, Kansas, USA | LIVE Train Camera (PTZ)", locality: "Wichita", area: "Kansas", country: 'US', category: "Tren",
    coordinates: [-97.3277, 37.6763], videoId: "iN7u2jKbDm0", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=iN7u2jKbDm0",
  },
  {
    id: "us-camera-OtssjZ3hdX0", name: "La Grange, Kentucky, USA | LIVE Railcam Camera (Observation Platform PTZ)", locality: "La Grange", area: "Kentucky", country: 'US', category: "Tren",
    coordinates: [-85.3768, 38.39725], videoId: "OtssjZ3hdX0", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=OtssjZ3hdX0",
  },
  {
    id: "us-camera-9SLt3AT0rXk", name: "Trains in the Street at La Grange, Kentucky, USA | LIVE Train Camera (PTZ)", locality: "La Grange", area: "Kentucky", country: 'US', category: "Tren",
    coordinates: [-85.3768, 38.39725], videoId: "9SLt3AT0rXk", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=9SLt3AT0rXk",
  },
  {
    id: "us-camera-iZRbml7fnXI", name: "FR24 - MSY New Orleans LIVE 24/7✈️", locality: "New Orleans", area: "Louisiana", country: 'US', category: "Aeropuerto",
    coordinates: [-90.0884, 29.9689], videoId: "iZRbml7fnXI", provider: "Flightradar24",
    sourceUrl: "https://www.youtube.com/watch?v=iZRbml7fnXI",
  },
  {
    id: "us-camera-1o39CobYA7Y", name: "Greenville, Maine - Airport Cam Live", locality: "Greenville", area: "Maine", country: 'US', category: "Aeropuerto",
    coordinates: [-69.57803, 45.46618], videoId: "1o39CobYA7Y", provider: "Boston and Maine Live",
    sourceUrl: "https://www.youtube.com/watch?v=1o39CobYA7Y",
  },
  {
    id: "us-camera-RH9wCBhxkxM", name: "Bar Harbor, Maine - North View - Bar Harbor Inn", locality: "Bar Harbor", area: "Maine", country: 'US', category: "Puerto",
    coordinates: [-68.21113, 44.38131], videoId: "RH9wCBhxkxM", provider: "Boston and Maine Live",
    sourceUrl: "https://www.youtube.com/watch?v=RH9wCBhxkxM",
  },
  {
    id: "us-camera-OteVW3af3BU", name: "Bar Harbor, Maine - West View - Bar Harbor Inn", locality: "Bar Harbor", area: "Maine", country: 'US', category: "Puerto",
    coordinates: [-68.21113, 44.38131], videoId: "OteVW3af3BU", provider: "Boston and Maine Live",
    sourceUrl: "https://www.youtube.com/watch?v=OteVW3af3BU",
  },
  {
    id: "us-camera-t_VfYNtprYE", name: "Baltimore Shipping Channel | Baltimore, MD USA | StreamTime LIVE in 4K", locality: "Baltimore", area: "Maryland", country: 'US', category: "Puerto",
    coordinates: [-76.61052, 39.30006], videoId: "t_VfYNtprYE", provider: "StreamTime Live",
    sourceUrl: "https://www.youtube.com/watch?v=t_VfYNtprYE",
  },
  {
    id: "us-camera-lfEj-ab7rgM", name: "Spicer Bros. Camera At Salisbury University", locality: "Salisbury", area: "Maryland", country: 'US', category: "Plaza",
    coordinates: [-75.58656, 38.3752], videoId: "lfEj-ab7rgM", provider: "Salisbury University Cam Live Stream",
    sourceUrl: "https://www.youtube.com/watch?v=lfEj-ab7rgM",
  },
  {
    id: "us-camera-cR3kSHm7Ts0", name: "CSX Mainline in Cumberland, Maryland, USA | LIVE Train Camera (PTZ – South)", locality: "Cumberland", area: "Maryland", country: 'US', category: "Tren",
    coordinates: [-78.75795, 39.65174], videoId: "cR3kSHm7Ts0", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=cR3kSHm7Ts0",
  },
  {
    id: "us-camera-LqPsNV_b-uc", name: "Cumberland, Maryland, USA | LIVE Train Camera (PTZ — Downtown) Feat. Western Maryland Scenic 1309!", locality: "Cumberland", area: "Maryland", country: 'US', category: "Tren",
    coordinates: [-78.75795, 39.65174], videoId: "LqPsNV_b-uc", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=LqPsNV_b-uc",
  },
  {
    id: "us-camera-f5D4lPET76s", name: "Turners Falls, Massachusetts - Municipal Airport Live Cam", locality: "Turners Falls", area: "Massachusetts", country: 'US', category: "Aeropuerto",
    coordinates: [-72.5565, 42.59667], videoId: "f5D4lPET76s", provider: "Boston and Maine Live",
    sourceUrl: "https://www.youtube.com/watch?v=f5D4lPET76s",
  },
  {
    id: "us-camera-CHd0z44hTQc", name: "🟢 GOMV.COM Vineyard Haven Downtown Live Webcam", locality: "Vineyard Haven", area: "Massachusetts", country: 'US', category: "Calle",
    coordinates: [-70.60746, 41.45718], videoId: "CHd0z44hTQc", provider: "Go Martha's Vineyard",
    sourceUrl: "https://www.youtube.com/watch?v=CHd0z44hTQc",
  },
  {
    id: "us-camera-WkjZg22TBfQ", name: "State Street South Live Cam - Newburyport Live Stream", locality: "Newburyport", area: "Massachusetts", country: 'US', category: "Calle",
    coordinates: [-70.88661, 42.81229], videoId: "WkjZg22TBfQ", provider: "Newburyport.com",
    sourceUrl: "https://www.youtube.com/watch?v=WkjZg22TBfQ",
  },
  {
    id: "us-camera-FoAvYeGRjU4", name: "🟢 GOMV.COM Martha's Vineyard Edgartown Harbor & Lighthouse Webcam", locality: "Edgartown", area: "Massachusetts", country: 'US', category: "Puerto",
    coordinates: [-70.51967, 41.38991], videoId: "FoAvYeGRjU4", provider: "Go Martha's Vineyard",
    sourceUrl: "https://www.youtube.com/watch?v=FoAvYeGRjU4",
  },
  {
    id: "us-camera-TE6N2eDrsR0", name: "🟢 GOMV.COM Woods Hole Ferry Dock & Harbor Webcam", locality: "Woods Hole", area: "Massachusetts", country: 'US', category: "Puerto",
    coordinates: [-70.66648, 41.52869], videoId: "TE6N2eDrsR0", provider: "Go Martha's Vineyard",
    sourceUrl: "https://www.youtube.com/watch?v=TE6N2eDrsR0",
  },
  {
    id: "us-camera-5-ClAzUV2UA", name: "🟢 GOMV.COM Woods Hole Harbor & MV Ferry Live Webcam", locality: "Woods Hole", area: "Massachusetts", country: 'US', category: "Puerto",
    coordinates: [-70.66648, 41.52869], videoId: "5-ClAzUV2UA", provider: "Go Martha's Vineyard",
    sourceUrl: "https://www.youtube.com/watch?v=5-ClAzUV2UA",
  },
  {
    id: "us-camera-JHEmvHrNfJg", name: "Westfield, Massachusetts US - Park Square Live", locality: "Westfield", area: "Massachusetts", country: 'US', category: "Plaza",
    coordinates: [-72.75591, 42.13884], videoId: "JHEmvHrNfJg", provider: "Boston and Maine Live",
    sourceUrl: "https://www.youtube.com/watch?v=JHEmvHrNfJg",
  },
  {
    id: "us-camera-exkU6Rjn0vM", name: "Boston Weather Cam, MA Live Cam - Green Line", locality: "Boston", area: "Massachusetts", country: 'US', category: "Tren",
    coordinates: [-71.01351, 42.33273], videoId: "exkU6Rjn0vM", provider: "Boston and Maine Live",
    sourceUrl: "https://www.youtube.com/watch?v=exkU6Rjn0vM",
  },
  {
    id: "us-camera-mwZwcV0Enm4", name: "LIVE Ayer, MA Railcam | Railside Live", locality: "Ayer", area: "Massachusetts", country: 'US', category: "Tren",
    coordinates: [-71.58484, 42.56222], videoId: "mwZwcV0Enm4", provider: "Railside Live",
    sourceUrl: "https://www.youtube.com/watch?v=mwZwcV0Enm4",
  },
  {
    id: "us-camera-8U0M_mionOs", name: "Springfield, Massachusetts, USA | LIVE Train Camera (PTZ)", locality: "Springfield", area: "Massachusetts", country: 'US', category: "Tren",
    coordinates: [-72.53998, 42.11545], videoId: "8U0M_mionOs", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=8U0M_mionOs",
  },
  {
    id: "us-camera-e3AB9nAhqjA", name: "Westfield, Massachusetts USA - LIVE Railfan Cam", locality: "Westfield", area: "Massachusetts", country: 'US', category: "Tren",
    coordinates: [-72.75591, 42.13884], videoId: "e3AB9nAhqjA", provider: "Boston and Maine Live",
    sourceUrl: "https://www.youtube.com/watch?v=e3AB9nAhqjA",
  },
  {
    id: "us-camera-6WZcy07GsGc", name: "City of Bangor MI - Downtown Live Stream", locality: "Bangor", area: "Michigan", country: 'US', category: "Calle",
    coordinates: [-86.11344, 42.31243], videoId: "6WZcy07GsGc", provider: "Official City of Bangor, MI",
    sourceUrl: "https://www.youtube.com/watch?v=6WZcy07GsGc",
  },
  {
    id: "us-camera-yJefbf6d2Vk", name: "Rotary Park", locality: "Coldwater", area: "Michigan", country: 'US', category: "Infraestructura",
    coordinates: [-84.9993, 41.94601], videoId: "yJefbf6d2Vk", provider: "City of Coldwater MI",
    sourceUrl: "https://www.youtube.com/watch?v=yJefbf6d2Vk",
  },
  {
    id: "us-camera-cTL6RHF3WDs", name: "LIVE | Alpena, MI | Thunder Bay Harbor Camera |", locality: "Alpena", area: "Michigan", country: 'US', category: "Puerto",
    coordinates: [-83.44293, 45.07403], videoId: "cTL6RHF3WDs", provider: "105.7 The Bird",
    sourceUrl: "https://www.youtube.com/watch?v=cTL6RHF3WDs",
  },
  {
    id: "us-camera-FS9Iz-EJW5Y", name: "LIVE | Alpena, MI | Thunder Bay Marina Camera", locality: "Alpena", area: "Michigan", country: 'US', category: "Puerto",
    coordinates: [-83.44293, 45.07403], videoId: "FS9Iz-EJW5Y", provider: "Radio Centre",
    sourceUrl: "https://www.youtube.com/watch?v=FS9Iz-EJW5Y",
  },
  {
    id: "us-camera-AwP_Q6IGwFs", name: "Port Huron, Michigan USA | StreamTime LIVE", locality: "Port Huron", area: "Michigan", country: 'US', category: "Puerto",
    coordinates: [-82.43374, 42.99377], videoId: "AwP_Q6IGwFs", provider: "StreamTime Live",
    sourceUrl: "https://www.youtube.com/watch?v=AwP_Q6IGwFs",
  },
  {
    id: "us-camera-TkY4BzCikQ4", name: "Soo Locks, Sault Ste Marie, Michigan USA | Streamtime LIVE", locality: "Sault Ste. Marie", area: "Michigan", country: 'US', category: "Puerto",
    coordinates: [-84.3453, 46.4953], videoId: "TkY4BzCikQ4", provider: "StreamTime Live",
    sourceUrl: "https://www.youtube.com/watch?v=TkY4BzCikQ4",
  },
  {
    id: "us-camera--dgI51xRej8", name: "Albertson Hall Construction Camera #2", locality: "Houghton", area: "Michigan", country: 'US', category: "Plaza",
    coordinates: [-88.56724, 47.11175], videoId: "-dgI51xRej8", provider: "Albertson Hall Construction Camera",
    sourceUrl: "https://www.youtube.com/watch?v=-dgI51xRej8",
  },
  {
    id: "us-camera-8-V9uEqFLwE", name: "LIVE | Traverse City, MI | Downtown Camera |", locality: "Traverse City", area: "Michigan", country: 'US', category: "Tráfico",
    coordinates: [-85.60301, 44.75431], videoId: "8-V9uEqFLwE", provider: "Radio Centre",
    sourceUrl: "https://www.youtube.com/watch?v=8-V9uEqFLwE",
  },
  {
    id: "us-camera-fTkOmPbSXBg", name: "Battle Creek, Michigan, USA | LIVE Train Camera (Fixed View — East)", locality: "Battle Creek", area: "Michigan", country: 'US', category: "Tren",
    coordinates: [-85.22927, 42.29918], videoId: "fTkOmPbSXBg", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=fTkOmPbSXBg",
  },
  {
    id: "us-camera-EbVlhVeD3jA", name: "Bayfront Cam", locality: "Duluth", area: "Minnesota", country: 'US', category: "Puerto",
    coordinates: [-92.13414, 46.77446], videoId: "EbVlhVeD3jA", provider: "Duluth Harbor Cam",
    sourceUrl: "https://www.youtube.com/watch?v=EbVlhVeD3jA",
  },
  {
    id: "us-camera-HPS48TMmNag", name: "Duluth Canal Cam", locality: "Duluth", area: "Minnesota", country: 'US', category: "Puerto",
    coordinates: [-92.13414, 46.77446], videoId: "HPS48TMmNag", provider: "Duluth Harbor Cam",
    sourceUrl: "https://www.youtube.com/watch?v=HPS48TMmNag",
  },
  {
    id: "us-camera-H6cm5Hf-yFY", name: "Duluth Ship Cam at Canal Park ⚓️", locality: "Duluth", area: "Minnesota", country: 'US', category: "Puerto",
    coordinates: [-92.13414, 46.77446], videoId: "H6cm5Hf-yFY", provider: "Vibe with Mike ⚓️",
    sourceUrl: "https://www.youtube.com/watch?v=H6cm5Hf-yFY",
  },
  {
    id: "us-camera-n0H5FkWkjjs", name: "Grand Marais, Minnesota Harbor Cam Live Stream", locality: "Grand Marais", area: "Minnesota", country: 'US', category: "Puerto",
    coordinates: [-90.34432, 47.75856], videoId: "n0H5FkWkjjs", provider: "Visit Cook County MN",
    sourceUrl: "https://www.youtube.com/watch?v=n0H5FkWkjjs",
  },
  {
    id: "us-camera-zTVWJ3Mc0Ag", name: "Silver Bay Marina", locality: "Silver Bay", area: "Minnesota", country: 'US', category: "Puerto",
    coordinates: [-91.27681, 47.29331], videoId: "zTVWJ3Mc0Ag", provider: "Duluth Harbor Cam",
    sourceUrl: "https://www.youtube.com/watch?v=zTVWJ3Mc0Ag",
  },
  {
    id: "us-camera-sThx7mQM3Uc", name: "Two Harbors Boat Launch", locality: "Two Harbors", area: "Minnesota", country: 'US', category: "Puerto",
    coordinates: [-91.67574, 47.02995], videoId: "sThx7mQM3Uc", provider: "Duluth Harbor Cam",
    sourceUrl: "https://www.youtube.com/watch?v=sThx7mQM3Uc",
  },
  {
    id: "us-camera-2yx7RKxpyzQ", name: "Two Harbors Overlook powered by EXPLORE.org", locality: "Two Harbors", area: "Minnesota", country: 'US', category: "Puerto",
    coordinates: [-91.67574, 47.02995], videoId: "2yx7RKxpyzQ", provider: "Explore Eagle Nest Cams",
    sourceUrl: "https://www.youtube.com/watch?v=2yx7RKxpyzQ",
  },
  {
    id: "us-camera-SBElcRmgVjw", name: "Western Harborcam", locality: "Duluth", area: "Minnesota", country: 'US', category: "Puerto",
    coordinates: [-92.13414, 46.77446], videoId: "SBElcRmgVjw", provider: "Duluth Harbor Cam",
    sourceUrl: "https://www.youtube.com/watch?v=SBElcRmgVjw",
  },
  {
    id: "us-camera-DzJb26edNjs", name: "Duluth Hillside Cam", locality: "Duluth", area: "Minnesota", country: 'US', category: "Panorámica",
    coordinates: [-92.13414, 46.77446], videoId: "DzJb26edNjs", provider: "Duluth Harbor Cam",
    sourceUrl: "https://www.youtube.com/watch?v=DzJb26edNjs",
  },
  {
    id: "us-camera-u5dt2mHDuxQ", name: "St. Paul, Minnesota, USA | LIVE Train Camera (Fixed View – East)", locality: "St. Paul", area: "Minnesota", country: 'US', category: "Tren",
    coordinates: [-93.10403, 44.94891], videoId: "u5dt2mHDuxQ", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=u5dt2mHDuxQ",
  },
  {
    id: "us-camera-9eqVB3JbJHc", name: "Saint Louis, Missouri, USA | LIVE Train Camera (PTZ - West)", locality: "St. Louis", area: "Missouri", country: 'US', category: "Tráfico",
    coordinates: [-90.24458, 38.6357], videoId: "9eqVB3JbJHc", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=9eqVB3JbJHc",
  },
  {
    id: "us-camera-9fzUjSTK5F8", name: "EarthCam Live: Kansas City Cam (Kansas City, MO)", locality: "Kansas City", area: "Missouri", country: 'US', category: "Panorámica",
    coordinates: [-94.55031, 39.12515], videoId: "9fzUjSTK5F8", provider: "EarthCam",
    sourceUrl: "https://www.youtube.com/watch?v=9fzUjSTK5F8",
  },
  {
    id: "us-camera-PyLw5HQKiYU", name: "Kansas City, Missouri, USA | LIVE Train Camera (PTZ – Bottom)", locality: "Kansas City", area: "Missouri", country: 'US', category: "Tren",
    coordinates: [-94.55031, 39.12515], videoId: "PyLw5HQKiYU", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=PyLw5HQKiYU",
  },
  {
    id: "us-camera-X-ir2KfXMX0", name: "La Plata, Missouri, USA | LIVE Train Camera (Fixed View – East)", locality: "La Plata", area: "Missouri", country: 'US', category: "Tren",
    coordinates: [-92.49078, 40.02395], videoId: "X-ir2KfXMX0", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=X-ir2KfXMX0",
  },
  {
    id: "us-camera-flEBdsoP4o0", name: "La Plata, Missouri, USA | LIVE Train Camera (Fixed View – West)", locality: "La Plata", area: "Missouri", country: 'US', category: "Tren",
    coordinates: [-92.49078, 40.02395], videoId: "flEBdsoP4o0", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=flEBdsoP4o0",
  },
  {
    id: "us-camera-iz9IQhp_fu0", name: "La Plata, Missouri, USA | LIVE Train Camera (PTZ – Lookout)", locality: "La Plata", area: "Missouri", country: 'US', category: "Tren",
    coordinates: [-92.49078, 40.02395], videoId: "iz9IQhp_fu0", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=iz9IQhp_fu0",
  },
  {
    id: "us-camera-OHRc7YRmuTk", name: "🔴 LIVE Trains Railcam | St Louis, Missouri (West Cam)", locality: "St. Louis", area: "Missouri", country: 'US', category: "Tren",
    coordinates: [-90.24458, 38.6357], videoId: "OHRc7YRmuTk", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=OHRc7YRmuTk",
  },
  {
    id: "us-camera-nO81bQFql7M", name: "Parkville, Missouri, USA | LIVE Train Camera (Fixed View – East)", locality: "Parkville", area: "Missouri", country: 'US', category: "Tren",
    coordinates: [-94.70437, 39.2146], videoId: "nO81bQFql7M", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=nO81bQFql7M",
  },
  {
    id: "us-camera-_ml6k80wSVc", name: "Springfield CID Live Railcam (PTZ) - Springfield, MO #steelhighway", locality: "Springfield", area: "Missouri", country: 'US', category: "Tren",
    coordinates: [-93.29236, 37.19534], videoId: "_ml6k80wSVc", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=_ml6k80wSVc",
  },
  {
    id: "us-camera-qJ0ADUNfEhM", name: "Springfield CID Live Railcam (Static) - Springfield, MO #steelhighway", locality: "Springfield", area: "Missouri", country: 'US', category: "Tren",
    coordinates: [-93.29236, 37.19534], videoId: "qJ0ADUNfEhM", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=qJ0ADUNfEhM",
  },
  {
    id: "us-camera-HbxRw7ED3dE", name: "Range Broadus, MT", locality: "Broadus", area: "Montana", country: 'US', category: "Tráfico",
    coordinates: [-105.40835, 45.44305], videoId: "HbxRw7ED3dE", provider: "Range",
    sourceUrl: "https://www.youtube.com/watch?v=HbxRw7ED3dE",
  },
  {
    id: "us-camera-MA5BTAmKdiY", name: "Range Forsyth, MT Downtown", locality: "Forsyth", area: "Montana", country: 'US', category: "Tráfico",
    coordinates: [-106.67259, 46.26788], videoId: "MA5BTAmKdiY", provider: "Range",
    sourceUrl: "https://www.youtube.com/watch?v=MA5BTAmKdiY",
  },
  {
    id: "us-camera-23tmCNeFh7A", name: "Kearney, Nebraska, USA | LIVE Train Camera (Fixed View – West)", locality: "Kearney", area: "Nebraska", country: 'US', category: "Tren",
    coordinates: [-99.08231, 40.70175], videoId: "23tmCNeFh7A", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=23tmCNeFh7A",
  },
  {
    id: "us-camera-laKzBnfVIsQ", name: "North Platte Golden Spike Tower (West) Live Railcam - North Platte, NE #steelhighway", locality: "North Platte", area: "Nebraska", country: 'US', category: "Tren",
    coordinates: [-100.7498, 41.12564], videoId: "laKzBnfVIsQ", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=laKzBnfVIsQ",
  },
  {
    id: "us-camera-4nwnbVcNiKA", name: "🔴 LIVE Trains Railcam | Caliente, Nevada (Depot Cam)", locality: "Caliente", area: "Nevada", country: 'US', category: "Tren",
    coordinates: [-114.49293, 37.64576], videoId: "4nwnbVcNiKA", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=4nwnbVcNiKA",
  },
  {
    id: "us-camera-RVLqQtrbCT8", name: "🔴 LIVE Trains Railcam | Caliente, Nevada (PTZ)", locality: "Caliente", area: "Nevada", country: 'US', category: "Tren",
    coordinates: [-114.49293, 37.64576], videoId: "RVLqQtrbCT8", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=RVLqQtrbCT8",
  },
  {
    id: "us-camera-H8bFFw-0ZQE", name: "North Conway, New Hampshire - LIVE CAM", locality: "North Conway", area: "New Hampshire", country: 'US', category: "Calle",
    coordinates: [-71.11723, 44.03572], videoId: "H8bFFw-0ZQE", provider: "Boston and Maine Live",
    sourceUrl: "https://www.youtube.com/watch?v=H8bFFw-0ZQE",
  },
  {
    id: "us-camera-2MNsMmfdpx8", name: "🔴 LIVE | 9600 Atlantic Ave Margate NJ — North View | Atlantic City Skyline Cam", locality: "Atlantic City", area: "New Jersey", country: 'US', category: "Panorámica",
    coordinates: [-74.45107, 39.37734], videoId: "2MNsMmfdpx8", provider: "You Need LED",
    sourceUrl: "https://www.youtube.com/watch?v=2MNsMmfdpx8",
  },
  {
    id: "us-camera-sw8MuxrKcs8", name: "Bridge Street looking West, Las Vegas NM", locality: "Las Vegas", area: "New Mexico", country: 'US', category: "Calle",
    coordinates: [-105.21702, 35.60486], videoId: "sw8MuxrKcs8", provider: "DesertGate Internet",
    sourceUrl: "https://www.youtube.com/watch?v=sw8MuxrKcs8",
  },
  {
    id: "us-camera-EKohXgHGCj8", name: "BNSF Railway Yard in Belen, New Mexico, USA | LIVE Train Camera (PTZ)", locality: "Belen", area: "New Mexico", country: 'US', category: "Tren",
    coordinates: [-106.80851, 34.76657], videoId: "EKohXgHGCj8", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=EKohXgHGCj8",
  },
  {
    id: "us-camera-yWr9-HqS2Ys", name: "Alexandria Bay Chamber of Commerce Docks Cam", locality: "Alexandria Bay", area: "New York", country: 'US', category: "Puerto",
    coordinates: [-75.92271, 44.33722], videoId: "yWr9-HqS2Ys", provider: "Alexandria Bay Chamber of Commerce",
    sourceUrl: "https://www.youtube.com/watch?v=yWr9-HqS2Ys",
  },
  {
    id: "us-camera-TLoMqn5wkng", name: "Hamptons.com - LIVE! 4K Conscience Point Marina, Southampton, New York", locality: "Southampton", area: "New York", country: 'US', category: "Puerto",
    coordinates: [-1.4, 50.9], videoId: "TLoMqn5wkng", provider: "Hamptons. com",
    sourceUrl: "https://www.youtube.com/watch?v=TLoMqn5wkng",
  },
  {
    id: "us-camera-l7b5RFAkKhY", name: "LIVE CAMERA: New York City Harbor, Brooklyn, New York | StreamTime LIVE", locality: "New York", area: "New York", country: 'US', category: "Puerto",
    coordinates: [-73.93868, 40.66271], videoId: "l7b5RFAkKhY", provider: "StreamTime Live",
    sourceUrl: "https://www.youtube.com/watch?v=l7b5RFAkKhY",
  },
  {
    id: "us-camera-Bf7ewHyVP5I", name: "LIVE: Lake Champlain Webcam in 4K | Port Henry, NY | Bridgeview Harbour Marina", locality: "Port Henry", area: "New York", country: 'US', category: "Puerto",
    coordinates: [-73.46126, 44.04538], videoId: "Bf7ewHyVP5I", provider: "Bridgeview Harbour Marina",
    sourceUrl: "https://www.youtube.com/watch?v=Bf7ewHyVP5I",
  },
  {
    id: "us-camera-nbkq2zjuFaw", name: "Hamptons.com - LIVE! Water Mill Square & Windmill, Water Mill, New York", locality: "Water Mill", area: "New York", country: 'US', category: "Plaza",
    coordinates: [-72.3507, 40.92239], videoId: "nbkq2zjuFaw", provider: "Hamptons Traffic Cams",
    sourceUrl: "https://www.youtube.com/watch?v=nbkq2zjuFaw",
  },
  {
    id: "us-camera-Zz9hMrxl20I", name: "Live Stream — Public Square, Watertown NY — Jake Johnson Properties", locality: "Watertown", area: "New York", country: 'US', category: "Plaza",
    coordinates: [-75.91004, 43.97329], videoId: "Zz9hMrxl20I", provider: "nny․live",
    sourceUrl: "https://www.youtube.com/watch?v=Zz9hMrxl20I",
  },
  {
    id: "us-camera-2_PDaUJbfuI", name: "EarthCam Live: SUMMIT One Vanderbilt (New York City, NY)", locality: "New York", area: "New York", country: 'US', category: "Panorámica",
    coordinates: [-73.93868, 40.66271], videoId: "2_PDaUJbfuI", provider: "EarthCam",
    sourceUrl: "https://www.youtube.com/watch?v=2_PDaUJbfuI",
  },
  {
    id: "us-camera-XWxyuL9dctA", name: "Fairport, New York, USA | LIVE Train Camera (Fixed View – West)", locality: "Fairport", area: "New York", country: 'US', category: "Tren",
    coordinates: [-77.44307, 43.09947], videoId: "XWxyuL9dctA", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=XWxyuL9dctA",
  },
  {
    id: "us-camera-nVUI6lDy0Bc", name: "Ocean Isle Marina & Yacht Club Webcam", locality: "Ocean Isle Beach", area: "North Carolina", country: 'US', category: "Puerto",
    coordinates: [-78.43672, 33.90221], videoId: "nVUI6lDy0Bc", provider: "Carolina Webcam Streaming",
    sourceUrl: "https://www.youtube.com/watch?v=nVUI6lDy0Bc",
  },
  {
    id: "us-camera-JPdUQtZcuk8", name: "Thomasville, North Carolina, USA | LIVE Train Camera (Fixed View – South)", locality: "Thomasville", area: "North Carolina", country: 'US', category: "Tren",
    coordinates: [-80.08155, 35.88131], videoId: "JPdUQtZcuk8", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=JPdUQtZcuk8",
  },
  {
    id: "us-camera-usuANNquuAI", name: "Construction Progress | Flight Operations Center", locality: "Grand Forks", area: "North Dakota", country: 'US', category: "Infraestructura",
    coordinates: [-97.08733, 47.9196], videoId: "usuANNquuAI", provider: "UND Aerospace",
    sourceUrl: "https://www.youtube.com/watch?v=usuANNquuAI",
  },
  {
    id: "us-camera-mpcvRHLGBRw", name: "UND Dept. of Atmospheric Sciences Skycam - West (Grand Forks, ND)", locality: "Grand Forks", area: "North Dakota", country: 'US', category: "Panorámica",
    coordinates: [-97.08733, 47.9196], videoId: "mpcvRHLGBRw", provider: "UND Atmospheric Sciences",
    sourceUrl: "https://www.youtube.com/watch?v=mpcvRHLGBRw",
  },
  {
    id: "us-camera-iHqqkh_Lths", name: "EarthCam Live: Terminal Tower Cam (Cleveland, OH)", locality: "Cleveland", area: "Ohio", country: 'US', category: "Panorámica",
    coordinates: [-81.67943, 41.47846], videoId: "iHqqkh_Lths", provider: "EarthCam",
    sourceUrl: "https://www.youtube.com/watch?v=iHqqkh_Lths",
  },
  {
    id: "us-camera-eAdWk0Vg64A", name: "Live Traffic @ 741 & Lytle South", locality: "Springboro", area: "Ohio", country: 'US', category: "Tráfico",
    coordinates: [-84.23375, 39.56244], videoId: "eAdWk0Vg64A", provider: "City of Springboro Live Traffic",
    sourceUrl: "https://www.youtube.com/watch?v=eAdWk0Vg64A",
  },
  {
    id: "us-camera-Y28qU7UsFko", name: "Deshler, Ohio, USA | LIVE Train Camera (Fixed View — Diamond)", locality: "Deshler", area: "Ohio", country: 'US', category: "Tren",
    coordinates: [-83.90593, 41.20784], videoId: "Y28qU7UsFko", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=Y28qU7UsFko",
  },
  {
    id: "us-camera-TjMwpB8JRw8", name: "Deshler, Ohio, USA | LIVE Train Camera (PTZ)", locality: "Deshler", area: "Ohio", country: 'US', category: "Tren",
    coordinates: [-83.90593, 41.20784], videoId: "TjMwpB8JRw8", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=TjMwpB8JRw8",
  },
  {
    id: "us-camera-vF4ZdG-_6FE", name: "Glendale, Ohio, USA | LIVE Train Camera (Fixed View – North)", locality: "Glendale", area: "Ohio", country: 'US', category: "Tren",
    coordinates: [-84.45854, 39.27066], videoId: "vF4ZdG-_6FE", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=vF4ZdG-_6FE",
  },
  {
    id: "us-camera-kGB1z-KVcy0", name: "Beaver Ave and Allen St - State College, PA", locality: "State College", area: "Pennsylvania", country: 'US', category: "Tráfico",
    coordinates: [-77.85681, 40.79104], videoId: "kGB1z-KVcy0", provider: "StateCollegeDotCom",
    sourceUrl: "https://www.youtube.com/watch?v=kGB1z-KVcy0",
  },
  {
    id: "us-camera-9mMnqO1UuIU", name: "EarthCam Live: Philadelphia, PA", locality: "Philadelphia", area: "Pennsylvania", country: 'US', category: "Tráfico",
    coordinates: [-75.13327, 40.0093], videoId: "9mMnqO1UuIU", provider: "EarthCam",
    sourceUrl: "https://www.youtube.com/watch?v=9mMnqO1UuIU",
  },
  {
    id: "us-camera-9uPCPh8jWas", name: "Cresson, Pennsylvania | LIVE Train Camera (PTZ)", locality: "Cresson", area: "Pennsylvania", country: 'US', category: "Tren",
    coordinates: [-78.58661, 40.46257], videoId: "9uPCPh8jWas", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=9uPCPh8jWas",
  },
  {
    id: "us-camera-KHNgcx8AMQ0", name: "Cresson, Pennsylvania, USA | LIVE Train Camera (Fixed View - West)", locality: "Cresson", area: "Pennsylvania", country: 'US', category: "Tren",
    coordinates: [-78.58661, 40.46257], videoId: "KHNgcx8AMQ0", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=KHNgcx8AMQ0",
  },
  {
    id: "us-camera-ssuM6NJQ2no", name: "Horseshoe Curve – Altoona, Pennsylvania, USA | LIVE Train Camera (PTZ)", locality: "Altoona", area: "Pennsylvania", country: 'US', category: "Tren",
    coordinates: [-78.40111, 40.50805], videoId: "ssuM6NJQ2no", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=ssuM6NJQ2no",
  },
  {
    id: "us-camera-lUMGsNe-R9Q", name: "Johnstown, Pennsylvania, USA | LIVE Train Camera (Fixed View – West)", locality: "Johnstown", area: "Pennsylvania", country: 'US', category: "Tren",
    coordinates: [-78.91914, 40.32613], videoId: "lUMGsNe-R9Q", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=lUMGsNe-R9Q",
  },
  {
    id: "us-camera-RZpIX6cq7Os", name: "Strasburg, Pennsylvania, USA | LIVE Train Camera (PTZ)", locality: "Strasburg", area: "Pennsylvania", country: 'US', category: "Tren",
    coordinates: [-76.18618, 39.98452], videoId: "RZpIX6cq7Os", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=RZpIX6cq7Os",
  },
  {
    id: "us-camera-xJMJegqnl8Y", name: "Spartanburg, South Carolina, USA | LIVE Train Camera (Fixed View – North)", locality: "Spartanburg", area: "South Carolina", country: 'US', category: "Tren",
    coordinates: [-81.92594, 34.94563], videoId: "xJMJegqnl8Y", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=xJMJegqnl8Y",
  },
  {
    id: "us-camera-uu82CI54eJU", name: "Live View from Hotel Sturgis on Main St. and Harley-Davidson Way in Sturgis SD", locality: "Sturgis", area: "South Dakota", country: 'US', category: "Calle",
    coordinates: [-103.49957, 44.41044], videoId: "uu82CI54eJU", provider: "UDrive Tech LIVE Streaming",
    sourceUrl: "https://www.youtube.com/watch?v=uu82CI54eJU",
  },
  {
    id: "us-camera-ICva1RPK6Do", name: "🔴 LIVE: Nashville Live Cam • Lower Broadway (With Sound)", locality: "Nashville", area: "Tennessee", country: 'US', category: "Calle",
    coordinates: [-86.7846, 36.17218], videoId: "ICva1RPK6Do", provider: "On Broadway (Nashville, Tennessee)",
    sourceUrl: "https://www.youtube.com/watch?v=ICva1RPK6Do",
  },
  {
    id: "us-camera-hVzxl2gSQ18", name: "🔴 LIVE: Nashville Sunset Cam • 24/7 Horizon View from Downtown", locality: "Nashville", area: "Tennessee", country: 'US', category: "Panorámica",
    coordinates: [-86.7846, 36.17218], videoId: "hVzxl2gSQ18", provider: "On Broadway (Nashville, Tennessee)",
    sourceUrl: "https://www.youtube.com/watch?v=hVzxl2gSQ18",
  },
  {
    id: "us-camera-k3ZpqfybsQE", name: "Hwy 109 @ I-40 WB Ramp", locality: "Lebanon", area: "Tennessee", country: 'US', category: "Tráfico",
    coordinates: [-86.34552, 36.1983], videoId: "k3ZpqfybsQE", provider: "City of Lebanon, TN -Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=k3ZpqfybsQE",
  },
  {
    id: "us-camera-Hoh5o3Imj10", name: "Hwy 109 N @ Eastgate Blvd/Leeville Pk", locality: "Lebanon", area: "Tennessee", country: 'US', category: "Tráfico",
    coordinates: [-86.34552, 36.1983], videoId: "Hoh5o3Imj10", provider: "City of Lebanon, TN -Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=Hoh5o3Imj10",
  },
  {
    id: "us-camera-h36zLcmCFO8", name: "Murfreesboro Rd @ Alligood Way", locality: "Lebanon", area: "Tennessee", country: 'US', category: "Tráfico",
    coordinates: [-86.34552, 36.1983], videoId: "h36zLcmCFO8", provider: "City of Lebanon, TN -Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=h36zLcmCFO8",
  },
  {
    id: "us-camera-10LSNoGeEHE", name: "S Cumberland St @ I-40WB", locality: "Lebanon", area: "Tennessee", country: 'US', category: "Tráfico",
    coordinates: [-86.34552, 36.1983], videoId: "10LSNoGeEHE", provider: "City of Lebanon, TN -Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=10LSNoGeEHE",
  },
  {
    id: "us-camera-DgJlC8WemnE", name: "Traffic Camera Trailer", locality: "Lebanon", area: "Tennessee", country: 'US', category: "Tráfico",
    coordinates: [-86.34552, 36.1983], videoId: "DgJlC8WemnE", provider: "City of Lebanon, TN -Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=DgJlC8WemnE",
  },
  {
    id: "us-camera-NIultPoJuaE", name: "Sweetwater, Tennessee, USA | LIVE Train Camera", locality: "Sweetwater", area: "Tennessee", country: 'US', category: "Tren",
    coordinates: [-84.47338, 35.60262], videoId: "NIultPoJuaE", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=NIultPoJuaE",
  },
  {
    id: "us-camera-V8WuWZUwKzc", name: "I-35 @ John Bowden - Waco", locality: "Waco", area: "Texas", country: 'US', category: "Infraestructura",
    coordinates: [-97.19084, 31.55789], videoId: "V8WuWZUwKzc", provider: "I-35 Waco South - Construction Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=V8WuWZUwKzc",
  },
  {
    id: "us-camera-inCQ49QGmqQ", name: "Starbase Live Rover Cam - SpaceX Starship Launch Facility", locality: "Starbase", area: "Texas", country: 'US', category: "Infraestructura",
    coordinates: [-97.19781, 25.9752], videoId: "inCQ49QGmqQ", provider: "Avid Space",
    sourceUrl: "https://www.youtube.com/watch?v=inCQ49QGmqQ",
  },
  {
    id: "us-camera-IQV0DlS1Ew0", name: "Starbase Live Sentinel Cam - SpaceX Starship Launch and Production Facility", locality: "Starbase", area: "Texas", country: 'US', category: "Infraestructura",
    coordinates: [-97.19781, 25.9752], videoId: "IQV0DlS1Ew0", provider: "Avid Space",
    sourceUrl: "https://www.youtube.com/watch?v=IQV0DlS1Ew0",
  },
  {
    id: "us-camera-Mn3vY8bordE", name: "Aransas Pass Harbor Park", locality: "Aransas Pass", area: "Texas", country: 'US', category: "Puerto",
    coordinates: [-97.12099, 27.89311], videoId: "Mn3vY8bordE", provider: "City of Aransas Pass",
    sourceUrl: "https://www.youtube.com/watch?v=Mn3vY8bordE",
  },
  {
    id: "us-camera-SDK_m1_BVJ4", name: "Houston, Texas | 24/7 Live City Camera", locality: "Houston", area: "Texas", country: 'US', category: "Panorámica",
    coordinates: [-95.38881, 29.78574], videoId: "SDK_m1_BVJ4", provider: "ABC13 Houston",
    sourceUrl: "https://www.youtube.com/watch?v=SDK_m1_BVJ4",
  },
  {
    id: "us-camera-wUQc3RoLAPs", name: "Houston, Texas | 24/7 Live Downtown Skyline Camera", locality: "Houston", area: "Texas", country: 'US', category: "Panorámica",
    coordinates: [-95.38881, 29.78574], videoId: "wUQc3RoLAPs", provider: "ABC13 Houston",
    sourceUrl: "https://www.youtube.com/watch?v=wUQc3RoLAPs",
  },
  {
    id: "us-camera-fiUqVsMR8z4", name: "Aquarena Spring @ Charles Austin", locality: "San Marcos", area: "Texas", country: 'US', category: "Tráfico",
    coordinates: [-97.93574, 29.87333], videoId: "fiUqVsMR8z4", provider: "San Marcos, TX Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=fiUqVsMR8z4",
  },
  {
    id: "us-camera-MYNXvJGw0NE", name: "Aquarena Springs Drive @ Post Road", locality: "San Marcos", area: "Texas", country: 'US', category: "Tráfico",
    coordinates: [-97.93574, 29.87333], videoId: "MYNXvJGw0NE", provider: "San Marcos, TX Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=MYNXvJGw0NE",
  },
  {
    id: "us-camera-S_o0_F9BiuY", name: "Aquarena Springs Drive @ Sessom Drive", locality: "San Marcos", area: "Texas", country: 'US', category: "Tráfico",
    coordinates: [-97.93574, 29.87333], videoId: "S_o0_F9BiuY", provider: "San Marcos, TX Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=S_o0_F9BiuY",
  },
  {
    id: "us-camera-bYd6ChdCblg", name: "Aquarena Springs @Thorpe", locality: "San Marcos", area: "Texas", country: 'US', category: "Tráfico",
    coordinates: [-97.93574, 29.87333], videoId: "bYd6ChdCblg", provider: "San Marcos, TX Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=bYd6ChdCblg",
  },
  {
    id: "us-camera-tDFokEet4Ys", name: "Hopkins@LBJ", locality: "San Marcos", area: "Texas", country: 'US', category: "Tráfico",
    coordinates: [-97.93574, 29.87333], videoId: "tDFokEet4Ys", provider: "San Marcos, TX Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=tDFokEet4Ys",
  },
  {
    id: "us-camera-Qj6osxu6XVI", name: "Hopkins Street @ Moore Street", locality: "San Marcos", area: "Texas", country: 'US', category: "Tráfico",
    coordinates: [-97.93574, 29.87333], videoId: "Qj6osxu6XVI", provider: "San Marcos, TX Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=Qj6osxu6XVI",
  },
  {
    id: "us-camera-xdWLJzOlMUI", name: "Hopkins_Thorpe", locality: "San Marcos", area: "Texas", country: 'US', category: "Tráfico",
    coordinates: [-97.93574, 29.87333], videoId: "xdWLJzOlMUI", provider: "San Marcos, TX Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=xdWLJzOlMUI",
  },
  {
    id: "us-camera-1xnW0pXEArs", name: "🔴 LIVE Trains Railcam | Houston, Texas (TNO Jct)", locality: "Houston", area: "Texas", country: 'US', category: "Tráfico",
    coordinates: [-95.38881, 29.78574], videoId: "1xnW0pXEArs", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=1xnW0pXEArs",
  },
  {
    id: "us-camera-wMsY4Sj9ljg", name: "Sessom @ Comanche", locality: "San Marcos", area: "Texas", country: 'US', category: "Tráfico",
    coordinates: [-97.93574, 29.87333], videoId: "wMsY4Sj9ljg", provider: "San Marcos, TX Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=wMsY4Sj9ljg",
  },
  {
    id: "us-camera-MUQJubAnBmI", name: "SH123@Broadway", locality: "San Marcos", area: "Texas", country: 'US', category: "Tráfico",
    coordinates: [-97.93574, 29.87333], videoId: "MUQJubAnBmI", provider: "San Marcos, TX Traffic Cameras",
    sourceUrl: "https://www.youtube.com/watch?v=MUQJubAnBmI",
  },
  {
    id: "us-camera-WNSkLhEWbuY", name: "Big Sandy, Texas, USA | LIVE Train Camera (PTZ)", locality: "Big Sandy", area: "Texas", country: 'US', category: "Tren",
    coordinates: [-95.11248, 32.58571], videoId: "WNSkLhEWbuY", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=WNSkLhEWbuY",
  },
  {
    id: "us-camera-gpSR9c0p6lI", name: "🔴 LIVE Trains Railcam | Houston, Texas PTZ (Baer Jct)", locality: "Houston", area: "Texas", country: 'US', category: "Tren",
    coordinates: [-95.38881, 29.78574], videoId: "gpSR9c0p6lI", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=gpSR9c0p6lI",
  },
  {
    id: "us-camera-DTLIqs3mWiM", name: "🔴 LIVE Trains Railcam | Houston, Texas (Sampson Street East Cam)", locality: "Houston", area: "Texas", country: 'US', category: "Tren",
    coordinates: [-95.38881, 29.78574], videoId: "DTLIqs3mWiM", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=DTLIqs3mWiM",
  },
  {
    id: "us-camera-oAJH5nZgrNQ", name: "🔴 LIVE Trains Railcam | Houston, Texas (Sampson Street North)", locality: "Houston", area: "Texas", country: 'US', category: "Tren",
    coordinates: [-95.38881, 29.78574], videoId: "oAJH5nZgrNQ", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=oAJH5nZgrNQ",
  },
  {
    id: "us-camera-OmWt0efvmNQ", name: "🔴 LIVE Trains Railcam | Houston, Texas (Sampson Street South)", locality: "Houston", area: "Texas", country: 'US', category: "Tren",
    coordinates: [-95.38881, 29.78574], videoId: "OmWt0efvmNQ", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=OmWt0efvmNQ",
  },
  {
    id: "us-camera-bchdO4OtIEI", name: "🔴 LIVE Trains Railcam | Houston, Texas (Tower 26) East Cam", locality: "Houston", area: "Texas", country: 'US', category: "Tren",
    coordinates: [-95.38881, 29.78574], videoId: "bchdO4OtIEI", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=bchdO4OtIEI",
  },
  {
    id: "us-camera-cRRQyXQAvsE", name: "🔴 LIVE Trains Railcam | Houston, Texas (Tower 26) PTZ", locality: "Houston", area: "Texas", country: 'US', category: "Tren",
    coordinates: [-95.38881, 29.78574], videoId: "cRRQyXQAvsE", provider: "LIVE Trains",
    sourceUrl: "https://www.youtube.com/watch?v=cRRQyXQAvsE",
  },
  {
    id: "us-camera-blcDjPvPbss", name: "Tower 55 in Fort Worth, Texas, USA | LIVE Train Camera (PTZ)", locality: "Fort Worth", area: "Texas", country: 'US', category: "Tren",
    coordinates: [-97.34, 32.74], videoId: "blcDjPvPbss", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=blcDjPvPbss",
  },
  {
    id: "us-camera-Kyjfp6GmV8Q", name: "Bastian Center 4H Construction", locality: "South Jordan", area: "Utah", country: 'US', category: "Infraestructura",
    coordinates: [-111.99234, 40.55501], videoId: "Kyjfp6GmV8Q", provider: "USU Webcams",
    sourceUrl: "https://www.youtube.com/watch?v=Kyjfp6GmV8Q",
  },
  {
    id: "us-camera-NP-bvAcswIM", name: "Salt Lake City, Utah, USA | LIVE Train Camera (Fixed View - South)", locality: "Salt Lake City", area: "Utah", country: 'US', category: "Tren",
    coordinates: [-111.932, 40.777], videoId: "NP-bvAcswIM", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=NP-bvAcswIM",
  },
  {
    id: "us-camera-qJd7diix4eI", name: "Salt Lake City, Utah, USA | LIVE Train Camera (PTZ)", locality: "Salt Lake City", area: "Utah", country: 'US', category: "Tren",
    coordinates: [-111.932, 40.777], videoId: "qJd7diix4eI", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=qJd7diix4eI",
  },
  {
    id: "us-camera-T8_7hmOsIJI", name: "WCAX SkyWatch3: Homeport, Church St., Burlington, VT", locality: "Burlington", area: "Vermont", country: 'US', category: "Calle",
    coordinates: [-73.2395, 44.49237], videoId: "T8_7hmOsIJI", provider: "WCAX Channel 3 News",
    sourceUrl: "https://www.youtube.com/watch?v=T8_7hmOsIJI",
  },
  {
    id: "us-camera-jhCh3dsEv-M", name: "Gate House Plaza View", locality: "Warren", area: "Vermont", country: 'US', category: "Plaza",
    coordinates: [-72.89586, 44.1357], videoId: "jhCh3dsEv-M", provider: "Sugarbush Resort",
    sourceUrl: "https://www.youtube.com/watch?v=jhCh3dsEv-M",
  },
  {
    id: "us-camera-TxS4AlWPqNQ", name: "Market Street & East Beverley Street | Staunton VA", locality: "Staunton", area: "Virginia", country: 'US', category: "Calle",
    coordinates: [-79.06188, 38.15798], videoId: "TxS4AlWPqNQ", provider: "Lingo Networks",
    sourceUrl: "https://www.youtube.com/watch?v=TxS4AlWPqNQ",
  },
  {
    id: "us-camera-1j-V9OAVQN0", name: "CNU Great Lawn Webcam", locality: "Newport News", area: "Virginia", country: 'US', category: "Parque",
    coordinates: [-76.52064, 37.07646], videoId: "1j-V9OAVQN0", provider: "Public Webcam",
    sourceUrl: "https://www.youtube.com/watch?v=1j-V9OAVQN0",
  },
  {
    id: "us-camera-8CgXXdx97DA", name: "Ashland, Virginia, USA | LIVE Train Camera (Fixed View — North)", locality: "Ashland", area: "Virginia", country: 'US', category: "Tren",
    coordinates: [-77.47241, 37.76042], videoId: "8CgXXdx97DA", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=8CgXXdx97DA",
  },
  {
    id: "us-camera-_Kk5anP-dQg", name: "Ashland, Virginia, USA | LIVE Train Camera (Fixed View — South)", locality: "Ashland", area: "Virginia", country: 'US', category: "Tren",
    coordinates: [-77.47241, 37.76042], videoId: "_Kk5anP-dQg", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=_Kk5anP-dQg",
  },
  {
    id: "us-camera-4XYbh4Pegzw", name: "Ashland, Virginia, USA | LIVE Train Camera (PTZ)", locality: "Ashland", area: "Virginia", country: 'US', category: "Tren",
    coordinates: [-77.47241, 37.76042], videoId: "4XYbh4Pegzw", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=4XYbh4Pegzw",
  },
  {
    id: "us-camera-UhP0rMfgjJ8", name: "Roanoke, Virginia, USA | LIVE Train Camera (PTZ)", locality: "Roanoke", area: "Virginia", country: 'US', category: "Tren",
    coordinates: [-79.95817, 37.27846], videoId: "UhP0rMfgjJ8", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=UhP0rMfgjJ8",
  },
  {
    id: "us-camera-pr2p_uvmXh8", name: "Port of Friday Harbor Live Stream", locality: "Friday Harbor", area: "Washington", country: 'US', category: "Puerto",
    coordinates: [-123.019, 48.53395], videoId: "pr2p_uvmXh8", provider: "Port of Friday Harbor",
    sourceUrl: "https://www.youtube.com/watch?v=pr2p_uvmXh8",
  },
  {
    id: "us-camera-uDmlA-mHiUU", name: "LIVE: Snoqualmie Pass Traffic Camera", locality: "Snoqualmie Pass", area: "Washington", country: 'US', category: "Tráfico",
    coordinates: [-121.41101, 47.40155], videoId: "uDmlA-mHiUU", provider: "KOMO News",
    sourceUrl: "https://www.youtube.com/watch?v=uDmlA-mHiUU",
  },
  {
    id: "us-camera-wSZCdFJNkR4", name: "Chehalis, Washington, USA | LIVE Train Camera (Fixed View – North)", locality: "Chehalis", area: "Washington", country: 'US', category: "Tren",
    coordinates: [-122.96542, 46.66418], videoId: "wSZCdFJNkR4", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=wSZCdFJNkR4",
  },
  {
    id: "us-camera-YV8hzUJCp88", name: "Lewis County Historical Museum Live Railcam (PTZ) - Chehalis, WA #steelhighway", locality: "Chehalis", area: "Washington", country: 'US', category: "Tren",
    coordinates: [-122.96542, 46.66418], videoId: "YV8hzUJCp88", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=YV8hzUJCp88",
  },
  {
    id: "us-camera-PftkGaoFl_0", name: "Olympia-Lacey Centennial Station Live Railcam - Olympia-Lacey, Washington #steelhighway", locality: "Olympia", area: "Washington", country: 'US', category: "Tren",
    coordinates: [-122.895, 47.0406], videoId: "PftkGaoFl_0", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=PftkGaoFl_0",
  },
  {
    id: "us-camera-pHqTDmH7H7c", name: "Seattle, Washington, USA | LIVE Train Camera (PTZ)", locality: "Seattle", area: "Washington", country: 'US', category: "Tren",
    coordinates: [-122.3153, 47.6004], videoId: "pHqTDmH7H7c", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=pHqTDmH7H7c",
  },
  {
    id: "us-camera-jxvalaix3K0", name: "Skykomish, Washington, USA | LIVE Train Camera (PTZ)", locality: "Skykomish", area: "Washington", country: 'US', category: "Tren",
    coordinates: [-121.35729, 47.70993], videoId: "jxvalaix3K0", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=jxvalaix3K0",
  },
  {
    id: "us-camera-2blgPhEGUy0", name: "Spokane, Washington, USA | LIVE Train Cam | Virtual Railfan (Fixed View - East)", locality: "Spokane", area: "Washington", country: 'US', category: "Tren",
    coordinates: [-117.43332, 47.66694], videoId: "2blgPhEGUy0", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=2blgPhEGUy0",
  },
  {
    id: "us-camera-jS-2TmpeDKc", name: "Vader, Washington The Tracks Bar & Grill Live Railcam #steelhighway", locality: "Vader", area: "Washington", country: 'US', category: "Tren",
    coordinates: [-122.95703, 46.4046], videoId: "jS-2TmpeDKc", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=jS-2TmpeDKc",
  },
  {
    id: "us-camera-sJl7PsdHxWM", name: "MKE Airport LIVE 24/7 • Milwaukee, Wisconsin ✈️", locality: "Milwaukee", area: "Wisconsin", country: 'US', category: "Aeropuerto",
    coordinates: [-87.9667, 43.06335], videoId: "sJl7PsdHxWM", provider: "Flightradar24",
    sourceUrl: "https://www.youtube.com/watch?v=sJl7PsdHxWM",
  },
  {
    id: "us-camera-ADsY4BQWZOU", name: "Broad Street Live Stream", locality: "Greendale", area: "Wisconsin", country: 'US', category: "Calle",
    coordinates: [-88.00086, 42.93999], videoId: "ADsY4BQWZOU", provider: "Village of Greendale, Wisconsin",
    sourceUrl: "https://www.youtube.com/watch?v=ADsY4BQWZOU",
  },
  {
    id: "us-camera-lwHkvJXdu7g", name: "Brothertown Boat Harbor", locality: "Brothertown", area: "Wisconsin", country: 'US', category: "Puerto",
    coordinates: [-88.31747, 43.97496], videoId: "lwHkvJXdu7g", provider: "Calumet County Parks Department",
    sourceUrl: "https://www.youtube.com/watch?v=lwHkvJXdu7g",
  },
  {
    id: "us-camera-Wb763UMrNxo", name: "Neenah Harbor Cam", locality: "Neenah", area: "Wisconsin", country: 'US', category: "Puerto",
    coordinates: [-88.48004, 44.16457], videoId: "Wb763UMrNxo", provider: "City of Neenah",
    sourceUrl: "https://www.youtube.com/watch?v=Wb763UMrNxo",
  },
  {
    id: "us-camera-PduE4p0YzTo", name: "Neenah Rec Park Cam", locality: "Neenah", area: "Wisconsin", country: 'US', category: "Parque",
    coordinates: [-88.48004, 44.16457], videoId: "PduE4p0YzTo", provider: "City of Neenah",
    sourceUrl: "https://www.youtube.com/watch?v=PduE4p0YzTo",
  },
  {
    id: "us-camera-MT5Og9gOKuM", name: "EarthCam Live: Milwaukee, WI", locality: "Milwaukee", area: "Wisconsin", country: 'US', category: "Panorámica",
    coordinates: [-87.9667, 43.06335], videoId: "MT5Og9gOKuM", provider: "EarthCam",
    sourceUrl: "https://www.youtube.com/watch?v=MT5Og9gOKuM",
  },
  {
    id: "us-camera-7fZ2JLtv_c8", name: "MKE Live Cam - Milwaukee, Wisconsin from MKE.com", locality: "Milwaukee", area: "Wisconsin", country: 'US', category: "Panorámica",
    coordinates: [-87.9667, 43.06335], videoId: "7fZ2JLtv_c8", provider: "MKElivecam",
    sourceUrl: "https://www.youtube.com/watch?v=7fZ2JLtv_c8",
  },
  {
    id: "us-camera-vio6cp536gQ", name: "City of Alma Live Railcam - Alma, WI", locality: "Alma", area: "Wisconsin", country: 'US', category: "Tren",
    coordinates: [-91.91852, 44.33997], videoId: "vio6cp536gQ", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=vio6cp536gQ",
  },
  {
    id: "us-camera-Z8FSWpaaPC4", name: "Julie's Java House Live Railcam - Columbus, WI #steelhighway", locality: "Columbus", area: "Wisconsin", country: 'US', category: "Tren",
    coordinates: [-89.02999, 43.3368], videoId: "Z8FSWpaaPC4", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=Z8FSWpaaPC4",
  },
  {
    id: "us-camera-8v69iuim8JQ", name: "Riverside & Great Northern Live Railcam Narrow Gauge - Wisconsin Dells, WI #steelhighway", locality: "Wisconsin Dells", area: "Wisconsin", country: 'US', category: "Tren",
    coordinates: [-89.77576, 43.63837], videoId: "8v69iuim8JQ", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=8v69iuim8JQ",
  },
  {
    id: "us-camera-L80yh_XM7bc", name: "Waupaca Airport Live Airport Camera - Waupaca, Wisconsin #SteelHighway", locality: "Waupaca", area: "Wisconsin", country: 'US', category: "Tren",
    coordinates: [-89.07, 44.35005], videoId: "L80yh_XM7bc", provider: "Steel Highway Railcams",
    sourceUrl: "https://www.youtube.com/watch?v=L80yh_XM7bc",
  },
  {
    id: "us-camera-gicEyI_T8Hk", name: "Downtown Laramie Web Camera", locality: "Laramie", area: "Wyoming", country: 'US', category: "Calle",
    coordinates: [-105.60647, 41.31181], videoId: "gicEyI_T8Hk", provider: "Visit Laramie",
    sourceUrl: "https://www.youtube.com/watch?v=gicEyI_T8Hk",
  },
  {
    id: "us-camera-cavcN9tRJzE", name: "Range Dubois, WY Town Camera", locality: "Dubois", area: "Wyoming", country: 'US', category: "Calle",
    coordinates: [-109.64798, 43.54606], videoId: "cavcN9tRJzE", provider: "Range",
    sourceUrl: "https://www.youtube.com/watch?v=cavcN9tRJzE",
  },
  {
    id: "us-camera-lrkKxtHV70E", name: "Range Hot Springs State Park Lower Terrace Thermopolis, WY", locality: "Thermopolis", area: "Wyoming", country: 'US', category: "Parque",
    coordinates: [-108.21453, 43.64788], videoId: "lrkKxtHV70E", provider: "Range",
    sourceUrl: "https://www.youtube.com/watch?v=lrkKxtHV70E",
  },
  {
    id: "us-camera-qzNgK27jXK0", name: "Range Baggs, WY North", locality: "Baggs", area: "Wyoming", country: 'US', category: "Panorámica",
    coordinates: [-107.65728, 41.03466], videoId: "qzNgK27jXK0", provider: "Range",
    sourceUrl: "https://www.youtube.com/watch?v=qzNgK27jXK0",
  },
  {
    id: "us-camera-oY9HOqAU_Gc", name: "Range Baggs, WY South", locality: "Baggs", area: "Wyoming", country: 'US', category: "Tráfico",
    coordinates: [-107.65728, 41.03466], videoId: "oY9HOqAU_Gc", provider: "Range",
    sourceUrl: "https://www.youtube.com/watch?v=oY9HOqAU_Gc",
  },
  {
    id: "us-camera-7HJ2ctibBeY", name: "Range Sheridan, WY Grinnell Street", locality: "Sheridan", area: "Wyoming", country: 'US', category: "Tráfico",
    coordinates: [-106.96417, 44.79622], videoId: "7HJ2ctibBeY", provider: "Range",
    sourceUrl: "https://www.youtube.com/watch?v=7HJ2ctibBeY",
  },
  {
    id: "us-camera-p9CJkmVgxp0", name: "Cheyenne, Wyoming, USA | LIVE Train Camera (Fixed View - West)", locality: "Cheyenne", area: "Wyoming", country: 'US', category: "Tren",
    coordinates: [-104.79915, 41.12828], videoId: "p9CJkmVgxp0", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=p9CJkmVgxp0",
  },
  {
    id: "us-camera-hV30GxkdTAs", name: "Cheyenne, Wyoming, USA | LIVE Train Camera (PTZ)", locality: "Cheyenne", area: "Wyoming", country: 'US', category: "Tren",
    coordinates: [-104.79915, 41.12828], videoId: "hV30GxkdTAs", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=hV30GxkdTAs",
  },
  {
    id: "us-camera-LRTTZdNTW_0", name: "Laramie, Wyoming, USA | LIVE Train Camera (PTZ)", locality: "Laramie", area: "Wyoming", country: 'US', category: "Tren",
    coordinates: [-105.60647, 41.31181], videoId: "LRTTZdNTW_0", provider: "Virtual Railfan",
    sourceUrl: "https://www.youtube.com/watch?v=LRTTZdNTW_0",
  },
];

export const USA_WEBCAMS: Webcam[] = [...CURATED_USA_WEBCAMS, ...FAMELACK_US_WEBCAMS];
export const WEBCAMS: Webcam[] = [...USA_WEBCAMS, ...SPAIN_WEBCAMS, ...INTERNATIONAL_WEBCAMS, ...FAMELACK_INTERNATIONAL_WEBCAMS, ...LIVE_ENVIRONMENT_WEBCAMS];
export const WEBCAM_COUNTRIES: Record<string, string> = { US: 'Estados Unidos', ES: 'España' };
const countryDisplayNames = new Intl.DisplayNames(['es'], { type: 'region' });
export const webcamCountryName = (code: string) =>
  WEBCAM_COUNTRIES[code] ?? countryDisplayNames.of(code === 'UK' ? 'GB' : code) ?? code;
export const webcamDetailLine = (camera: Webcam) => {
  const area = camera.area === webcamCountryName(camera.country) ? undefined : camera.area;
  return [camera.locality, camera.category, area].filter(Boolean).join(' · ');
};
export const regionalWebcamCountry = (iso: string | null): Webcam['country'] | undefined =>
  iso === 'USA' ? 'US' : iso === 'ESP' ? 'ES' : undefined;

export const webcamSourceUrl = (camera: Webcam) => camera.videoId
  ? `https://www.youtube.com/watch?v=${camera.videoId}`
  : camera.streamUrl ?? camera.sourceUrl;
export const webcamPlayerUrl = (camera: Webcam) =>
  camera.videoId ? `https://www.youtube.com/embed/${camera.videoId}?autoplay=1&mute=1&playsinline=1&rel=0` : '';
