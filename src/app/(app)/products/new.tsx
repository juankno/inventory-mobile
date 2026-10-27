import { messages } from '@/shared/i18n/messages';
import { PlaceholderScreen } from '@/shared/ui/PlaceholderScreen';

// Registro de producto con o sin código de barras (RF-05, RF-06, RF-16).
export default function NewProductScreen() {
  return <PlaceholderScreen title={messages.screens.newProduct} />;
}
