import { Ionicons } from '@expo/vector-icons';
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

// Max dimension (px, long edge) a captured/picked photo is downscaled to
// before it's ever previewed or uploaded. Modern phone cameras can produce
// 12-108MP photos — decoding one of those into memory to resize it can
// itself require hundreds of MB to 1GB+, which is well past what many
// Android devices allow a single app process, and causes a native
// out-of-memory crash that no JS try/catch can intercept. Keeping this
// conservative (rather than e.g. 1600px) leaves a wide safety margin while
// still preserving plenty of detail for structural analysis.
const MAX_IMAGE_DIMENSION = 1400;
const IMAGE_COMPRESSION = 0.7;

export default function QuickTestScreen() {
  const api = useApi();
  const insets = useSafeAreaInsets();

  const [image, setImage] = useState(null);
  const [isPreparingImage, setIsPreparingImage] = useState(false);
  const [symptomContext, setSymptomContext] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const resetScan = () => {
    setImage(null);
    setAnalysisResult(null);
    setSymptomContext('');
  };

  // Takes whatever URI expo-image-picker handed back and produces a safe,
  // downscaled photo before it's ever held in memory for preview or upload.
  //
  // Deliberately does NOT fall back to the original, full-size image if
  // resizing fails for any reason — that would silently reintroduce the
  // exact memory-pressure risk this step exists to prevent. A clear,
  // catchable error is far better than an invisible native crash.
  const prepareAndSetImage = async (rawUri) => {
    setIsPreparingImage(true);
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        rawUri,
        [{ resize: { width: MAX_IMAGE_DIMENSION } }],
        { compress: IMAGE_COMPRESSION, format: ImageManipulator.SaveFormat.JPEG }
      );
      setImage(manipulated.uri);
      setAnalysisResult(null);
    } catch (error) {
      console.error('[Quick Test] Image processing failed:', error);
      Alert.alert(
        'Photo Not Usable',
        'That photo could not be processed. Please try taking or selecting it again.'
      );
    } finally {
      setIsPreparingImage(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera access to capture quick test photos.');
      return;
    }

    let result;
    try {
      result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    } catch (error) {
      console.error('[Quick Test] Camera launch failed:', error);
      Alert.alert('Camera Error', 'Could not open the camera. Please try again.');
      return;
    }

    if (!result.canceled && result.assets?.[0]?.uri) {
      await prepareAndSetImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to process diagnostic scans.');
      return;
    }

    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
    } catch (error) {
      console.error('[Quick Test] Photo library launch failed:', error);
      Alert.alert('Library Error', 'Could not open your photo library. Please try again.');
      return;
    }

    if (!result.canceled && result.assets?.[0]?.uri) {
      await prepareAndSetImage(result.assets[0].uri);
    }
  };

  // Uploads the already-downscaled photo directly from disk using
  // expo-file-system's native streaming upload (api.uploadFile), rather
  // than reading the whole file into a JS Blob/FormData and passing it
  // through fetch. The native task streams bytes straight from disk to
  // the network without ever holding the full file in JS/bridge memory —
  // a meaningfully safer path for large images than FormData + fetch.
  const runDiagnosticAnalysis = async () => {
    if (!image) {
      Alert.alert('Missing Photo', 'Please take or upload a scan image before running analysis.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await api.uploadFile('/scan', image, {
        fieldName: 'photo',
        mimeType: 'image/jpeg',
        parameters: symptomContext.trim() ? { notes: symptomContext.trim() } : {},
      });

      const data = response?.data;
      if (!data) {
        throw new Error('Received an empty response from the server.');
      }

      setAnalysisResult({
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        trackingStatus: data.trackingStatus,
        asymmetryScore: data.asymmetryScore,
        borderProfile: data.borderProfile,
        estimatedDiameterMm: data.estimatedDiameterMm,
        summaryMarkdown: data.summaryMarkdown,
      });
    } catch (error) {
      console.error('[Quick Test] Analysis failed:', error);
      Alert.alert('Analysis Failed', error.message || 'Something went wrong while processing your scan.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const busy = isPreparingImage || isAnalyzing;

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
            {isPreparingImage ? (
              <View className="w-full h-56 items-center justify-center">
                <BrandLoader fullScreen={false} size={64} message="Preparing your photo…" />
              </View>
            ) : image ? (
              <View className="w-full">
                <Image source={{ uri: image }} className="w-full h-64 rounded-2xl bg-slate-100" resizeMode="cover" />
                <TouchableOpacity
                  onPress={resetScan}
                  disabled={busy}
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
                disabled={busy}
                className={`flex-1 h-12 bg-black rounded-xl flex-row items-center justify-center mr-2 ${busy ? 'opacity-50' : ''}`}
              >
                <Ionicons name="camera-outline" size={18} color="white" />
                <Text className="text-white font-semibold text-sm ml-2">Use Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={pickImage}
                disabled={busy}
                className={`flex-1 h-12 bg-white border border-slate-200 rounded-xl flex-row items-center justify-center ${busy ? 'opacity-50' : ''}`}
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
              editable={!busy}
              className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm h-20"
            />
          </View>

          {/* Trigger */}
          {!analysisResult && !isAnalyzing && (
            <TouchableOpacity
              onPress={runDiagnosticAnalysis}
              disabled={isPreparingImage}
              className={`w-full h-14 bg-black rounded-2xl items-center justify-center ${isPreparingImage ? 'opacity-50' : ''}`}
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
                    {typeof analysisResult.asymmetryScore === 'number'
                      ? `${(analysisResult.asymmetryScore * 100).toFixed(0)}%`
                      : '—'}
                  </Text>
                </View>
                <View className="flex-1 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Diameter</Text>
                  <Text className="text-2xl font-black text-slate-900 mt-0.5">
                    {analysisResult.estimatedDiameterMm != null ? `${analysisResult.estimatedDiameterMm}mm` : '—'}
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
                onPress={resetScan}
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
