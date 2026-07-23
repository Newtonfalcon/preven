import { useClerk, useUser } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

function SettingsRow({ icon, label, subtitle, onPress, destructive, disabled, isLoading, isLast }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
      className={`flex-row items-center py-4 px-1 ${disabled ? 'opacity-40' : ''} ${
        isLast ? '' : 'border-b border-slate-50'
      }`}
    >
      <View
        className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${
          destructive ? 'bg-rose-50' : 'bg-slate-100'
        }`}
      >
        <Ionicons name={icon} size={17} color={destructive ? '#E11D48' : '#0F172A'} />
      </View>
      <View className="flex-1">
        <Text className={`text-sm font-semibold ${destructive ? 'text-rose-600' : 'text-slate-900'}`}>
          {label}
        </Text>
        {subtitle ? <Text className="text-slate-400 text-xs mt-0.5">{subtitle}</Text> : null}
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color="#94A3B8" />
      ) : (
        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      )}
    </TouchableOpacity>
  );
}

// Simple bottom-anchored form modal — used for both the profile and
// password editors below so they share one consistent look.
function FormModal({ visible, title, onClose, onSubmit, isSubmitting, submitLabel, children }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl p-5 pb-8">
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-slate-900 text-base font-bold">{title}</Text>
              <TouchableOpacity onPress={onClose} hitSlop={12}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {children}

            <TouchableOpacity
              onPress={onSubmit}
              disabled={isSubmitting}
              className={`h-12 rounded-full items-center justify-center mt-2 ${
                isSubmitting ? 'bg-slate-300' : 'bg-black'
              }`}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold text-sm">{submitLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const inputClassName = 'bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm text-slate-900 mb-3';

export default function SettingsScreen() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const insets = useSafeAreaInsets();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Profile edit modal state
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Password change modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Your account';
  const email = user?.primaryEmailAddress?.emailAddress;

  const openProfileModal = () => {
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      setIsProfileModalOpen(false);
    } catch (error) {
      Alert.alert('Could not update profile', error?.errors?.[0]?.message || error?.message || 'Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('Missing fields', 'Enter both your current and new password.');
      return;
    }
    setIsSavingPassword(true);
    try {
      await user.updatePassword({ currentPassword, newPassword });
      setIsPasswordModalOpen(false);
      Alert.alert('Password updated', 'Your password has been changed.');
    } catch (error) {
      Alert.alert('Could not update password', error?.errors?.[0]?.message || error?.message || 'Please try again.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need access to your photos to update your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    setIsUploadingAvatar(true);
    try {
      // Same fix used for the /scan upload: SDK 57's global fetch (expo/fetch)
      // and Clerk's setProfileImage both need a real Blob/File, not a bare
      // uri string — expo-file-system's File wraps the local uri correctly.
      const file = new File(result.assets[0].uri);
      await user.setProfileImage({ file });
    } catch (error) {
      Alert.alert('Could not update photo', error?.errors?.[0]?.message || error?.message || 'Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          try {
            // AppShell (app/_layout.jsx) redirects once isSignedIn flips to
            // false — no manual navigation here on purpose (avoids the
            // double-navigate race fixed elsewhere in the auth flow).
            await signOut();
          } catch (error) {
            Alert.alert('Sign out failed', error?.message || 'Please try again.');
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your Preven account and all associated data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Self-service account deletion must be enabled for your
              // application in the Clerk Dashboard for this to succeed.
              await user.delete();
            } catch (error) {
              Alert.alert('Could not delete account', error?.errors?.[0]?.message || error?.message || 'Please try again.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 130 }}
      >
        <Text className="text-slate-900 text-xl font-bold mb-4">Settings</Text>

        {/* Account card — identity is read from Clerk, not app-managed state */}
        <View className="bg-white border border-slate-100 rounded-3xl p-5 mb-4 flex-row items-center">
          <TouchableOpacity onPress={handleChangeAvatar} disabled={isUploadingAvatar} className="mr-4">
            <View className="w-14 h-14 rounded-full items-center justify-center bg-slate-100 overflow-hidden">
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} className="w-14 h-14 rounded-full" />
              ) : (
                <Ionicons name="person" size={22} color="#94A3B8" />
              )}
              {isUploadingAvatar ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 28,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(15,23,42,0.5)',
                  }}
                >
                  <ActivityIndicator size="small" color="white" />
                </View>
              ) : null}
            </View>
            <View
              style={{ position: 'absolute', bottom: -2, right: -2 }}
              className="w-5 h-5 rounded-full bg-black items-center justify-center border-2 border-white"
            >
              <Ionicons name="camera" size={10} color="white" />
            </View>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-slate-900 text-base font-bold" numberOfLines={1}>
              {isLoaded ? fullName : 'Loading…'}
            </Text>
            {email ? (
              <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>
                {email}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Account & security — handled directly through Clerk's User methods */}
        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-2 ml-1">
          Account & Security
        </Text>
        <View className="bg-white border border-slate-100 rounded-3xl px-4 mb-4">
          <SettingsRow
            icon="person-circle-outline"
            label="Edit Profile"
            subtitle="Name shown on your account"
            onPress={openProfileModal}
          />
          <SettingsRow
            icon="key-outline"
            label="Change Password"
            subtitle="Update your account password"
            onPress={openPasswordModal}
          />
          <SettingsRow
            icon="mail-outline"
            label="Email Address"
            subtitle={email || 'No email on file'}
            onPress={() => email && Alert.alert('Email Address', email)}
            isLast
          />
        </View>

        {/* Session */}
        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-2 ml-1">Session</Text>
        <View className="bg-white border border-slate-100 rounded-3xl px-4 mb-4">
          <SettingsRow
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleSignOut}
            isLoading={isSigningOut}
            isLast
          />
        </View>

        {/* Danger zone */}
        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-2 ml-1">Danger Zone</Text>
        <View className="bg-white border border-slate-100 rounded-3xl px-4 mb-4">
          <SettingsRow
            icon="trash-outline"
            label="Delete Account"
            subtitle="Permanently remove your account and data"
            onPress={handleDeleteAccount}
            destructive
            isLoading={isDeleting}
            isLast
          />
        </View>

        <Text className="text-center text-slate-300 text-[11px] mt-2">
          Account and security settings are managed securely through Clerk.
        </Text>
      </ScrollView>

      <FormModal
        visible={isProfileModalOpen}
        title="Edit Profile"
        onClose={() => setIsProfileModalOpen(false)}
        onSubmit={handleSaveProfile}
        isSubmitting={isSavingProfile}
        submitLabel="Save Changes"
      >
        <Text className="text-slate-500 text-xs mb-1.5 ml-1">First name</Text>
        <TextInput
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First name"
          placeholderTextColor="#94A3B8"
          className={inputClassName}
        />
        <Text className="text-slate-500 text-xs mb-1.5 ml-1">Last name</Text>
        <TextInput
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last name"
          placeholderTextColor="#94A3B8"
          className={inputClassName}
        />
      </FormModal>

      <FormModal
        visible={isPasswordModalOpen}
        title="Change Password"
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handleSavePassword}
        isSubmitting={isSavingPassword}
        submitLabel="Update Password"
      >
        <Text className="text-slate-500 text-xs mb-1.5 ml-1">Current password</Text>
        <TextInput
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          className={inputClassName}
        />
        <Text className="text-slate-500 text-xs mb-1.5 ml-1">New password</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
          placeholderTextColor="#94A3B8"
          secureTextEntry
          className={inputClassName}
        />
      </FormModal>
    </SafeAreaView>
  );
}