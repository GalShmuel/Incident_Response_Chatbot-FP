import React from 'react';
import { Bar } from 'react-chartjs-2';

const TopOffendersChart = ({ data, options }) => (
  <>
    <h3 style={{ marginBottom: 16 }}>Top Offenders</h3>
    <Bar data={data} options={options} />
  </>
);

export default TopOffendersChart; 