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
    <div className="table-container" style={{
      border: "1px solid rgba(229, 231, 235, 0.6)",
      boxShadow: "0 1px 3px rgba(11,63,107,0.02), 0 4px 12px rgba(11,63,107,0.01)",
      background: "#fff",
    }}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{
                width: col.width,
                padding: "14px 18px",
                fontSize: 11.5,
                fontWeight: 700,
                color: "var(--color-text-muted)",
                letterSpacing: "0.03em",
                borderBottom: "1.5px solid rgba(229, 231, 235, 0.8)",
              }}>
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
                <tr key={key} style={{ transition: "background 0.2s ease" }}>
                  {columns.map((col) => (
                    <td key={col.key} style={{
                      padding: "14px 18px",
                      fontSize: 13.5,
                      color: "var(--color-text-dark)",
                      borderBottom: idx === data.length - 1 ? "none" : "1px solid rgba(243, 244, 246, 0.8)",
                    }}>
                      {col.render(row)}
                    </td>
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
