import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandLoader from '../../../components/BrandLoader';
import { useApi } from '../../../context/ApiContext';
import markdownStyles from '../../../utils/markdownStyles';

export default function QuickTestScreen() {
  const api = useApi();
  const insets = useSafeAreaInsets();
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
      await handlePickedAsset(result.assets[0].uri);
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
      await handlePickedAsset(result.assets[0].uri);
    }
  };

  // Modern phone cameras can produce very large photos (many MB, 12MP+),
  // which have been known to cause native out-of-memory crashes on Android
  // when held in memory for preview/upload with no downscaling at all.
  // Resizing to a sane max dimension keeps plenty of detail for structural
  // analysis while drastically cutting memory pressure and upload size.
  //
  // IMPORTANT: if resize fails, we do NOT fall back to the original,
  // full-size image — that would silently reintroduce the exact crash
  // risk this step exists to prevent. We surface a clear error instead
  // and leave the picker empty so the user can retry.
  const handlePickedAsset = async (rawUri) => {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        rawUri,
        [{ resize: { width: 1600 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImage(manipulated.uri);
      setAnalysisResult(null); // Clear previous runs
    } catch (resizeError) {
      console.error('[Quick Test] Image resize failed:', resizeError);
      Alert.alert(
        'Photo Not Usable',
        'That photo could not be processed. Please try taking or selecting it again.'
      );
    }
  };

  const runDiagnosticAnalysis = async () => {
    if (!image) {
      Alert.alert('Missing Asset', 'Please take or upload a scan image before running analysis.');
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      // SDK 57+ makes expo/fetch the global fetch on native, and its FormData
      // only accepts real Blob/File parts — the old React Native shorthand
      // { uri, name, type } throws "Unsupported FormDataPart implementation".
      // expo-file-system's File wraps the local uri as a proper Blob.
      //
      // expo-image-picker normally returns a file:// URI, but some Android
      // OEM camera intents have been known to omit the scheme — File's
      // native validatePath() rejects anything that isn't a proper
      // file:///content:// URI, so normalize defensively before using it.
      const fileUri = /^[a-zA-Z]+:\/\//.test(image) ? image : `file://${image}`;

      let file;
      try {
        file = new File(fileUri);
      } catch (fileError) {
        console.error('[Quick Test] Could not reference scan image file:', fileError);
        throw new Error('Could not read the selected photo. Please retake or reselect it.');
      }

      formData.append('photo', file, file.name || 'scan.jpg');
      if (symptomContext.trim()) {
        formData.append('notes', symptomContext.trim());
      }

      const response = await api.post('/scan', formData);

      setAnalysisResult({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        trackingStatus: response.data.trackingStatus,
        asymmetryScore: response.data.asymmetryScore,
        borderProfile: response.data.borderProfile,
        estimatedDiameterMm: response.data.estimatedDiameterMm,
        summaryMarkdown: response.data.summaryMarkdown,
      });
    } catch (error) {
      console.error('[Quick Test] Analysis failed:', error);
      Alert.alert('Analysis Failed', error.message || 'Something went wrong while processing your scan.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 130 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Header */}
          <View className="mb-6 mt-2">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-slate-100 rounded-lg items-center justify-center">
                <Ionicons name="flask-sharp" size={18} color="#0F172A" />
              </View>
              <Text className="text-xs uppercase tracking-widest text-slate-500 font-bold ml-2">Quick Test</Text>
            </View>
            <Text className="text-3xl font-black text-slate-900 tracking-tight mt-1">Quick Scan Test</Text>
            <Text className="text-slate-500 text-sm mt-1">
              Upload a photo of the target area for a structural analysis read-out.
            </Text>
          </View>

          {/* Image Dropzone */}
          <View className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm mb-5 items-center justify-center">
            {image ? (
              <View className="w-full">
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
                <Text className="text-slate-400 text-xs text-center mt-1" style={{ maxWidth: 220 }}>
                  Take a photo or choose one from your gallery to get started.
                </Text>
              </View>
            )}

            <View className="flex-row w-full mt-4">
              <TouchableOpacity
                onPress={takePhoto}
                className="flex-1 h-12 bg-black rounded-xl flex-row items-center justify-center mr-2"
              >
                <Ionicons name="camera-outline" size={18} color="white" />
                <Text className="text-white font-semibold text-sm ml-2">Use Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickImage}
                className="flex-1 h-12 bg-white border border-slate-200 rounded-xl flex-row items-center justify-center"
              >
                <Ionicons name="images-outline" size={18} color="#0F172A" />
                <Text className="text-slate-700 font-semibold text-sm ml-2">Browse Files</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Context notes */}
          <View className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm mb-6">
            <Text className="text-slate-800 font-bold text-base mb-1">Additional Observations</Text>
            <Text className="text-slate-400 text-xs mb-3">
              Add any symptoms or context to help sharpen the read-out.
            </Text>
            <TextInput
              value={symptomContext}
              onChangeText={setSymptomContext}
              placeholder="e.g., Slight itching since yesterday, or routine 3-week check..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm h-20"
            />
          </View>

          {/* Trigger */}
          {!analysisResult && !isAnalyzing && (
            <TouchableOpacity
              onPress={runDiagnosticAnalysis}
              className="w-full h-14 bg-black rounded-2xl items-center justify-center"
            >
              <Text className="text-white font-bold text-base tracking-wide">Run Analysis</Text>
            </TouchableOpacity>
          )}

          {/* Loading */}
          {isAnalyzing && (
            <View className="w-full bg-white border border-slate-100 p-6 rounded-3xl items-center shadow-sm">
              <BrandLoader fullScreen={false} size={72} message={null} />
              <Text className="text-slate-800 font-bold text-base mt-4">Analyzing your scan…</Text>
              <Text className="text-slate-400 text-xs text-center mt-1">
                Uploading your photo and generating a structural read-out.
              </Text>
            </View>
          )}

          {/* Results */}
          {analysisResult && !isAnalyzing && (
            <View className="w-full bg-white border border-emerald-50 p-6 rounded-3xl shadow-sm border-t-4 border-t-emerald-500">
              <View className="flex-row justify-between items-center mb-4">
                <View className="flex-row items-center">
                  <View className="w-6 h-6 bg-emerald-100 rounded-full items-center justify-center">
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  </View>
                  <Text className="text-emerald-800 font-bold text-sm ml-2">{analysisResult.trackingStatus}</Text>
                </View>
                <Text className="text-slate-400 text-xs font-mono">{analysisResult.timestamp}</Text>
              </View>

              <View className="flex-row mb-4">
                <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100 mr-2">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asymmetry Score</Text>
                  <Text className="text-2xl font-black text-slate-900 mt-0.5">
                    {(analysisResult.asymmetryScore * 100).toFixed(0)}%
                  </Text>
                </View>
                <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Diameter</Text>
                  <Text className="text-2xl font-black text-slate-900 mt-0.5">
                    {analysisResult.estimatedDiameterMm}mm
                  </Text>
                </View>
              </View>

              <Text className="text-slate-800 font-bold text-sm mb-1">Border Profile</Text>
              <View className="mb-4">
                <Markdown style={markdownStyles}>{analysisResult.borderProfile || '—'}</Markdown>
              </View>

              <Text className="text-slate-800 font-bold text-sm mb-1">Structural Extraction Insights</Text>
              <Markdown style={markdownStyles}>{analysisResult.summaryMarkdown || '—'}</Markdown>

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
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
