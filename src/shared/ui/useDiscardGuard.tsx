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
  // Al descartar o guardar se marca la salida como permitida en el mismo
  // manejador, para que preventRemove pase a false junto con la protección.
  const [released, setReleased] = useState(false);
  const disablePrevention = usePreventRemove(hasChanges && !released, ({ repeat }) => setLeave(() => repeat));

  const allowLeave = () => {
    setReleased(true);
    disablePrevention();
  };

  const discard = () => {
    const repeat = leave;
    setLeave(null);
    setReleased(true);
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
