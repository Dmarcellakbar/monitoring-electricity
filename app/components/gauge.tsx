/* eslint-disable */

import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

export default function Gauge({ value, max = 100, metric = '' }: any) {
  const [size, setSize] = useState('35dvh');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 600) {
        setSize('50vw'); // Mobile
      } else if (width < 1024) {
        setSize('40vw'); // Tablet
      } else {
        setSize('35dvh'); // PC
      }
    };

    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const optionGauge = {
    tooltip: {
      formatter: '{a} <br/>{b} : {c}%'
    },
    series: [
      {
        name: 'Performance',
        type: 'gauge',
        max: max,
        detail: {
          formatter: `{value}${metric}`,
          fontSize: 25,
          color: '#1EC997'
        },
        axisLine: {
          lineStyle: {
            width: 10,
            color: [
              [0.2, '#80FFA5'],
              [0.8, '#00DDFF'],
              [1, '#FF0087']
            ]
          },
        },
        axisLabel: {
          color: '#1EC997',
          fontSize: 12
        },
        data: [
          {
            value: value || 0,
            name: '',
            itemStyle: {
              color: '#1EC997'
            }
          }
        ]
      }
    ]
  };

  return (
    <div style={{ height: size, width: size, zIndex: 1 }}>
      <ReactECharts option={optionGauge} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
