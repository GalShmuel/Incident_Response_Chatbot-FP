import React, { useState, useEffect, useMemo } from 'react';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
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
import './Analytics.css';
import { FaBell, FaExclamationTriangle, FaFireAlt, FaGlobe, FaFlag, FaChartLine } from 'react-icons/fa';

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

const Analytics = () => {
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/findings');
        if (!response.ok) {
          throw new Error('Failed to fetch findings');
        }
        const data = await response.json();
        setFindings(data.findings || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching findings:', error);
        setLoading(false);
      }
    };

    fetchFindings();
  }, []);

  // Threat Type Distribution
  const threatTypeData = useMemo(() => {
    const threatCounts = {};
    findings.forEach(finding => {
      const type = finding.Type?.split(':')[0] || 'Other';
      threatCounts[type] = (threatCounts[type] || 0) + 1;
    });

    const sortedTypes = Object.entries(threatCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      labels: sortedTypes.map(([type]) => type),
      datasets: [{
        data: sortedTypes.map(([, count]) => count),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ],
        borderWidth: 2,
      }]
    };
  }, [findings]);

  // Geographic Threat Distribution
  const geographicData = useMemo(() => {
    const countryCounts = {};
    findings.forEach(finding => {
      const country = finding.Service?.Action?.NetworkConnectionAction?.RemoteIpDetails?.Country?.CountryName || 'Unknown';
      countryCounts[country] = (countryCounts[country] || 0) + 1;
    });

    const sortedCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      labels: sortedCountries.map(([country]) => country),
      datasets: [{
        label: 'Threats by Country',
        data: sortedCountries.map(([, count]) => count),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      }]
    };
  }, [findings]);

  // Severity Trend Over Time
  const severityTrendData = useMemo(() => {
    const timeData = {};
    findings.forEach(finding => {
      const date = new Date(finding.CreatedAt);
      const day = date.toLocaleDateString('en-CA');
      if (!timeData[day]) {
        timeData[day] = { total: 0, high: 0, critical: 0 };
      }
      timeData[day].total += 1;
      if (finding.Severity >= 8) {
        timeData[day].critical += 1;
      } else if (finding.Severity >= 6) {
        timeData[day].high += 1;
      }
    });

    const sortedDays = Object.keys(timeData).sort();
    
    return {
      labels: sortedDays,
      datasets: [
        {
          label: 'Total Alerts',
          data: sortedDays.map(day => timeData[day].total),
          borderColor: '#36A2EB',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          fill: true,
        },
        {
          label: 'High Severity (6-7)',
          data: sortedDays.map(day => timeData[day].high),
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          fill: true,
        },
        {
          label: 'Critical Severity (8+)',
          data: sortedDays.map(day => timeData[day].critical),
          borderColor: '#F44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          fill: true,
        }
      ]
    };
  }, [findings]);

  // Network Protocol Analysis
  const protocolData = useMemo(() => {
    const protocolCounts = {};
    findings.forEach(finding => {
      const protocol = finding.Service?.Action?.NetworkConnectionAction?.Protocol || 'Unknown';
      protocolCounts[protocol] = (protocolCounts[protocol] || 0) + 1;
    });

    return {
      labels: Object.keys(protocolCounts),
      datasets: [{
        data: Object.values(protocolCounts),
        backgroundColor: ['#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'],
        borderWidth: 2,
      }]
    };
  }, [findings]);

  // Top Threat Sources
  const threatSourcesData = useMemo(() => {
    const sourceCounts = {};
    findings.forEach(finding => {
      const ip = finding.Service?.Action?.NetworkConnectionAction?.RemoteIpDetails?.IpAddressV4;
      const org = finding.Service?.Action?.NetworkConnectionAction?.RemoteIpDetails?.Organization?.Org;
      const source = org || ip || 'Unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    const sortedSources = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      labels: sortedSources.map(([source]) => source.length > 20 ? source.substring(0, 20) + '...' : source),
      datasets: [{
        label: 'Threats by Source',
        data: sortedSources.map(([, count]) => count),
        backgroundColor: 'rgba(255, 99, 132, 0.8)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      }]
    };
  }, [findings]);

  // Security Metrics Summary
  const securityMetrics = useMemo(() => {
    const totalAlerts = findings.length;
    const criticalAlerts = findings.filter(f => f.Severity >= 8).length;
    const highAlerts = findings.filter(f => f.Severity >= 6 && f.Severity < 8).length;
    const uniqueIPs = new Set(findings.map(f => 
      f.Service?.Action?.NetworkConnectionAction?.RemoteIpDetails?.IpAddressV4
    ).filter(Boolean)).size;
    const uniqueCountries = new Set(findings.map(f => 
      f.Service?.Action?.NetworkConnectionAction?.RemoteIpDetails?.Country?.CountryName
    ).filter(Boolean)).size;

    return {
      totalAlerts,
      criticalAlerts,
      highAlerts,
      uniqueIPs,
      uniqueCountries,
      avgSeverity: totalAlerts > 0 ? (findings.reduce((sum, f) => sum + (f.Severity || 0), 0) / totalAlerts).toFixed(1) : 0
    };
  }, [findings]);

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1>Security Analytics</h1>
        <p>Comprehensive security insights and threat intelligence</p>
      </div>

      {/* Security Metrics Cards */}
      <div className="metrics-grid" style={{ marginBottom: 48 }}>
        <div className="metric-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <span className="metric-icon" style={{ color: '#36A2EB' }}><FaBell /></span>
          <h3>Total Alerts</h3>
          <div className="metric-value-with-icon">{securityMetrics.totalAlerts}</div>
        </div>
        <div className="metric-card critical" style={{ position: 'relative', overflow: 'hidden' }}>
          <span className="metric-icon" style={{ color: '#F44336' }}><FaExclamationTriangle /></span>
          <h3>Critical Alerts</h3>
          <div className="metric-value-with-icon">{securityMetrics.criticalAlerts}</div>
        </div>
        <div className="metric-card high" style={{ position: 'relative', overflow: 'hidden' }}>
          <span className="metric-icon" style={{ color: '#FF9800' }}><FaFireAlt /></span>
          <h3>High Severity</h3>
          <div className="metric-value-with-icon">{securityMetrics.highAlerts}</div>
        </div>
        <div className="metric-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <span className="metric-icon" style={{ color: '#4BC0C0' }}><FaGlobe /></span>
          <h3>Unique Threat IPs</h3>
          <div className="metric-value-with-icon">{securityMetrics.uniqueIPs}</div>
        </div>
        <div className="metric-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <span className="metric-icon" style={{ color: '#9966FF' }}><FaFlag /></span>
          <h3>Countries Affected</h3>
          <div className="metric-value-with-icon">{securityMetrics.uniqueCountries}</div>
        </div>
        <div className="metric-card" style={{ position: 'relative', overflow: 'hidden' }}>
          <span className="metric-icon" style={{ color: '#FFCE56' }}><FaChartLine /></span>
          <h3>Avg Severity</h3>
          <div className="metric-value-with-icon">{securityMetrics.avgSeverity}</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Threat Type Distribution</h3>
          <Doughnut data={threatTypeData} options={{
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
          }} />
        </div>

        <div className="chart-card">
          <h3>Geographic Threat Distribution</h3>
          <Bar data={geographicData} options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }} />
        </div>

        <div className="chart-card full-width">
          <h3>Severity Trend Over Time</h3>
          <Line data={severityTrendData} options={{
            responsive: true,
            plugins: { legend: { position: 'top' } },
            scales: { y: { beginAtZero: true } }
          }} />
        </div>

        <div className="chart-card">
          <h3>Network Protocol Analysis</h3>
          <Pie data={protocolData} options={{
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
          }} />
        </div>

        <div className="chart-card">
          <h3>Top Threat Sources</h3>
          <Bar data={threatSourcesData} options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true } }
          }} />
        </div>
      </div>
    </div>
  );
};

export default Analytics; 