import React, { useState } from 'react';
import api from '../services/api';
import './Analytics.css';

const Analytics: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.exportOrders(startDate, endDate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>Analytics & Reports</h1>
          <p>Export and analyze order data</p>
        </div>
      </div>

      <div className="card">
        <h3>Export Orders</h3>
        <p className="mb-lg">
          Export orders to Excel for detailed analysis and reporting.
        </p>

        {error && <div className="error-message mb-md">{error}</div>}

        <div className="export-form">
          <div className="form-group">
            <label htmlFor="startDate">Start Date</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? 'Exporting...' : 'Export to Excel'}
          </button>
        </div>
      </div>

      <div className="card mt-xl">
        <h3>Quick Date Ranges</h3>
        <div className="quick-ranges">
          <button
            className="btn-secondary"
            onClick={() => {
              const today = new Date();
              setEndDate(today.toISOString().split('T')[0]);
              const weekAgo = new Date(today);
              weekAgo.setDate(today.getDate() - 7);
              setStartDate(weekAgo.toISOString().split('T')[0]);
            }}
          >
            Last 7 Days
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              const today = new Date();
              setEndDate(today.toISOString().split('T')[0]);
              const monthAgo = new Date(today);
              monthAgo.setMonth(today.getMonth() - 1);
              setStartDate(monthAgo.toISOString().split('T')[0]);
            }}
          >
            Last 30 Days
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              const today = new Date();
              setEndDate(today.toISOString().split('T')[0]);
              const start = new Date(today.getFullYear(), today.getMonth(), 1);
              setStartDate(start.toISOString().split('T')[0]);
            }}
          >
            This Month
          </button>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
