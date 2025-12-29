// components/NASAWorldWindMap.tsx
// NASA Web WorldWind 3D Globe - Official NASA planetary visualization engine
// Integrates GIBS WMTS imagery and WMS services with interactive 3D globe

import React, { useEffect, useRef, useState } from 'react';
import { Station } from '../types';

// TypeScript declarations for WorldWind
declare global {
  interface Window {
    WorldWind: any;
  }
}

interface NASAWorldWindMapProps {
  selectedStation?: Station | null;
  stations?: Station[];
}

interface SSTLayerConfig {
  id: string;
  name: string;
  description: string;
  serviceType: 'GIBS_WMTS' | 'WMS';
  identifier?: string; // For GIBS layers
  wmsConfig?: {
    url: string;
    layerName: string;
  };
  temporal: boolean;
  resolution: string;
  timeRange?: string;
}

// NASA GIBS SST Layers - Official layer identifiers from GIBS documentation
const SST_LAYERS: SSTLayerConfig[] = [
  {
    id: 'ghrsst_mur',
    name: 'GHRSST MUR SST',
    description: 'Multi-scale Ultra-high Resolution Sea Surface Temperature',
    serviceType: 'GIBS_WMTS',
    identifier: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    temporal: true,
    resolution: '1km',
    timeRange: '2002-06-01 to present'
  },
  {
    id: 'modis_sst_day',
    name: 'MODIS Aqua SST (Day)',
    description: 'Mid-infrared daytime sea surface temperature',
    serviceType: 'GIBS_WMTS',
    identifier: 'MODIS_Aqua_L3_SST_MidIR_4km_Day_Daily',
    temporal: true,
    resolution: '4km',
    timeRange: '2002-07-04 to present'
  },
  {
    id: 'modis_sst_night',
    name: 'MODIS Aqua SST (Night)',
    description: 'Mid-infrared nighttime sea surface temperature',
    serviceType: 'GIBS_WMTS',
    identifier: 'MODIS_Aqua_L3_SST_MidIR_4km_Night_Daily',
    temporal: true,
    resolution: '4km',
    timeRange: '2002-07-04 to present'
  },
  {
    id: 'noaa_jpl_mur',
    name: 'NOAA JPL MUR WMS',
    description: 'NOAA CoastWatch JPL MUR SST (fallback)',
    serviceType: 'WMS',
    wmsConfig: {
      url: 'https://coastwatch.pfeg.noaa.gov/erddap/wms/jplMURSST41/request',
      layerName: 'jplMURSST41:analysed_sst'
    },
    temporal: true,
    resolution: '1km',
    timeRange: '2002-06-01 to present'
  }
];

