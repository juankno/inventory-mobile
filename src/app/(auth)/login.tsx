import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocalSearchParams } from 'expo-router';
import { useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, type TextInputInstance } from 'react-native';

import { AuthFrame } from '@/features/auth/components/AuthFrame';
import { useLogin } from '@/features/auth/hooks/useAuthMutations';
import { loginSchema, type LoginForm } from '@/features/auth/schemas';
import { errorMessage, isNetworkError } from '@/shared/api/errors';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Banner } from '@/shared/ui/Feedback';
import { TextField } from '@/shared/ui/TextField';
import { theme } from '@/shared/ui/theme';

// Inicio de sesión (RF-02).
export default function LoginScreen() {
  const { reset } = useLocalSearchParams<{ reset?: string }>();
  const loginMutation = useLogin();
  const passwordRef = useRef<TextInputInstance>(null);
  const { control, handleSubmit, formState } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const busy = loginMutation.isPending;
  const onSubmit = handleSubmit((form) => {
    if (!busy) loginMutation.mutate(form);
  });
  const error = loginMutation.error;

  return (
    <AuthFrame
      tab="login"
      busy={busy}
      footer={
        <Button
          label={isNetworkError(error) ? messages.auth.tryAgain : messages.auth.login}
          onPress={onSubmit}
          loading={busy}
        />
      }
    >
      {error ? (
        <Banner message={errorMessage(error, messages.errors.unexpected)} />
      ) : reset ? (
        <Banner tone="success" message={messages.auth.passwordChanged} />
      ) : null}

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label={messages.auth.email}
            placeholder={messages.auth.emailPlaceholder}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            ref={passwordRef}
            label={messages.auth.password}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={formState.errors.password?.message}
            secureToggle
            autoCapitalize="none"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void onSubmit()}
          />
        )}
      />
      <Link href="/forgot-password" disabled={busy} style={[styles.link, busy && styles.disabled]}>
        <AppText variant="bodyStrong" style={styles.linkText}>
          {messages.auth.forgot}
        </AppText>
      </Link>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  link: { alignSelf: 'flex-start', paddingVertical: theme.spacing.sm },
  disabled: { opacity: 0.4 },
  linkText: { textDecorationLine: 'underline', fontSize: theme.fontSize.lead },
});
