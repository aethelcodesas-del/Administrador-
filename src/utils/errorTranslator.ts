/**
 * Traductor de errores — convierte TODOS los mensajes de error
 * (Supabase Auth, PostgreSQL, PostgREST, red, etc.) al español.
 *
 * REGLA: Nunca mostrar errores en inglés al usuario.
 */
export const translateError = (error: any, defaultFallback?: string): string => {
  if (!error) {
    return defaultFallback || 'Ha ocurrido un error inesperado.';
  }

  // Extraer el mensaje del error (string u objeto)
  let message = '';
  if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    message = error.message || error.error_description || error.error || '';
  }

  if (!message) {
    return defaultFallback || 'Ha ocurrido un error inesperado.';
  }

  const msgLower = message.toLowerCase();

  // ── 1. Errores de red / conexión ──
  if (
    msgLower.includes('networkerror') ||
    msgLower.includes('failed to fetch') ||
    msgLower.includes('fetch resource') ||
    msgLower.includes('load failed') ||
    msgLower.includes('network error') ||
    msgLower.includes('net::err_') ||
    msgLower.includes('econnrefused') ||
    msgLower.includes('timeout')
  ) {
    return 'Error de red: No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo de nuevo.';
  }

  // ── 2. Errores de autenticación ──
  if (
    msgLower.includes('invalid login credentials') ||
    msgLower.includes('invalid credentials') ||
    msgLower.includes('credentials incorrect')
  ) {
    return 'Credenciales incorrectas. Verifica tu correo y contraseña o crea una cuenta.';
  }
  if (msgLower.includes('email not confirmed')) {
    return 'El correo electrónico no ha sido verificado. Revisa tu bandeja de entrada.';
  }
  if (
    msgLower.includes('user already registered') ||
    msgLower.includes('already exists') ||
    msgLower.includes('user_already_exists')
  ) {
    return 'Este correo electrónico ya se encuentra registrado. Intenta iniciar sesión.';
  }
  if (msgLower.includes('password should be at least') || msgLower.includes('password is too short')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (msgLower.includes('signup requires a valid email')) {
    return 'El registro requiere un correo electrónico válido.';
  }
  if (msgLower.includes('email address not allowed')) {
    return 'Esta dirección de correo no está autorizada para registrarse.';
  }
  if (msgLower.includes('invalid email') || msgLower.includes('email is invalid')) {
    return 'El correo electrónico ingresado no es válido.';
  }
  if (msgLower.includes('user not found') || msgLower.includes('no user found')) {
    return 'No se encontró un usuario con ese correo. Verifica la dirección o crea una cuenta.';
  }
  if (msgLower.includes('email link is invalid') || msgLower.includes('otp_expired')) {
    return 'El enlace de verificación ha expirado o es inválido. Solicita uno nuevo.';
  }

  // ── 3. Límite de intentos ──
  if (msgLower.includes('rate limit') || msgLower.includes('too many requests')) {
    return 'Límite de intentos excedido. Espera unos minutos e inténtalo de nuevo.';
  }

  // ── 4. Sesión / Token ──
  if (
    msgLower.includes('invalid token') ||
    msgLower.includes('token expired') ||
    msgLower.includes('jwt expired') ||
    msgLower.includes('invalid claim') ||
    msgLower.includes('refresh_token_not_found')
  ) {
    return 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.';
  }
  if (msgLower.includes('session_not_found') || msgLower.includes('no session')) {
    return 'No hay una sesión activa. Inicia sesión para continuar.';
  }

  // ── 5. Errores RLS / Políticas de seguridad (PostgreSQL) ──
  if (msgLower.includes('infinite recursion') && msgLower.includes('policy')) {
    return 'Error de configuración de seguridad en la base de datos. Contacte al administrador del sistema.';
  }
  if (msgLower.includes('new row violates row-level security policy') || msgLower.includes('row-level security')) {
    return 'No tienes permiso para realizar esta operación. Contacte al administrador.';
  }
  if (msgLower.includes('permission denied')) {
    return 'Acceso denegado: No tienes permisos suficientes para esta acción.';
  }

  // ── 6. Errores de base de datos (PostgreSQL / PostgREST) ──
  if (msgLower.includes('unique') && msgLower.includes('violation')) {
    return 'Este registro ya existe en el sistema. Verifica los datos e intenta de nuevo.';
  }
  if (msgLower.includes('foreign key') && msgLower.includes('violation')) {
    return 'No se puede completar la operación porque existen datos relacionados.';
  }
  if (msgLower.includes('not null') && msgLower.includes('violation')) {
    return 'Faltan campos obligatorios. Completa toda la información requerida.';
  }
  if (msgLower.includes('check') && msgLower.includes('violation')) {
    return 'El valor ingresado no es válido. Verifica los datos e intenta de nuevo.';
  }
  if (
    msgLower.includes('database error') ||
    msgLower.includes('postgres') ||
    msgLower.includes('postgrest') ||
    msgLower.includes('pgrst') ||
    msgLower.includes('could not find the') ||
    msgLower.includes('relation') && msgLower.includes('does not exist')
  ) {
    return 'Error interno del servidor. Intenta de nuevo más tarde o contacta al administrador.';
  }

  // ── 7. Errores de funciones RPC ──
  if (msgLower.includes('function') && (msgLower.includes('does not exist') || msgLower.includes('not found'))) {
    return 'Error de configuración del sistema. Una función requerida no está disponible. Contacte al administrador.';
  }

  // ── 8. Errores de almacenamiento ──
  if (msgLower.includes('bucket') || msgLower.includes('storage')) {
    return 'Error al acceder al almacenamiento. Intenta de nuevo más tarde.';
  }

  // ── 9. Detectar cualquier mensaje en inglés restante y usar el fallback ──
  // Si el mensaje contiene palabras comunes en inglés, NUNCA mostrarlo al usuario
  const englishIndicators = [
    'user', 'error', 'invalid', 'request', 'fetch', 'not found',
    'login', 'signup', 'confirm', 'failed', 'denied', 'policy',
    'relation', 'column', 'table', 'function', 'trigger', 'constraint',
    'violates', 'cannot', 'could not', 'unable', 'unexpected',
    'recursion', 'detected', 'access', 'forbidden', 'unauthorized',
    'conflict', 'internal', 'server', 'connection', 'refused'
  ];
  const looksEnglish = englishIndicators.some(word => msgLower.includes(word));

  if (looksEnglish) {
    return defaultFallback || 'Ha ocurrido un error. Intenta de nuevo o contacta al administrador.';
  }

  // Si el mensaje ya está en español (o no lo podemos detectar), devolverlo
  return message;
};
