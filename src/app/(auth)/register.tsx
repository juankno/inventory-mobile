import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View } from 'react-native';

import { AuthFrame } from '@/features/auth/components/AuthFrame';
import { useRegister } from '@/features/auth/hooks/useAuthMutations';
import { registerSchema, type RegisterForm } from '@/features/auth/schemas';
import { errorMessage, isNetworkError } from '@/shared/api/errors';
import { messages } from '@/shared/i18n/messages';
import { AppText } from '@/shared/ui/AppText';
import { BottomSheet } from '@/shared/ui/BottomSheet';
import { Button } from '@/shared/ui/Button';
import { Banner } from '@/shared/ui/Feedback';
import { Icon } from '@/shared/ui/Icon';
import { TextField } from '@/shared/ui/TextField';
import { theme } from '@/shared/ui/theme';

// Registro del negocio y aceptación de la política de datos (RF-01, RS-05).
export default function RegisterScreen() {
  const registerMutation = useRegister();
  const [policyOpen, setPolicyOpen] = useState(false);
  const { control, handleSubmit, formState } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { businessName: '', ownerName: '', email: '', password: '', dataPolicyAccepted: false },
  });

  const onSubmit = handleSubmit((form) => registerMutation.mutate({ ...form, dataPolicyAccepted: true }));
  const error = registerMutation.error;
  const { errors } = formState;

  return (
    <AuthFrame
      tab="register"
      footer={
        <Button
          label={isNetworkError(error) ? messages.auth.tryAgain : messages.auth.register}
          onPress={onSubmit}
          loading={registerMutation.isPending}
        />
      }
    >
      {error ? <Banner message={errorMessage(error, messages.errors.unexpected)} /> : null}

      <Controller
        control={control}
        name="businessName"
        render={({ field }) => (
          <TextField
            label={messages.auth.businessName}
            placeholder={messages.auth.businessPlaceholder}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.businessName?.message}
            autoCapitalize="words"
            maxLength={80}
          />
        )}
      />
      <Controller
        control={control}
        name="ownerName"
        render={({ field }) => (
          <TextField
            label={messages.auth.ownerName}
            placeholder={messages.auth.ownerPlaceholder}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.ownerName?.message}
            autoCapitalize="words"
            autoComplete="name"
            maxLength={80}
          />
        )}
      />
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
            error={errors.email?.message}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field }) => (
          <TextField
            label={messages.auth.password}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.password?.message}
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
        name="dataPolicyAccepted"
        render={({ field }) => (
          <View style={styles.policy}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: field.value }}
              accessibilityLabel={messages.auth.policyAccept + messages.auth.policyLink}
              onPress={() => field.onChange(!field.value)}
              style={styles.policyRow}
              hitSlop={6}
            >
              <View style={[styles.checkbox, field.value && styles.checkboxChecked]}>
                {field.value ? <Icon name="check" size={18} color={theme.colors.onInk} strokeWidth={3} /> : null}
              </View>
              <AppText variant="body" style={styles.policyText}>
                {messages.auth.policyAccept}
                <AppText variant="bodyStrong" style={styles.underline} onPress={() => setPolicyOpen(true)}>
                  {messages.auth.policyLink}
                </AppText>
              </AppText>
            </Pressable>
            {errors.dataPolicyAccepted ? (
              <AppText variant="caption" tone="danger">
                {errors.dataPolicyAccepted.message}
              </AppText>
            ) : null}
          </View>
        )}
      />

      <BottomSheet visible={policyOpen} onClose={() => setPolicyOpen(false)}>
        <AppText variant="heading">{messages.auth.policyTitle}</AppText>
        <AppText variant="lead" tone="secondary">
          {messages.auth.policyBody}
        </AppText>
        <Button label={messages.common.understood} onPress={() => setPolicyOpen(false)} />
      </BottomSheet>
    </AuthFrame>
  );
}

const styles = StyleSheet.create({
  policy: { gap: theme.spacing.sm },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, minHeight: 48 },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: theme.colors.ink },
  policyText: { flex: 1 },
  underline: { textDecorationLine: 'underline' },
});
