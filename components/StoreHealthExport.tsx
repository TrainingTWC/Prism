import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { fetchTrainingData } from '../services/dataService';

interface StoreHealthExportProps {
  config: any; 
  setJson: (s: string) => void; 
  saving: boolean; 
  onSave: () => void;
}

const StoreHealthExport: React.FC<StoreHealthExportProps> = () => {
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [downloadFormat, setDownloadFormat] = useState('csv');
  const [auditData, setAuditData] = useState<any[]>([]);
  const [monthlyScores, setMonthlyScores] = useState<{[key: string]: any[]}>({});

  // Fetch audit data when component mounts or month changes
  useEffect(() => {
    const fetchAuditData = async () => {
      console.log('🔄 StoreHealthExport: Starting data fetch for month:', selectedMonth);
      setLoading(true);

      try {
        // Use the dataService's fetchTrainingData instead of direct API call
        console.log('📡 StoreHealthExport: Calling fetchTrainingData()...');
        const data = await fetchTrainingData();
        
        if (!Array.isArray(data)) {
          throw new Error('Received data is not an array');
        }
        
        console.log('✅ StoreHealthExport: Raw training data received:', {
          totalEntries: data?.length || 0,
          sample: data?.[0],
          fields: data?.[0] ? Object.keys(data[0]) : []
        });
        
        // Process the data by month
        const monthlyScores: {[key: string]: any[]} = {};
        let processedCount = 0;
        let skippedCount = 0;
        
        data.forEach((entry: any) => {
          if (!entry) {
            console.log('⚠️ Skipping null/undefined entry');
            return;
          }

          // Safely access properties with fallbacks
          const storeId = entry.storeId || entry.storeID || entry.store_id;
          const storeName = entry.storeName || entry.store_name || 'Unknown Store';
          const region = entry.region || 'Unknown';
          const amName = entry.amName || entry.am_name || 'Unknown';
          const trainerName = entry.trainerName || entry.trainer_name || 'Unknown';
          const percentageScore = entry.percentageScore || entry.percentage_score || entry.percent || '0';
          
          if (!storeId || !entry.submissionTime) {
            console.log('⚠️ Skipping entry missing required fields:', { storeId, submissionTime: entry.submissionTime });
            return;
          }
          
          console.log('🔍 Processing entry:', {
            storeId,
            submissionTime: entry.submissionTime,
            percentageScore
          });
          
          try {
            const entryDate = new Date(entry.submissionTime);
            const entryMonth = entryDate.toISOString().slice(0, 7);
            
            monthlyScores[entryMonth] = (monthlyScores[entryMonth] || [])
              .concat({
                storeId,
                storeName,
                region,
                amName,
                trainerName,
                score: percentageScore,
                date: entry.submissionTime
              });
              
            processedCount++;
            
          } catch (error) {
            console.error('❌ Error processing entry:', { error, entry });
            skippedCount++;
            return; // Skip this entry and continue with next
          }
        });

        console.log('📊 StoreHealthExport: Data processing complete', {
          totalEntries: data.length,
          processedEntries: processedCount,
          skippedEntries: skippedCount,
          monthsWithData: Object.keys(monthlyScores).length
        });

        setMonthlyScores(monthlyScores);
        
        // Set audit data for current month
        const currentMonthData = monthlyScores[selectedMonth] || [];
        setAuditData(currentMonthData);
        
        console.log(`📅 StoreHealthExport: Set ${currentMonthData.length} records for ${selectedMonth}`);

      } catch (error) {
        console.error('❌ StoreHealthExport: Error fetching training audit data:', error);
      }
      
      setLoading(false);
    };

    fetchAuditData();
  }, [selectedMonth]);

  const downloadStoreHealth = () => {
    setLoading(true);
    
    // Prepare CSV data
    const headers = ['Store ID', 'Store Name', 'Region', 'AM', 'Trainer', 'Audit Score', 'Health Rating', 'Last Audit Date'];
    
    // Map audit data to required format
    const rows = auditData.map(store => {
      const auditScore = parseFloat(store.score);
      const health = auditScore >= 90 ? 'Excellent' : 
                    auditScore >= 80 ? 'Good' :
                    auditScore >= 70 ? 'Fair' : 'Needs Improvement';

      const lastAudit = new Date(store.date).toLocaleDateString();

      return [
        store.storeId,
        store.storeName,
        store.region,
        store.amName,
        store.trainerName,
        Math.round(auditScore) + '%',
        health,
        lastAudit
      ];
    });

    // Function to escape and format CSV cell
    const escapeCsvCell = (cell: string) => {
      // If cell contains comma, quotes, or newline, wrap in quotes and escape existing quotes
      if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    };

    // Build CSV lines and include Excel separator hint to force correct parsing in different locales
    const csvLines = [] as string[];
    // Add a 'sep=,' header line so Excel will use comma as the separator
    csvLines.push('sep=,');
    // Header row
    csvLines.push(headers.map(header => escapeCsvCell(header)).join(','));
    // Data rows
    csvLines.push(...rows.map(row => row.map(cell => escapeCsvCell(cell?.toString() || '')).join(',')));

    // Join using CRLF for Windows/Excel compatibility
    const csvContent = csvLines.join('\r\n');

    // Prepend UTF-8 BOM so Excel reliably detects UTF-8 encoding (useful for special characters)
    const csvWithBOM = '\uFEFF' + csvContent;

    // Create and download file; support TSV option for locales where TSV opens correctly
    let blob: Blob;
    let filename = `store-health-${selectedMonth}`;

    if (downloadFormat === 'tsv') {
      // Build TSV lines: header + rows, replacing any tabs/newlines in cells
      const tsvLines: string[] = [];
      tsvLines.push(headers.join('\t'));
      tsvLines.push(...rows.map(row => row.map(cell => {
        const s = (cell?.toString() || '').replace(/\t/g, ' ').replace(/\r?\n/g, ' ');
        // Escape quotes by doubling if present
        return s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join('\t')));

      const tsvContent = tsvLines.join('\r\n');
      const tsvWithBOM = '\uFEFF' + tsvContent;
      blob = new Blob([tsvWithBOM], { type: 'text/tab-separated-values;charset=utf-8;' });
      filename += '.tsv';
    } else {
      blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      filename += '.csv';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">
          Store Health Report
        </h3>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Download store health data for analysis and reporting. Select a month and preferred format below.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Month Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Select Month
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
          />
          <p className="mt-1 text-sm text-gray-500">
            {auditData.length} stores found for {selectedMonth}
          </p>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            Download Format
          </label>
          <select
            value={downloadFormat}
            onChange={(e) => setDownloadFormat(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100"
          >
            <option value="csv">CSV (comma-separated)</option>
            <option value="tsv">TSV (tab-separated)</option>
          </select>
        </div>
      </div>

      {/* Preview Table */}
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Store ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Store Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Region</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">AM</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Trainer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Audit Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Health Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-slate-300 uppercase tracking-wider">Last Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-gray-500 dark:text-slate-400">Loading training audit data...</p>
                  </td>
                </tr>
              ) : auditData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-slate-400">
                    No training audit data available for the selected month.
                  </td>
                </tr>
              ) : (
                auditData.slice(0, 10).map((store: any) => {
                  const auditScore = parseFloat(store.score);
                  const health = auditScore >= 90 ? 'Excellent' : 
                              auditScore >= 80 ? 'Good' :
                              auditScore >= 70 ? 'Fair' : 'Needs Improvement';
                  
                  const lastAudit = new Date(store.date).toLocaleDateString();
                  
                  return (
                    <tr key={store.storeId} className="text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 font-medium">{store.storeId}</td>
                      <td className="px-4 py-3">{store.storeName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {store.region}
                        </span>
                      </td>
                      <td className="px-4 py-3">{store.amName}</td>
                      <td className="px-4 py-3">{store.trainerName}</td>
                      <td className="px-4 py-3 font-medium">{auditScore.toFixed(1)}%</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          health === 'Excellent' ? 'bg-green-100 text-green-800' :
                          health === 'Good' ? 'bg-blue-100 text-blue-800' :
                          health === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {health}
                        </span>
                      </td>
                      <td className="px-4 py-3">{lastAudit}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {auditData.length > 10 && (
          <div className="px-4 py-3 bg-gray-50 dark:bg-slate-900 text-sm text-gray-500 dark:text-slate-400 border-t border-gray-200 dark:border-slate-700">
            Showing 10 of {auditData.length} stores. Download the report to see all data.
          </div>
        )}
      </div>

      {/* Download Button */}
      <div className="flex justify-end">
        <button
          onClick={downloadStoreHealth}
          disabled={loading || auditData.length === 0}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg transition-all disabled:opacity-60"
        >
          <Download className="w-5 h-5" />
          {loading ? 'Preparing Download...' : 'Download Store Health Data'}
        </button>
      </div>
    </div>
  );
};

export default StoreHealthExport;