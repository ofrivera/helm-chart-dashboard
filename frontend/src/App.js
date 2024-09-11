import React, { useState, useEffect } from 'react';
import ChartTable from './components/ChartTable';
import './App.css';

function App() {
  const [inHouseCharts, setInHouseCharts] = useState([]);
  const [externalCharts, setExternalCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = 'http://localhost:3001/api/charts';

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setInHouseCharts(data.inHouseChartsArray);
        setExternalCharts(data.externalChartsArray);
        setError(null);
      } catch (e) {
        setError('Failed to fetch chart data. Please try again later.');
        console.error('Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h2>Helm Charts Dashboard</h2>
      </header>
      <main>
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {!loading && !error && (
          <>
            <h2>In-house Charts</h2>
            <ChartTable data={inHouseCharts} />
            <h2>External Charts</h2>
            <ChartTable data={externalCharts} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;