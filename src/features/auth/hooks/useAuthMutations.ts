import { useMutation } from '@tanstack/react-query';

import type { AuthResponse } from '@/shared/api/types';
import { useSession } from '@/shared/session/SessionProvider';
import { confirmPasswordReset, login, register, requestPasswordReset } from '../api';

// Al ingresar o registrarse se guarda la sesión; la protección de rutas
// del layout raíz lleva entonces al inventario.
function useStartSession() {
  const { signIn } = useSession();
  return (response: AuthResponse) =>
    signIn({ token: response.token, businessName: response.business.name, ownerName: response.user.ownerName });
}

export function useLogin() {
  const startSession = useStartSession();
  return useMutation({ mutationFn: login, onSuccess: startSession });
}

export function useRegister() {
  const startSession = useStartSession();
  return useMutation({ mutationFn: register, onSuccess: startSession });
}

export function useRequestPasswordReset() {
  return useMutation({ mutationFn: requestPasswordReset });
}

export function useConfirmPasswordReset() {
  return useMutation({ mutationFn: confirmPasswordReset });
}
