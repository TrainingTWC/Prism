/**
 * MAIN DASHBOARD VIEW
 * 
 * The primary view component showing organization-wide audit metrics,
 * region breakdown, trainer performance, and navigation widgets.
 */

import React, { useEffect, useState } from 'react';
import { useFilters, navigationActions } from '../state';
import {
  fetchSummary,
  fetchRegionData,
  fetchTrainerData,
  fetchSectionData,
  fetchTrendData,
  fetchWeakSections,
  fetchWeakStores,
  fetchWeakTrainers
} from '../services/dataService';
import {
  Summary,
  RegionData,
  TrainerData,
  SectionData,
  TrendData,
  WeakSection,
  WeakStore,
  WeakTrainer
} from '../types';

const Dashboard: React.FC = () => {
  const filters = useFilters();
  const { 
    handleRegionPerfClick, 
    handleTopTrainerClick, 
    handleSectionPerfClick, 
    handleScoreDistribClick 
  } = navigationActions;

  // State for dashboard data
  const [summary, setSummary] = useState<Summary | null>(null);
  const [regions, setRegions] = useState<RegionData[]>([]);
  const [trainers, setTrainers] = useState<TrainerData[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [weakSections, setWeakSections] = useState<WeakSection[]>([]);
  const [weakStores, setWeakStores] = useState<WeakStore[]>([]);
  const [weakTrainers, setWeakTrainers] = useState<WeakTrainer[]>([]);
  const [loading, setLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [
          summaryData,
          regionsData,
          trainersData,
          sectionsData,
          trendsData,
          weakSectionsData,
          weakStoresData,
          weakTrainersData
        ] = await Promise.all([
          fetchSummary(filters),
          fetchRegionData(filters),
          fetchTrainerData(filters),
          fetchSectionData(filters),
          fetchTrendData(filters),
          fetchWeakSections(filters),
          fetchWeakStores(filters),
          fetchWeakTrainers(filters)
        ]);

        setSummary(summaryData);
        setRegions(regionsData);
        setTrainers(trainersData);
        setSections(sectionsData);
        setTrends(trendsData);
        setWeakSections(weakSectionsData);
        setWeakStores(weakStoresData);
        setWeakTrainers(weakTrainersData);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Audit Dashboard</h1>
        <p className="text-gray-600">Organization-wide training audit performance and insights</p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Audits</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{summary.totalAudits}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Average Score</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{summary.avgScorePct}%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Stores Covered</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">{summary.storesCovered}</div>
          </div>
        </div>
      )}

      {/* Trends Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Score Trends (Last 30 Days)</h2>
        <div className="h-64 flex items-end space-x-1">
          {trends.map((trend, index) => (
            <div
              key={trend.date}
              className="flex-1 bg-blue-500 opacity-75 hover:opacity-100 transition-opacity"
              style={{ height: `${(trend.avgScorePct / 100) * 100}%` }}
              title={`${trend.date}: ${trend.avgScorePct}%`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regions Widget - widget ID: region-breakdown */}
        <div id="region-breakdown" className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance by Region</h2>
          <div className="space-y-3">
            {regions.map((region) => (
              <div
                key={region.regionId}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleRegionPerfClick(region.regionId)}
              >
                <div>
                  <div className="font-medium text-gray-900">{region.name}</div>
                  <div className="text-sm text-gray-500">{region.audits} audits</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${
                    region.avgScorePct >= 80 ? 'text-green-600' :
                    region.avgScorePct >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {region.avgScorePct}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trainers Widget - widget ID: trainer-performance */}
        <div id="trainer-performance" className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Trainers</h2>
          <div className="space-y-3">
            {trainers
              .sort((a, b) => b.avgScorePct - a.avgScorePct)
              .slice(0, 5)
              .map((trainer) => (
                <div
                  key={trainer.trainerId}
                  className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleTopTrainerClick(trainer.trainerId)}
                >
                  <div>
                    <div className="font-medium text-gray-900">{trainer.name}</div>
                    <div className="text-sm text-gray-500">{trainer.stores} stores, {trainer.audits} audits</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${
                      trainer.avgScorePct >= 80 ? 'text-green-600' :
                      trainer.avgScorePct >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {trainer.avgScorePct}%
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Sections Widget - widget ID: section-breakdown */}
        <div id="section-breakdown" className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance by Section</h2>
          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section.sectionKey}
                className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleSectionPerfClick(section.sectionKey)}
              >
                <div>
                  <div className="font-medium text-gray-900">{section.label}</div>
                  <div className="text-sm text-gray-500">{section.questionsCount} questions, {section.responsesCount} responses</div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-semibold ${
                    section.avgScorePct >= 80 ? 'text-green-600' :
                    section.avgScorePct >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {section.avgScorePct}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Score Distribution Widget - widget ID: score-distribution */}
        <div id="score-distribution" className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</h2>
          <div className="space-y-3">
            {[
              { range: '90-100%', min: 90, max: 100, color: 'bg-green-500' },
              { range: '80-89%', min: 80, max: 89, color: 'bg-blue-500' },
              { range: '70-79%', min: 70, max: 79, color: 'bg-yellow-500' },
              { range: '60-69%', min: 60, max: 69, color: 'bg-orange-500' },
              { range: 'Below 60%', min: 0, max: 59, color: 'bg-red-500' }
            ].map((band) => (
              <div
                key={band.range}
                className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleScoreDistribClick(`${band.min}-${band.max}`)}
              >
                <div className={`w-4 h-4 rounded ${band.color} mr-3`}></div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{band.range}</div>
                </div>
                <div className="text-sm text-gray-500">
                  Click to view entities
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section - Weak Performance Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weak Sections */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Areas Needing Improvement</h2>
          <div className="space-y-2">
            {weakSections.slice(0, 5).map((section) => (
              <div
                key={section.sectionKey}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => handleSectionPerfClick(section.sectionKey)}
              >
                <div className="text-sm text-gray-900 capitalize">
                  {section.sectionKey.replace('_', ' ')}
                </div>
                <div className="text-sm font-medium text-red-600">
                  {section.avgScorePct}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Stores */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stores Needing Support</h2>
          <div className="space-y-2">
            {weakStores.slice(0, 5).map((store) => (
              <div
                key={store.storeId}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
              >
                <div className="text-sm text-gray-900">{store.name}</div>
                <div className="text-sm font-medium text-red-600">
                  {store.avgScorePct}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Trainers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Trainers Needing Development</h2>
          <div className="space-y-2">
            {weakTrainers.slice(0, 5).map((trainer) => (
              <div
                key={trainer.trainerId}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-50 cursor-pointer"
                onClick={() => handleTopTrainerClick(trainer.trainerId)}
              >
                <div className="text-sm text-gray-900">{trainer.name}</div>
                <div className="text-sm font-medium text-red-600">
                  {trainer.avgScorePct}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;