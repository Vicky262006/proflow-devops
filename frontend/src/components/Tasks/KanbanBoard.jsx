import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import TaskCard from '../UI/TaskCard'
import { Plus } from 'lucide-react'

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: 'bg-gray-400' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'review', label: 'In Review', color: 'bg-purple-500' },
  { id: 'completed', label: 'Completed', color: 'bg-green-500' },
]

const KanbanBoard = ({ tasks, onDragEnd, onEdit, onDelete, onView, onAdd }) => {
  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id)
    return acc
  }, {})

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
        {COLUMNS.map(col => (
          <div key={col.id} className="flex-shrink-0 w-72">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300">{col.label}</h3>
                <span className="ml-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-xs font-medium">
                  {grouped[col.id]?.length || 0}
                </span>
              </div>
              <button
                onClick={() => onAdd?.(col.id)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-600 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Droppable column */}
            <Droppable droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    min-h-[200px] rounded-2xl p-2 space-y-2 transition-colors duration-200
                    ${snapshot.isDraggingOver
                      ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-300 dark:ring-primary-700'
                      : 'bg-gray-100/60 dark:bg-gray-800/40'
                    }
                  `}
                >
                  {grouped[col.id]?.map((task, idx) => (
                    <Draggable key={task._id} draggableId={task._id} index={idx}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                        >
                          <TaskCard
                            task={task}
                            dragging={snap.isDragging}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onView={onView}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}

                  {grouped[col.id]?.length === 0 && !snapshot.isDraggingOver && (
                    <div className="flex flex-col items-center justify-center h-24 text-gray-300 dark:text-gray-600">
                      <p className="text-xs">Drop tasks here</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}

export default KanbanBoard
