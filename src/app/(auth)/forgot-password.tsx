import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet } from 'react-native';

import {
  useConfirmPasswordReset,
  useRequestPasswordReset,
} from '@/features/auth/hooks/useAuthMutations';
import {
  confirmResetSchema,
  requestResetSchema,
  type ConfirmResetForm,
  type RequestResetForm,
} from '@/features/auth/schemas';
import { errorMessage } from '@/shared/api/errors';
import { messages } from '@/shared/i18n/messages';
import { AppText, Headline } from '@/shared/ui/AppText';
import { Button } from '@/shared/ui/Button';
import { Banner } from '@/shared/ui/Feedback';
import { IconButton } from '@/shared/ui/IconButton';
import { PageLayout } from '@/shared/ui/PageLayout';
import { TextField } from '@/shared/ui/TextField';
import { theme } from '@/shared/ui/theme';

const t = messages.forgotPassword;

// Recuperar contraseña en dos pasos (RF-04): pedir el código y cambiarla con él.
export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState<string | null>(null);

  const goBack = () => (email ? setEmail(null) : router.back());

  return email ? (
    <ConfirmStep email={email} onBack={goBack} />
  ) : (
    <RequestStep onSent={setEmail} onBack={goBack} />
  );
}

function RequestStep({ onSent, onBack }: { onSent: (email: string) => void; onBack: () => void }) {
  const requestMutation = useRequestPasswordReset();
  const { control, handleSubmit, formState } = useForm<RequestResetForm>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = handleSubmit(({ email }) =>
    requestMutation.mutate(email, { onSuccess: () => onSent(email) }),
  );

  return (
    <PageLayout
      left={<IconButton icon="chevronLeft" accessibilityLabel={messages.common.back} onPress={onBack} />}
      header={
        <>
          <AppText variant="bodyStrong" tone="secondary">
            {t.step(1)}
          </AppText>
          <Headline strong={t.titleStrong} soft={t.titleSoft} />
          <AppText variant="lead" tone="secondary">
            {t.intro}
          </AppText>
        </>
      }
      footer={<Button label={t.send} onPress={onSubmit} loading={requestMutation.isPending} />}
    >
      {requestMutation.error ? (
        <Banner message={errorMessage(requestMutation.error, messages.errors.unexpected)} />
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
            returnKeyType="send"
            onSubmitEditing={() => void onSubmit()}
          />
        )}
      />
    </PageLayout>
  );
}

function ConfirmStep({ email, onBack }: { email: string; onBack: () => void }) {
  const confirmMutation = useConfirmPasswordReset();
  const resendMutation = useRequestPasswordReset();
  const { control, handleSubmit, formState } = useForm<ConfirmResetForm>({
    resolver: zodResolver(confirmResetSchema),
    defaultValues: { code: '', newPassword: '', confirmPassword: '' },
  });
  const { errors } = formState;

  const onSubmit = handleSubmit(({ code, newPassword }) =>
    confirmMutation.mutate(
      { email, code, newPassword },
      { onSuccess: () => router.replace({ pathname: '/login', params: { reset: '1' } }) },
    ),
  );

  const error = confirmMutation.error ?? resendMutation.error;

  return (
    <PageLayout
      left={<IconButton icon="chevronLeft" accessibilityLabel={messages.common.back} onPress={onBack} />}
      header={
        <>
          <AppText variant="bodyStrong" tone="secondary">
            {t.step(2)}
          </AppText>
          <Headline strong={t.codeTitleStrong} soft={t.codeTitleSoft} />
          <AppText variant="lead" tone="secondary">
            {t.codeIntro(email)}
          </AppText>
        </>
      }
      footer={<Button label={t.change} onPress={onSubmit} loading={confirmMutation.isPending} />}
    >
      {error ? (
        <Banner message={errorMessage(error, messages.errors.unexpected)} />
      ) : resendMutation.isSuccess ? (
        <Banner tone="success" message={t.resent} />
      ) : null}
      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <TextField
            label={t.code}
            placeholder={t.codePlaceholder}
            value={field.value}
            onChangeText={(text) => field.onChange(text.replace(/\D/g, ''))}
            onBlur={field.onBlur}
            error={errors.code?.message}
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            style={styles.code}
          />
        )}
      />
      <Controller
        control={control}
        name="newPassword"
        render={({ field }) => (
          <TextField
            label={t.newPassword}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.newPassword?.message}
            hint={messages.auth.passwordHint}
            secureToggle
            autoCapitalize="none"
            autoComplete="new-password"
            textContentType="newPassword"
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field }) => (
          <TextField
            label={t.confirmPassword}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.confirmPassword?.message}
            secureToggle
            autoCapitalize="none"
            autoComplete="new-password"
          />
        )}
      />
      <Pressable
        accessibilityRole="button"
        onPress={() => resendMutation.mutate(email)}
        disabled={resendMutation.isPending}
        style={styles.resend}
      >
        <AppText variant="bodyStrong" style={styles.underline}>
          {t.resend}
        </AppText>
      </Pressable>
    </PageLayout>
  );
}

const styles = StyleSheet.create({
  code: { letterSpacing: 8, fontFamily: theme.fonts.semibold },
  resend: { alignSelf: 'flex-start', paddingVertical: theme.spacing.sm },
  underline: { textDecorationLine: 'underline' },
});
