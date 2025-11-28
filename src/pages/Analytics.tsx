import React, { useState } from 'react';
import api from '../services/api';
import { Download, Calendar, Clock } from 'lucide-react';
import type { ItemsSoldByMonthResponse } from '../types';
import './Analytics.css';

const Analytics: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [itemsStartDate, setItemsStartDate] = useState('');
  const [itemsEndDate, setItemsEndDate] = useState('');
  const [itemsData, setItemsData] = useState<ItemsSoldByMonthResponse | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState('');

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

  const handleFetchItemsReport = async () => {
    if (!itemsStartDate || !itemsEndDate) {
      setItemsError('Please select both start and end dates');
      return;
    }

    try {
      setItemsLoading(true);
      setItemsError('');
      const data = (await api.getItemsSoldByMonth(itemsStartDate, itemsEndDate)) as ItemsSoldByMonthResponse;
      setItemsData(data);
    } catch (err) {
      setItemsError(err instanceof Error ? err.message : 'Failed to fetch items report');
      setItemsData(null);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleExportItemsReport = async () => {
    if (!itemsStartDate || !itemsEndDate) {
      setItemsError('Please select both start and end dates');
      return;
    }

    try {
      setItemsLoading(true);
      setItemsError('');
      await api.exportItemsReport(itemsStartDate, itemsEndDate);
    } catch (err) {
      setItemsError(err instanceof Error ? err.message : 'Failed to export items report');
    } finally {
      setItemsLoading(false);
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
            {loading ? (
              <span>Exporting...</span>
            ) : (
              <>
                <Download size={18} />
                <span>Export to Excel</span>
              </>
            )}
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
            <Clock size={16} />
            <span>Last 7 Days</span>
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
            <Calendar size={16} />
            <span>Last 30 Days</span>
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
            <Calendar size={16} />
            <span>This Month</span>
          </button>
        </div>
      </div>

      <div className="card mt-xl">
        <h3>Items Sold by Month Report</h3>
        <p className="mb-lg">
          View and export a breakdown of items sold by month. Includes pending and confirmed orders only.
        </p>

        {itemsError && <div className="error-message mb-md">{itemsError}</div>}

        <div className="export-form">
          <div className="form-group">
            <label htmlFor="itemsStartDate">Start Date</label>
            <input
              type="date"
              id="itemsStartDate"
              value={itemsStartDate}
              onChange={(e) => setItemsStartDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="itemsEndDate">End Date</label>
            <input
              type="date"
              id="itemsEndDate"
              value={itemsEndDate}
              onChange={(e) => setItemsEndDate(e.target.value)}
            />
          </div>

          <button
            className="btn-primary"
            onClick={handleFetchItemsReport}
            disabled={itemsLoading}
          >
            {itemsLoading ? 'Loading...' : 'View Report'}
          </button>

          <button
            className="btn-secondary"
            onClick={handleExportItemsReport}
            disabled={itemsLoading || !itemsData}
          >
            {itemsLoading ? (
              <span>Exporting...</span>
            ) : (
              <>
                <Download size={18} />
                <span>Export to Excel</span>
              </>
            )}
          </button>
        </div>

        {itemsData && (
          <div className="items-report-table mt-lg">
            <table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Serving Size</th>
                  {itemsData.monthsIncluded.map((month) => (
                    <th key={month}>{month}</th>
                  ))}
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {itemsData.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>{item.servingSize}</td>
                    {itemsData.monthsIncluded.map((month) => (
                      <td key={month} className="number">
                        {item[month] || 0}
                      </td>
                    ))}
                    <td className="number total-cell">{item.total}</td>
                  </tr>
                ))}
                <tr className="grand-total-row">
                  <td colSpan={2}>
                    <strong>GRAND TOTAL</strong>
                  </td>
                  {itemsData.monthsIncluded.map((month) => {
                    const monthTotal = itemsData.items.reduce(
                      (sum, item) => sum + (typeof item[month] === 'number' ? item[month] : 0),
                      0
                    );
                    return (
                      <td key={month} className="number">
                        <strong>{monthTotal}</strong>
                      </td>
                    );
                  })}
                  <td className="number total-cell">
                    <strong>{itemsData.grandTotal}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
