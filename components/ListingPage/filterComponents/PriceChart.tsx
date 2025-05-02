"use client";
import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
function PriceChart({ points }) {
  const [windowWidth, setWindowWidth] = useState(0);
  useEffect(() => {
    setWindowWidth(window.innerWidth);
  }, []);
  return (
    <div className="chart-container flex-row top-0  absolute w-full">
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
        width={windowWidth - 58}
        height={100}
      />
    </div>
  );
}

export default PriceChart;
