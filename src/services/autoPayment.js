/**
 * Servicio de detección automática de pagos.
 * Escucha notificaciones bancarias y crea pagos en Firestore.
 */
import { Capacitor } from '@capacitor/core';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { reactive } from 'vue';
import NotificationListener from '@/plugins/notification-listener';
import { parseNotification, getBankByPackage } from '@/utils/business/bankNotificationParser';
import { createPayment } from '@/utils/business/payments';
import { convertToMainCurrency } from '@/utils/currencyConverter';
import { deriveKey, encrypt, decrypt } from '@/services/encryption';

const db = getFirestore();
const auth = getAuth();

let listenerHandle = null;
let recentPayments = []; // Para prevenir duplicados

/**
 * Pagos pendientes de categorización (comercio nuevo sin mapeo).
 * Array reactivo accesible desde cualquier componente.
 */
export const pendingPayments = reactive([]);

/**
 * Obtiene la configuración de auto-pago del usuario desde Firestore.
 */
export async function getAutoPaymentConfig() {
  const user = auth.currentUser;
  if (!user) return null;

  const configDoc = await getDoc(doc(db, 'autoPaymentConfig', user.uid));
  if (!configDoc.exists()) return null;
  return configDoc.data();
}

/**
 * Guarda la configuración de auto-pago del usuario.
 */
export async function saveAutoPaymentConfig(config) {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(doc(db, 'autoPaymentConfig', user.uid), {
    ...config,
    userId: user.uid,
    updatedAt: new Date(),
  });
}

/**
 * Normaliza el nombre de un comercio para matching consistente.
 */
export function normalizeMerchant(name) {
  if (!name) return '';
  return name.trim().toUpperCase().replace(/\s+/g, ' ');
}

/**
 * Busca la categoría mapeada para un comercio.
 * @returns {{ categoryName: string, categoryIcon: string } | null}
 */
function getMerchantCategory(merchant, config) {
  if (!merchant || !config?.merchantMappings) return null;
  const key = normalizeMerchant(merchant);
  return config.merchantMappings[key] || null;
}

/**
 * Guarda un mapeo comercio → categoría en la config del usuario.
 */
export async function saveMerchantMapping(merchant, categoryName, categoryIcon) {
  const config = await getAutoPaymentConfig();
  if (!config) return;

  const mappings = config.merchantMappings || {};
  mappings[normalizeMerchant(merchant)] = { categoryName, categoryIcon };

  await saveAutoPaymentConfig({
    ...config,
    merchantMappings: mappings,
  });
}

/**
 * Elimina un mapeo de comercio.
 */
export async function deleteMerchantMapping(merchantKey) {
  const config = await getAutoPaymentConfig();
  if (!config?.merchantMappings) return;

  const mappings = { ...config.merchantMappings };
  delete mappings[merchantKey];

  await saveAutoPaymentConfig({
    ...config,
    merchantMappings: mappings,
  });
}

/**
 * Confirma un pago pendiente: crea el pago y opcionalmente guarda el mapeo.
 */
export async function confirmPendingPayment(pendingId, categoryName, categoryIcon, rememberMapping) {
  const idx = pendingPayments.findIndex(p => p.id === pendingId);
  if (idx === -1) return;

  const pending = pendingPayments[idx];

  // Guardar mapeo si el usuario lo pidió
  if (rememberMapping && pending.merchant) {
    await saveMerchantMapping(pending.merchant, categoryName, categoryIcon);
  }

  // Crear el pago real
  await createPayment({
    goalId: pending.goalId,
    amount: pending.amount,
    currency: pending.currency,
    categoryName,
    categoryIcon,
    isAutoDetected: true,
    merchant: pending.merchant,
  });

  // Actualizar balance del goal
  const user = auth.currentUser;
  if (user) {
    const key = deriveKey(user.uid);
    const goalDoc = await getDoc(doc(db, 'goals', pending.goalId));
    if (goalDoc.exists()) {
      const goalData = goalDoc.data();
      const goalCurrency = decrypt(goalData.mainCurrency, key);
      const goalType = decrypt(goalData.type, key);
      const currentBalance = parseFloat(decrypt(goalData.currentBalanceOnAccount, key));
      const convertedAmount = await convertToMainCurrency(pending.amount, pending.currency, goalCurrency);

      const newBalance = goalType === 'Cuenta bancaria'
        ? currentBalance - convertedAmount
        : currentBalance + convertedAmount;

      await updateDoc(doc(db, 'goals', pending.goalId), {
        currentBalanceOnAccount: encrypt(newBalance.toString(), key),
      });
    }
  }

  // Remover de pendientes
  pendingPayments.splice(idx, 1);
}

/**
 * Descarta un pago pendiente sin crearlo.
 */
export function dismissPendingPayment(pendingId) {
  const idx = pendingPayments.findIndex(p => p.id === pendingId);
  if (idx !== -1) {
    pendingPayments.splice(idx, 1);
  }
}

/**
 * Verifica si el permiso de NotificationListener está otorgado.
 */
