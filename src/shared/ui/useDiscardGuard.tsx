import { usePreventRemove } from 'expo-router';
import { useState } from 'react';

import { messages } from '@/shared/i18n/messages';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

// Pregunta antes de salir de un formulario con cambios sin guardar (✕, botón
// o gesto de atrás). Devuelve la hoja de confirmación para ponerla en la
// pantalla y allowLeave para salir sin preguntar después de guardar.
export function useDiscardGuard(hasChanges: boolean) {
  const [leave, setLeave] = useState<(() => void) | null>(null);
  const allowLeave = usePreventRemove(hasChanges, ({ repeat }) => setLeave(() => repeat));

  const discard = () => {
    const repeat = leave;
    setLeave(null);
    allowLeave();
    repeat?.();
  };

  const discardSheet = (
    <BottomSheet visible={leave !== null} onClose={() => setLeave(null)}>
      <AppText variant="heading">{messages.discard.title}</AppText>
      <AppText variant="lead" tone="secondary">
        {messages.discard.body}
      </AppText>
      <Button label={messages.discard.confirm} variant="danger" onPress={discard} />
      <Button label={messages.discard.keepEditing} variant="secondary" onPress={() => setLeave(null)} />
    </BottomSheet>
  );

  return { allowLeave, discardSheet };
}
