"use client";

import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { LeadQualityCampaign } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/utils";

const columns: ColumnDef<LeadQualityCampaign>[] = [
  { accessorKey: "campaignName", header: "Reklama" },
  {
    accessorKey: "averageScore",
    header: "O'rtacha ball",
    cell: ({ row }) => formatNumber(row.original.averageScore)
  },
  {
    accessorKey: "qualifiedLeadRate",
    header: "Sifatli lid",
    cell: ({ row }) => formatPercent(row.original.qualifiedLeadRate)
  },
  {
    accessorKey: "spamRate",
    header: "Spam",
    cell: ({ row }) => formatPercent(row.original.spamRate)
  },
  {
    accessorKey: "repliedRate",
    header: "Javob berdi",
    cell: ({ row }) => formatPercent(row.original.repliedRate)
  },
  {
    accessorKey: "interestedRate",
    header: "Qiziqdi",
    cell: ({ row }) => formatPercent(row.original.interestedRate)
  },
  {
    accessorKey: "saleConversionRate",
    header: "Sotuvga aylanish",
    cell: ({ row }) => formatPercent(row.original.saleConversionRate)
  }
];

export function LeadQualityTable({ data }: { data: LeadQualityCampaign[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[760px]">
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
