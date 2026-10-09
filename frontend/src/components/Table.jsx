import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function Table({
  columns = [],
  data = [],
  keyExtractor = (item, index) => item.id || index,
  emptyMessage = 'Nenhum registro encontrado.',
  loading = false,
  className = ''
}) {
  return (
    <div className={`table-container ${className}`}>
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  style={{
                    textAlign: col.align || 'left',
                    width: col.width || 'auto'
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2.5rem' }}>
                  <LoadingSpinner text="Carregando registros..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2.5rem' }}>
                  <div className="empty-state">
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr key={keyExtractor(item, rowIndex)}>
                  {columns.map((col, colIndex) => {
                    const cellContent = col.render
                      ? col.render(item, rowIndex)
                      : col.accessor
                      ? item[col.accessor]
                      : null;

                    return (
                      <td
                        key={colIndex}
                        style={{ textAlign: col.align || 'left' }}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
