// Textos que ve el usuario, todos en español y en un solo archivo (RIU-01, M-12).
export const messages = {
  common: {
    save: 'Guardar',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    loading: 'Cargando…',
    pending: 'Pantalla en construcción',
  },
  errors: {
    network: 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.',
    unexpected: 'Ocurrió un error inesperado. Intenta de nuevo.',
    sessionExpired: 'Tu sesión venció. Inicia sesión de nuevo.',
  },
  screens: {
    login: 'Iniciar sesión',
    register: 'Crear cuenta',
    forgotPassword: 'Recuperar contraseña',
    inventory: 'Inventario',
    scanner: 'Escanear código',
    alerts: 'Productos por reponer',
    newProduct: 'Nuevo producto',
    productDetail: 'Detalle del producto',
    editProduct: 'Editar producto',
    movement: 'Registrar movimiento',
    qr: 'Código QR',
  },
} as const;
