import React from "react";
import Chart from "react-apexcharts";
function PriceChart() {
  return (
    <div className="chart-container flex-row">
      <Chart
        options={{
          stroke: { curve: "smooth", show: false },
          colors: ["#F8F8F8"],
          grid: { show: false },
          fill: {
            colors: ["#F8F8F8"],
            opacity: 1,
            type: "colors",
          },
          legend: { show: false },
          tooltip: { enabled: false },
          chart: {
            toolbar: { show: false },
            type: "area",
          },

          dataLabels: { enabled: false },
          xaxis: {
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false },
          },
          yaxis: {
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false },
          },
        }}
        series={[
          {
            data: [0, 200, 300, 340, 500, 340, 300, 200, 120, 80, 0],
            name: "price",
            color: "#F8F8F8",
          },
        ]}
        type="area"
        width={window.innerWidth - 58}
        height={100}
      />
    </div>
  );
}

export default PriceChart;
