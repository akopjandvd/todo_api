import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PriorityPieChart({ data, isDarkMode }) {
  return (
    <Pie
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
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: isDarkMode ? "#fff" : "#000",
              font: {
                size: 14,
              },
            },
          },
          tooltip: {
            bodyColor: isDarkMode ? "#fff" : "#000",
            backgroundColor: isDarkMode ? "#1f2937" : "#fff",
          },
        },
      }}
    />
  );
}
