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

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeeklyBarChart({ data, isDarkMode }) {
  return (
    <Bar
      data={{
        labels: days,
        datasets: [
          {
            label: "Due tasks",
            data: data,
            backgroundColor: "#60a5fa", // Tailwind blue-400
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: isDarkMode ? "#fff" : "#000",
            },
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
              color: isDarkMode ? "#fff" : "#000",
              stepSize: 1,
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