export const NASAWorldWindMap: React.FC<NASAWorldWindMapProps> = ({
  selectedStation,
  stations = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wwdRef = useRef<any>(null);
  const placemarkLayerRef = useRef<any>(null);
  const sstLayerRef = useRef<any>(null);

  const [worldWindLoaded, setWorldWindLoaded] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState<SSTLayerConfig>(SST_LAYERS[0]);
  const [currentDate, setCurrentDate] = useState(
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load WorldWind script
  useEffect(() => {
    // Check if WorldWind is already loaded
    if (window.WorldWind) {
      setWorldWindLoaded(true);
      return;
    }

    // Load WorldWind from CDN
    const script = document.createElement('script');
    script.src = 'https://files.worldwind.arc.nasa.gov/artifactory/web/0.11.0/worldwind.min.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ NASA WorldWind loaded successfully');
      setWorldWindLoaded(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load NASA WorldWind');
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Initialize WorldWind Globe
  useEffect(() => {
    if (!worldWindLoaded || !canvasRef.current || wwdRef.current) return;

    const WorldWind = window.WorldWind;

    console.log('🌍 Initializing NASA WorldWind Globe...');

    try {
      // Create WorldWindow
      const wwd = new WorldWind.WorldWindow(canvasRef.current.id);
      wwdRef.current = wwd;

      // Add base layers - NASA Blue Marble imagery
      wwd.addLayer(new WorldWind.BMNGOneImageLayer());
      wwd.addLayer(new WorldWind.BMNGLandsatLayer());

      // Add atmosphere and stars for visual enhancement
      wwd.addLayer(new WorldWind.AtmosphereLayer());
      wwd.addLayer(new WorldWind.StarFieldLayer());

      // Add compass, coordinates, and view controls
      wwd.addLayer(new WorldWind.CompassLayer());
      wwd.addLayer(new WorldWind.CoordinatesDisplayLayer(wwd));
      wwd.addLayer(new WorldWind.ViewControlsLayer(wwd));

      // Create placemark layer for stations
      const placemarkLayer = new WorldWind.RenderableLayer('Stations');
      placemarkLayer.displayName = 'Oceanographic Stations';
      wwd.addLayer(placemarkLayer);
      placemarkLayerRef.current = placemarkLayer;

      // Set initial view to Brazil coast
      wwd.navigator.lookAtLocation.latitude = -23.5;
      wwd.navigator.lookAtLocation.longitude = -45.0;
      wwd.navigator.range = 2000000; // 2000km altitude

      console.log('✅ NASA WorldWind initialized successfully');
      setLoading(false);

    } catch (error) {
      console.error('❌ Error initializing WorldWind:', error);
      setLoading(false);
    }
  }, [worldWindLoaded]);

  // Add/Update SST Layer
  useEffect(() => {
    if (!wwdRef.current || !worldWindLoaded) return;

    const WorldWind = window.WorldWind;
    const wwd = wwdRef.current;

    // Remove existing SST layer
    if (sstLayerRef.current) {
      wwd.removeLayer(sstLayerRef.current);
      sstLayerRef.current = null;
    }

    console.log(`🌡️ Adding ${selectedLayer.name} for ${currentDate}`);

    if (selectedLayer.serviceType === 'GIBS_WMTS') {
      // NASA GIBS WMTS Layer
      const gibsConfig = {
        identifier: selectedLayer.identifier,
        date: currentDate,
        format: 'image/png',
        transparent: true
      };

      // Build GIBS WMTS URL following official pattern
      // https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{layer}/default/{time}/{resolution}/{z}/{y}/{x}.{format}
      const gibsBaseUrl = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
      const tileMatrixSet = 'GoogleMapsCompatible_Level9';

      const wmtsLayer = new WorldWind.WmtsLayer({
        service: `${gibsBaseUrl}/wmts.cgi?`,
        layerIdentifier: gibsConfig.identifier,
        tileMatrixSet: tileMatrixSet,
        levelZeroDelta: new WorldWind.Location(180, 180),
        numLevels: 10,
        format: gibsConfig.format,
        size: 256,
        // GIBS time parameter
        urlBuilder: {
          urlForTile: function(tile: any, imageFormat: string) {
            const level = tile.level.levelNumber;
            const row = tile.row;
            const col = tile.column;

            // GIBS REST URL pattern
            return `${gibsBaseUrl}/${gibsConfig.identifier}/default/${currentDate}/${tileMatrixSet}/${level}/${row}/${col}.png`;
          }
        }
      }, null);

      wmtsLayer.displayName = selectedLayer.name;
      wmtsLayer.opacity = 0.7;
      wwd.addLayer(wmtsLayer);
      sstLayerRef.current = wmtsLayer;

      console.log(`✅ GIBS WMTS layer added: ${selectedLayer.identifier}`);

    } else if (selectedLayer.serviceType === 'WMS' && selectedLayer.wmsConfig) {
      // WMS Layer (fallback for NOAA data)
      const wmsConfig = WorldWind.WmsLayer.formLayerConfiguration({
        service: selectedLayer.wmsConfig.url,
        layerNames: selectedLayer.wmsConfig.layerName,
        title: selectedLayer.name,
        version: '1.3.0'
      });

      wmsConfig.urlBuilder = {
        urlForTile: function(tile: any, imageFormat: string) {
          const sector = tile.sector;
          const bbox = `${sector.minLongitude},${sector.minLatitude},${sector.maxLongitude},${sector.maxLatitude}`;

          return `${selectedLayer.wmsConfig!.url}?` +
            `SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap` +
            `&LAYERS=${selectedLayer.wmsConfig!.layerName}` +
            `&STYLES=` +
            `&FORMAT=image/png` +
            `&TRANSPARENT=true` +
            `&WIDTH=256&HEIGHT=256` +
            `&CRS=EPSG:4326` +
            `&BBOX=${bbox}` +
            `&TIME=${currentDate}T00:00:00.000Z` +
            `&COLORSCALERANGE=0,32`;
        }
      };

      const wmsLayer = new WorldWind.WmsLayer(wmsConfig);
      wmsLayer.opacity = 0.7;
      wwd.addLayer(wmsLayer);
      sstLayerRef.current = wmsLayer;

      console.log(`✅ WMS layer added: ${selectedLayer.name}`);
    }

    wwd.redraw();

  }, [worldWindLoaded, selectedLayer, currentDate]);

  // Add/Update Station Placemarks
  useEffect(() => {
    if (!placemarkLayerRef.current || !worldWindLoaded) return;

    const WorldWind = window.WorldWind;
    const placemarkLayer = placemarkLayerRef.current;

    // Clear existing placemarks
    placemarkLayer.removeAllRenderables();

    stations.forEach(station => {
      const isSelected = selectedStation && station.id === selectedStation.id;

      // Placemark attributes
      const placemarkAttributes = new WorldWind.PlacemarkAttributes(null);
      placemarkAttributes.imageScale = isSelected ? 0.8 : 0.5;
      placemarkAttributes.imageColor = isSelected
        ? WorldWind.Color.YELLOW
        : (station.status === 'critical' ? WorldWind.Color.RED : WorldWind.Color.CYAN);

      // Use NASA's default pushpin image
      placemarkAttributes.imageSource = WorldWind.configuration.baseUrl +
        (station.status === 'critical'
          ? 'images/pushpins/castshadow-red.png'
          : 'images/pushpins/castshadow-blue.png');

      placemarkAttributes.labelAttributes.color = WorldWind.Color.WHITE;
      placemarkAttributes.labelAttributes.offset = new WorldWind.Offset(
        WorldWind.OFFSET_FRACTION, 0.5,
        WorldWind.OFFSET_FRACTION, 1.5
      );

      // Create placemark
      const position = new WorldWind.Position(
        station.latitude,
        station.longitude,
        0 // Altitude in meters
      );

      const placemark = new WorldWind.Placemark(position, false, placemarkAttributes);
      placemark.label = station.name || `Station ${station.id}`;
      placemark.alwaysOnTop = true;

      placemarkLayer.addRenderable(placemark);
    });

    wwdRef.current?.redraw();

  }, [worldWindLoaded, stations, selectedStation]);

  // Navigate to selected station
  useEffect(() => {
    if (!wwdRef.current || !selectedStation || !worldWindLoaded) return;

    const wwd = wwdRef.current;

    // Animate to selected station
    wwd.goTo(new window.WorldWind.Position(
      selectedStation.latitude,
      selectedStation.longitude,
      500000 // 500km altitude for close view
    ));

  }, [selectedStation, worldWindLoaded]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-black rounded-lg overflow-hidden border border-slate-800">
      {/* Canvas for WorldWind */}
      <canvas
        ref={canvasRef}
        id="worldwind-canvas"
        className="w-full h-full"
        style={{ cursor: 'grab' }}
      >
        Your browser does not support HTML5 Canvas.
      </canvas>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-ocean-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300 text-sm">Loading NASA WorldWind...</p>
          </div>
        </div>
      )}

      {/* Layer Selection Panel */}
      {worldWindLoaded && (
        <div className="absolute top-4 left-4 z-[1000]">
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className="px-4 py-3 bg-slate-900/95 backdrop-blur-md rounded-lg border border-ocean-500/30 shadow-lg flex items-center gap-2 hover:bg-slate-800/95 transition-colors mb-2"
          >
            <span className="text-ocean-400 text-lg">🛰️</span>
            <div className="flex flex-col items-start">
              <span className="text-xs font-semibold text-slate-200">SST Layer</span>
              <span className="text-[10px] text-slate-400">{selectedLayer.name}</span>
            </div>
            <span className="text-slate-400 text-sm ml-2">
              {showLayerPanel ? '▼' : '▶'}
            </span>
          </button>

          {showLayerPanel && (
            <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200 max-w-xs">
              {SST_LAYERS.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => {
                    setSelectedLayer(layer);
                    setShowLayerPanel(false);
                  }}
                  className={`px-4 py-3 rounded-lg text-left transition-all ${
                    selectedLayer.id === layer.id
                      ? 'bg-ocean-500 text-white shadow-lg'
                      : 'bg-slate-900/95 backdrop-blur-md border border-slate-700 text-slate-300 hover:bg-slate-800/95'
                  }`}
                >
                  <div className="text-xs font-semibold mb-1">{layer.name}</div>
                  <div className="text-[10px] opacity-70">
                    {layer.resolution} | {layer.serviceType}
                  </div>
                  <div className="text-[9px] opacity-60 mt-1">
                    {layer.description}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Date Selector */}
      {worldWindLoaded && (
        <div className="absolute top-4 right-4 bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-lg border border-ocean-500/30 shadow-lg z-[1000]">
          <label className="block text-[10px] text-slate-400 mb-1">Date</label>
          <input
            type="date"
            value={currentDate}
            onChange={(e) => setCurrentDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
          />
        </div>
      )}

      {/* Info Panel */}
      {worldWindLoaded && (
        <div className="absolute bottom-4 right-4 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-ocean-500/30 shadow-lg z-[1000]">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            🌍 NASA WorldWind
          </h4>
          <div className="text-xs text-slate-300 space-y-1">
            <div>📅 {currentDate}</div>
            <div>🛰️ {selectedLayer.resolution}</div>
            <div className="text-[10px] text-slate-400 mt-2">
              3D Interactive Globe
            </div>
          </div>
        </div>
      )}

      {/* Controls Info */}
      {worldWindLoaded && (
        <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-md px-3 py-2 rounded-lg border border-ocean-500/30 shadow-lg z-[1000]">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Controls
          </h4>
          <div className="text-[10px] text-slate-300 space-y-1">
            <div>🖱️ Drag: Rotate globe</div>
            <div>⚙️ Scroll: Zoom in/out</div>
            <div>⌨️ Shift+Drag: Tilt view</div>
          </div>
        </div>
      )}
    </div>
  );
};
