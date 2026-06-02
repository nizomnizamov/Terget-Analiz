"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ManagerMetric } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

const columns: ColumnDef<ManagerMetric>[] = [
  { accessorKey: "managerName", header: "Operator" },
  { accessorKey: "leads", header: "Lidlar" },
  { accessorKey: "repliedLeads", header: "Javob berdi" },
  {
    accessorKey: "contactRate",
    header: "Aloqa ulushi",
    cell: ({ row }) => formatPercent(row.original.contactRate)
  },
  {
    accessorKey: "qualifiedLeadRate",
    header: "Sifatli lid",
    cell: ({ row }) => formatPercent(row.original.qualifiedLeadRate)
  },
  {
    accessorKey: "saleConversion",
    header: "Sotuvga aylanish",
    cell: ({ row }) => formatPercent(row.original.saleConversion)
  },
  {
    accessorKey: "averageResponseMinutes",
    header: "Javob vaqti",
    cell: ({ row }) => `${formatNumber(row.original.averageResponseMinutes)} daq`
  },
  { accessorKey: "lostLeads", header: "Yo'qotildi" },
  { accessorKey: "wonDeals", header: "Sotuv" },
  {
    accessorKey: "revenue",
    header: "Tushum",
    cell: ({ row }) => formatCurrency(row.original.revenue)
  }
];

export function OperatorTable({ data }: { data: ManagerMetric[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[980px]">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
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
  );
}