export async function isPermissionGranted() {
  if (!Capacitor.isNativePlatform()) return false;
  const result = await NotificationListener.isPermissionGranted();
  return result.granted;
}

/**
 * Abre la configuración de Android para otorgar permiso.
 */
export async function requestPermission() {
  if (!Capacitor.isNativePlatform()) return;
  await NotificationListener.requestPermission();
}

/**
 * Verifica si un pago es duplicado (misma cantidad y timestamp cercano).
 */
function isDuplicate(amount, timestamp) {
  const now = Date.now();
  // Limpiar pagos antiguos (más de 5 minutos)
  recentPayments = recentPayments.filter(p => now - p.time < 300000);

  // Verificar duplicado (mismo monto dentro de 60 segundos)
  const isDup = recentPayments.some(
    p => p.amount === amount && Math.abs(p.timestamp - timestamp) < 60000
  );

  if (!isDup) {
    recentPayments.push({ amount, timestamp, time: now });
  }

  return isDup;
}

/**
 * Determina el goalId destino para un pago automático.
 * Prioridad: goal específico con autoPayment activado > default global
 */
async function resolveTargetGoal(config) {
  if (!config) return null;

  // Si hay un goal con autoPayment activado, usar ese
  if (config.goalOverrides) {
    for (const [goalId, override] of Object.entries(config.goalOverrides)) {
      if (override.enabled) return goalId;
    }
  }

  // Fallback al goal por defecto
  return config.defaultGoalId || null;
}

/**
 * Inicia la escucha de notificaciones bancarias.
 */
export async function startAutoPayment() {
  if (!Capacitor.isNativePlatform()) return;

  const config = await getAutoPaymentConfig();
  if (!config || !config.enabled) return;

  const packageNames = config.monitoredBanks || [];
  if (packageNames.length === 0) return;

  // Iniciar escucha en el servicio nativo
  await NotificationListener.startListening({ packageNames });

  // Escuchar eventos de notificaciones
  listenerHandle = await NotificationListener.addListener('notificationReceived', async (event) => {
    try {
      const { packageName, title, text, timestamp } = event;

      // Parsear la notificación
      const parsed = parseNotification(text || title, packageName);
      if (!parsed) {
        console.log('Notificación bancaria no parseada:', text);
        return;
      }

      // Verificar duplicados
      if (isDuplicate(parsed.amount, timestamp)) {
        console.log('Pago duplicado ignorado:', parsed.amount);
        return;
      }

      // Determinar goal destino
      const goalId = await resolveTargetGoal(config);
      if (!goalId) {
        console.log('No hay goal configurado para pagos automáticos');
        return;
      }

      // Buscar mapeo de comercio → categoría
      const mapping = getMerchantCategory(parsed.merchant, config);
      const bank = getBankByPackage(packageName);

      if (mapping) {
        // Comercio conocido: crear pago directamente con categoría mapeada
        await createPayment({
          goalId,
          amount: parsed.amount,
          currency: parsed.currency,
          categoryName: mapping.categoryName,
          categoryIcon: mapping.categoryIcon,
          isAutoDetected: true,
          merchant: parsed.merchant,
        });

        // Actualizar balance del goal
        const user = auth.currentUser;
        if (user) {
          const key = deriveKey(user.uid);
          const goalDoc = await getDoc(doc(db, 'goals', goalId));
          if (goalDoc.exists()) {
            const goalData = goalDoc.data();
            const goalCurrency = decrypt(goalData.mainCurrency, key);
            const goalType = decrypt(goalData.type, key);
            const currentBalance = parseFloat(decrypt(goalData.currentBalanceOnAccount, key));
            const convertedAmount = await convertToMainCurrency(parsed.amount, parsed.currency, goalCurrency);

            const newBalance = goalType === 'Cuenta bancaria'
              ? currentBalance - convertedAmount
              : currentBalance + convertedAmount;

            await updateDoc(doc(db, 'goals', goalId), {
              currentBalanceOnAccount: encrypt(newBalance.toString(), key),
            });
          }
        }

        console.log(`Pago auto-detectado (mapeado): ${parsed.currency} ${parsed.amount} en ${parsed.merchant} → ${mapping.categoryName}`);
      } else {
        // Comercio nuevo: agregar a pendientes para que el usuario elija categoría
        pendingPayments.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          merchant: parsed.merchant,
          amount: parsed.amount,
          currency: parsed.currency,
          goalId,
          bankName: bank?.name || packageName,
          timestamp: timestamp || Date.now(),
        });

        console.log(`Pago pendiente de categorización: ${parsed.currency} ${parsed.amount} en ${parsed.merchant}`);
      }
    } catch (error) {
      console.error('Error procesando notificación bancaria:', error);
    }
  });
}

/**
 * Detiene la escucha de notificaciones bancarias.
 */
export async function stopAutoPayment() {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await NotificationListener.stopListening();
    if (listenerHandle) {
      listenerHandle.remove();
      listenerHandle = null;
    }
  } catch (error) {
    console.error('Error deteniendo auto-payment:', error);
  }
}
