'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BookOpen, FileText, Video, Download, Search } from 'lucide-react'
import { useState, useEffect } from 'react'

interface HelpItem {
  id: string
  title: string
  type: 'PDF' | 'Video'
  category: string
  description: string
  url: string
  uploadDate: string | Date
}

export default function HelpLibraryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [helpItems, setHelpItems] = useState<HelpItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHelpItems = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/help-library')
        if (!response.ok) {
          throw new Error('Failed to fetch help items')
        }
        const data = await response.json()
        setHelpItems(data.helpItems || [])
      } catch (err) {
        console.error('Error fetching help items:', err)
        setError('Failed to load help resources. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchHelpItems()
  }, [])

  const filteredItems = helpItems.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Help Library
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Access helpful resources, guides, and tutorials
          </p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search help resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Loading help resources...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Items Grid */}
      {!loading && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {item.type === 'PDF' ? (
                        <FileText className="h-5 w-5 text-red-600" />
                      ) : (
                        <Video className="h-5 w-5 text-blue-600" />
                      )}
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                    </div>
                  </div>
                  <Badge variant="outline" className="mt-2 w-fit">
                    {item.category}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {item.type}
                    </span>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        if (item.url) {
                          if (item.type === 'Video') {
                            window.open(item.url, '_blank')
                          } else {
                            // For PDFs, open in new tab or download
                            const link = document.createElement('a')
                            link.href = item.url
                            link.target = '_blank'
                            link.download = item.title
                            link.click()
                          }
                        }
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {item.type === 'Video' ? 'Watch' : 'Download'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'No help resources found matching your search' : 'No help resources available'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
