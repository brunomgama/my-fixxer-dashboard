"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useEnvironment } from "@/lib/context/environment"
import { UnsubscribeApi } from "@/lib/api/unsubscribe"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RippleWaveLoader } from "@/components/ripple-wave-loader"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { Badge } from "@/components/ui/badge"
import { Unsubscribe, UnsubscribeListParams } from "@/lib/types/unsubscribe"
import { useToast } from "@/hooks/useToast"
import Toaster from "@/components/toast"
import { 
  IconSearch, 
  IconTrash,
  IconMail,
  IconClock,
  IconChevronRight,
  IconFilter,
  IconX
} from "@tabler/icons-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UnsubscribePage() {
  const { env } = useEnvironment()
  
  // Remove useMemo to ensure API instance is always fresh and matches current environment
//   console.log('Creating UnsubscribeApi instance for env:', env)
  const api = new UnsubscribeApi(env)

  const { toasterRef, showToast } = useToast()

  const [unsubscribes, setUnsubscribes] = useState<Unsubscribe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [lastEvaluatedKey, setLastEvaluatedKey] = useState<string | undefined>()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Filtering state
  const [filters, setFilters] = useState<UnsubscribeListParams>({
    sortBy: "unsubscribedAt",
    sortOrder: "desc"
  })
  const [showFilters, setShowFilters] = useState(false)
  const [emailFilter, setEmailFilter] = useState("")
  const [emailTypeFilter, setEmailTypeFilter] = useState<string>("all")

  // Search functionality
  const [searchEmail, setSearchEmail] = useState("")
  const [searchEmailType, setSearchEmailType] = useState<string>("Marketing")
  const [searchResult, setSearchResult] = useState<Unsubscribe | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Delete modal state
  const [selectedUnsubscribe, setSelectedUnsubscribe] = useState<Unsubscribe | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reset state when environment changes
  useEffect(() => {
    console.log('Environment changed to:', env, 'Resetting state')
    setUnsubscribes([])
    setLoading(true)
    setError(null)
    setTotalCount(0)
    setLastEvaluatedKey(undefined)
    setCurrentPage(1)
    setSearchResult(null)
    setSearchError(null)
  }, [env])

  const fetchUnsubscribes = useCallback(async (resetPagination = false) => {
    console.log('fetchUnsubscribes called:', { resetPagination, env })
    setLoading(true)
    setError(null)
    
    try {
      const params: UnsubscribeListParams = {
        ...filters,
        limit: itemsPerPage,
        lastKey: resetPagination ? undefined : lastEvaluatedKey
      }

      if (emailFilter.trim()) {
        params.email = [emailFilter.trim()]
      }
      if (emailTypeFilter && emailTypeFilter !== "all") {
        params.emailType = [emailTypeFilter]
      }

    //   console.log('Calling api.list with params:', params)
      const result = await api.list(params)
      
    //   console.log("Unsubscribe list response:", result)
    //   console.log("Unsubscribe list params:", params)

      // Validate the response structure
      if (!result) {
        throw new Error('No response received from API')
      }

      if (!Array.isArray(result.results)) {
        console.error('Invalid response structure:', result)
        throw new Error('Invalid response structure: results is not an array')
      }

      if (resetPagination) {
        setUnsubscribes(result.results)
        setCurrentPage(1)
      } else {
        setUnsubscribes(prev => [...prev, ...result.results])
      }
      
      setLastEvaluatedKey(result.lastEvaluatedKey)
      setTotalCount(result.count || 0)
      
    //   console.log('State updated:', {
    //     resultsCount: result.results.length,
    //     totalCount: result.count,
    //     lastEvaluatedKey: result.lastEvaluatedKey
    //   })
      
    } catch (err: any) {
      console.error('fetchUnsubscribes error:', err)
      const errorMessage = err.message || "Failed to fetch unsubscriptions"
      setError(errorMessage)
      showToast("Error", errorMessage, "error")
    } finally {
      setLoading(false)
    }
  }, [api, filters, itemsPerPage, lastEvaluatedKey, emailFilter, emailTypeFilter, showToast, env])

  useEffect(() => {
    console.log('useEffect triggered, calling fetchUnsubscribes')
    fetchUnsubscribes(true)
  }, [filters, emailFilter, emailTypeFilter, itemsPerPage, env]) // Added env to dependencies

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      showToast("Error", "Please enter an email address", "error")
      return
    }

    setSearchLoading(true)
    setSearchError(null)
    setSearchResult(null)

    try {
      const result = await api.searchByEmail(searchEmail.trim(), searchEmailType)
      setSearchResult(result)
      showToast("Success", "Unsubscription found", "success")
    } catch (error: any) {
      if (error.message.includes("404")) {
        setSearchError("No unsubscription found for this email and type")
        showToast("Info", "No unsubscription found", "warning")
      } else {
        setSearchError("Failed to search unsubscription")
        showToast("Error", "Failed to search unsubscription", "error")
      }
    } finally {
      setSearchLoading(false)
    }
  }

  const handleRemoveUnsubscription = async () => {
    if (!selectedUnsubscribe) return

    setIsDeleting(true)
    try {
      await api.delete(selectedUnsubscribe.email, selectedUnsubscribe.emailType)
      showToast("Success", "Unsubscription removed", "success")
      
      // Remove from main list if it exists
      setUnsubscribes(prev => prev.filter(u => 
        !(u.email === selectedUnsubscribe.email && u.emailType === selectedUnsubscribe.emailType)
      ))
      
      // Clear search result if it matches
      if (searchResult && 
          searchResult.email === selectedUnsubscribe.email && 
          searchResult.emailType === selectedUnsubscribe.emailType) {
        setSearchResult(null)
        setSearchError("No unsubscription found for this email and type")
      }
      
      // Refresh the list to get accurate count
      fetchUnsubscribes(true)
      
    } catch {
      showToast("Error", "Failed to remove unsubscription", "error")
    } finally {
      setIsDeleting(false)
      setSelectedUnsubscribe(null)
    }
  }

  const handleLoadMore = () => {
    if (lastEvaluatedKey && !loading) {
      fetchUnsubscribes()
      setCurrentPage(prev => prev + 1)
    }
  }

  const handleApplyFilters = () => {
    fetchUnsubscribes(true)
    setShowFilters(false)
  }

  const handleClearFilters = () => {
    setEmailFilter("")
    setEmailTypeFilter("all")
    setFilters({
      sortBy: "unsubscribedAt",
      sortOrder: "desc"
    })
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getEmailTypeBadge = (emailType: string) => {
    switch (emailType.toLowerCase()) {
      case "marketing":
        return "bg-yellow-100 text-yellow-800"
      case "automation":
        return "bg-blue-100 text-blue-700"
      case "functional":
        return "bg-purple-100 text-purple-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const hasActiveFilters = (emailFilter || emailTypeFilter) && emailTypeFilter !== "all"

  // Debug information display
  const debugInfo = {
    env,
    loading,
    error,
    unsubscribesLength: unsubscribes.length,
    totalCount,
    lastEvaluatedKey,
    hasActiveFilters
  }

//   console.log('Component render state:', debugInfo)

  if (loading && unsubscribes.length === 0) return <RippleWaveLoader />
  if (error && unsubscribes.length === 0) {
    return (
      <div className="p-4">
        <p className="text-destructive mb-4">{error}</p>
        <div className="bg-gray-100 p-4 rounded text-sm">
          <h3 className="font-semibold mb-2">Debug Information:</h3>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
        <Button onClick={() => fetchUnsubscribes(true)} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 mr-4 mb-4">
      <Toaster ref={toasterRef} />
      
      {/* Debug Panel (only in development) */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 p-4 rounded-lg border text-sm">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>Environment: {env}</div>
            <div>Loading: {loading.toString()}</div>
            <div>Results: {unsubscribes.length}</div>
            <div>Total Count: {totalCount}</div>
            <div>Last Key: {lastEvaluatedKey || 'none'}</div>
            <div>Error: {error || 'none'}</div>
          </div>
        </div>
      )} */}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Unsubscriptions</h1>
          <p className="text-muted-foreground">
            Manage email unsubscriptions ({totalCount} total)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={hasActiveFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <IconFilter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={handleClearFilters}>
              <IconX className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="emailFilter">Email</Label>
              <Input
                id="emailFilter"
                type="email"
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                placeholder="Filter by email"
              />
            </div>
            <div>
              <Label htmlFor="emailTypeFilter">Email Type</Label>
              <Select value={emailTypeFilter} onValueChange={setEmailTypeFilter}>
                <SelectTrigger>
                    <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Automation">Automation</SelectItem>
                    <SelectItem value="Functional">Functional</SelectItem>
                </SelectContent>
                </Select>
            </div>
            <div>
              <Label htmlFor="sortBy">Sort By</Label>
              <Select 
                value={filters.sortBy} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unsubscribedAt">Unsubscribed Date</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="emailType">Email Type</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Select 
                value={filters.sortOrder} 
                onValueChange={(value) => setFilters(prev => ({ ...prev, sortOrder: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowFilters(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Search Unsubscription</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="searchEmail">Email Address</Label>
            <Input
              id="searchEmail"
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="Enter email address"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <div>
            <Label htmlFor="searchEmailType">Email Type</Label>
            <Select value={searchEmailType} onValueChange={setSearchEmailType}>
              <SelectTrigger>
                <SelectValue placeholder="Select email type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Automation">Automation</SelectItem>
                <SelectItem value="Functional">Functional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleSearch} disabled={searchLoading} className="w-full">
              <IconSearch className="w-4 h-4 mr-2" />
              {searchLoading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {searchResult && (
          <div className="mt-4 p-4 border rounded-lg bg-green-50">
            <h3 className="font-medium text-green-800 mb-2">Unsubscription Found</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Email:</span> {searchResult.email}
              </div>
              <div>
                <span className="font-medium">Type:</span> 
                <Badge className={`ml-2 ${getEmailTypeBadge(searchResult.emailType)}`}>
                  {searchResult.emailType}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Unsubscribed:</span> {formatDateTime(searchResult.unsubscribedAt).date}
              </div>
              <div className="flex items-center justify-end">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive"
                  onClick={() => setSelectedUnsubscribe(searchResult)}
                >
                  <IconTrash className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}

        {searchError && (
          <div className="mt-4 p-4 border rounded-lg bg-yellow-50">
            <p className="text-yellow-800">{searchError}</p>
          </div>
        )}
      </div>

      {/* Unsubscriptions Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Email Type</TableHead>
              <TableHead>Unsubscribed At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unsubscribes.length > 0 ? (
              unsubscribes.map((unsubscribe, index) => {
                const { date, time } = formatDateTime(unsubscribe.unsubscribedAt)
                
                return (
                  <TableRow key={`${unsubscribe.email}-${unsubscribe.emailType}-${index}`}>
                    <TableCell className="flex items-center gap-2">
                      <IconMail className="h-4 w-4 text-muted-foreground shrink-0" />
                      {unsubscribe.email}
                    </TableCell>

                    <TableCell>
                      <Badge className={getEmailTypeBadge(unsubscribe.emailType)}>
                        {unsubscribe.emailType}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconClock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{date}</div>
                          <div className="text-sm text-muted-foreground">{time}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive"
                        onClick={() => setSelectedUnsubscribe(unsubscribe)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  {loading ? "Loading..." : "No unsubscriptions found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Load More Button */}
        {lastEvaluatedKey && (
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              onClick={handleLoadMore} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                "Loading..."
              ) : (
                <>
                  <IconChevronRight className="w-4 h-4 mr-2" />
                  Load More ({unsubscribes.length} of {totalCount})
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={!!selectedUnsubscribe}
        onClose={() => setSelectedUnsubscribe(null)}
        onConfirm={handleRemoveUnsubscription}
        loading={isDeleting}
        title="Remove Unsubscription"
        description={selectedUnsubscribe ? 
          `Are you sure you want to remove the unsubscription for "${selectedUnsubscribe.email}" from ${selectedUnsubscribe.emailType} emails? This will allow them to receive emails again.` :
          ""
        }
      />
    </div>
  )
}