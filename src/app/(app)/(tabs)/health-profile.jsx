import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { useApi } from '../../../context/ApiContext';
import markdownStyles, { stripMarkdown } from '../../../utils/markdownStyles';

const CARD_WIDTH = 168;


function trendStyles(status = '') {
  const normalized = status.toLowerCase();
  if (normalized.includes('flag')) {
    return { bg: '#FFF1F2', border: '#FFE4E6', text: '#BE123C', dot: '#E11D48' };
  }
  if (normalized.includes('shift') || normalized.includes('minor')) {
    return { bg: '#FFFBEB', border: '#FEF3C7', text: '#B45309', dot: '#D97706' };
  }
  if (normalized.includes('stable')) {
    return { bg: '#ECFDF5', border: '#D1FAE5', text: '#047857', dot: '#10B981' };
  }
  return { bg: '#F1F5F9', border: '#E2E8F0', text: '#334155', dot: '#64748B' };
}

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function HealthProfileScreen() {
  const api = useApi();
  const insets = useSafeAreaInsets();

  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logsError, setLogsError] = useState('');

  const [selectedLogId, setSelectedLogId] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  const loadLogById = useCallback(
    async (id) => {
      setSelectedLogId(id);
      setIsLoadingDetail(true);
      setDetailError('');
      try {
        const response = await api.get(`/log/${id}`);
        setSelectedLog(response.data);
      } catch (error) {
        setDetailError(error?.message || 'Could not load this record.');
        setSelectedLog(null);
      } finally {
        setIsLoadingDetail(false);
      }
    },
    [api]
  );

  const loadLogs = useCallback(async () => {
    setLogsError('');
    try {
      const response = await api.get('/get-logs?page=1&limit=20');
      const fetchedLogs = response.data || [];
      setLogs(fetchedLogs);

      // Default to showing the latest record (list is already sorted newest-first).
      if (fetchedLogs.length > 0) {
        await loadLogById(fetchedLogs[0]._id);
      } else {
        setSelectedLogId(null);
        setSelectedLog(null);
      }
    } catch (error) {
      setLogsError(error?.message || 'Could not load your health records.');
    }
  }, [api, loadLogById]);

  useEffect(() => {
    setIsLoadingLogs(true);
    loadLogs().finally(() => setIsLoadingLogs(false));
    // Only run once on mount — loadLogs is intentionally not re-invoked on
    // every render even though it's a new function identity each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadLogs().finally(() => setIsRefreshing(false));
  }, [loadLogs]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <View className="px-5 pt-2 pb-3">
        <Text className="text-slate-900 text-xl font-bold">Health Records</Text>
        <Text className="text-slate-400 text-xs mt-0.5">Your tracked scans, newest first</Text>
      </View>

      {isLoadingLogs ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0F172A" />
        </View>
      ) : logsError ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-white border border-slate-100 items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={28} color="#E11D48" />
          </View>
          <Text className="text-slate-900 font-bold text-base text-center">Couldn't load your records</Text>
          <Text className="text-slate-500 text-sm text-center mt-2 leading-5">{logsError}</Text>
          <TouchableOpacity
            onPress={onRefresh}
            className="mt-6 h-11 px-6 bg-black rounded-full items-center justify-center"
          >
            <Text className="text-white font-semibold text-sm">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : logs.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-white border border-slate-100 items-center justify-center mb-4">
            <Ionicons name="documents-outline" size={28} color="#94A3B8" />
          </View>
          <Text className="text-slate-900 font-bold text-base text-center">No records yet</Text>
          <Text className="text-slate-500 text-sm text-center mt-2 leading-5">
            Run a Quick Test scan and it will show up here as a tracked health record.
          </Text>
        </View>
      ) : (
        <>
          {/* Horizontal scroll of log "packets" — left to right, newest first */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ maxHeight: 190, flexGrow: 0 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
          >
            {logs.map((log) => {
              const isActive = log._id === selectedLogId;
              const badge = trendStyles(log.trackingStatus);
              return (
                <TouchableOpacity
                  key={log._id}
                  onPress={() => loadLogById(log._id)}
                  activeOpacity={0.8}
                  style={{ width: CARD_WIDTH }}
                  className={`mr-3 rounded-2xl p-4 border ${
                    isActive ? 'bg-black border-black' : 'bg-white border-slate-100'
                  }`}
                >
                  <Text className={`text-[10px] font-semibold ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                    {formatDate(log.createdAt)} · {formatTime(log.createdAt)}
                  </Text>

                  <View
                    className="self-start flex-row items-center px-2 py-1 rounded-full mt-2"
                    style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : badge.bg }}
                  >
                    <View
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 2.5,
                        backgroundColor: isActive ? '#34D399' : badge.dot,
                        marginRight: 5,
                      }}
                    />
                    <Text
                      className="text-[10px] font-bold"
                      style={{ color: isActive ? '#FFFFFF' : badge.text }}
                      numberOfLines={1}
                    >
                      {log.trackingStatus || 'Unknown'}
                    </Text>
                  </View>

                  <Text
                    className={`text-xs mt-2 leading-4 ${isActive ? 'text-slate-200' : 'text-slate-600'}`}
                    numberOfLines={3}
                  >
                    {stripMarkdown(log.summaryMarkdown) || 'No summary available.'}
                  </Text>

                  <View className="flex-row justify-between mt-3">
                    <Text className={`text-[10px] font-semibold ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                      Asym {Math.round((log.metrics?.asymmetryScore || 0) * 100)}%
                    </Text>
                    <Text className={`text-[10px] font-semibold ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                      {log.metrics?.estimatedDiameterMm ?? '—'}mm
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Full detail of whichever record is selected — separately scrollable */}
          <ScrollView
            className="flex-1 px-5 mt-4"
            contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#0F172A" />}
          >
            {isLoadingDetail ? (
              <View className="items-center justify-center py-16">
                <ActivityIndicator size="large" color="#0F172A" />
              </View>
            ) : detailError ? (
              <View className="items-center justify-center py-16 px-4">
                <Text className="text-rose-600 text-sm text-center">{detailError}</Text>
              </View>
            ) : selectedLog ? (
              <View className="bg-white border border-slate-100 rounded-3xl p-5">
                <View className="flex-row items-center justify-between mb-4">
                  {(() => {
                    const badge = trendStyles(selectedLog.trackingStatus);
                    return (
                      <View
                        className="flex-row items-center px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: badge.bg }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: badge.dot,
                            marginRight: 6,
                          }}
                        />
                        <Text className="text-xs font-bold" style={{ color: badge.text }}>
                          {selectedLog.trackingStatus}
                        </Text>
                      </View>
                    );
                  })()}
                  <Text className="text-slate-400 text-xs">
                    {formatDate(selectedLog.createdAt)} · {formatTime(selectedLog.createdAt)}
                  </Text>
                </View>

                <View className="flex-row mb-4">
                  <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 mr-2">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Asymmetry Score
                    </Text>
                    <Text className="text-2xl font-black text-slate-900 mt-0.5">
                      {Math.round((selectedLog.metrics?.asymmetryScore || 0) * 100)}%
                    </Text>
                  </View>
                  <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Est. Diameter
                    </Text>
                    <Text className="text-2xl font-black text-slate-900 mt-0.5">
                      {selectedLog.metrics?.estimatedDiameterMm ?? '—'}mm
                    </Text>
                  </View>
                </View>

                <Text className="text-slate-800 font-bold text-sm">Border Profile</Text>
                <Text className="text-slate-600 text-sm mt-1 leading-5 mb-4">
                  {selectedLog.metrics?.borderProfile || 'Not available'}
                </Text>

                <Text className="text-slate-800 font-bold text-sm mb-1">Full Summary</Text>
                <View className="mb-4">
                  <Markdown style={markdownStyles}>
                    {selectedLog.summaryMarkdown || 'No summary available.'}
                  </Markdown>
                </View>

                <Text className="text-slate-800 font-bold text-sm">Your Notes</Text>
                <Text className="text-slate-600 text-sm mt-1 leading-5">
                  {selectedLog.userNotes || 'No notes were added for this scan.'}
                </Text>
              </View>
            ) : null}
          </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}