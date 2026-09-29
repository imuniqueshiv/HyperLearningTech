/**
 * Phase 2: Validate table structure preservation.
 * Ambiguous tables → REVIEW_REQUIRED; never invent cells.
 */

export interface TableCellEvidence {
  row: number;
  column: number;
  text: string;
}

export interface TableEvidenceLike {
  id: string;
  rows: number;
  columns: number;
  cells: TableCellEvidence[];
  confidence?: string;
}

export type TableValidationStatus = "VALID" | "REVIEW_REQUIRED" | "INVALID";

export interface TableValidationResult {
  status: TableValidationStatus;
  warnings: string[];
  errors: string[];
}

/**
 * Validates that cell grid is consistent with declared rows/columns.
 */
export function validateTableStructure(
  table: TableEvidenceLike
): TableValidationResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  if (table.rows < 1 || table.columns < 1) {
    errors.push(`TABLE_INVALID_DIMS:${table.id}`);
    return { status: "INVALID", warnings, errors };
  }

  const expected = table.rows * table.columns;
  if (table.cells.length === 0) {
    warnings.push(`TABLE_EMPTY_CELLS:${table.id}`);
    return { status: "REVIEW_REQUIRED", warnings, errors };
  }

  if (table.cells.length < expected * 0.5) {
    warnings.push(`TABLE_SPARSE:${table.id}`);
  }

  const seen = new Set<string>();
  let outOfRange = 0;
  let emptyNumericSuspect = 0;
  for (const cell of table.cells) {
    const key = `${cell.row}:${cell.column}`;
    if (seen.has(key)) {
      warnings.push(`TABLE_DUPLICATE_CELL:${table.id}:${key}`);
    }
    seen.add(key);
    if (
      cell.row < 0 ||
      cell.column < 0 ||
      cell.row >= table.rows ||
      cell.column >= table.columns
    ) {
      outOfRange += 1;
    }
    if (!cell.text.trim()) {
      emptyNumericSuspect += 1;
    }
  }

  if (outOfRange > 0) {
    errors.push(`TABLE_CELL_OUT_OF_RANGE:${table.id}:${outOfRange}`);
  }

  if (emptyNumericSuspect > table.cells.length * 0.4) {
    warnings.push(`TABLE_MANY_EMPTY_CELLS:${table.id}`);
  }

  // Flattened presentation heuristic: all cells in one row index
  const rowsUsed = new Set(table.cells.map((c) => c.row));
  if (table.rows >= 2 && rowsUsed.size === 1 && table.cells.length >= 4) {
    warnings.push(`TABLE_POSSIBLY_FLATTENED:${table.id}`);
  }

  let status: TableValidationStatus = "VALID";
  if (errors.length > 0) status = "INVALID";
  else if (warnings.length > 0) status = "REVIEW_REQUIRED";

  return { status, warnings, errors };
}

/**
 * Ensures numeric cell values from evidence appear in AI text when AI mentions the table.
 */
export function validateTableNumericsAgainstText(
  table: TableEvidenceLike,
  aiText: string
): string[] {
  const warnings: string[] = [];
  const numericCells = table.cells.filter((c) =>
    /^-?\d+(?:\.\d+)?$/.test(c.text.trim())
  );
  for (const cell of numericCells) {
    const v = cell.text.trim();
    if (!aiText.includes(v)) {
      warnings.push(`TABLE_NUMERIC_MISSING_IN_AI:${table.id}:${v}`);
    }
  }
  return warnings;
}
