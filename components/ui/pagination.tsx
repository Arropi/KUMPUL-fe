"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export interface PaginationProps extends React.ComponentProps<"nav"> {
  className?: string;
}

export function Pagination({ className, ...props }: PaginationProps) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

export function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

export function PaginationItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return <li className={cn("", className)} {...props} />;
}

export interface PaginationLinkProps extends React.ComponentProps<"button"> {
  isActive?: boolean;
  size?: "default" | "icon";
}

export function PaginationLink({
  className,
  isActive,
  size = "default",
  ...props
}: PaginationLinkProps) {
  return (
    <button
      type="button"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-40",
        size === "icon" ? "size-8" : "h-8 min-w-8 px-2.5",
        isActive
          ? "bg-primary text-white font-bold shadow-xs hover:bg-primary-hover active:scale-95"
          : "text-text-secondary hover:text-text-primary hover:bg-surface-subtle active:scale-95",
        className
      )}
      {...props}
    />
  );
}

export function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      className={cn("flex size-8 items-center justify-center text-text-muted", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

/**
 * Watermelon UI Pagination-15 Component
 * Styled with KUMPUL design tokens (natural surfaces, deep forest green primary)
 */
export interface WatermelonPagination15Props {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  className?: string;
}

export function Pagination15({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [6, 9, 12, 24],
  itemLabel = "produk",
  className,
}: WatermelonPagination15Props) {
  const safeTotalPages = Math.max(1, totalPages);
  const safeCurrentPage = Math.min(Math.max(1, currentPage), safeTotalPages);

  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis window
  const getVisiblePages = (): (number | "dots")[] => {
    if (safeTotalPages <= 5) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1);
    }

    if (safeCurrentPage <= 3) {
      return [1, 2, 3, "dots", safeTotalPages];
    }

    if (safeCurrentPage >= safeTotalPages - 2) {
      return [1, "dots", safeTotalPages - 2, safeTotalPages - 1, safeTotalPages];
    }

    return [1, "dots", safeCurrentPage - 1, safeCurrentPage, safeCurrentPage + 1, "dots", safeTotalPages];
  };

  const visiblePages = getVisiblePages();

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 shadow-elevation-1 transition-all max-sm:flex-col max-sm:justify-center max-sm:gap-3.5 max-sm:px-3 max-sm:py-4",
        className
      )}
    >
      {/* 1. Rows per page selector with user's DropdownMenu style */}
      <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-border/70 bg-surface-subtle/80 px-2 py-1">
        <span className="text-[10px] font-bold tracking-widest text-text-muted uppercase pl-1 select-none">
          Baris
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 h-7 rounded-lg border border-border/80 bg-surface px-2.5 text-xs font-bold text-text-primary shadow-xs outline-none cursor-pointer hover:border-primary/40 hover:bg-surface-subtle focus:ring-2 focus:ring-primary/20 transition-all duration-150"
            >
              <span>{pageSize}</span>
              <ChevronDown className="size-3 text-text-muted shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[7rem] p-1.5 rounded-xl shadow-elevation-2">
            <div className="px-2 py-1 text-[10px] font-bold text-text-muted uppercase tracking-wider border-b border-border/60 mb-1">
              Jumlah Baris
            </div>
            <DropdownMenuRadioGroup
              value={String(pageSize)}
              onValueChange={(val) => {
                onPageSizeChange(Number(val));
                onPageChange(1);
              }}
            >
              {pageSizeOptions.map((opt) => (
                <DropdownMenuRadioItem
                  key={opt}
                  value={String(opt)}
                  className="py-1.5 px-2.5 text-xs font-semibold rounded-lg cursor-pointer hover:bg-surface-subtle"
                >
                  <span>{opt} baris</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 2. Showing text & Page buttons */}
      <div className="flex items-center gap-4 sm:gap-6 max-sm:flex-col max-sm:justify-center max-sm:gap-3">
        <p
          className="text-xs font-medium text-text-secondary"
          aria-live="polite"
        >
          Menampilkan{" "}
          <span className="font-bold text-primary">
            {startItem}-{endItem}
          </span>{" "}
          dari{" "}
          <span className="font-bold text-text-primary">
            {totalItems}
          </span>{" "}
          {itemLabel}
        </p>

        <Pagination className="w-auto mx-0">
          <PaginationContent className="gap-1 rounded-xl bg-surface-subtle/80 border border-border/70 p-1 max-sm:flex-wrap max-sm:justify-center">
            {/* Jump to start */}
            <PaginationItem className="hidden sm:flex">
              <PaginationLink
                aria-label="Awal halaman"
                size="icon"
                disabled={safeCurrentPage <= 1}
                onClick={() => onPageChange(1)}
                className="rounded-lg border border-border/60 bg-surface shadow-2xs hover:bg-surface-subtle"
                title="Halaman pertama"
              >
                <ChevronsLeft className="size-4" />
              </PaginationLink>
            </PaginationItem>

            {/* Previous */}
            <PaginationItem>
              <PaginationLink
                aria-label="Halaman sebelumnya"
                size="icon"
                disabled={safeCurrentPage <= 1}
                onClick={() => onPageChange(safeCurrentPage - 1)}
                className="rounded-lg border border-border/60 bg-surface shadow-2xs hover:bg-surface-subtle"
                title="Sebelumnya"
              >
                <ChevronLeft className="size-4" />
              </PaginationLink>
            </PaginationItem>

            {/* Page number buttons */}
            {visiblePages.map((page, idx) => {
              if (page === "dots") {
                return (
                  <PaginationItem key={`dots-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }

              const isCurrent = page === safeCurrentPage;
              return (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={isCurrent}
                    onClick={() => onPageChange(page)}
                    className={cn(
                      "rounded-lg font-bold min-w-8 h-8 px-2 transition-all",
                      isCurrent
                        ? "bg-primary text-white shadow-xs hover:bg-primary-hover"
                        : "hover:bg-surface text-text-primary"
                    )}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            {/* Next */}
            <PaginationItem>
              <PaginationLink
                aria-label="Halaman berikutnya"
                size="icon"
                disabled={safeCurrentPage >= safeTotalPages}
                onClick={() => onPageChange(safeCurrentPage + 1)}
                className="rounded-lg border border-border/60 bg-surface shadow-2xs hover:bg-surface-subtle"
                title="Berikutnya"
              >
                <ChevronRight className="size-4" />
              </PaginationLink>
            </PaginationItem>

            {/* Jump to end */}
            <PaginationItem className="hidden sm:flex">
              <PaginationLink
                aria-label="Akhir halaman"
                size="icon"
                disabled={safeCurrentPage >= safeTotalPages}
                onClick={() => onPageChange(safeTotalPages)}
                className="rounded-lg border border-border/60 bg-surface shadow-2xs hover:bg-surface-subtle"
                title="Halaman terakhir"
              >
                <ChevronsRight className="size-4" />
              </PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
