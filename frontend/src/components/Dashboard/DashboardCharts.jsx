import React, { useMemo, useState } from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
} from 'chart.js';
import './DashboardCharts.css';
import AlertsTrendChart from '../AlertGraphs/Trends/AlertsTrendChart';
import TopOffendersChart from '../AlertGraphs/Trends/TopOffendersChart';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const COLORS = [
  '#4F8EF7', // blue
  '#43C59E', // green
  '#FFB547', // orange
  '#F45B69', // red
  '#845EC2', // purple
  '#2EC4B6', // teal
  '#FFD166', // yellow
  '#6D7278', // gray
];

const DashboardCharts = ({ findings, onFilteredAlerts }) => {
  const [selectedSeverityRanges, setSelectedSeverityRanges] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Alerts Level Evolution (Line/Area Chart)
  const lineData = useMemo(() => {
    // Group by hour
    const counts = {};
    findings.forEach(f => {
      const date = new Date(f.UpdatedAt || f.CreatedAt);
      if (isNaN(date.getTime())) return;
      const hour = date.toLocaleString('en-US', {
        year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false
      });
      counts[hour] = (counts[hour] || 0) + 1;
    });
    const labels = Object.keys(counts).sort((a, b) => new Date(a) - new Date(b));
    return {
      labels,
      datasets: [
        {
          label: 'Alerts',
          data: labels.map(l => counts[l]),
          fill: true,
          backgroundColor: 'rgba(102,192,197,0.15)',
          borderColor: '#66c0c5',
          tension: 0.3,
          pointRadius: 2,
        }
      ]
    };
  }, [findings]);

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Alerts Level Evolution' }
    },
    scales: {
      x: { title: { display: true, text: 'Time (by hour)' }, ticks: { maxRotation: 45, minRotation: 0 } },
      y: { title: { display: true, text: 'Alert Count' }, beginAtZero: true }
    }
  };

  // MITRE ATT&CK Donut Chart
  const mitreData = useMemo(() => {
    const counts = {};
    findings.forEach(f => {
      const type = (f.Type || '').split(':')[0] || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 6);
    return {
      labels: top.map(([type]) => type),
      datasets: [
        {
          data: top.map(([, count]) => count),
          backgroundColor: COLORS.slice(0, top.length),
          borderWidth: 2,
        }
      ]
    };
  }, [findings]);

  const mitreOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' },
      title: { display: true, text: 'MITRE ATTACK (by Type)' }
    }
  };

  // Alerts Trend Over Time (by day)
  const trendData = useMemo(() => {
    const counts = {};
    findings.forEach(f => {
      const date = new Date(f.UpdatedAt || f.CreatedAt);
      if (isNaN(date.getTime())) return;
      const day = date.toLocaleDateString('en-CA'); // YYYY-MM-DD
      counts[day] = (counts[day] || 0) + 1;
    });
    const labels = Object.keys(counts).sort((a, b) => new Date(a) - new Date(b));
    return {
      labels,
      datasets: [
        {
          label: 'Alerts',
          data: labels.map(l => counts[l]),
          fill: true,
          backgroundColor: 'rgba(102,192,197,0.15)',
          borderColor: '#66c0c5',
          tension: 0.3,
          pointRadius: 2,
        }
      ]
    };
  }, [findings]);

  const trendOptions = {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: true, text: 'Alerts Trend (Daily)' } },
    scales: { x: { title: { display: true, text: 'Date' } }, y: { beginAtZero: true } }
  };

  // Top Offenders (Top 3 IPs)
  const topOffenderData = useMemo(() => {
    const ipCounts = {};
    findings.forEach(f => {
      const ip = f.Service?.Action?.AwsApiCallAction?.RemoteIpDetails?.IpAddressV4 ||
                 f.Service?.Action?.NetworkConnectionAction?.RemoteIpDetails?.IpAddressV4;
      if (ip) ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    });
    const sorted = Object.entries(ipCounts).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 3);
    return {
      labels: top.map(([ip]) => ip),
      datasets: [
        {
          label: 'Alert Count',
          data: top.map(([, count]) => count),
          backgroundColor: COLORS.slice(0, top.length),
        }
      ]
    };
  }, [findings]);

  const topOffenderOptions = {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: true, text: 'Top Offenders (IPs)' } },
    scales: { y: { beginAtZero: true } }
  };

  // Check if severity is in selected range
  const isInSelectedRange = (severity) => {
    if (selectedSeverityRanges.length === 0) return true;
    return selectedSeverityRanges.some(range => {
      const [min, max] = range;
      return severity >= min && severity <= max;
    });
  };

  // World map geoData with severity filtering
  const geoData = React.useMemo(() => {
    return findings.reduce((acc, f) => {
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
            actionType: f.Service?.Action?.ActionType || 'Unknown',
            findings: [], // Store all findings for this location
            // Additional details
            asn: d.Organization?.Asn || 'Unknown',
            asnOrg: d.Organization?.AsnOrg || 'Unknown',
            isp: d.Organization?.Isp || 'Unknown',
            geoLocation: d.GeoLocation
          };
        }
        acc[k].ips.add(d.IpAddressV4);
        acc[k].count++;
        acc[k].findings.push(f); // Add this finding to the location's findings array
      }
      return acc;
    }, {});
  }, [findings, selectedSeverityRanges]);

  const getSeverityColor = (severity) => {
    const num = typeof severity === 'string' ? parseInt(severity) : severity;
    const colors = {
      1: '#00C851', 2: '#7CB342', 3: '#CDDC39', 4: '#FFEB3B', 5: '#FFC107',
      6: '#FF9800', 7: '#FF5722', 8: '#F44336', 9: '#D32F2F', 10: '#B22222'
    };
    return colors[num] || '#00C851';
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

  // Handle severity range toggle
  const handleSeverityToggle = (range) => {
    setSelectedSeverityRanges(prev => {
      const rangeExists = prev.some(r => r[0] === range[0] && r[1] === range[1]);
      if (rangeExists) {
        return prev.filter(r => !(r[0] === range[0] && r[1] === range[1]));
      }
      return [...prev, range];
    });
    setSelectedLocation(null); // Clear location selection when changing severity
  };

  // Check if a severity range is selected
  const isRangeSelected = (range) => {
    return selectedSeverityRanges.some(r => r[0] === range[0] && r[1] === range[1]);
  };

  // Handle location click from the popup button
  const handleLocationClick = (locationKey, locationData) => {
    setSelectedLocation(locationKey);
    
    // Call the callback to update the alerts view
    if (onFilteredAlerts) {
      const filteredFindings = locationData.findings.filter(f => isInSelectedRange(f.Severity));
      onFilteredAlerts(filteredFindings, `Location: ${locationData.city}, ${locationData.country}`);
    }
  };

  // Handle severity legend click
  const handleSeverityLegendClick = (range) => {
    handleSeverityToggle(range);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedSeverityRanges([]);
    setSelectedLocation(null);
    if (onFilteredAlerts) {
      onFilteredAlerts(null, null);
    }
  };

  // Map helper for fitting bounds and fixing resize issues
  const MapComponent = ({ geoData }) => {
    const map = useMap();
    React.useEffect(() => {
      if (!map || !geoData || Object.keys(geoData).length === 0) return;
      // Fit bounds
      try {
        const bounds = L.latLngBounds(
          Object.values(geoData).map(loc => [loc.lat, loc.lon])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch (error) {
        // ignore
      }
      // Fix map rendering after resize/layout change
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }, [map, geoData]);
    // Also fix on window resize
    React.useEffect(() => {
      if (!map) return;
      const handleResize = () => map.invalidateSize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [map]);
    return null;
  };

  return (
    <div className="dashboard-charts-grid">
      <div className="dashboard-chart dashboard-chart-main">
        <h3>Attack Source Locations</h3>
        {Object.keys(geoData).length === 0 ? (
          <div className="map-placeholder"><p>No location data available</p></div>
        ) : (
          <>
            <MapContainer center={[0, 0]} zoom={2} style={{ height: '320px', width: '100%' }}>
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
                      <div className="map-popup-content">
                        <p>
                          <strong>Location:</strong>
                          <span>
                            {data.city && data.city !== 'Unknown' 
                              ? `${data.city}, ${data.country}` 
                              : data.country !== 'Unknown'
                                ? data.country
                                : 'Not Available'
                            }
                          </span>
                        </p>
                        <p>
                          <strong>Alert Count:</strong>
                          <span>{data.count}</span>
                        </p>
                        <button 
                          className="view-alerts-btn"
                          onClick={() => handleLocationClick(key, data)}
                        >
                          View Alerts ({data.count})
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              <MapComponent geoData={geoData} />
            </MapContainer>
            
            {/* Severity Level Legend */}
            <div className="map-legend">
              <div className="legend-header">
                <h4>Filter by Severity Level</h4>
              </div>
              <div className="severity-legend">
                <div 
                  className={`legend-item ${isRangeSelected([1, 2]) ? 'active' : ''}`}
                  onClick={() => handleSeverityLegendClick([1, 2])} 
                  style={{cursor: 'pointer'}}
                >
                  <span className="legend-color low"></span>
                  <span>Low (1-2)</span>
                </div>
                <div 
                  className={`legend-item ${isRangeSelected([3, 4]) ? 'active' : ''}`}
                  onClick={() => handleSeverityLegendClick([3, 4])} 
                  style={{cursor: 'pointer'}}
                >
                  <span className="legend-color medium"></span>
                  <span>Medium (3-4)</span>
                </div>
                <div 
                  className={`legend-item ${isRangeSelected([5, 7]) ? 'active' : ''}`}
                  onClick={() => handleSeverityLegendClick([5, 7])} 
                  style={{cursor: 'pointer'}}
                >
                  <span className="legend-color high"></span>
                  <span>High (5-7)</span>
                </div>
                <div 
                  className={`legend-item ${isRangeSelected([8, 10]) ? 'active' : ''}`}
                  onClick={() => handleSeverityLegendClick([8, 10])} 
                  style={{cursor: 'pointer'}}
                >
                  <span className="legend-color critical"></span>
                  <span>Critical (8-10)</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      <div className="dashboard-chart dashboard-chart-offenders">
        <TopOffendersChart
          data={topOffenderData}
          options={topOffenderOptions}
        />
      </div>
      <div className="dashboard-chart dashboard-chart-evolution">
        <Line data={lineData} options={lineOptions} />
      </div>
      <div className="dashboard-chart dashboard-chart-mitre">
        <Doughnut data={mitreData} options={mitreOptions} />
      </div>
    </div>
  );
};

export default DashboardCharts; 