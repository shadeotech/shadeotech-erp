'use client'

import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  Download, 
  Upload, 
  Plus,
  FileText,
  Image as ImageIcon,
  File,
  Paperclip,
  MessageCircle,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Calendar,
  AlignJustify,
  Upload as UploadIcon
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Tabs for the project detail
const tabs = ['Overview', 'Targets', 'Budget', 'Users', 'Files', 'Activity', 'Settings']

// Sample activity data
const activities = [
  { 
    id: 1, 
    icon: '🐛', 
    text: 'You have a bug that needs to be fixed.', 
    time: 'Just now',
    type: 'bug'
  },
  { 
    id: 2, 
    icon: '🚀', 
    text: 'Released a new version', 
    time: '59 minutes ago',
    type: 'release'
  },
  { 
    id: 3, 
    icon: '📝', 
    text: 'Submitted a bug', 
    time: '12 hours ago',
    type: 'submit'
  },
  { 
    id: 4, 
    icon: '✏️', 
    text: 'Modified A data in Page X', 
    time: 'Today, 11:59 AM',
    type: 'modify'
  },
  { 
    id: 5, 
    icon: '🗑️', 
    text: 'Deleted a page in Project X', 
    time: 'Feb 2, 2025',
    type: 'delete'
  },
]

// Sample files data
const files = [
  { 
    id: 1, 
    name: 'Project tech requirements.pdf', 
    size: '5.6 MB', 
    time: 'Just now', 
    user: 'Karina Clark',
    type: 'pdf'
  },
  { 
    id: 2, 
    name: 'Dashboard-design.jpg', 
    size: '2.3 MB', 
    time: '59 minutes ago', 
    user: 'Marcus Blake',
    type: 'image'
  },
  { 
    id: 3, 
    name: 'Completed Project Stylings.pdf', 
    size: '4.6 MB', 
    time: '12 hours ago', 
    user: 'Terry Barry',
    type: 'pdf'
  },
  { 
    id: 4, 
    name: 'Create Project Wireframes.xls', 
    size: '1.2 MB', 
    time: 'Today, 11:59 AM', 
    user: 'Roth Bloom',
    type: 'excel'
  },
  { 
    id: 5, 
    name: 'Project tech requirements.pdf', 
    size: '2.8 MB', 
    time: 'Yesterday', 
    user: 'Natali Craig',
    type: 'pdf'
  },
]

// Sample spending data
const spendings = [
  { id: 1, manager: 'ByeWind', avatar: '', date: 'Jun 24, 2025', amount: '$942.00', status: 'In Progress' },
  { id: 2, manager: 'Natali Craig', avatar: '', date: 'Mar 10, 2025', amount: '$881.00', status: 'Complete' },
  { id: 3, manager: 'Drew Cano', avatar: '', date: 'Nov 10, 2025', amount: '$409.00', status: 'Pending' },
  { id: 4, manager: 'Orlando Diggs', avatar: '', date: 'Dec 20, 2025', amount: '$953.00', status: 'Approved' },
  { id: 5, manager: 'Andi Lane', avatar: '', date: 'Jul 25, 2025', amount: '$907.00', status: 'Rejected' },
]

const statusColors: Record<string, string> = {
  'In Progress': 'text-blue-500',
  'Complete': 'text-green-500',
  'Pending': 'text-yellow-500',
  'Approved': 'text-green-500',
  'Rejected': 'text-red-500',
}

// Calendar days
const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const dates = [22, 23, 24, 25, 26, 27, 28]

