import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useTheme } from '../../context/ThemeContext'

ChartJS.register(ArcElement, Tooltip, Legend)

const TaskPieChart = ({ completed = 0, pending = 0, inProgress = 0, review = 0 }) => {
  const { dark } = useTheme()
  const total = completed + pending + inProgress + review

  const data = {
    labels: ['Completed', 'To Do', 'In Progress', 'Review'],
    datasets: [{
      data: [completed, pending, inProgress, review],
      backgroundColor: ['#22c55e', '#94a3b8', '#3b82f6', '#a855f7'],
      borderColor: dark ? '#0f172a' : '#ffffff',
      borderWidth: 3,
      hoverOffset: 8,
    }],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: dark ? '#94a3b8' : '#64748b',
          padding: 16,
          font: { size: 12, family: 'Inter' },
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0
            return ` ${ctx.label}: ${ctx.raw} (${pct}%)`
          },
        },
      },
    },
    cutout: '65%',
  }

  return (
    <div className="relative">
      <div style={{ height: 220 }}>
        <Pie data={data} options={options} />
      </div>
      {total === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-gray-400">No tasks yet</p>
        </div>
      )}
    </div>
  )
}

export default TaskPieChart
