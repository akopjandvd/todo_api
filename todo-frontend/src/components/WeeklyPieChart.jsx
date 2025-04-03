import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const colors = [
  "#f87171", // red-400
  "#fb923c", // orange-400
  "#facc15", // yellow-400
  "#4ade80", // green-400
  "#38bdf8", // blue-400
  "#a78bfa", // purple-400
  "#f472b6", // pink-400
];

export default function WeeklyPieChart({ data, isDarkMode }) {
  return (
    <Pie
      data={{
        labels: dayLabels,
        datasets: [
          {
            label: "Due tasks",
            data: data,
            backgroundColor: colors,
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
            },
          },
        },
      }}
    />
  );
}
