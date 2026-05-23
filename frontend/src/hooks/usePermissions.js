import { useAuth } from '../context/AuthContext'

export const usePermissions = () => {
  const { user, isAdmin, isEmployee } = useAuth()

  const canCreateTask = isAdmin
  const canDeleteTask = isAdmin
  const canAssignTask = isAdmin
  const canManageTeams = isAdmin
  const canViewAllAnalytics = isAdmin
  
  const canUpdateTaskProgress = (task) => {
    if (isAdmin) return true
    return task.assignee?._id === user?._id || task.assignee === user?._id
  }

  const canAddComment = (task) => true

  return {
    isAdmin,
    isEmployee,
    canCreateTask,
    canDeleteTask,
    canAssignTask,
    canManageTeams,
    canViewAllAnalytics,
    canUpdateTaskProgress,
    canAddComment,
  }
}
