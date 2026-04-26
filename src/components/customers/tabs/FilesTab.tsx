'use client'

import { Button } from '@/components/ui/button'
import { FileIcon, Upload, Download, Trash2, Image, FileText } from 'lucide-react'

interface FileItem {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedAt: Date
}

// Mock files
const mockFiles: FileItem[] = [
  {
    id: '1',
    fileName: 'quote_proposal.pdf',
    fileType: 'application/pdf',
    fileSize: 245000,
    uploadedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    fileName: 'window_measurements.xlsx',
    fileType: 'application/vnd.ms-excel',
    fileSize: 52000,
    uploadedAt: new Date('2024-01-12'),
  },
  {
    id: '3',
    fileName: 'living_room_photo.jpg',
    fileType: 'image/jpeg',
    fileSize: 1200000,
    uploadedAt: new Date('2024-01-10'),
  },
]

interface FilesTabProps {
  customerId: string
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image
  if (fileType.includes('pdf')) return FileText
  return FileIcon
}

export function FilesTab({ customerId }: FilesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Files ({mockFiles.length})</h3>
        <Button size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      {/* Upload Drop Zone */}
      <div className="rounded-lg border-2 border-dashed p-8 text-center">
        <Upload className="mx-auto h-10 w-10 text-muted-foreground/50" />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, Images, Excel, Word documents up to 10MB
        </p>
      </div>

      {/* File List */}
      {mockFiles.length > 0 ? (
        <div className="space-y-2">
          {mockFiles.map((file) => {
            const Icon = getFileIcon(file.fileType)
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.fileSize)} • {file.uploadedAt.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <FileIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">No files uploaded yet</p>
        </div>
      )}
    </div>
  )
}

