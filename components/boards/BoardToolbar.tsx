"use client";

import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ColumnType } from "@/lib/column-types/schemas";

export interface SortState {
  columnId: number | null;
  direction: "asc" | "desc";
}

interface ColumnData {
  id: number;
  name: string;
  type: ColumnType;
  config: Record<string, unknown>;
}

export function BoardToolbar({
  search,
  onSearchChange,
  filterableColumns,
  activeFilters,
  onToggleFilter,
  sortableColumns,
  sort,
  onSortChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filterableColumns: { column: ColumnData; options: { label: string; color: string }[] }[];
  activeFilters: Record<number, Set<string>>;
  onToggleFilter: (columnId: number, label: string) => void;
  sortableColumns: ColumnData[];
  sort: SortState;
  onSortChange: (next: SortState) => void;
}) {
  const activeFilterCount = Object.values(activeFilters).reduce((sum, set) => sum + set.size, 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full max-w-xs">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar item..."
          className="h-8 pl-8"
        />
      </div>

      {filterableColumns.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" variant="outline" size="sm">
                <SlidersHorizontal />
                Filtrar
                {activeFilterCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            }
          />
          <DropdownMenuContent align="start" className="w-56">
            {filterableColumns.map(({ column, options }, index) => (
              <DropdownMenuGroup key={column.id}>
                {index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{column.name}</DropdownMenuLabel>
                {options.map((option) => (
                  <DropdownMenuCheckboxItem
                    key={option.label}
                    checked={activeFilters[column.id]?.has(option.label) ?? false}
                    onCheckedChange={() => onToggleFilter(column.id, option.label)}
                    onSelect={(event) => event.preventDefault()}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: option.color }} />
                      {option.label}
                    </span>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuGroup>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {sortableColumns.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" variant="outline" size="sm">
                <ArrowUpDown />
                Ordenar
              </Button>
            }
          />
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuRadioGroup
              value={sort.columnId ? String(sort.columnId) : "none"}
              onValueChange={(value) =>
                onSortChange({ columnId: value === "none" ? null : Number(value), direction: sort.direction })
              }
            >
              <DropdownMenuRadioItem value="none">Sem ordenação</DropdownMenuRadioItem>
              {sortableColumns.map((column) => (
                <DropdownMenuRadioItem key={column.id} value={String(column.id)}>
                  {column.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            {sort.columnId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={sort.direction}
                  onValueChange={(value) => onSortChange({ columnId: sort.columnId, direction: value as "asc" | "desc" })}
                >
                  <DropdownMenuRadioItem value="asc">Crescente</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="desc">Decrescente</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
