import { Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import { Manrope_500Medium, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { Feather } from '@expo/vector-icons';
import { useSignUp } from '@clerk/expo';
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

export default function SignUp() {
  const router = useRouter();
  const [fontsLoaded] = useFonts({ Fraunces_500Medium, Manrope_500Medium, Manrope_700Bold });
  const displayFont = fontsLoaded ? 'font-[Fraunces_500Medium]' : 'font-serif';
  const bodyFont = fontsLoaded ? 'font-[Manrope_500Medium]' : '';
  const boldFont = fontsLoaded ? 'font-[Manrope_700Bold]' : 'font-bold';

  const { signUp, errors: signUpErrors, fetchStatus } = useSignUp();

  // 'form' -> collect details, 'verify' -> email verification code
  // (Clerk requires email verification at sign-up before the account is complete)
  const [step, setStep] = useState('form');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [code, setCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const busy = submitting || fetchStatus === 'fetching';

  const clearFieldError = (field) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const finalizeAndEnter = async () => {
    // No router.replace here on purpose: setting the session active flips
    // Clerk's isSignedIn to true, and AppShell's own effect (app/_layout.jsx)
    // reacts to that and does the redirect. Navigating from both places at
    // once races the navigator and is what was causing intermittent crashes
    // / stale isSignedIn:false reads on native.
    await signUp.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) {
          // App doesn't have custom UI for pending session tasks yet.
        }
      },
    });
  };

  const handleSignUp = async () => {
    setFormError('');
    const errors = {};
    if (!name.trim()) errors.name = 'Name is required.';
    if (!email.trim()) errors.email = 'Email is required.';
    else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.';
    if (!password) errors.password = 'Password is required.';
    else if (password.length < 6) errors.password = 'Use at least 6 characters.';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password.';
    else if (confirmPassword !== password) errors.confirmPassword = 'Passwords don\u2019t match.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const [firstName, ...rest] = name.trim().split(/\s+/);
      const lastName = rest.join(' ') || undefined;

      // Create the account with a password, then Clerk requires the email
      // to be verified with a one-time code before the sign-up can complete.
      const { error } = await signUp.password({
        emailAddress: email.trim(),
        password,
        firstName,
        lastName,
      });
      if (error) {
        setFormError(getClerkErrorMessage(error));
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setFormError(getClerkErrorMessage(sendError));
        return;
      }
      setStep('verify');
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    setFormError('');
    setSubmitting(true);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) {
        setFormError(getClerkErrorMessage(error));
        return;
      }
      if (signUp.status === 'complete') {
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

  const handleResendCode = async () => {
    setFormError('');
    setResending(true);
    try {
      const { error } = await signUp.verifications.sendEmailCode();
      if (error) setFormError(getClerkErrorMessage(error));
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  if (step === 'verify') {
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
                <Text className={`${displayFont} text-3xl text-[#0F172A]`}>Verify your email</Text>
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
                      autoFocus
                      editable={!busy}
                      className={`${bodyFont} flex-1 py-4 text-base tracking-widest`}
                      style={{ color: C.text }}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={handleVerify}
                  disabled={!code || busy}
                  className={`w-full items-center rounded-2xl bg-black py-4 active:opacity-80 ${(!code || busy) ? 'opacity-50' : ''}`}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className={`${boldFont} text-base text-white`}>Verify</Text>
                  )}
                </Pressable>

                <Pressable onPress={handleResendCode} disabled={resending || busy} className="mt-4 items-center" hitSlop={8}>
                  <Text className={`${bodyFont} text-sm text-[#64748B]`}>
                    {resending ? 'Resending…' : "Didn't get it? Resend code"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    );
  }

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
                <Text className={`${displayFont} text-3xl text-[#0F172A]`}>Create account</Text>
                <Text className={`${bodyFont} mt-2 text-base text-[#64748B]`}>
                  Start your journey with Preven.
                </Text>
              </View>

              {formError ? (
                <View className="mb-4 rounded-xl px-4 py-3" style={{ backgroundColor: C.dangerBg }}>
                  <Text className={`${bodyFont} text-sm text-[#E11D48]`}>{formError}</Text>
                </View>
              ) : null}

              {/* Full name */}
              <View className="mb-4">
                <Text className={`${bodyFont} mb-2 text-xs text-[#64748B]`}>Full name</Text>
                <View
                  className="flex-row items-center rounded-2xl px-4"
                  style={{
                    borderWidth: 1,
                    borderColor: fieldErrors.name ? C.danger : C.border,
                    backgroundColor: C.surface,
                  }}
                >
                  <TextInput
                    value={name}
                    onChangeText={(text) => {
                      setName(text);
                      clearFieldError('name');
                    }}
                    placeholder="Jane Doe"
                    placeholderTextColor={C.placeholder}
                    autoCapitalize="words"
                    textContentType="name"
                    autoComplete="name"
                    autoCorrect={false}
                    editable={!busy}
                    className={`${bodyFont} flex-1 py-4 text-base`}
                    style={{ color: C.text }}
                  />
                </View>
                {fieldErrors.name ? (
                  <Text className={`${bodyFont} mt-1.5 text-xs text-[#E11D48]`}>{fieldErrors.name}</Text>
                ) : null}
              </View>

              {/* Email */}
              <View className="mb-4">
                <Text className={`${bodyFont} mb-2 text-xs text-[#64748B]`}>Email</Text>
                <View
                  className="flex-row items-center rounded-2xl px-4"
                  style={{
                    borderWidth: 1,
                    borderColor: fieldErrors.email ? C.danger : C.border,
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
                    placeholder="At least 6 characters"
                    placeholderTextColor={C.placeholder}
                    secureTextEntry={!showPassword}
                    textContentType="newPassword"
                    autoComplete="password-new"
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

              {/* Confirm password */}
              <View className="mb-4">
                <Text className={`${bodyFont} mb-2 text-xs text-[#64748B]`}>Confirm password</Text>
                <View
                  className="flex-row items-center rounded-2xl px-4"
                  style={{
                    borderWidth: 1,
                    borderColor: fieldErrors.confirmPassword ? C.danger : C.border,
                    backgroundColor: C.surface,
                  }}
                >
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      clearFieldError('confirmPassword');
                    }}
                    placeholder="Re-enter your password"
                    placeholderTextColor={C.placeholder}
                    secureTextEntry={!showConfirmPassword}
                    textContentType="newPassword"
                    autoComplete="password-new"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!busy}
                    className={`${bodyFont} flex-1 py-4 text-base`}
                    style={{ color: C.text }}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    hitSlop={10}
                    accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color={C.muted} />
                  </Pressable>
                </View>
                {fieldErrors.confirmPassword ? (
                  <Text className={`${bodyFont} mt-1.5 text-xs text-[#E11D48]`}>
                    {fieldErrors.confirmPassword}
                  </Text>
                ) : null}
              </View>

              <Text className={`${bodyFont} mb-6 text-xs leading-5 text-[#94A3B8]`}>
                By creating an account, you agree to Preven\u2019s Terms of Service and Privacy Policy.
              </Text>

              {/* Create account button */}
              <Pressable
                onPress={handleSignUp}
                disabled={busy}
                className={`w-full items-center rounded-2xl bg-black py-4 active:opacity-80 ${busy ? 'opacity-50' : ''}`}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className={`${boldFont} text-base text-white`}>Create account</Text>
                )}
              </Pressable>

              <View className="mt-8 flex-row justify-center">
                <Text className={`${bodyFont} text-sm text-[#64748B]`}>Already have an account? </Text>
                <Pressable onPress={() => router.replace('/(auth)/sign-in')} hitSlop={8}>
                  <Text className={`${boldFont} text-sm text-[#0F172A]`}>Sign in</Text>
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
