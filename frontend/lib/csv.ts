export type CsvColumn<T> = {
  header: string;
  accessor: (row: T) => unknown;
};

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const cell = String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const shouldQuote = /[",\n]/.test(cell);

  if (!shouldQuote) {
    return cell;
  }

  return `"${cell.replace(/"/g, "\"\"")}"`;
}

export function exportRowsToCsv<T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[]
): void {
  const normalizedFilename = filename.toLowerCase().endsWith(".csv")
    ? filename
    : `${filename}.csv`;

  const headerRow = columns.map((column) => escapeCsvCell(column.header)).join(",");
  const dataRows = rows.map((row) =>
    columns.map((column) => escapeCsvCell(column.accessor(row))).join(",")
  );

  const csvContent = [headerRow, ...dataRows].join("\r\n");
  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.setAttribute("download", normalizedFilename);
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
