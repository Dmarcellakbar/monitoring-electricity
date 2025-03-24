import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';

interface ChartData {
  power_1: number[] | string[];
  power_2: number[] | string[];
  xAxis: string[];
}

export default function Grafik({ data }: { data: ChartData }) {
  // Konversi string ke angka
  const power1Data = data?.power_1.map(Number) ?? [];
  const power2Data = data?.power_2.map(Number) ?? [];
  const xAxisData = data?.xAxis ?? [];

  // Cek apakah hanya ada satu data pada xAxis
  const isSingleDataPoint = xAxisData.length === 1;

  const optionWave = {
    color: ['#80FFA5', '#FFBF00'],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: isSingleDataPoint ? 'shadow' : 'cross',
        label: {
          backgroundColor: '#6a7985',
          fontSize: 10
        }
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: isSingleDataPoint,
      data: xAxisData,
      axisLabel: { 
        color: "#1EC997", 
        fontSize: xAxisData.length > 20 ? 5 : 10,
        interval: 0, // Tampilkan semua label
        rotate: xAxisData.length > 20 ? 60 : 0 // Putar jika terlalu banyak label
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: "#1EC997", fontSize: 10 },
    },
    series: [
      {
        name: 'Power 1',
        type: isSingleDataPoint ? 'bar' : 'line',
        smooth: !isSingleDataPoint,
        showSymbol: !isSingleDataPoint,
        barWidth: isSingleDataPoint ? '40%' : undefined,
        areaStyle: !isSingleDataPoint
          ? {
              opacity: 0.8,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgb(128, 255, 165)' },
                { offset: 1, color: 'rgb(1, 191, 236)' }
              ])
            }
          : undefined,
        emphasis: { focus: 'series' },
        data: power1Data
      },
      {
        name: 'Power 2',
        type: isSingleDataPoint ? 'bar' : 'line',
        smooth: !isSingleDataPoint,
        showSymbol: !isSingleDataPoint,
        barWidth: isSingleDataPoint ? '40%' : undefined,
        areaStyle: !isSingleDataPoint
          ? {
              opacity: 0.8,
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgb(255, 187, 120)' },
                { offset: 1, color: 'rgb(255, 85, 85)' }
              ])
            }
          : undefined,
        emphasis: { focus: 'series' },
        data: power2Data
      }
    ]
  };

  return (
    <div style={{ height: '50dvh', width: '100%', zIndex: 1 }}>
      <ReactECharts option={optionWave} style={{ height: '100%', width: '100%' }} />
    </div>
  );
}
