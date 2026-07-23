import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApi } from '../../../context/ApiContext';

// Maps the backend's free-text trend status into a consistent badge color.
function trendStyles(status = '') {
  const normalized = status.toLowerCase();
  if (normalized.includes('flag')) {
    return { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', dot: '#E11D48' };
  }
  if (normalized.includes('shift') || normalized.includes('minor')) {
    return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', dot: '#D97706' };
  }
  if (normalized.includes('stable')) {
    return { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', dot: '#10B981' };
  }
  return { bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-700', dot: '#64748B' };
}

export default function SummaryScreen() {
  const router = useRouter();
  const api = useApi();
  const insets = useSafeAreaInsets();

  const [report, setReport] = useState(null);
  const [isCached, setIsCached] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // 'ok' | 'empty' | 'error'
  const [status, setStatus] = useState('ok');
  const [errorMessage, setErrorMessage] = useState('');

  const loadSummary = useCallback(async () => {
    try {
      const response = await api.get('/summary');
      setReport(response.data);
      setIsCached(Boolean(response.cached));
      setStatus('ok');
    } catch (error) {
      // ApiContext throws with the backend's own error message when available,
      // e.g. "No visual logs found to summarize." on a 404.
      const message = error?.message || 'Something went wrong loading your summary.';
      if (message.toLowerCase().includes('no visual logs')) {
        setStatus('empty');
      } else {
        setStatus('error');
        setErrorMessage(message);
      }
    }
  }, [api]);

  useEffect(() => {
    setIsLoading(true);
    loadSummary().finally(() => setIsLoading(false));
  }, [loadSummary]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadSummary().finally(() => setIsRefreshing(false));
  }, [loadSummary]);

  const badge = trendStyles(report?.overallTrendStatus);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      {/* Header */}
      <View className="flex-row items-center px-5 pt-2 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          className="w-10 h-10 rounded-full bg-white border border-slate-100 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-base font-bold text-slate-900 mr-10">
          Progress Summary
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0F172A" />
          <Text className="text-slate-400 text-xs mt-3">Analyzing your tracking history…</Text>
        </View>
      ) : status === 'empty' ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-white border border-slate-100 items-center justify-center mb-4">
            <Ionicons name="documents-outline" size={28} color="#94A3B8" />
          </View>
          <Text className="text-slate-900 font-bold text-base text-center">No scans yet</Text>
          <Text className="text-slate-500 text-sm text-center mt-2 leading-5">
            Run at least one Quick Test scan and we'll start building your longitudinal progress summary here.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/(tabs)/quick-test')}
            className="mt-6 h-11 px-6 bg-black rounded-full items-center justify-center"
          >
            <Text className="text-white font-semibold text-sm">Run a Quick Test</Text>
          </TouchableOpacity>
        </View>
      ) : status === 'error' ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-white border border-slate-100 items-center justify-center mb-4">
            <Ionicons name="alert-circle-outline" size={28} color="#E11D48" />
          </View>
          <Text className="text-slate-900 font-bold text-base text-center">Couldn't load your summary</Text>
          <Text className="text-slate-500 text-sm text-center mt-2 leading-5">{errorMessage}</Text>
          <TouchableOpacity
            onPress={onRefresh}
            className="mt-6 h-11 px-6 bg-black rounded-full items-center justify-center"
          >
            <Text className="text-white font-semibold text-sm">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#0F172A" />}
        >
          {/* Trend status + scan count */}
          <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-4">
            <View className={`self-start flex-row items-center px-3 py-1.5 rounded-full border ${badge.bg} ${badge.border}`}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: badge.dot, marginRight: 6 }} />
              <Text className={`text-xs font-bold ${badge.text}`}>{report.overallTrendStatus}</Text>
            </View>
            <Text className="text-slate-400 text-xs mt-3">
              Based on {report.totalLogsAnalyzed} tracked {report.totalLogsAnalyzed === 1 ? 'scan' : 'scans'}
              {isCached ? ' · cached' : ''}
            </Text>
          </View>

          {/* Executive summary */}
          <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-4">
            <Text className="text-slate-900 font-bold text-sm mb-2">Executive Summary</Text>
            <Text className="text-slate-600 text-sm leading-5">{report.executiveSummary}</Text>
          </View>

          {/* Key observations */}
          {Array.isArray(report.keyObservations) && report.keyObservations.length > 0 && (
            <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-4">
              <Text className="text-slate-900 font-bold text-sm mb-3">Key Observations</Text>
              {report.keyObservations.map((observation, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 mr-3" />
                  <Text className="flex-1 text-slate-600 text-sm leading-5">{observation}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Recommended next steps */}
          {Array.isArray(report.recommendedNextSteps) && report.recommendedNextSteps.length > 0 && (
            <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-4">
              <Text className="text-slate-900 font-bold text-sm mb-3">Recommended Next Steps</Text>
              {report.recommendedNextSteps.map((step, index) => (
                <View key={index} className="flex-row items-start mb-2">
                  <Ionicons name="checkmark-circle" size={16} color="#0F172A" style={{ marginTop: 1, marginRight: 8 }} />
                  <Text className="flex-1 text-slate-600 text-sm leading-5">{step}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}