import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function QuickTestScreen() {
  const [image, setImage] = useState(null);
  const [symptomContext, setSymptomContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Native Photo Library Picker
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to process diagnostic scans.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setAnalysisResult(null); // Clear previous runs
    }
  };

  // Native Hardware Camera Picker
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera access to capture quick test photos.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setAnalysisResult(null);
    }
  };

  // Simulating the pipeline before connecting Atlas and Gemini APIs later
  const runDiagnosticAnalysis = () => {
    if (!image) {
      Alert.alert('Missing Asset', 'Please take or upload a scan image before running analysis.');
      return;
    }

    setIsAnalyzing(true);

    // Mocking an advanced multi-modal API pipeline structure
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult({
        status: 'Completed',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: '94.2%',
        summary: 'Image processed successfully. Structural symmetry falls within target baselines. Minor localized surface friction detected.',
        recommendation: 'Continue monitoring across your regular weekly intervals. No emergency markers isolated by current multi-modal models.',
      });
    }, 2500);
  };

  return (
    <ScrollView 
      className="flex-1 bg-slate-50" 
      contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Tech Vibrant Top Heading */}
      <View className="mb-6 mt-2">
        <View className="flex-row items-center space-x-2">
          <View className="w-8 h-8 bg-indigo-100 rounded-lg items-center justify-center">
            <Ionicons name="flask-sharp" size={18} color="#4F46E5" />
          </View>
          <Text className="text-xs uppercase tracking-widest text-indigo-600 font-bold ml-2">Engine System</Text>
        </View>
        <Text className="text-3xl font-black text-slate-900 tracking-tight mt-1">Quick Scan Test</Text>
        <Text className="text-slate-500 text-sm mt-1">
          Upload target area images for accelerated local structural analysis.
        </Text>
      </View>

      {/* 📸 Image Dropzone Component Frame */}
      <View className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm mb-5 items-center justify-center">
        {image ? (
          <View className="w-full position-relative">
            <Image source={{ uri: image }} className="w-full h-64 rounded-2xl bg-slate-100" resizeMode="cover" />
            <TouchableOpacity 
              onPress={() => setImage(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-slate-900/80 rounded-full items-center justify-center"
            >
              <Ionicons name="trash-outline" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <View className="w-full h-56 border-2 border-dashed border-slate-200 rounded-2xl items-center justify-center p-6 bg-slate-50/50">
            <Ionicons name="cloud-upload-outline" size={36} color="#94A3B8" />
            <Text className="text-slate-700 font-semibold mt-3 text-base">No scan target selected</Text>
            <Text className="text-slate-400 text-xs text-center mt-1 max-w-[220px]">
              Capture a live photo or pull an asset straight from your device gallery array.
            </Text>
          </View>
        )}

        {/* Media Trigger Actions Row */}
        <View className="flex-row w-full mt-4 space-x-3">
          <TouchableOpacity 
            onPress={takePhoto}
            className="flex-1 h-12 bg-slate-900 rounded-xl flex-row items-center justify-center mr-2"
          >
            <Ionicons name="camera-outline" size={18} color="white" />
            <Text className="text-white font-semibold text-sm ml-2">Use Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={pickImage}
            className="flex-1 h-12 bg-white border border-slate-200 rounded-xl flex-row items-center justify-center"
          >
            <Ionicons name="images-outline" size={18} color="#4F46E5" />
            <Text className="text-slate-700 font-semibold text-sm ml-2">Browse Files</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 📑 Dynamic Text Context Fields */}
      <View className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm mb-6">
        <Text className="text-slate-800 font-bold text-base mb-1">Additional Observations</Text>
        <Text className="text-slate-400 text-xs mb-3">Provide extra information to guide the LLM context logic prompts.</Text>
        <TextInput
          value={symptomContext}
          onChangeText={setSymptomContext}
          placeholder="e.g., Note changes in shape, texturized itching duration, size variations over past months..."
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm h-20"
        />
      </View>

      {/* 🚀 Active Process Trigger Action */}
      {!analysisResult && !isAnalyzing && (
        <TouchableOpacity
          onPress={runDiagnosticAnalysis}
          className="w-full h-14 bg-indigo-600 rounded-2xl items-center justify-center shadow-lg shadow-indigo-100"
        >
          <Text className="text-white font-bold text-base tracking-wide">Initialize API Engine Scan</Text>
        </TouchableOpacity>
      )}

      {/* ⏳ Active Loading Processing State Component */}
      {isAnalyzing && (
        <View className="w-full bg-white border border-indigo-50 p-6 rounded-3xl items-center shadow-sm">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-slate-800 font-bold text-base mt-4">Running Vector Normalization...</Text>
          <Text className="text-slate-400 text-xs text-center mt-1">
            Uploading payload metrics, compiling spatial data streams, and preparing prompt context structures.
          </Text>
        </View>
      )}

      {/* 📊 Tech-Vibrant Result Panel Blueprint */}
      {analysisResult && !isAnalyzing && (
        <View className="w-full bg-white border border-emerald-50 p-6 rounded-3xl shadow-sm border-t-4 border-t-emerald-500">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center">
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </View>
              <Text className="text-emerald-800 font-bold text-sm ml-2">Pipeline Output Matrix</Text>
            </View>
            <Text className="text-slate-400 text-xs font-mono">{analysisResult.timestamp}</Text>
          </View>

          <View className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-100">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model Engine Confidence</Text>
            <Text className="text-2xl font-black text-indigo-600 mt-0.5">{analysisResult.confidence}</Text>
          </View>

          <Text className="text-slate-800 font-bold text-sm">Structural Extraction Insights:</Text>
          <Text className="text-slate-600 text-sm mt-1 leading-5 mb-4">{analysisResult.summary}</Text>

          <Text className="text-slate-800 font-bold text-sm">System Recommendations:</Text>
          <Text className="text-slate-600 text-sm mt-1 leading-5">{analysisResult.recommendation}</Text>

          <TouchableOpacity 
            onPress={() => {
              setImage(null);
              setAnalysisResult(null);
              setSymptomContext('');
            }}
            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl mt-6 items-center justify-center"
          >
            <Text className="text-slate-600 font-semibold text-xs">Clear Results & Scan Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}