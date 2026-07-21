import { Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import { Manrope_500Medium, Manrope_700Bold } from '@expo-google-fonts/manrope';
import { Feather } from '@expo/vector-icons';
import { useSignUp, useSSO } from '@clerk/expo';
import { makeRedirectUri } from 'expo-auth-session';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

// Colors match the welcome screen (src/app/index.jsx)
const C = {
  text: '#F5F3EF',
  muted: '#8B93A0',
  placeholder: '#5B6270',
  border: '#1F2124',
  surface: '#0D0E10',
  danger: '#FF6B6B',
  dangerBg: 'rgba(255,107,107,0.12)',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Extracts a friendly message out of a Clerk error object
function getClerkErrorMessage(error) {
  const first = error?.errors?.[0];
  return first?.longMessage || first?.message || 'Something went wrong. Please try again.';
}

// Preloads the browser for Android devices to reduce SSO load time.
// See: https://docs.expo.dev/guides/authentication/#improving-user-experience
function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}
WebBrowser.maybeCompleteAuthSession();

function GoogleGlyph() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}

export default function SignUp() {
  const router = useRouter();
  useWarmUpBrowser();
  const [fontsLoaded] = useFonts({ Fraunces_500Medium, Manrope_500Medium, Manrope_700Bold });
  const displayFont = fontsLoaded ? 'font-[Fraunces_500Medium]' : 'font-serif';
  const bodyFont = fontsLoaded ? 'font-[Manrope_500Medium]' : '';
  const boldFont = fontsLoaded ? 'font-[Manrope_700Bold]' : 'font-bold';

  const { signUp, errors: signUpErrors, fetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();

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
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const busy = submitting || googleSubmitting || fetchStatus === 'fetching';

  const clearFieldError = (field) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const finalizeAndEnter = async () => {
    await signUp.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) {
          // App doesn't have custom UI for pending session tasks yet.
          return;
        }
        router.replace('/(app)/(tabs)');
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

  const handleGoogleSignUp = async () => {
    setFormError('');
    setGoogleSubmitting(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: makeRedirectUri(),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(app)/(tabs)');
      }
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  if (step === 'verify') {
    return (
      <View className="flex-1 bg-black">
        <SafeAreaView className="flex-1">
          <View className="flex-1 px-8 pb-8 pt-6">
            <Text className={`${displayFont} text-3xl text-[#F5F3EF]`}>Verify your email</Text>
            <Text className={`${bodyFont} mt-2 text-base text-[#8B93A0]`}>
              We sent a verification code to {email.trim()}.
            </Text>

            {formError ? (
              <View className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: C.dangerBg }}>
                <Text className={`${bodyFont} text-sm text-[#FF6B6B]`}>{formError}</Text>
              </View>
            ) : null}

            <View className="mt-6 mb-4">
              <Text className={`${bodyFont} mb-2 text-xs text-[#8B93A0]`}>Verification code</Text>
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
              className={`w-full items-center rounded-2xl bg-white py-4 active:opacity-80 ${(!code || busy) ? 'opacity-50' : ''}`}
            >
              {submitting ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <Text className={`${boldFont} text-base text-black`}>Verify</Text>
              )}
            </Pressable>

            <Pressable onPress={handleResendCode} disabled={resending || busy} className="mt-4 items-center" hitSlop={8}>
              <Text className={`${bodyFont} text-sm text-[#8B93A0]`}>
                {resending ? 'Resending…' : "Didn't get it? Resend code"}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <SafeAreaView className="flex-1">
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="flex-1 px-8 pb-8 pt-6">
              <View className="mb-10">
                <Text className={`${displayFont} text-3xl text-[#F5F3EF]`}>Create account</Text>
                <Text className={`${bodyFont} mt-2 text-base text-[#8B93A0]`}>
                  Start your journey with Preven.
                </Text>
              </View>

              {formError ? (
                <View className="mb-4 rounded-xl px-4 py-3" style={{ backgroundColor: C.dangerBg }}>
                  <Text className={`${bodyFont} text-sm text-[#FF6B6B]`}>{formError}</Text>
                </View>
              ) : null}

              {/* Google sign-up */}
              <Pressable
                onPress={handleGoogleSignUp}
                disabled={googleSubmitting || submitting}
                className={`w-full flex-row items-center justify-center rounded-2xl py-4 active:opacity-70 ${googleSubmitting ? 'opacity-60' : ''}`}
                style={{ borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }}
              >
                {googleSubmitting ? (
                  <ActivityIndicator color={C.text} />
                ) : (
                  <View className="flex-row items-center">
                    <GoogleGlyph />
                    <Text className={`${bodyFont} ml-3 text-base text-[#F5F3EF]`}>
                      Sign up with Google
                    </Text>
                  </View>
                )}
              </Pressable>

              {/* Divider */}
              <View className="my-6 flex-row items-center">
                <View className="h-[1px] flex-1" style={{ backgroundColor: C.border }} />
                <Text className={`${bodyFont} mx-3 text-xs uppercase tracking-widest text-[#5B6270]`}>
                  or
                </Text>
                <View className="h-[1px] flex-1" style={{ backgroundColor: C.border }} />
              </View>

              {/* Full name */}
              <View className="mb-4">
                <Text className={`${bodyFont} mb-2 text-xs text-[#8B93A0]`}>Full name</Text>
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
                  <Text className={`${bodyFont} mt-1.5 text-xs text-[#FF6B6B]`}>{fieldErrors.name}</Text>
                ) : null}
              </View>

              {/* Email */}
              <View className="mb-4">
                <Text className={`${bodyFont} mb-2 text-xs text-[#8B93A0]`}>Email</Text>
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
                  <Text className={`${bodyFont} mt-1.5 text-xs text-[#FF6B6B]`}>{fieldErrors.email}</Text>
                ) : null}
              </View>

              {/* Password */}
              <View className="mb-4">
                <Text className={`${bodyFont} mb-2 text-xs text-[#8B93A0]`}>Password</Text>
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
                  <Text className={`${bodyFont} mt-1.5 text-xs text-[#FF6B6B]`}>
                    {fieldErrors.password}
                  </Text>
                ) : null}
              </View>

              {/* Confirm password */}
              <View className="mb-4">
                <Text className={`${bodyFont} mb-2 text-xs text-[#8B93A0]`}>Confirm password</Text>
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
                  <Text className={`${bodyFont} mt-1.5 text-xs text-[#FF6B6B]`}>
                    {fieldErrors.confirmPassword}
                  </Text>
                ) : null}
              </View>

              <Text className={`${bodyFont} mb-6 text-xs leading-5 text-[#5B6270]`}>
                By creating an account, you agree to Preven\u2019s Terms of Service and Privacy Policy.
              </Text>

              {/* Create account button */}
              <Pressable
                onPress={handleSignUp}
                disabled={busy}
                className={`w-full items-center rounded-2xl bg-white py-4 active:opacity-80 ${busy ? 'opacity-50' : ''}`}
              >
                {submitting ? (
                  <ActivityIndicator color="#000000" />
                ) : (
                  <Text className={`${boldFont} text-base text-black`}>Create account</Text>
                )}
              </Pressable>

              <View className="mt-8 flex-row justify-center">
                <Text className={`${bodyFont} text-sm text-[#8B93A0]`}>Already have an account? </Text>
                <Pressable onPress={() => router.replace('/(auth)/sign-in')} hitSlop={8}>
                  <Text className={`${boldFont} text-sm text-[#F5F3EF]`}>Sign in</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
