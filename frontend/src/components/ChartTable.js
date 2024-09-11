import React, { useState, useEffect, useRef } from 'react';
import './ChartTable.css';

function ChartTable({ data }) {
  const [selectedItems, setSelectedItems] = useState(null);
  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setSelectedItems(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!Array.isArray(data)) {
    return <p>No data available</p>;
  }



  return (
    <div>
      <table className="chart-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Version</th>
            <th>Repository</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.version}</td>
              <td>
                <a href={item.repositoryLink} target="_blank" rel="noopener noreferrer">
                  {item.repository}
                </a>
              </td>
              <td>
                <span 
                  className="count-click"
                  onClick={() => setSelectedItems(item.items)}
                >
                  {item.count}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedItems && (
        <div className="items-popup" ref={popupRef}>
          <h3>Items ({selectedItems.length}):</h3>
          <ul>
            {selectedItems.map((item, index) => (
              <li key={index}>
                <a href={item} target="_blank" rel="noopener noreferrer">{item}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ChartTable;