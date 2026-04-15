import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { useTheme } from '../../context/ThemeContext'
import { format, subDays } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const TaskLineChart = ({ dailyAgg = [] }) => {
  const { dark } = useTheme()

  // Build last 7 days labels
  const labels = Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), 6 - i), 'MMM d')
  )
  const dateKeys = Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), 6 - i), 'yyyy-MM-dd')
  )

  const created = dateKeys.map(d => dailyAgg.find(a => a._id === d)?.count || 0)
  const completed = dateKeys.map(d => dailyAgg.find(a => a._id === d)?.completed || 0)

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasks Created',
        data: created,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Completed',
        data: completed,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.08)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#22c55e',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: dark ? '#94a3b8' : '#64748b',
          font: { size: 12, family: 'Inter' },
          usePointStyle: true,
        },
      },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        grid: { color: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
        ticks: { color: dark ? '#64748b' : '#94a3b8', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
        ticks: { color: dark ? '#64748b' : '#94a3b8', font: { size: 11 }, stepSize: 1 },
      },
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
  }

  return (
    <div style={{ height: 220 }}>
      <Line data={data} options={options} />
    </div>
  )
}

export default TaskLineChart
