"use client";

import { useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils";

/**
 * DataTable — sortable, filterable, paginated; sticky header; empty state;
 * CSV export (the organiser owns their data — APP_RULES 2.6). Used for
 * entries, payments, comms log.
 */
export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = "Search…",
  emptyTitle = "Nothing here yet",
  emptyAction,
  csvFileName,
  /** Map a row to a flat record for CSV export. Omit to hide the button. */
  csvRow,
  pageSize = 10,
  className,
}: {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchPlaceholder?: string;
  emptyTitle?: string;
  emptyAction?: React.ReactNode;
  csvFileName?: string;
  csvRow?: (row: TData) => Record<string, string | number | boolean | null>;
  pageSize?: number;
  className?: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  function exportCsv() {
    if (!csvRow) return;
    const rows = table.getFilteredRowModel().rows.map((r) => csvRow(r.original));
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const escape = (v: string | number | boolean | null) => {
      const s = v === null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = csvFileName ?? "export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const rows = table.getRowModel().rows;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <Input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="max-w-xs"
          aria-label="Filter rows"
        />
        {csvRow && (
          <Button variant="outline" size="sm" onClick={exportCsv} className="ml-auto">
            <Download aria-hidden /> Export CSV
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Inbox} title={emptyTitle} action={emptyAction} />
      ) : (
        <div className="max-h-[32rem] overflow-auto rounded-lg border bg-card">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface-2">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    return (
                      <TableHead key={header.id}>
                        {canSort ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:text-text"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <ArrowUpDown aria-hidden className="size-3.5 text-text-faint" />
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="font-mono text-[0.8125rem] tabular-nums text-text-muted">
            {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
}
