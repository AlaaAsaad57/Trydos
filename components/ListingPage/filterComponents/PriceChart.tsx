import React from "react";
import Chart from "react-apexcharts";
function PriceChart({ points }) {
  return (
    <div className="chart-container flex-row top-8  absolute w-full">
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
            data: points,
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
