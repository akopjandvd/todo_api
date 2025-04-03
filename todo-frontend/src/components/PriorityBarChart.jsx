import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function PriorityBarChart({ data, isDarkMode }) {
  return (
    <Bar
      data={{
        labels: data.map((d) => d.name),
        datasets: [
          {
            label: "Priority",
            data: data.map((d) => d.value),
            backgroundColor: [
              "#22c55e", // Low
              "#facc15", // Medium
              "#ef4444", // High
            ],
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: {
            display: false,
            labels: {
              color: isDarkMode ? "#fff" : "#000",
            },
          },
          tooltip: {
            bodyColor: isDarkMode ? "#fff" : "#000",
            backgroundColor: isDarkMode ? "#1f2937" : "#fff",
          },
        },
        scales: {
          x: {
            ticks: {
              color: isDarkMode ? "#fff" : "#000",
            },
            grid: {
              color: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              color: isDarkMode ? "#fff" : "#000",
            },
            grid: {
              color: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
            },
          },
        },
      }}
    />
  );
}
