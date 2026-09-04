import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Upload, FileCheck, X, ChevronLeft, AlertCircle } from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import { uploadFileToR2 } from '../../utils/upload';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../stores/authStore';

export const DocumentUploadScreen = ({ navigation }: any) => {
  const { user, submitVerification } = useAuthStore();
  const [file, setFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'خطأ', text2: 'حدث خطأ أثناء اختيار الملف' });
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Get presigned URL
      const { data: urlData } = await apiClient.post('/verification/upload-url', {
        documentType: 'bar_license',
        contentType: file.mimeType || 'image/jpeg',
      });

      // 2. Upload directly to Cloudflare R2
      await uploadFileToR2({
        localUri: file.uri,
        presignedUrl: urlData.uploadUrl,
        contentType: file.mimeType || 'image/jpeg',
        onProgress: (progress) => setUploadProgress(progress),
      });

      // 3. Confirm upload with the backend
      await apiClient.post(`/verification/${urlData.documentId}/confirm`, {
        barId: '0000', // Placeholder or add input field for Bar ID
      });

      // Update local state to PENDING so the router redirects
      await submitVerification('PENDING');

    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'فشل الرفع',
        text2: err.message || 'حدث خطأ غير متوقع',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="flex-row items-center p-6 gap-4">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <ChevronLeft size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text className="text-xl font-displayBold text-ink">Upload Credentials</Text>
      </View>

      <View className="flex-1 p-8">
        <Text className="text-[12px] font-bodySemibold text-muted tracking-[1.5px] mb-4 uppercase">GOVERNMENT ID / BAR CARD</Text>
        <Text className="text-[15px] font-body text-ink leading-[22px] mb-8">
          Please provide a clear scan or photo of your official bar association card or government-issued identification.
        </Text>

        <TouchableOpacity
          className={`h-60 border-2 rounded-2xl bg-white justify-center items-center shadow-sm ${
            file ? 'border-signal border-solid bg-signal/[0.02]' : 'border-line border-dashed'
          }`}
          onPress={pickDocument}
          activeOpacity={0.7}
        >
          <AnimatePresence>
            {!file ? (
              <MotiView
                key="empty"
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="items-center w-full p-6"
              >
                <View className="w-16 h-16 rounded-full bg-signal/10 justify-center items-center mb-4">
                  <Upload size={32} color="#2A8F85" />
                </View>
                <Text className="text-base font-bodySemibold text-ink mb-1">Tap to select file</Text>
                <Text className="text-[13px] font-body text-muted">PDF, JPG or PNG (max 10MB)</Text>
              </MotiView>
            ) : (
              <MotiView
                key="selected"
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="items-center w-full p-6"
              >
                <View className="w-16 h-16 rounded-full bg-success/20 justify-center items-center mb-4">
                  <FileCheck size={32} color="#38A169" />
                </View>
                <Text className="text-base font-bodySemibold text-ink mb-4 text-center" numberOfLines={1}>{file.name}</Text>
                <TouchableOpacity onPress={() => setFile(null)} className="flex-row items-center gap-1">
                  <X size={14} color="#E53E3E" />
                  <Text className="text-sm font-bodyMedium text-destructive">Remove</Text>
                </TouchableOpacity>
              </MotiView>
            )}
          </AnimatePresence>
        </TouchableOpacity>

        <View className="flex-row bg-info/10 p-4 rounded-xl mt-8 gap-3 items-start">
          <AlertCircle size={18} color="#3182CE" />
          <Text className="flex-1 text-[13px] font-body text-info leading-[18px]">
            Your data is encrypted and only accessible by the verification team.
          </Text>
        </View>
      </View>

      <View className="p-8">
        <TouchableOpacity
          className={`h-14 rounded-xl justify-center items-center shadow-md ${
            !file || isUploading ? 'bg-line opacity-60' : 'bg-signal'
          }`}
          onPress={handleUpload}
          disabled={!file || isUploading}
        >
          <Text className="text-white text-base font-bodySemibold">
            {isUploading ? 'Securing Files...' : 'Submit for Review'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
