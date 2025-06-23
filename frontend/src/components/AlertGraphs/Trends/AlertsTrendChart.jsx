import React from 'react';
import { Line } from 'react-chartjs-2';

const AlertsTrendChart = ({ data, options }) => (
  <>
    <h3 style={{ marginBottom: 16 }}>Alerts Trend Over Time</h3>
    <Line data={data} options={options} />
  </>
);

export default AlertsTrendChart; 