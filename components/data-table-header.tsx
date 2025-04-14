import React from 'react'
import { TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"

interface DataTableHeaderProps {
  columnVisibility: Record<string, boolean>
  handleOutlineClick: () => void
  toggleAllFiles: (checked: boolean) => void
  allSelected: boolean
}

export function DataTableHeader({
  columnVisibility,
  handleOutlineClick,
  toggleAllFiles,
  allSelected,
}: DataTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[20px]">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAllFiles}
          />
        </TableHead>
        <TableHead>Name</TableHead>
        {columnVisibility.size && <TableHead>Size</TableHead>}
        {columnVisibility.type && <TableHead>Type</TableHead>}
        {columnVisibility.pages && <TableHead>Pages</TableHead>}
        {columnVisibility.description && <TableHead>Description</TableHead>}
        {columnVisibility.outline && (
          <TableHead>
            <Button onClick={handleOutlineClick} variant="ghost" size="sm">
              Generate Outline
            </Button>
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
  )
}
