import { useState } from 'react';
import { 
  downloadCSV, 
  generateDailyReport, 
  getCurrentMonthReport,
  getCurrentWeekReport,
  type SalesReportData 
} from '../lib/csv';

export default function ReportExport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<SalesReportData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDailyReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await generateDailyReport();
      setReportData(data);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate daily report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate daily report');
    } finally {
      setLoading(false);
    }
  };

  const handleWeeklyReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCurrentWeekReport();
      setReportData(data);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate weekly report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate weekly report');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthlyReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCurrentMonthReport();
      setReportData(data);
      setShowPreview(true);
    } catch (error) {
      console.error('Failed to generate monthly report:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate monthly report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const now = new Date();
    const filename = `sales-report-${now.toISOString().split('T')[0]}.csv`;
    downloadCSV(reportData, filename);
  };

  const calculateTotal = () => {
    return reportData.reduce((sum, row) => sum + parseFloat(row.totalAmount), 0).toFixed(2);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-4">Sales Reports</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={handleDailyReport}
          disabled={loading}
          className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Today's Sales
        </button>

        <button
          onClick={handleWeeklyReport}
          disabled={loading}
          className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          This Week
        </button>

        <button
          onClick={handleMonthlyReport}
          disabled={loading}
          className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          This Month
        </button>
      </div>

      {loading && (
        <div className="text-center py-4 text-gray-600">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Generating report...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {showPreview && reportData.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Report Preview ({reportData.length} sales)</h3>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left">Sale ID</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Customer</th>
                  <th className="px-4 py-2 text-left">Items</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2 text-left">Payment</th>
                  <th className="px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{row.saleId}</td>
                    <td className="px-4 py-2">{row.date}</td>
                    <td className="px-4 py-2">
                      <div>{row.customerName}</div>
                      {row.customerPhone && (
                        <div className="text-xs text-gray-500">{row.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-4 py-2 max-w-xs truncate">{row.items}</td>
                    <td className="px-4 py-2 text-right font-medium">${row.totalAmount}</td>
                    <td className="px-4 py-2">{row.paymentMethod}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        row.status === 'completed' ? 'bg-green-100 text-green-800' :
                        row.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-semibold">
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right">Total:</td>
                  <td className="px-4 py-2 text-right">${calculateTotal()}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {showPreview && reportData.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No sales data found for the selected period.</p>
        </div>
      )}
    </div>
  );
}
