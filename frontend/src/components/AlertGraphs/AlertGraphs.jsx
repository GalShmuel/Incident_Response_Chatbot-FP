import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './AlertGraphs.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = ({ geoData }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !geoData || Object.keys(geoData).length === 0) return;

    try {
      const bounds = L.latLngBounds(
        Object.values(geoData).map(loc => [loc.lat, loc.lon])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } catch (error) {
      console.error('Error setting map bounds:', error);
    }
  }, [map, geoData]);

  return null;
};

const AlertGraphs = ({ findings }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeverityRanges, setSelectedSeverityRanges] = useState([]);

  useEffect(() => {
    if (findings) {
      setLoading(false);
    }
  }, [findings]);

  if (loading) {
    return (
      <div className="alert-graphs">
        <div className="graph-container">
          <h3>Loading findings data...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-graphs">
        <div className="graph-container">
          <h3>Error: {error}</h3>
          <p>Please check:</p>
          <ul>
            <li>Is the backend server running?</li>
            <li>Is the backend server running on port 5000?</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!Array.isArray(findings)) {
    return (
      <div className="alert-graphs">
        <div className="graph-container">
          <h3>Error: Invalid findings data format</h3>
        </div>
      </div>
    );
  }

  const validFindings = findings.filter(f => {
    const date = new Date(f.UpdatedAt);
    return !isNaN(date.getTime());
  });

  const severityCounts = validFindings.reduce((acc, f) => {
    acc[f.Severity] = (acc[f.Severity] || 0) + 1;
    return acc;
  }, {});

  const isInSelectedRange = (severity) => {
    return selectedSeverityRanges.some(range => {
      const [min, max] = range;
      return severity >= min && severity <= max;
    });
  };

  const geoData = validFindings.reduce((acc, f) => {
    // Skip if severity filter is active and this finding doesn't match any selected range
    if (selectedSeverityRanges.length > 0 && !isInSelectedRange(f.Severity)) {
      return acc;
    }

    const d = f.Service?.Action?.AwsApiCallAction?.RemoteIpDetails ||
              f.Service?.Action?.NetworkConnectionAction?.RemoteIpDetails ||
              f.Service?.Action?.PortProbeAction?.RemoteIpDetails ||
              f.Service?.Action?.DnsRequestAction?.RemoteIpDetails;
    if (d?.GeoLocation?.Lat && d?.GeoLocation?.Lon) {
      const k = `${d.GeoLocation.Lat},${d.GeoLocation.Lon}`;
      if (!acc[k]) {
        acc[k] = {
          lat: d.GeoLocation.Lat,
          lon: d.GeoLocation.Lon,
          country: d.Country?.CountryName || 'Unknown',
          city: d.City?.CityName || 'Unknown',
          ips: new Set(),
          count: 0,
          severity: f.Severity,
          organization: d.Organization?.Org || 'Unknown',
          actionType: f.Service?.Action?.ActionType || 'Unknown'
        };
      }
      acc[k].ips.add(d.IpAddressV4);
      acc[k].count++;
    }
    return acc;
  }, {});

  const timeData = validFindings.reduce((acc, f) => {
    const date = new Date(f.UpdatedAt);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const sortedDates = Object.keys(timeData).sort((a, b) => new Date(a) - new Date(b));

  const getSeverityColor = (severity) => {
    const num = typeof severity === 'string' ? parseInt(severity) : severity;
    // Color gradient from green (low) to red (high)
    const colors = {
      1: '#00C851',  // Bright Green
      2: '#7CB342',  // Light Green
      3: '#CDDC39',  // Lime
      4: '#FFEB3B',  // Yellow
      5: '#FFC107',  // Amber
      6: '#FF9800',  // Orange
      7: '#FF5722',  // Deep Orange
      8: '#F44336',  // Red
      9: '#D32F2F',  // Dark Red
      10: '#B22222'  // Firebrick
    };
    return colors[num] || '#00C851'; // Default to green if severity is out of range
  };

  const severityPieData = {
    labels: Object.keys(severityCounts),
    datasets: [{
      label: 'Alerts by Severity',
      data: Object.values(severityCounts),
      backgroundColor: Object.keys(severityCounts).map(severity => getSeverityColor(severity)),
      borderColor: '#ff452',
      borderWidth: 1,
    }]
  };

  const timeChartData = {
    labels: sortedDates,
    datasets: [{
      label: 'Alerts per Day',
      data: sortedDates.map(date => timeData[date]),
      backgroundColor: 'rgba(102, 192, 197, 0.6)',
      borderColor: '#000000',
      borderWidth: 1
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Alert Distribution' },
      datalabels: { display: false }
    },
    scales: {
      x: { ticks: { maxRotation: 45, minRotation: 45 } },
      y: { ticks: { display: false } }
    }
  };

  const createSeverityIcon = (severity) => {
    const color = getSeverityColor(severity);
    return L.divIcon({ 
      className: 'custom-marker',
      html: `<div style="
        background:${color};
        width:14px;
        height:14px;
        border-radius:50%;
        border:3px solid #000000;
        box-shadow:0 0 6px rgba(0,0,0,0.7);
        position:relative;
        z-index:1;
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  const handleSeverityToggle = (range) => {
    setSelectedSeverityRanges(prev => {
      const rangeExists = prev.some(r => r[0] === range[0] && r[1] === range[1]);
      if (rangeExists) {
        return prev.filter(r => !(r[0] === range[0] && r[1] === range[1]));
      }
      return [...prev, range];
    });
  };

  const isRangeSelected = (range) => {
    return selectedSeverityRanges.some(r => r[0] === range[0] && r[1] === range[1]);
  };

  const renderMap = () => {
    if (!geoData || Object.keys(geoData).length === 0) {
      return (
        <div className="map-placeholder">
          <p>No location data available</p>
        </div>
      );
    }

    return (
      <MapContainer
        center={[0, 0]}
        zoom={2}
        style={{ height: '400px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {Object.entries(geoData).map(([key, data]) => (
          <Marker
            key={key}
            position={[data.lat, data.lon]}
            icon={createSeverityIcon(data.severity)}
          >
            <Popup>
              <div className="map-popup">
                <h4>Location Details</h4>
                <p><strong>Country:</strong> {data.country}</p>
                <p><strong>City:</strong> {data.city}</p>
                <p><strong>Organization:</strong> {data.organization}</p>
                <p><strong>Action Type:</strong> {data.actionType}</p>
                <p><strong>Alert Count:</strong> {data.count}</p>
                <p><strong>IP Addresses:</strong></p>
                <ul>
                  {Array.from(data.ips).map(ip => (
                    <li key={ip}>{ip}</li>
                  ))}
                </ul>
              </div>
            </Popup>
          </Marker>
        ))}
        <MapComponent geoData={geoData} />
      </MapContainer>
    );
  };

  return (
    <div className="alert-graphs">
      {validFindings.length === 0 ? (
        <div className="graph-container">
          <h3>No findings data available</h3>
        </div>
      ) : (
        <>
          <div className="graph-container map-container">
            <h3>Attack Source Locations</h3>
            <div className="map-summary">
              <p>Total Alerts: {Object.values(geoData).reduce((sum, loc) => sum + loc.count, 0)}</p>
              <p>Unique Locations: {Object.keys(geoData).length}</p>
            </div>
            {renderMap()}
            <div className="map-legend">
              <div 
                className={`legend-item ${isRangeSelected([1, 2]) ? 'active' : ''}`}
                onClick={() => handleSeverityToggle([1, 2])} 
                style={{cursor: 'pointer'}}
              >
                <span className="legend-color low"></span>
                <span>Low (1-2)</span>
              </div>
              <div 
                className={`legend-item ${isRangeSelected([3, 4]) ? 'active' : ''}`}
                onClick={() => handleSeverityToggle([3, 4])} 
                style={{cursor: 'pointer'}}
              >
                <span className="legend-color medium"></span>
                <span>Medium (3-4)</span>
              </div>
              <div 
                className={`legend-item ${isRangeSelected([5, 7]) ? 'active' : ''}`}
                onClick={() => handleSeverityToggle([5, 7])} 
                style={{cursor: 'pointer'}}
              >
                <span className="legend-color high"></span>
                <span>High (5-7)</span>
              </div>
              <div 
                className={`legend-item ${isRangeSelected([8, 10]) ? 'active' : ''}`}
                onClick={() => handleSeverityToggle([8, 10])} 
                style={{cursor: 'pointer'}}
              >
                <span className="legend-color critical"></span>
                <span>Critical (8-10)</span>
              </div>
            </div>
          </div>

          <div className="graph-container">
            <h3>Severity Distribution (Pie)</h3>
            <Pie data={severityPieData} options={options} />
          </div>

          <div className="graph-container">
            <h3>Alerts Over Time</h3>
            <Bar data={timeChartData} options={options} />
          </div>
        </>
      )}
    </div>
  );
};

export default AlertGraphs;
