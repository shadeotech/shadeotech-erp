'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export interface ProjectCardProps {
  id: string
  name: string
  dueDate: string
  icon: string
  iconBg: string
  status: 'In Progress' | 'Complete' | 'Pending' | 'Rejected' | 'Approved'
  completedTasks: number
  totalTasks: number
  progress: number
  teamMembers: { name: string; avatar?: string }[]
}

const statusColors = {
  'In Progress': 'text-green-500 dark:text-green-400',
  'Complete': 'text-green-500 dark:text-green-400',
  'Pending': 'text-yellow-500 dark:text-yellow-400',
  'Rejected': 'text-red-500 dark:text-red-400',
  'Approved': 'text-green-500 dark:text-green-400',
}

const statusDots = {
  'In Progress': 'bg-green-500 dark:bg-green-400',
  'Complete': 'bg-green-500 dark:bg-green-400',
  'Pending': 'bg-yellow-500 dark:bg-yellow-400',
  'Rejected': 'bg-red-500 dark:bg-red-400',
  'Approved': 'bg-green-500 dark:bg-green-400',
}

export function ProjectCard({
  id,
  name,
  dueDate,
  icon,
  iconBg,
  status,
  completedTasks,
  totalTasks,
  progress,
  teamMembers,
}: ProjectCardProps) {
  return (
    <Link href={`/projects/${id}`}>
      <div className="rounded-xl border border-gray-100 bg-white p-4 transition-all hover:shadow-md cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 text-sm mb-1 truncate max-w-[140px]">{name}</h3>
            <p className="text-xs text-gray-400">Due Date: {dueDate}</p>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: iconBg }}
          >
            {icon}
          </div>
        </div>

        {/* Team & Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex -space-x-2">
            {teamMembers.slice(0, 3).map((member, index) => (
              <Avatar key={index} className="w-6 h-6 border-2 border-white dark:border-gray-700">
                <AvatarImage src={member.avatar} alt={member.name} />
                <AvatarFallback className="text-[10px] bg-gray-200 dark:bg-gray-700">
                  {member.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
            {teamMembers.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 border-2 border-white dark:border-gray-700 flex items-center justify-center text-[10px] text-gray-500 dark:text-gray-400">
                +{teamMembers.length - 3}
              </div>
            )}
          </div>
          <div className={`flex items-center gap-1 text-xs ${statusColors[status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDots[status]}`}></span>
            {status}
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            <span className="text-gray-900 dark:text-white font-medium">{completedTasks}</span>
            {' | '}
            <span>{totalTasks} Total Tasks</span>
          </span>
          <span className="text-gray-900 dark:text-white font-medium">{progress}%</span>
        </div>
      </div>
    </Link>
  )
}

