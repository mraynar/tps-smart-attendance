import EmptyState from "./EmptyState";

interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  keyField?: keyof T;
  emptyTitle?: string;
  emptyDescription?: string;
}

function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} style={{ padding: "14px 16px" }}>
              <div
                className="skeleton"
                style={{ height: 14, width: j === 0 ? "80%" : "60%", borderRadius: 6 }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function DataTable<T extends { id?: unknown }>({
  columns,
  data,
  loading = false,
  keyField,
  emptyTitle,
  emptyDescription,
}: DataTableProps<T>) {
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <SkeletonRows cols={columns.length} />
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 0 }}>
                <EmptyState title={emptyTitle} description={emptyDescription} />
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const key = keyField
                ? String(row[keyField])
                : `row-${idx}`;
              return (
                <tr key={key}>
                  {columns.map((col) => (
                    <td key={col.key}>{col.render(row)}</td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export type { Column };
