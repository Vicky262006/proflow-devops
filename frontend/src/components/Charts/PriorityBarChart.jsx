import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js'
import { useTheme } from '../../context/ThemeContext'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const PriorityBarChart = ({ priorityAgg = [] }) => {
  const { dark } = useTheme()

  const priorities = ['low', 'medium', 'high', 'urgent']
  const counts = priorities.map(p => priorityAgg.find(a => a._id === p)?.count || 0)
  const colors = ['#22c55e', '#eab308', '#f97316', '#ef4444']
  const hoverColors = ['#16a34a', '#ca8a04', '#ea580c', '#dc2626']

  const data = {
    labels: ['Low', 'Medium', 'High', 'Urgent'],
    datasets: [{
      label: 'Tasks',
      data: counts,
      backgroundColor: colors,
      hoverBackgroundColor: hoverColors,
      borderRadius: 8,
      borderSkipped: false,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw} task${ctx.raw !== 1 ? 's' : ''}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: dark ? '#64748b' : '#94a3b8', font: { size: 12, family: 'Inter' } },
      },
      y: {
        beginAtZero: true,
        grid: { color: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
        ticks: { color: dark ? '#64748b' : '#94a3b8', font: { size: 11 }, stepSize: 1 },
      },
    },
  }

  return (
    <div style={{ height: 220 }}>
      <Bar data={data} options={options} />
    </div>
  )
}

export default PriorityBarChart
