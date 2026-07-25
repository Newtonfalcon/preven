import { Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import { Manrope_500Medium, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { Feather } from '@expo/vector-icons';
import { useSignIn } from '@clerk/expo';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Colors match the welcome screen (src/app/index.jsx)
const C = {
  text: '#0F172A',
  muted: '#64748B',
  placeholder: '#94A3B8',
  border: '#E2E8F0',
  surface: '#F8FAFC',
  danger: '#E11D48',
  dangerBg: 'rgba(225,29,72,0.08)',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Extracts a friendly message out of a Clerk error object
function getClerkErrorMessage(error) {
  const first = error?.errors?.[0];
  return first?.longMessage || first?.message || 'Something went wrong. Please try again.';
}

// Small branded header shown above the main sign-in/sign-up forms.
function BrandHeader() {
  return (
    <View className="mb-8 flex-row items-center">
      <LinearGradient
        colors={['#1F2937', '#000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
      >
        <Image
          source={require('../../../assets/images/logo.png')}
          style={{ width: 26, height: 26 }}
          resizeMode="contain"
        />
      </LinearGradient>
      <Text className="ml-3 text-lg font-semibold text-[#0F172A]">Preven</Text>
    </View>
  );
}

// Footer shown at the bottom of the main sign-in/sign-up forms.
function BrandFooter() {
  return (
    <Text className="mt-auto pt-8 text-center text-xs tracking-wide text-[#94A3B8]">
      Powered by Netech
    </Text>
  );
}

export default function SignIn() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Fraunces_500Medium, Manrope_500Medium, Manrope_700Bold });
  const displayFont = fontsLoaded ? 'font-[Fraunces_500Medium]' : 'font-serif';
  const bodyFont = fontsLoaded ? 'font-[Manrope_500Medium]' : '';
  const boldFont = fontsLoaded ? 'font-[Manrope_700Bold]' : 'font-bold';

  const { signIn, errors: signInErrors, fetchStatus } = useSignIn();

  // 'signin' -> main form, 'verify' -> client-trust code step,
  // 'resetEmail' / 'resetCode' / 'resetPassword' -> forgot-password sub-flow
  const [mode, setMode] = useState('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const busy = submitting || fetchStatus === 'fetching';

  const finalizeAndEnter = async () => {
    // No router.replace here on purpose: setting the session active flips
    // Clerk's isSignedIn to true, and AppShell's own effect (app/_layout.jsx)
    // reacts to that and does the redirect. Navigating from both places at
    // once races the navigator and is what was causing intermittent crashes
    // / stale isSignedIn:false reads on native.
    await signIn.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) {
          // App doesn't have custom UI for pending session tasks yet.
        }
      },
    });
  };

  const clearFieldError = (field) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSignIn = async () => {
    setFormError('');
    const errors = {};
    if (!email.trim()) errors.email = 'Email is required.';
    else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Password is required.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const { error } = await signIn.password({ emailAddress: email.trim(), password });
      if (error) {
        setFormError(getClerkErrorMessage(error));
        return;
      }

      if (signIn.status === 'complete') {
        await finalizeAndEnter();
      } else if (signIn.status === 'needs_second_factor') {
        setFormError('This account requires additional verification, which isn’t supported here yet.');
      } else if (signIn.status === 'needs_client_trust') {
        const emailCodeFactor = signIn.supportedSecondFactors?.find((f) => f.strategy === 'email_code');
        if (emailCodeFactor) {
          await signIn.mfa.sendEmailCode();
          setMode('verify');
        } else {
          setFormError('This device needs to be verified, but no verification method is available.');
        }
      } else {
        setFormError('Sign-in could not be completed. Please try again.');
      }
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyClientTrust = async () => {
    setFormError('');
    setSubmitting(true);
    try {
      const { error } = await signIn.mfa.verifyEmailCode({ code });
      if (error) {
        setFormError(getClerkErrorMessage(error));
        return;
      }
      if (signIn.status === 'complete') {
        await finalizeAndEnter();
      } else {
        setFormError('Verification could not be completed. Please try again.');
      }
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  // --- Forgot password sub-flow ---

  const handleSendResetCode = async () => {
    setFormError('');
    if (!EMAIL_RE.test(email.trim())) {
      setFieldErrors((prev) => ({ ...prev, email: 'Enter your email above first.' }));
      return;
    }
    setSubmitting(true);
    try {
      const { error: createError } = await signIn.create({ identifier: email.trim() });
      if (createError) {
        setFormError(getClerkErrorMessage(createError));
        return;
      }
      const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
      if (sendError) {
        setFormError(getClerkErrorMessage(sendError));
        return;
      }
      setMode('resetCode');
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyResetCode = async () => {
    setFormError('');
    setSubmitting(true);
    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (error) {
        setFormError(getClerkErrorMessage(error));
        return;
      }
      setMode('resetPassword');
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitNewPassword = async () => {
    setFormError('');
    if (!newPassword || newPassword.length < 6) {
      setFieldErrors((prev) => ({ ...prev, newPassword: 'Use at least 6 characters.' }));
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({
        password: newPassword,
        signOutOfOtherSessions: true,
      });
      if (error) {
        setFormError(getClerkErrorMessage(error));
        return;
      }
      if (signIn.status === 'complete') {
        Alert.alert('Password updated', 'Your password has been reset.');
        await finalizeAndEnter();
      } else {
        setFormError('Password reset could not be completed. Please try again.');
      }
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const resetToSignIn = () => {
    setMode('signin');
    setCode('');
    setNewPassword('');
    setFormError('');
    setFieldErrors({});
  };

  // --- Verify (client trust) screen ---
  if (mode === 'verify') {
    return (
      <View className="flex-1 bg-white">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <SafeAreaView className="flex-1">
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="px-8 pb-8 pt-6">
                <Text className={`${displayFont} text-3xl text-[#0F172A]`}>Verify it’s you</Text>
                <Text className={`${bodyFont} mt-2 text-base text-[#64748B]`}>
                  We sent a verification code to {email.trim()}.
                </Text>

                {formError ? (
                  <View className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: C.dangerBg }}>
                    <Text className={`${bodyFont} text-sm text-[#E11D48]`}>{formError}</Text>
                  </View>
                ) : null}

                <View className="mt-6 mb-4">
                  <Text className={`${bodyFont} mb-2 text-xs text-[#64748B]`}>Verification code</Text>
                  <View
                    className="flex-row items-center rounded-2xl px-4"
                    style={{ borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }}
                  >
                    <TextInput
                      value={code}
                      onChangeText={setCode}
                      placeholder="123456"
                      placeholderTextColor={C.placeholder}
                      keyboardType="number-pad"
                      editable={!busy}
                      className={`${bodyFont} flex-1 py-4 text-base`}
                      style={{ color: C.text }}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={handleVerifyClientTrust}
                  disabled={!code || busy}
                  className={`w-full items-center rounded-2xl bg-black py-4 active:opacity-80 ${(!code || busy) ? 'opacity-50' : ''}`}
                >
                  {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text className={`${boldFont} text-base text-white`}>Verify</Text>}
                </Pressable>

                <Pressable onPress={() => signIn.mfa.sendEmailCode()} className="mt-4 items-center" hitSlop={8}>
                  <Text className={`${bodyFont} text-sm text-[#64748B]`}>I need a new code</Text>
                </Pressable>
                <Pressable onPress={resetToSignIn} className="mt-2 items-center" hitSlop={8}>
                  <Text className={`${bodyFont} text-sm text-[#64748B]`}>Start over</Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // --- Forgot password: send code ---
  if (mode === 'resetEmail') {
    return (
      <View className="flex-1 bg-white">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <SafeAreaView className="flex-1">
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="px-8 pb-8 pt-6">
                <Text className={`${displayFont} text-3xl text-[#0F172A]`}>Reset password</Text>
                <Text className={`${bodyFont} mt-2 text-base text-[#64748B]`}>
                  Enter your email and we’ll send you a reset code.
                </Text>

                {formError ? (
                  <View className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: C.dangerBg }}>
                    <Text className={`${bodyFont} text-sm text-[#E11D48]`}>{formError}</Text>
                  </View>
                ) : null}

                <View className="mt-6 mb-4">
                  <Text className={`${bodyFont} mb-2 text-xs text-[#64748B]`}>Email</Text>
                  <View
                    className="flex-row items-center rounded-2xl px-4"
                    style={{ borderWidth: 1, borderColor: fieldErrors.email ? C.danger : C.border, backgroundColor: C.surface }}
                  >
                    <TextInput
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        clearFieldError('email');
                      }}
                      placeholder="you@example.com"
                      placeholderTextColor={C.placeholder}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!busy}
                      className={`${bodyFont} flex-1 py-4 text-base`}
                      style={{ color: C.text }}
                    />
                  </View>
                  {fieldErrors.email ? (
                    <Text className={`${bodyFont} mt-1.5 text-xs text-[#E11D48]`}>{fieldErrors.email}</Text>
                  ) : null}
                </View>

                <Pressable
                  onPress={handleSendResetCode}
                  disabled={busy}
                  className={`w-full items-center rounded-2xl bg-black py-4 active:opacity-80 ${busy ? 'opacity-50' : ''}`}
                >
                  {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text className={`${boldFont} text-base text-white`}>Send reset code</Text>}
                </Pressable>

                <Pressable onPress={resetToSignIn} className="mt-4 items-center" hitSlop={8}>
                  <Text className={`${bodyFont} text-sm text-[#64748B]`}>Back to sign in</Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // --- Forgot password: enter code ---
  if (mode === 'resetCode') {
    return (
      <View className="flex-1 bg-white">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <SafeAreaView className="flex-1">
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="px-8 pb-8 pt-6">
                <Text className={`${displayFont} text-3xl text-[#0F172A]`}>Enter the code</Text>
                <Text className={`${bodyFont} mt-2 text-base text-[#64748B]`}>
                  We sent a reset code to {email.trim()}.
                </Text>

                {formError ? (
                  <View className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: C.dangerBg }}>
                    <Text className={`${bodyFont} text-sm text-[#E11D48]`}>{formError}</Text>
                  </View>
                ) : null}

                <View className="mt-6 mb-4">
                  <Text className={`${bodyFont} mb-2 text-xs text-[#64748B]`}>Verification code</Text>
                  <View
                    className="flex-row items-center rounded-2xl px-4"
                    style={{ borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }}
                  >
                    <TextInput
                      value={code}
                      onChangeText={setCode}
                      placeholder="123456"
                      placeholderTextColor={C.placeholder}
                      keyboardType="number-pad"
                      editable={!busy}
                      className={`${bodyFont} flex-1 py-4 text-base`}
                      style={{ color: C.text }}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={handleVerifyResetCode}
                  disabled={!code || busy}
                  className={`w-full items-center rounded-2xl bg-black py-4 active:opacity-80 ${(!code || busy) ? 'opacity-50' : ''}`}
                >
                  {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text className={`${boldFont} text-base text-white`}>Verify code</Text>}
                </Pressable>

                <Pressable onPress={resetToSignIn} className="mt-4 items-center" hitSlop={8}>
                  <Text className={`${bodyFont} text-sm text-[#64748B]`}>Back to sign in</Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // --- Forgot password: set new password ---
  if (mode === 'resetPassword') {
    return (
      <View className="flex-1 bg-white">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <SafeAreaView className="flex-1">
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="px-8 pb-8 pt-6">
                <Text className={`${displayFont} text-3xl text-[#0F172A]`}>New password</Text>
                <Text className={`${bodyFont} mt-2 text-base text-[#64748B]`}>
                  Choose a new password for your account.
                </Text>

                {formError ? (
                  <View className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: C.dangerBg }}>
                    <Text className={`${bodyFont} text-sm text-[#E11D48]`}>{formError}</Text>
                  </View>
                ) : null}

                <View className="mt-6 mb-4">
                  <Text className={`${bodyFont} mb-2 text-xs text-[#64748B]`}>New password</Text>
                  <View
                    className="flex-row items-center rounded-2xl px-4"
                    style={{ borderWidth: 1, borderColor: fieldErrors.newPassword ? C.danger : C.border, backgroundColor: C.surface }}
                  >
                    <TextInput
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);
                        clearFieldError('newPassword');
                      }}
                      placeholder="At least 6 characters"
                      placeholderTextColor={C.placeholder}
                      secureTextEntry
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!busy}
                      className={`${bodyFont} flex-1 py-4 text-base`}
                      style={{ color: C.text }}
                    />
                  </View>
                  {fieldErrors.newPassword ? (
                    <Text className={`${bodyFont} mt-1.5 text-xs text-[#E11D48]`}>{fieldErrors.newPassword}</Text>
                  ) : null}
                </View>

                <Pressable
                  onPress={handleSubmitNewPassword}
                  disabled={busy}
                  className={`w-full items-center rounded-2xl bg-black py-4 active:opacity-80 ${busy ? 'opacity-50' : ''}`}
                >
                  {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text className={`${boldFont} text-base text-white`}>Set new password</Text>}
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // --- Main sign-in screen ---
  return (
    <View className="flex-1 bg-white">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <SafeAreaView className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="px-8 pb-8 pt-6">
              <BrandHeader />
              <View className="mb-10">
                <Text className={`${displayFont} text-3xl text-[#0F172A]`}>Welcome back</Text>
                <Text className={`${bodyFont} mt-2 text-base text-[#64748B]`}>
                  Sign in to continue to Preven.
                </Text>
              </View>

              {formError ? (
                <View className="mb-4 rounded-xl px-4 py-3" style={{ backgroundColor: C.dangerBg }}>
                  <Text className={`${bodyFont} text-sm text-[#E11D48]`}>{formError}</Text>
                </View>
              ) : null}

              {/* Email */}
              <View className="mb-4">
                <Text className={`${bodyFont} mb-2 text-xs text-[#64748B]`}>Email</Text>
                <View
                  className="flex-row items-center rounded-2xl px-4"
                  style={{
                    borderWidth: 1,
                    borderColor: fieldErrors.email || signInErrors?.fields?.identifier ? C.danger : C.border,
                    backgroundColor: C.surface,
                  }}
                >
                  <TextInput
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      clearFieldError('email');
                    }}
                    placeholder="you@example.com"
                    placeholderTextColor={C.placeholder}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                    className={`${bodyFont} flex-1 py-4 text-base`}
                    style={{ color: C.text }}
                  />
                </View>
                {fieldErrors.email ? (
                  <Text className={`${bodyFont} mt-1.5 text-xs text-[#E11D48]`}>{fieldErrors.email}</Text>
                ) : null}
              </View>

              {/* Password */}
              <View className="mb-4">
                <Text className={`${bodyFont} mb-2 text-xs text-[#64748B]`}>Password</Text>
                <View
                  className="flex-row items-center rounded-2xl px-4"
                  style={{
                    borderWidth: 1,
                    borderColor: fieldErrors.password ? C.danger : C.border,
                    backgroundColor: C.surface,
                  }}
                >
                  <TextInput
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      clearFieldError('password');
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={C.placeholder}
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    autoComplete="password"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                    className={`${bodyFont} flex-1 py-4 text-base`}
                    style={{ color: C.text }}
                  />
                  <Pressable
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={10}
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={C.muted} />
                  </Pressable>
                </View>
                {fieldErrors.password ? (
                  <Text className={`${bodyFont} mt-1.5 text-xs text-[#E11D48]`}>
                    {fieldErrors.password}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={() => {
                  setFormError('');
                  setMode('resetEmail');
                }}
                disabled={busy}
                className="mb-6 items-end"
                hitSlop={8}
              >
                <Text className={`${bodyFont} text-sm text-[#64748B]`}>Forgot password?</Text>
              </Pressable>

              {/* Sign in button */}
              <Pressable
                onPress={handleSignIn}
                disabled={busy}
                className={`w-full items-center rounded-2xl bg-black py-4 active:opacity-80 ${busy ? 'opacity-50' : ''}`}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className={`${boldFont} text-base text-white`}>Sign in</Text>
                )}
              </Pressable>

              <View className="mt-8 flex-row justify-center">
                <Text className={`${bodyFont} text-sm text-[#64748B]`}>Don't have an account? </Text>
                <Pressable onPress={() => router.replace('/(auth)/sign-up')} hitSlop={8}>
                  <Text className={`${boldFont} text-sm text-[#0F172A]`}>Create one</Text>
                </Pressable>
              </View>

              <BrandFooter />
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
