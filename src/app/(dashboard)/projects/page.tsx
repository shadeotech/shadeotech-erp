'use client'

import { ProjectCard, ProjectCardProps } from '@/components/projects/ProjectCard'
import { Calendar, DollarSign, Users } from 'lucide-react'

// Sample project data
const projects: ProjectCardProps[] = [
  {
    id: '1',
    name: 'SnowUI',
    dueDate: 'Nov 10, 2025',
    icon: '❄️',
    iconBg: '#E8F4FD',
    status: 'In Progress',
    completedTasks: 36,
    totalTasks: 49,
    progress: 75,
    teamMembers: [
      { name: 'John', avatar: '' },
    ],
  },
  {
    id: '2',
    name: 'Coffee detail page - Ma...',
    dueDate: 'Nov 10, 2025',
    icon: '☕',
    iconBg: '#E8F8F0',
    status: 'Complete',
    completedTasks: 56,
    totalTasks: 56,
    progress: 100,
    teamMembers: [
      { name: 'Sarah', avatar: '' },
    ],
  },
  {
    id: '3',
    name: 'Drinking bottle graphics',
    dueDate: 'Nov 10, 2025',
    icon: '🎨',
    iconBg: '#E8ECFD',
    status: 'Rejected',
    completedTasks: 16,
    totalTasks: 65,
    progress: 45,
    teamMembers: [
      { name: 'Mike', avatar: '' },
    ],
  },
  {
    id: '4',
    name: 'Company logo design',
    dueDate: 'Feb 21, 2025',
    icon: '🎯',
    iconBg: '#F8E8FD',
    status: 'Complete',
    completedTasks: 20,
    totalTasks: 20,
    progress: 100,
    teamMembers: [
      { name: 'Anna', avatar: '' },
    ],
  },
  {
    id: '5',
    name: 'Landing page design',
    dueDate: 'Jun 20, 2025',
    icon: '💎',
    iconBg: '#E8FDF8',
    status: 'Pending',
    completedTasks: 5,
    totalTasks: 23,
    progress: 36,
    teamMembers: [
      { name: 'Tom', avatar: '' },
      { name: 'Lisa', avatar: '' },
      { name: 'Jim', avatar: '' },
      { name: 'Extra', avatar: '' },
    ],
  },
  {
    id: '6',
    name: 'Product page redesign',
    dueDate: 'Jun 20, 2025',
    icon: '🔄',
    iconBg: '#FDE8F4',
    status: 'In Progress',
    completedTasks: 12,
    totalTasks: 49,
    progress: 38,
    teamMembers: [
      { name: 'Kate', avatar: '' },
    ],
  },
  {
    id: '7',
    name: 'Coffee detail page',
    dueDate: 'Jun 24, 2025',
    icon: '🌀',
    iconBg: '#E8F4FD',
    status: 'Rejected',
    completedTasks: 8,
    totalTasks: 12,
    progress: 68,
    teamMembers: [
      { name: 'Bob', avatar: '' },
    ],
  },
  {
    id: '8',
    name: 'Aviasales App',
    dueDate: 'Oct 25, 2025',
    icon: '🔴',
    iconBg: '#FDE8E8',
    status: 'Approved',
    completedTasks: 17,
    totalTasks: 20,
    progress: 70,
    teamMembers: [
      { name: 'Eva', avatar: '' },
    ],
  },
  {
    id: '9',
    name: 'Finance Dispatch',
    dueDate: 'Nov 10, 2025',
    icon: '📊',
    iconBg: '#FDF8E8',
    status: 'Pending',
    completedTasks: 2,
    totalTasks: 19,
    progress: 17,
    teamMembers: [
      { name: 'Dan', avatar: '' },
    ],
  },
  {
    id: '10',
    name: 'Fitnes App',
    dueDate: 'Nov 10, 2025',
    icon: '💪',
    iconBg: '#E8FDE8',
    status: 'Pending',
    completedTasks: 20,
    totalTasks: 48,
    progress: 45,
    teamMembers: [
      { name: 'Chris', avatar: '' },
    ],
  },
  {
    id: '11',
    name: 'Atica Banking',
    dueDate: 'Jun 20, 2025',
    icon: '🏦',
    iconBg: '#E8E8FD',
    status: 'In Progress',
    completedTasks: 35,
    totalTasks: 49,
    progress: 66,
    teamMembers: [
      { name: 'Amy', avatar: '' },
    ],
  },
  {
    id: '12',
    name: 'Coffee detail page',
    dueDate: 'Jun 24, 2025',
    icon: '🎵',
    iconBg: '#F4E8FD',
    status: 'Rejected',
    completedTasks: 2,
    totalTasks: 12,
    progress: 10,
    teamMembers: [
      { name: 'Steve', avatar: '' },
    ],
  },
]

export default function ProjectsPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">My Projects</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl p-5" style={{ backgroundColor: '#E6F1FD' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-700">Current Projects</span>
            <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-600" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-gray-900 dark:text-gray-800">268</span>
            <span className="text-xs text-green-500">+11.02% ↗</span>
          </div>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#EDEEFC' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-700">Project Finance</span>
            <DollarSign className="w-4 h-4 text-gray-400 dark:text-gray-600" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-gray-900 dark:text-gray-800">$3,290</span>
            <span className="text-xs text-red-500">-0.03% ↗</span>
          </div>
        </div>
        <div className="rounded-xl p-5" style={{ backgroundColor: '#E6F1FD' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-700">Our Clients</span>
            <Users className="w-4 h-4 text-gray-400 dark:text-gray-600" />
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-gray-900 dark:text-gray-800">31</span>
            <span className="text-xs text-green-500">+15.03% ↗</span>
          </div>
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </div>
    </div>
  )
}

