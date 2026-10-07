export default function DataTable({ columns, data, onRowClick, emptyMessage = 'No data available' }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-surface-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="nba-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} style={{ width: col.width }}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx}>
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
