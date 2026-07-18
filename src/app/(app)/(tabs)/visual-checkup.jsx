import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function VisualCheckupScreen() {
  const [selectedZone, setSelectedZone] = useState('All');

  const metricZones = ['All', 'Left Arm', 'Right Arm', 'Torso', 'Back', 'Neck'];

  // Local mock dataset representing chronologically tracked assets
  const trackingHistory = [
    {
      id: '1',
      zone: 'Left Arm',
      date: 'July 10, 2026',
      status: 'Stable',
      statusColor: '#10B981',
      image: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?q=80&w=200&auto=format&fit=crop',
      metrics: 'Symmetry: 98% | Diameter: 3.2mm',
    },
    {
      id: '2',
      zone: 'Torso',
      date: 'July 02, 2026',
      status: 'Review Needed',
      statusColor: '#F59E0B',
      image: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?q=80&w=200&auto=format&fit=crop',
      metrics: 'Symmetry: 89% | Diameter: 4.5mm',
    },
    {
      id: '3',
      zone: 'Back',
      date: 'June 24, 2026',
      status: 'Stable',
      statusColor: '#10B981',
      image: 'https://images.unsplash.com/photo-1512438248247-f0f2a5a8b7f0?q=80&w=200&auto=format&fit=crop',
      metrics: 'Symmetry: 96% | Diameter: 2.1mm',
    },
  ];

  const filteredHistory = selectedZone === 'All' 
    ? trackingHistory 
    : trackingHistory.filter(item => item.zone === selectedZone);

  return (
    <ScrollView 
      className="flex-1 bg-slate-50" 
      contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Premium Header Context */}
      <View className="mb-6 mt-2">
        <View className="flex-row items-center space-x-2">
          <View className="w-8 h-8 bg-indigo-100 rounded-lg items-center justify-center">
            <Ionicons name="camera-sharp" size={18} color="#4F46E5" />
          </View>
          <Text className="text-xs uppercase tracking-widest text-indigo-600 font-bold ml-2">Spatial Scan Registry</Text>
        </View>
        <Text className="text-3xl font-black text-slate-900 tracking-tight mt-1">Visual Log Tracker</Text>
        <Text className="text-slate-500 text-sm mt-1">
          Monitor surface level symmetry shifts and structural developments chronologically.
        </Text>
      </View>

      {/* 📊 High-Tech Delta Comparison Panel */}
      <View className="bg-gradient-to-br from-indigo-900 to-slate-900 bg-slate-900 p-5 rounded-3xl shadow-md mb-6 border border-slate-800">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-white font-bold text-base">Historical Overlay Engine</Text>
          <View className="bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full">
            <Text className="text-indigo-300 text-[10px] font-mono font-bold uppercase">Ready</Text>
          </View>
        </View>
        <Text className="text-slate-300 text-xs leading-5">
          Select target monitoring zones below to filter historical assets. This pipeline runs image pixel adjustments to map localized delta variances.
        </Text>
        
        {/* Statistics Banner */}
        <View className="flex-row justify-between mt-4 pt-4 border-t border-slate-800">
          <View>
            <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Tracked Zones</Text>
            <Text className="text-white text-xl font-black mt-0.5">5 Active</Text>
          </View>
          <View>
            <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Scans</Text>
            <Text className="text-white text-xl font-black mt-0.5">24 Overlays</Text>
          </View>
          <View>
            <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">System Baseline</Text>
            <Text className="text-emerald-400 text-xl font-black mt-0.5">Optimal</Text>
          </View>
        </View>
      </View>

      {/* 🏷️ Horizontal Filter Carousel */}
      <View className="mb-5">
        <FlatList
          data={metricZones}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedZone(item)}
              className={`px-4 h-10 rounded-full items-center justify-center mr-2 border ${
                selectedZone === item 
                  ? 'bg-indigo-600 border-indigo-600 shadow-sm' 
                  : 'bg-white border-slate-200'
              }`}
            >
              <Text className={`text-xs font-bold tracking-tight ${selectedZone === item ? 'text-white' : 'text-slate-600'}`}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* 🗂️ History Tracking Registry Feed */}
      <View className="space-y-4">
        <Text className="text-slate-800 font-bold text-base mb-2">Chronological Registry ({filteredHistory.length})</Text>
        
        {filteredHistory.length === 0 ? (
          <View className="bg-white border border-slate-100 rounded-3xl p-8 items-center justify-center">
            <Ionicons name="folder-open-outline" size={32} color="#94A3B8" />
            <Text className="text-slate-500 font-medium text-sm mt-2">No entries logged under this zone context yet.</Text>
          </View>
        ) : (
          filteredHistory.map((item) => (
            <View key={item.id} className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm flex-row items-center mb-3">
              {/* Media Asset Preview Frame */}
              <Image source={{ uri: item.image }} className="w-20 h-20 bg-slate-100 rounded-2xl" resizeMode="cover" />
              
              {/* Informational Cluster Metadata */}
              <View className="flex-1 ml-4 justify-center">
                <View className="flex-row justify-between items-center">
                  <Text className="text-slate-900 font-black text-base tracking-tight">{item.zone}</Text>
                  
                  {/* Dynamic Custom Badge Pills */}
                  <View 
                    style={{ backgroundColor: `${item.statusColor}15` }} 
                    className="px-2 py-0.5 rounded-md border border-transparent"
                  >
                    <Text style={{ color: item.statusColor }} className="text-[10px] font-bold uppercase tracking-wider">
                      {item.status}
                    </Text>
                  </View>
                </View>
                
                <Text className="text-slate-400 text-xs font-medium mt-0.5">{item.date}</Text>
                
                <View className="bg-slate-50 border border-slate-100 p-2 rounded-xl mt-2 flex-row items-center">
                  <Ionicons name="git-commit-outline" size={12} color="#4F46E5" />
                  <Text className="text-slate-600 text-[11px] font-mono font-medium ml-1.5 tracking-tight">
                    {item.metrics}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}