// Kanban board data for Targets tab
const kanbanColumns = [
  {
    id: 'yet-to-start',
    title: 'Yet to Start',
    count: 6,
    cards: [
      {
        id: 1,
        category: 'Technical Debt Reduction',
        title: 'Meeting with customer',
        description: 'Reduce technical debt by refactoring legacy code and improving architectur...',
        assigned: [{ initials: 'A', bg: 'bg-gray-200' }],
        attachments: 6,
        comments: 12,
      },
      {
        id: 2,
        category: 'User Experience',
        title: 'User Module Testing',
        description: 'Enhance user experience by incorporating user feedback and cond...',
        assigned: [{ initials: 'B', bg: 'bg-gray-200' }],
        attachments: 9,
        comments: 19,
      },
      {
        id: 3,
        category: 'Security Implementation',
        title: 'Branding Logo',
        description: 'Implement security measures to protect against cyber attacks and data breach...',
        assigned: [{ initials: 'C', bg: 'bg-gray-200' }],
        attachments: 6,
        comments: 21,
      },
      {
        id: 4,
        category: 'Collaboration Improvement',
        title: 'Sales report page',
        description: 'Increase collaboration between developers and stakeholders through a...',
        assigned: [{ initials: 'AB', bg: 'bg-purple-200' }],
        attachments: 8,
        comments: 21,
      },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    count: 4,
    cards: [
      {
        id: 5,
        category: 'Code Quality',
        title: 'Sales report page',
        description: 'Increase code quality through code reviews and automated testing.',
        assigned: [{ initials: 'D', bg: 'bg-gray-200' }],
        attachments: 8,
        comments: 15,
      },
      {
        id: 6,
        category: 'Feature Development',
        title: 'Meeting with customer',
        description: 'Implement new features and functionality to meet customer needs...',
        assigned: [
          { initials: 'E', bg: 'bg-gray-200' },
          { initials: 'F', bg: 'bg-gray-200' },
          { initials: 'G', bg: 'bg-gray-200' },
        ],
        additionalMembers: 3,
        attachments: 6,
        comments: 82,
      },
      {
        id: 7,
        category: 'Scalability Enhancement',
        title: 'Design main Dashboard',
        description: 'Increase software scalability and flexibility to accommodate growth and...',
        assigned: [{ initials: 'HW', bg: 'bg-blue-200' }],
        attachments: 8,
        comments: 22,
      },
      {
        id: 8,
        category: 'Productivity Boost',
        title: 'User Module Testing',
        description: 'Improve developer productivity by providing better tools and resources.',
        assigned: [{ initials: 'I', bg: 'bg-gray-200' }],
        attachments: 3,
        comments: 12,
      },
    ],
  },
  {
    id: 'completed',
    title: 'Completed',
    count: 8,
    cards: [
      {
        id: 9,
        category: 'Performance Optimization',
        title: 'Branding Logo',
        description: 'Improve software performance by optimizing algorithms and system reso...',
        assigned: [{ initials: 'J', bg: 'bg-red-200' }],
        attachments: 2,
        comments: 15,
      },
      {
        id: 10,
        category: 'Bug Reduction',
        title: 'To check User Management',
        description: 'Reduce software bugs and errors through bug tracking and issue resoluti...',
        assigned: [{ initials: 'K', bg: 'bg-gray-200' }],
        attachments: 1,
        comments: 18,
      },
      {
        id: 11,
        category: 'Process Streamlining',
        title: 'User Module Testing',
        description: 'Streamline development processes through automation and continuous int...',
        assigned: [{ initials: 'L', bg: 'bg-gray-200' }],
        attachments: 12,
        comments: 32,
      },
      {
        id: 12,
        category: 'Innovation Culture',
        title: 'Meeting with customer',
        description: 'Foster a culture of innovation and experimentation to drive continuous im...',
        assigned: [{ initials: 'M', bg: 'bg-gray-200' }],
        attachments: 6,
        comments: 17,
      },
    ],
  },
]

export default function ProjectDetailPage() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [usageCharacter, setUsageCharacter] = useState('precise')
  const [emailNotification, setEmailNotification] = useState(true)
  const [phoneNotification, setPhoneNotification] = useState(false)
  const [allowChanges, setAllowChanges] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<string[]>(['orlando-diggs'])
  const [currentPage, setCurrentPage] = useState(1)
  const [selectAll, setSelectAll] = useState(false)
  const { toast, dismiss } = useToast()

  // Sample user data
  const users = [
    { id: 'natali-craig', name: 'Natali Craig', email: 'smith@kpmg.com', date: 'Just now', avatar: 'NC' },
    { id: 'kate-morrison', name: 'Kate Morrison', email: 'melody@altbox.com', date: 'A minute ago', avatar: 'KM' },
    { id: 'drew-cano', name: 'Drew Cano', email: 'max@kt.com', date: '1 hour ago', avatar: 'DC' },
    { id: 'orlando-diggs', name: 'Orlando Diggs', email: 'sean@dellito.com', date: 'Yesterday', avatar: 'OD' },
    { id: 'andi-lane', name: 'Andi Lane', email: 'brian@exchange.com', date: 'Feb 2, 2025', avatar: 'AL' },
    { id: 'natali-craig-2', name: 'Natali Craig', email: 'smith@kpmg.com', date: 'Just now', avatar: 'NC' },
    { id: 'kate-morrison-2', name: 'Kate Morrison', email: 'melody@altbox.com', date: 'A minute ago', avatar: 'KM' },
    { id: 'drew-cano-2', name: 'Drew Cano', email: 'max@kt.com', date: '1 hour ago', avatar: 'DC' },
    { id: 'orlando-diggs-2', name: 'Orlando Diggs', email: 'sean@dellito.com', date: 'Yesterday', avatar: 'OD' },
    { id: 'andi-lane-2', name: 'Andi Lane', email: 'brian@exchange.com', date: 'Feb 2, 2025', avatar: 'AL' },
  ]

  // Files tab data
  const filesList = [
    { id: 'file-1', name: 'Project tech requirements.pdf', type: 'pdf', uploader: 'Natali Craig', uploaderAvatar: 'NC', size: '5.6 MB', time: 'Just now' },
    { id: 'file-2', name: 'Create Project Wireframes.xls', type: 'xls', uploader: 'Kate Morrison', uploaderAvatar: 'KM', size: '2.3 MB', time: 'A minute ago' },
    { id: 'file-3', name: 'Completed Project Stylings.pdf', type: 'pdf', uploader: 'Drew Cano', uploaderAvatar: 'DC', size: '4.6 MB', time: '1 hour ago' },
    { id: 'file-4', name: 'Dashboard-design.jpg', type: 'jpg', uploader: 'Orlando Diggs', uploaderAvatar: 'OD', size: '1.2 MB', time: 'Yesterday' },
    { id: 'file-5', name: 'Project tech requirements.pdf', type: 'pdf', uploader: 'Andi Lane', uploaderAvatar: 'AL', size: '2.8 MB', time: 'Feb 2, 2025' },
    { id: 'file-6', name: 'Project tech requirements.pdf', type: 'pdf', uploader: 'Natali Craig', uploaderAvatar: 'NC', size: '5.6 MB', time: 'Just now' },
    { id: 'file-7', name: 'Create Project Wireframes.xls', type: 'xls', uploader: 'Kate Morrison', uploaderAvatar: 'KM', size: '2.3 MB', time: 'A minute ago' },
    { id: 'file-8', name: 'Completed Project Stylings.pdf', type: 'pdf', uploader: 'Drew Cano', uploaderAvatar: 'DC', size: '4.6 MB', time: '1 hour ago' },
    { id: 'file-9', name: 'Dashboard-design.jpg', type: 'jpg', uploader: 'Orlando Diggs', uploaderAvatar: 'OD', size: '1.2 MB', time: 'Yesterday' },
    { id: 'file-10', name: 'Project tech requirements.pdf', type: 'pdf', uploader: 'Andi Lane', uploaderAvatar: 'AL', size: '2.8 MB', time: 'Feb 2, 2025' },
  ]

  const [selectedFiles, setSelectedFiles] = useState<string[]>(['file-4'])
  const [selectAllFiles, setSelectAllFiles] = useState(false)
  const [filesPage, setFilesPage] = useState(1)

  // Activity tab data
  const activitiesList = [
    { id: 'act-1', icon: '🐛', activity: 'Submitted a bug', user: 'Natali Craig', userAvatar: 'NC', date: 'Just now' },
    { id: 'act-2', icon: '🐛', activity: 'Fix a bug', user: 'Kate Morrison', userAvatar: 'KM', date: 'A minute ago' },
    { id: 'act-3', icon: '👤', activity: 'New user registered', user: 'Drew Cano', userAvatar: 'DC', date: '1 hour ago' },
    { id: 'act-4', icon: '**', activity: 'Changed account password', user: 'Orlando Diggs', userAvatar: 'OD', date: 'Yesterday' },
    { id: 'act-5', icon: '📄', activity: 'Created a document', user: 'Andi Lane', userAvatar: 'AL', date: 'Feb 2, 2025' },
    { id: 'act-6', icon: '📄', activity: 'Modified a document', user: 'Natali Craig', userAvatar: 'NC', date: 'Just now' },
    { id: 'act-7', icon: '🐛', activity: 'Submitted a bug', user: 'Kate Morrison', userAvatar: 'KM', date: 'A minute ago' },
    { id: 'act-8', icon: '🐛', activity: 'Fix a bug', user: 'Drew Cano', userAvatar: 'DC', date: '1 hour ago' },
    { id: 'act-9', icon: '👤', activity: 'New user registered', user: 'Orlando Diggs', userAvatar: 'OD', date: 'Yesterday' },
    { id: 'act-10', icon: '**', activity: 'Changed account password', user: 'Andi Lane', userAvatar: 'AL', date: 'Feb 2, 2025' },
  ]

  const [selectedActivities, setSelectedActivities] = useState<string[]>(['act-4'])
  const [selectAllActivities, setSelectAllActivities] = useState(false)
  const [activityPage, setActivityPage] = useState(1)

  // Settings form state
  const [projectName, setProjectName] = useState('SnowUI')
  const [projectType, setProjectType] = useState('ui-kit')
  const [projectDescription, setProjectDescription] = useState('SnowUI is a design system and UI Kit created with Figma. All of the products here here use the SnowUI Library as the main component library.')
  const [dueDate, setDueDate] = useState('Feb 1, 2025')
  const [settingsEmailNotification, setSettingsEmailNotification] = useState(true)
  const [settingsPhoneNotification, setSettingsPhoneNotification] = useState(false)
  const [status, setStatus] = useState(true)

  const handleSettingsChange = () => {
    showSaveToast()
  }

  const handleProjectNameChange = (value: string) => {
    setProjectName(value)
    handleSettingsChange()
  }

  const handleProjectTypeChange = (value: string) => {
    setProjectType(value)
    handleSettingsChange()
  }

  const handleProjectDescriptionChange = (value: string) => {
    setProjectDescription(value)
    handleSettingsChange()
  }

  const handleDueDateChange = (value: string) => {
    setDueDate(value)
    handleSettingsChange()
  }

  const handleSettingsEmailChange = (checked: boolean) => {
    setSettingsEmailNotification(checked)
    handleSettingsChange()
  }

  const handleSettingsPhoneChange = (checked: boolean) => {
    setSettingsPhoneNotification(checked)
    handleSettingsChange()
  }

  const handleStatusChange = (checked: boolean) => {
    setStatus(checked)
    handleSettingsChange()
  }

  const handleActivitySelect = (activityId: string) => {
    setSelectedActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    )
  }

  const handleSelectAllActivities = () => {
    if (selectAllActivities) {
      setSelectedActivities([])
    } else {
      setSelectedActivities(activitiesList.map(a => a.id))
    }
    setSelectAllActivities(!selectAllActivities)
  }

  const handleFileSelect = (fileId: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileId)
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const handleSelectAllFiles = () => {
    if (selectAllFiles) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(filesList.map(f => f.id))
    }
    setSelectAllFiles(!selectAllFiles)
  }

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <span className="text-xs font-semibold text-red-600">PDF</span>
      case 'xls':
        return <span className="text-xs font-semibold text-green-600">XLS</span>
      case 'jpg':
        return <span className="text-xs font-semibold text-blue-600">JPG</span>
      default:
        return <span className="text-xs font-semibold text-gray-600">FILE</span>
    }
  }

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
    setSelectAll(!selectAll)
  }

  const showSaveToast = () => {
    const toastResult = toast({
      title: '',
      description: '',
      action: (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-300"
            onClick={() => {
              dismiss(toastResult.id)
            }}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => {
              dismiss(toastResult.id)
            }}
          >
            Save Changes
          </Button>
        </div>
      ),
    })
  }

  const handleUsageCharacterChange = (value: string) => {
    setUsageCharacter(value)
    showSaveToast()
  }

  const handleEmailNotificationChange = (checked: boolean) => {
    setEmailNotification(checked)
    showSaveToast()
  }

  const handlePhoneNotificationChange = (checked: boolean) => {
    setPhoneNotification(checked)
    showSaveToast()
  }

  const handleAllowChangesChange = (checked: boolean) => {
    setAllowChanges(checked)
    showSaveToast()
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-500" />
      case 'image':
        return <ImageIcon className="w-4 h-4 text-blue-500" />
      default:
        return <File className="w-4 h-4 text-green-500" />
    }
  }

  return (
    <div className="p-6">
      {/* Header with Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm pb-2 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-gray-900 border-gray-900 font-medium'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-gray-600">
            <Plus className="w-4 h-4 mr-1" />
            Add User
          </Button>
          <Button variant="ghost" size="sm" className="text-gray-600">
            Add Target
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-400">
            •••
          </Button>
        </div>
      </div>

      {/* Targets Tab Content */}
      {activeTab === 'Targets' && (
        <div className="space-y-6">
          {/* Kanban Board */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {kanbanColumns.map((column) => {
              // Determine bar color based on column
              const getBarColor = () => {
                if (column.id === 'yet-to-start') return 'bg-blue-500'
                if (column.id === 'in-progress') return 'bg-purple-500'
                if (column.id === 'completed') return 'bg-green-500'
                return 'bg-gray-500'
              }

              return (
                <div key={column.id} className="flex flex-col">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      {column.title} ({column.count})
                    </h3>
                    {/* Colored bar under title */}
                    <div className={`h-1 rounded-full ${getBarColor()}`}></div>
                  </div>
                  <div className="space-y-4 flex-1">
                    {column.cards.map((card) => (
                      <div
                        key={card.id}
                        className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Category Badge */}
                        <Badge 
                          className="mb-3 text-gray-700 border-gray-200 hover:opacity-90"
                          style={{ backgroundColor: '#EDEEFC' }}
                        >
                          {card.category}
                        </Badge>

                      {/* Title */}
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">{card.title}</h4>

                      {/* Description */}
                      <p className="text-xs text-gray-600 mb-4 line-clamp-2">{card.description}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        {/* Assigned Avatars */}
                        <div className="flex items-center -space-x-2">
                          {card.assigned.map((member, idx) => (
                            <Avatar
                              key={idx}
                              className="w-6 h-6 border-2 border-white"
                            >
                              <AvatarFallback className={`text-xs ${member.bg} text-gray-700`}>
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {card.additionalMembers && (
                            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                              +{card.additionalMembers}
                            </div>
                          )}
                        </div>

                        {/* Metrics */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <Paperclip className="h-3.5 w-3.5" />
                            <span>{card.attachments}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>{card.comments}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
            })}
          </div>
        </div>
      )}

      {/* Overview Tab Content */}
      {activeTab === 'Overview' && (
        <>
      {/* Project Info Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">SnowUI</h2>
              <div className="flex items-center gap-8">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded bg-blue-100 text-blue-600 text-xs font-medium">
                      In Progress
                    </span>
                    <span className="text-sm text-gray-900">51%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Total Tasks</p>
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">15</span> | 48
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Due Date</p>
                  <p className="text-sm text-gray-900 font-medium">29 Jan, 2025</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Budget Spent</p>
                  <p className="text-sm text-gray-900 font-medium">$15,000</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-2xl">
              ❄️
            </div>
            <div className="flex -space-x-2">
              {['A', 'B', 'C'].map((letter, i) => (
                <Avatar key={i} className="w-8 h-8 border-2 border-white">
                  <AvatarFallback className="text-xs bg-gray-200">{letter}</AvatarFallback>
                </Avatar>
              ))}
              <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                +3
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* What's on the road? */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">What&apos;s on the road?</h3>
          
          {/* Mini Calendar */}
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
            {days.map((day, i) => (
              <div
                key={day}
                className={`flex-1 text-center py-2 rounded-lg ${
                  i === 1 ? 'bg-gray-900 text-white' : ''
                }`}
              >
                <p className={`text-xs ${i === 1 ? 'text-gray-300' : 'text-gray-400'}`}>{day}</p>
                <p className={`text-sm font-medium ${i === 1 ? 'text-white' : 'text-gray-900'}`}>
                  {dates[i]}
                </p>
              </div>
            ))}
          </div>

          {/* Activity List */}
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <span className="text-lg">{activity.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{activity.text}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Files */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Latest Files</h3>
            <Button variant="ghost" size="icon" className="text-gray-400">
              <Download className="w-4 h-4" />
            </Button>
          </div>

          {/* File List */}
          <div className="space-y-3 mb-4">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3">
                {getFileIcon(file.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-400">
                    {file.size} / {file.time} / {file.user}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Upload Area */}
          <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-400">
              Drop files here or upload{' '}
              <button className="text-blue-500 hover:underline">Upload</button>
            </p>
          </div>
        </div>
      </div>

      {/* Project Spendings Table */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Project Spendings</h3>
        
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
              <th className="pb-3 font-medium">Manager</th>
              <th className="pb-3 font-medium">Date</th>
              <th className="pb-3 font-medium">Amount</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {spendings.map((spending) => (
              <tr key={spending.id} className="border-b border-gray-50 last:border-0">
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs bg-gray-200">
                        {spending.manager.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-900">{spending.manager}</span>
                  </div>
                </td>
                <td className="py-3 text-sm text-gray-500">{spending.date}</td>
                <td className="py-3 text-sm text-gray-900 font-medium">{spending.amount}</td>
                <td className="py-3">
                  <span className={`text-sm ${statusColors[spending.status]}`}>
                    {spending.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </>
      )}

      {/* Budget Tab Content */}
      {activeTab === 'Budget' && (
        <div className="space-y-6">
          {/* Budget Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">
                Budget <span className="font-normal">$22,300 of 36,000 Used</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {/* Segmented Progress Bar */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
                {/* Light purple segment - represents initial portion */}
                <div className="absolute left-0 top-0 h-full rounded-l-full" style={{ width: '8%', backgroundColor: '#C4B5FD' }} />
                
                {/* Dark gray segments with visible gaps */}
                {/* Segment 1 */}
                <div className="absolute left-[8.5%] top-0 h-full rounded-full bg-gray-700" style={{ width: '12%' }} />
                {/* Segment 2 */}
                <div className="absolute left-[21%] top-0 h-full rounded-full bg-gray-700" style={{ width: '12%' }} />
                {/* Segment 3 */}
                <div className="absolute left-[33.5%] top-0 h-full rounded-full bg-gray-700" style={{ width: '12%' }} />
                {/* Segment 4 */}
                <div className="absolute left-[46%] top-0 h-full rounded-full bg-gray-700" style={{ width: '12%' }} />
                {/* Segment 5 */}
                <div className="absolute left-[58.5%] top-0 h-full rounded-full bg-gray-700" style={{ width: '12%' }} />
                {/* Segment 6 */}
                <div className="absolute left-[71%] top-0 h-full rounded-full bg-gray-700" style={{ width: '12%' }} />
                {/* Segment 7 - partial */}
                <div className="absolute left-[83.5%] top-0 h-full rounded-r-full bg-gray-700" style={{ width: '8%' }} />
                
                {/* Gaps between segments show as light gray background */}
              </div>
              
              {/* Footer Text */}
              <p className="text-sm text-gray-500">18 Targets are remaining</p>
            </CardContent>
          </Card>

          {/* Budget Settings Card */}
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Usage Character Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Usage Character</h3>
                <RadioGroup value={usageCharacter} onValueChange={handleUsageCharacterChange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <RadioGroupItem value="precise" id="precise" className="sr-only" />
                    <label
                      htmlFor="precise"
                      className={`flex flex-col justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors h-full ${
                        usageCharacter === 'precise'
                          ? 'border-gray-900 bg-white'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">Precise Usage</p>
                        <p className="text-xs text-gray-500">Less than $5,000 per transaction.</p>
                      </div>
                      <div className="flex justify-end mt-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            usageCharacter === 'precise'
                              ? 'border-gray-900'
                              : 'border-gray-300'
                          }`}
                        >
                          {usageCharacter === 'precise' && (
                            <div className="w-3 h-3 rounded-full bg-gray-900"></div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="relative">
                    <RadioGroupItem value="normal" id="normal" className="sr-only" />
                    <label
                      htmlFor="normal"
                      className={`flex flex-col justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors h-full ${
                        usageCharacter === 'normal'
                          ? 'border-gray-900 bg-white'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">Normal Usage</p>
                        <p className="text-xs text-gray-500">More than $5,000 per transaction.</p>
                      </div>
                      <div className="flex justify-end mt-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            usageCharacter === 'normal'
                              ? 'border-gray-900'
                              : 'border-gray-300'
                          }`}
                        >
                          {usageCharacter === 'normal' && (
                            <div className="w-3 h-3 rounded-full bg-gray-900"></div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="relative">
                    <RadioGroupItem value="extreme" id="extreme" className="sr-only" />
                    <label
                      htmlFor="extreme"
                      className={`flex flex-col justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors h-full ${
                        usageCharacter === 'extreme'
                          ? 'border-gray-900 bg-white'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-1">Extreme Usage</p>
                        <p className="text-xs text-gray-500">More than $50,000 per transaction.</p>
                      </div>
                      <div className="flex justify-end mt-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            usageCharacter === 'extreme'
                              ? 'border-gray-900'
                              : 'border-gray-300'
                          }`}
                        >
                          {usageCharacter === 'extreme' && (
                            <div className="w-3 h-3 rounded-full bg-gray-900"></div>
                          )}
                        </div>
                      </div>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Budget Notes Section */}
              <div className="space-y-3">
                <Label className="text-sm text-gray-500">Budget Notes</Label>
                <Textarea
                  defaultValue="Organize your thoughts with an outline. Here's the outlining strategy I use. I promise it works like a charm. Not only will it make writing your blog post easier, it'll help you make your message."
                  className="min-h-[100px] resize-none"
                />
              </div>

              {/* Manage Budget Section */}
              <div className="space-y-3">
                <Label className="text-sm text-gray-500">Manage Budget</Label>
                <div className="text-2xl font-bold text-gray-900">$36000.00</div>
              </div>

              {/* Overuse Notifications Section */}
              <div className="space-y-3">
                <Label className="text-sm text-gray-500">Overuse Notifications</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="email-notification"
                      checked={emailNotification}
                      onCheckedChange={handleEmailNotificationChange}
                      className="border-gray-900 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                    />
                    <Label
                      htmlFor="email-notification"
                      className="text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="phone-notification"
                      checked={phoneNotification}
                      onCheckedChange={handlePhoneNotificationChange}
                      className="border-gray-300 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                    />
                    <Label
                      htmlFor="phone-notification"
                      className="text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      Phone
                    </Label>
                  </div>
                </div>
              </div>

              {/* Allow Changes Section */}
              <div className="space-y-3">
                <Label className="text-sm text-gray-500">Allow Changes</Label>
                <div className="flex items-center gap-3">
                  <Switch
                    id="allow-changes"
                    checked={allowChanges}
                    onCheckedChange={handleAllowChangesChange}
                  />
                  <Label
                    htmlFor="allow-changes"
                    className="text-sm text-gray-500 cursor-pointer"
                  >
                    Allowed
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Tab Content */}
      {activeTab === 'Users' && (
        <div className="space-y-6">
          {/* Top Bar with Actions and Search */}
          <div className="bg-gray-100 rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-900 hover:bg-gray-200">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-900 hover:bg-gray-200">
                <AlignJustify className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-900 hover:bg-gray-200">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <div className="relative bg-white rounded-md border border-gray-200">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search"
                  className="pl-9 pr-4 h-9 w-64 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                        className="border-gray-300"
                      />
                    </TableHead>
                    <TableHead className="text-muted-foreground">User</TableHead>
                    <TableHead className="text-muted-foreground">Email</TableHead>
                    <TableHead className="text-muted-foreground">Registration Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => {
                    const isSelected = selectedUsers.includes(user.id)
                    const isHighlighted = isSelected || (index === 4 && !isSelected)
                    return (
                      <TableRow
                        key={user.id}
                        className={isHighlighted ? 'bg-gray-50' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleUserSelect(user.id)}
                            className="border-gray-300 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
                                {user.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-gray-900">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600">{user.date}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {index === 4 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-gray-200"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {[1, 2, 3, 4, 5].map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                className={`h-8 w-8 p-0 ${
                  currentPage === page
                    ? 'bg-gray-900 hover:bg-gray-800 text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-gray-200"
              onClick={() => setCurrentPage(prev => Math.min(5, prev + 1))}
              disabled={currentPage === 5}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Files Tab Content */}
      {activeTab === 'Files' && (
        <div className="space-y-6">
          {/* Top Bar with Actions and Search */}
          <div className="bg-gray-100 rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-900 hover:bg-gray-200">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-900 hover:bg-gray-200">
                <AlignJustify className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-900 hover:bg-gray-200">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <div className="relative bg-white rounded-md border border-gray-200">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search"
                  className="pl-9 pr-4 h-9 w-64 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>

          {/* Files Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAllFiles}
                        onCheckedChange={handleSelectAllFiles}
                        className="border-gray-300"
                      />
                    </TableHead>
                    <TableHead className="text-muted-foreground">Activity</TableHead>
                    <TableHead className="text-muted-foreground">Uploader</TableHead>
                    <TableHead className="text-muted-foreground">File Size</TableHead>
                    <TableHead className="text-muted-foreground">Upload Time</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filesList.map((file, index) => {
                    const isSelected = selectedFiles.includes(file.id)
                    const isHighlighted = index === 4
                    return (
                      <TableRow
                        key={file.id}
                        className={isHighlighted ? 'bg-gray-50' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleFileSelect(file.id)}
                            className="border-gray-300 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {getFileTypeIcon(file.type)}
                            <span className="text-sm text-gray-900">{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
                                {file.uploaderAvatar}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-900">{file.uploader}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">{file.size}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600">{file.time}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isHighlighted && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-gray-200"
              onClick={() => setFilesPage(prev => Math.max(1, prev - 1))}
              disabled={filesPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {[1, 2, 3, 4, 5].map((page) => (
              <Button
                key={page}
                variant={filesPage === page ? 'default' : 'outline'}
                size="sm"
                className={`h-8 w-8 p-0 ${
                  filesPage === page
                    ? 'bg-gray-900 hover:bg-gray-800 text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setFilesPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-gray-200"
              onClick={() => setFilesPage(prev => Math.min(5, prev + 1))}
              disabled={filesPage === 5}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Activity Tab Content */}
      {activeTab === 'Activity' && (
        <div className="space-y-6">
          {/* Top Bar with Actions and Search */}
          <div className="bg-gray-100 rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-900 hover:bg-gray-200">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-900 hover:bg-gray-200">
                <AlignJustify className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-900 hover:bg-gray-200">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <div className="relative bg-white rounded-md border border-gray-200">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search"
                  className="pl-9 pr-4 h-9 w-64 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>

          {/* Activity Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAllActivities}
                        onCheckedChange={handleSelectAllActivities}
                        className="border-gray-300"
                      />
                    </TableHead>
                    <TableHead className="text-muted-foreground">Activity</TableHead>
                    <TableHead className="text-center text-muted-foreground">User</TableHead>
                    <TableHead className="text-right text-muted-foreground">Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activitiesList.map((activity, index) => {
                    const isSelected = selectedActivities.includes(activity.id)
                    const isHighlighted = index === 3 || index === 4
                    return (
                      <TableRow
                        key={activity.id}
                        className={isHighlighted ? 'bg-gray-50 dark:bg-gray-800' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleActivitySelect(activity.id)}
                            className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-gray-900 dark:data-[state=checked]:bg-gray-100 data-[state=checked]:border-gray-900 dark:data-[state=checked]:border-gray-100"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="text-base">{activity.icon}</span>
                            <span className="text-sm text-gray-900 dark:text-white">{activity.activity}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {activity.userAvatar}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-gray-900 dark:text-white">{activity.user}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{activity.date}</span>
                        </TableCell>
                        <TableCell>
                          {index === 4 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-gray-200"
              onClick={() => setActivityPage(prev => Math.max(1, prev - 1))}
              disabled={activityPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {[1, 2, 3, 4, 5].map((page) => (
              <Button
                key={page}
                variant={activityPage === page ? 'default' : 'outline'}
                size="sm"
                className={`h-8 w-8 p-0 ${
                  activityPage === page
                    ? 'bg-gray-900 hover:bg-gray-800 text-white'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActivityPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 border-gray-200"
              onClick={() => setActivityPage(prev => Math.min(5, prev + 1))}
              disabled={activityPage === 5}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Settings Tab Content */}
      {activeTab === 'Settings' && (
        <div className="space-y-6">
          {/* Logo Upload Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {/* Upload Icon Circle */}
                <button className="flex-shrink-0 w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer">
                  <UploadIcon className="h-6 w-6 text-gray-900" />
                </button>
                
                {/* Text Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">SnowUI</h3>
                  <p className="text-sm text-gray-500">
                    Click upload Logo, allowed file types: png, jpg, jpeg.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* More Settings Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold">More Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-500">Project Name</Label>
                <Input
                  value={projectName}
                  onChange={(e) => handleProjectNameChange(e.target.value)}
                  className="bg-white border-gray-200 text-gray-900"
                />
              </div>

              {/* Project Type */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-500">Project Type</Label>
                <Select value={projectType} onValueChange={handleProjectTypeChange}>
                  <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ui-kit">UI Kit</SelectItem>
                    <SelectItem value="web-app">Web App</SelectItem>
                    <SelectItem value="mobile-app">Mobile App</SelectItem>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project Description */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-500">Project Description</Label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => handleProjectDescriptionChange(e.target.value)}
                  className="min-h-[100px] resize-none bg-white border-gray-200 text-gray-900"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label className="text-sm text-gray-500">Due Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Select value={dueDate} onValueChange={handleDueDateChange}>
                    <SelectTrigger className="pl-9 bg-white border-gray-200 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feb 1, 2025">Feb 1, 2025</SelectItem>
                      <SelectItem value="Feb 15, 2025">Feb 15, 2025</SelectItem>
                      <SelectItem value="Mar 1, 2025">Mar 1, 2025</SelectItem>
                      <SelectItem value="Mar 15, 2025">Mar 15, 2025</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Overuse Notifications */}
              <div className="space-y-3">
                <Label className="text-sm text-gray-500">Overuse Notifications</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="settings-email-notification"
                      checked={settingsEmailNotification}
                      onCheckedChange={handleSettingsEmailChange}
                      className="border-gray-900 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                    />
                    <Label
                      htmlFor="settings-email-notification"
                      className="text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      Email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="settings-phone-notification"
                      checked={settingsPhoneNotification}
                      onCheckedChange={handleSettingsPhoneChange}
                      className="border-gray-300 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900"
                    />
                    <Label
                      htmlFor="settings-phone-notification"
                      className="text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      Phone
                    </Label>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <Label className="text-sm text-gray-500">Status</Label>
                <div className="flex items-center gap-3">
                  <Switch
                    id="status-toggle"
                    checked={status}
                    onCheckedChange={handleStatusChange}
                  />
                  <span className="text-sm text-gray-900">{status ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Placeholder for other tabs */}
      {activeTab !== 'Overview' && activeTab !== 'Targets' && activeTab !== 'Budget' && activeTab !== 'Users' && activeTab !== 'Files' && activeTab !== 'Activity' && activeTab !== 'Settings' && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 text-center py-12">
          <p className="text-gray-500">{activeTab} page coming soon...</p>
        </div>
      )}
    </div>
  )
}

