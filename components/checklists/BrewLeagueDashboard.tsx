import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Users, Award, MapPin, Coffee, Target, BarChart3, Calendar, Filter } from 'lucide-react';

// Google Sheets endpoint for fetching Brew League data
const BREW_LEAGUE_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxIGr_utWW1EySanNuTjzG254uCvZiPcE1ZkGtxy6ubiPzGqAmaNHgoR2NrH-R4TXyn8w/exec';

interface BrewLeagueSubmission {
  timestamp: string;
  participantName: string;
  participantEmpID: string;
  judgeName: string;
  judgeID: string;
  scoresheetType: 'technical' | 'sensory';
  machineType: 'manual' | 'automatic';
  storeName: string;
  storeID: string;
  region: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  submissionTime?: string;
  sections: Record<string, number>;
}

const BrewLeagueDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<BrewLeagueSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterScoresheet, setFilterScoresheet] = useState<string>('all');
  const [filterMachine, setFilterMachine] = useState<string>('all');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');

  // Fetch data from Google Sheets
  useEffect(() => {
    const fetchBrewLeagueData = async () => {
      try {
        console.log('Fetching Brew League data from:', BREW_LEAGUE_ENDPOINT);
        
        const response = await fetch(BREW_LEAGUE_ENDPOINT, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          redirect: 'follow',
        });
        
        if (!response.ok) {
          console.error('Failed to fetch Brew League data:', response.status);
          setLoading(false);
          return;
        }
        
        const data = await response.json();
        console.log('Received Brew League data:', data);
        
        if (!Array.isArray(data)) {
          console.error('Invalid data format received');
          setLoading(false);
          return;
        }
        
        // Map Google Sheets column names to interface fields
        const mappedData: BrewLeagueSubmission[] = data.map((row: any) => ({
          timestamp: row['Timestamp'] || row.timestamp || '',
          participantName: row['Participant Name'] || row.participantName || '',
          participantEmpID: row['Participant Emp ID'] || row['Participant Emp. ID'] || row.participantEmpID || '',
          judgeName: row['Judge Name'] || row.judgeName || '',
          judgeID: row['Judge Emp ID'] || row['Judge ID'] || row.judgeID || '',
          scoresheetType: (row['Scoresheet Type'] || row.scoresheetType || 'technical').toLowerCase() as 'technical' | 'sensory',
          machineType: (row['Machine Type'] || row.machineType || 'manual').toLowerCase() as 'manual' | 'automatic',
          storeName: row['Store Name'] || row.storeName || '',
          storeID: row['Store ID'] || row.storeID || '',
          region: row['Region'] || row.region || '',
          totalScore: Number(row['Total Score'] || row.totalScore || 0),
          maxScore: Number(row['Max Score'] || row.maxScore || 0),
          percentage: Number(row['Percentage'] || row.percentage || 0),
          submissionTime: row['Submission Time'] || row.submissionTime || '',
          sections: {} // Can be expanded if needed
        }));
        
        console.log('Mapped Brew League data:', mappedData);
        setSubmissions(mappedData);
        setLoading(false);
        
      } catch (error) {
        console.error('Error fetching Brew League data:', error);
        setLoading(false);
      }
    };
    
    fetchBrewLeagueData();
  }, []);

  const filteredSubmissions = submissions.filter(sub => {
    if (filterRegion !== 'all' && sub.region !== filterRegion) return false;
    if (filterScoresheet !== 'all' && sub.scoresheetType !== filterScoresheet) return false;
    if (filterMachine !== 'all' && sub.machineType !== filterMachine) return false;
    if (filterEmployee !== 'all' && sub.participantEmpID !== filterEmployee) return false;
    return true;
  });

  const stats = {
    totalParticipants: new Set(filteredSubmissions.map(s => s.participantEmpID)).size,
    totalSubmissions: filteredSubmissions.length,
    avgScore: filteredSubmissions.length > 0 
      ? (filteredSubmissions.reduce((acc, s) => acc + s.percentage, 0) / filteredSubmissions.length).toFixed(1)
      : 0,
    topScore: filteredSubmissions.length > 0
      ? Math.max(...filteredSubmissions.map(s => s.percentage))
      : 0
  };

  const regions = ['all', ...Array.from(new Set(submissions.map(s => s.region)))];
  const employees = ['all', ...Array.from(new Set(submissions.map(s => s.participantEmpID))).filter(Boolean).sort()];
  const employeeNames = new Map(submissions.map(s => [s.participantEmpID, s.participantName]));
  
  const leaderboard = [...filteredSubmissions]
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 10);

  const recentSubmissions = [...filteredSubmissions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Trophy size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">Brew League Dashboard</h1>
                <p className="text-amber-100">Coffee Championship Performance Analytics</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{stats.totalParticipants}</div>
              <div className="text-sm text-amber-100">Competing Baristas</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter size={20} className="text-gray-600 dark:text-slate-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Employee</label>
              <select 
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              >
                <option value="all">All Employees</option>
                {employees.slice(1).map(empID => (
                  <option key={empID} value={empID}>
                    {employeeNames.get(empID)} ({empID})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Region</label>
              <select 
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              >
                {regions.map(r => (
                  <option key={r} value={r}>{r === 'all' ? 'All Regions' : r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Scoresheet Type</label>
              <select 
                value={filterScoresheet}
                onChange={(e) => setFilterScoresheet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              >
                <option value="all">All Types</option>
                <option value="technical">Technical</option>
                <option value="sensory">Sensory</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Machine Type</label>
              <select 
                value={filterMachine}
                onChange={(e) => setFilterMachine(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
              >
                <option value="all">All Machines</option>
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-blue-600 dark:text-blue-400" size={24} />
              <span className="text-sm text-gray-500 dark:text-slate-400">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">{stats.totalParticipants}</div>
            <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">Participants</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Coffee className="text-amber-600 dark:text-amber-400" size={24} />
              <span className="text-sm text-gray-500 dark:text-slate-400">Total</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">{stats.totalSubmissions}</div>
            <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">Submissions</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="text-green-600 dark:text-green-400" size={24} />
              <span className="text-sm text-gray-500 dark:text-slate-400">Average</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">{stats.avgScore}%</div>
            <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">Overall Score</div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <Award className="text-yellow-600 dark:text-yellow-400" size={24} />
              <span className="text-sm text-gray-500 dark:text-slate-400">Highest</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-slate-100">{stats.topScore}%</div>
            <div className="text-sm text-gray-600 dark:text-slate-400 mt-1">Top Score</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leaderboard */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={24} className="text-amber-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Top Performers</h2>
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-slate-400">Loading...</div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-slate-400">No submissions yet</div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((sub, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-lg border ${
                      idx === 0 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' :
                      idx === 1 ? 'bg-gray-50 dark:bg-slate-700/50 border-gray-300 dark:border-slate-600' :
                      idx === 2 ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700' :
                      'border-gray-200 dark:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          idx === 0 ? 'bg-amber-600 text-white' :
                          idx === 1 ? 'bg-gray-400 text-white' :
                          idx === 2 ? 'bg-orange-600 text-white' :
                          'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-slate-100">{sub.participantName}</div>
                          <div className="text-xs text-gray-600 dark:text-slate-400">
                            {sub.storeName} • {sub.region}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          sub.percentage >= 90 ? 'text-green-600 dark:text-green-400' :
                          sub.percentage >= 80 ? 'text-blue-600 dark:text-blue-400' :
                          sub.percentage >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-gray-600 dark:text-slate-400'
                        }`}>
                          {sub.percentage}%
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 capitalize">
                          {sub.scoresheetType}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Submissions */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Recent Submissions</h2>
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-500 dark:text-slate-400">Loading...</div>
            ) : recentSubmissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-slate-400">No submissions yet</div>
            ) : (
              <div className="space-y-3">
                {recentSubmissions.map((sub, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900 dark:text-slate-100">{sub.participantName}</div>
                      <div className={`text-lg font-bold ${
                        sub.percentage >= 90 ? 'text-green-600 dark:text-green-400' :
                        sub.percentage >= 80 ? 'text-blue-600 dark:text-blue-400' :
                        sub.percentage >= 70 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-gray-600 dark:text-slate-400'
                      }`}>
                        {sub.percentage}%
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} />
                        {sub.region}
                      </span>
                      <span className="flex items-center gap-1">
                        <Coffee size={12} />
                        {sub.machineType}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target size={12} />
                        {sub.scoresheetType}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-slate-500">
                      {new Date(sub.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Performance by Region */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={24} className="text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">Performance by Region</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from(new Set(submissions.map(s => s.region))).map(region => {
              const regionSubs = submissions.filter(s => s.region === region);
              const avgScore = regionSubs.length > 0
                ? (regionSubs.reduce((acc, s) => acc + s.percentage, 0) / regionSubs.length).toFixed(1)
                : 0;
              
              return (
                <div key={region} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">{region}</div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{avgScore}%</div>
                    <div className="text-sm text-gray-600 dark:text-slate-400">avg</div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                    {regionSubs.length} submission{regionSubs.length !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">About Brew League</h3>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                Brew League is TWC's premier barista championship where coffee experts compete across multiple rounds. 
                Participants are evaluated on grooming standards, espresso extraction technique, milk steaming precision, 
                latte art creation, and overall professionalism. Competition includes Store Round, AM Round, and Region Round, 
                with both Technical (detailed process) and Sensory (final product) evaluations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrewLeagueDashboard;
