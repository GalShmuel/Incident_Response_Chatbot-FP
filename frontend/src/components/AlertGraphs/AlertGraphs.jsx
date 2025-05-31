import React, { useState } from 'react';
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
  React.useEffect(() => {
    if (Object.keys(geoData).length > 0) {
      const bounds = L.latLngBounds(Object.values(geoData).map(loc => [loc.lat, loc.lon]));
      map.fitBounds(bounds);
    }
  }, [map, geoData]);
  return null;
};

const AlertGraphs = ({ findings }) => {
  const [selectedSeverityRanges, setSelectedSeverityRanges] = useState([]);

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

  const severityPieData = {
    labels: Object.keys(severityCounts),
    datasets: [{
      label: 'Alerts by Severity',
      data: Object.values(severityCounts),
      backgroundColor: ['#a8dd94', '#dc7a17', '#e23f3f'],
      borderColor: ['#2d601b', '#784919', '#872323'],
      borderWidth: 1,
    }]
  };

  const timeChartData = {
    labels: sortedDates,
    datasets: [{
      label: 'Alerts per Day',
      data: sortedDates.map(date => timeData[date]),
      backgroundColor: 'rgba(24, 98, 148, 0.6)',
      borderColor: 'rgb(22, 46, 62)',
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
    const num = typeof severity === 'string' ? parseInt(severity) : severity;
    let color = '#00C851'; //green
    if (num >= 8) color = '#ff4444'; //red
    else if (num >= 5) color = '#ffbb33'; //orange
    else if (num >= 3) color = '#ffeb3b'; //yellow
    return L.divIcon({ 
      className: 'custom-marker',
      html: `<div style="background:${color};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,0.5);"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
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

  return (
    <div className="alert-graphs">
      <div className="graph-container map-container">
        <h3>Attack Source Locations</h3>
        <div className="map-summary">
          <p>Total Alerts: {Object.values(geoData).reduce((sum, loc) => sum + loc.count, 0)}</p>
          <p>Unique Locations: {Object.keys(geoData).length}</p>
        </div>
        <MapContainer center={[31.9642, 34.7876]} zoom={6} style={{ height: '400px', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <MapComponent geoData={geoData} />
          {Object.values(geoData).map((loc, i) => (
            <Marker key={i} position={[loc.lat, loc.lon]} icon={createSeverityIcon(loc.severity)}>
              <Popup>
                <div>
                  <h4>{loc.city}, {loc.country}</h4>
                  <p>Attack Count: {loc.count}</p>
                  <p>Severity: {loc.severity}/10</p>
                  <p>Action Type: {loc.actionType}</p>
                  <p>Organization: {loc.organization}</p>
                  <p>IP Addresses:</p>
                  <ul>{Array.from(loc.ips).map((ip, j) => <li key={j}>{ip}</li>)}</ul>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
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
    </div>
  );
};

export default AlertGraphs;
