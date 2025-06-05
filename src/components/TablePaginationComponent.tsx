// React Imports
import { Table } from '@tanstack/react-table'

// MUI Imports
import TablePagination from '@mui/material/TablePagination'

interface TablePaginationComponentProps<T> {
  table: Table<T>
}

const TablePaginationComponent = <T,>({ table }: TablePaginationComponentProps<T>) => {
  return (
    <TablePagination
      component='div'
      count={table.getFilteredRowModel().rows.length}
      page={table.getState().pagination.pageIndex}
      onPageChange={(_, page) => table.setPageIndex(page)}
      rowsPerPage={table.getState().pagination.pageSize}
      onRowsPerPageChange={e => table.setPageSize(Number(e.target.value))}
      rowsPerPageOptions={[10, 25, 50, 100]}
    />
  )
}

export default TablePaginationComponent
