// template-quota.js — Shared Quota & Governance Enforcement Engine for AI Templates & Automations
// Enforces 24-Hour Rolling Window, Admin Panel Governance (dailyLimit, enforceDailyLimit), and Atomic User Quotas.

/**
 * Calculates a user's exact template generation quota and remaining allowance.
 * Used by 1-Click Template Generation, Autonomous 24-Hour Autopilot, and Admin Governance.
 */
export async function getUserTemplateQuota(db, user) {
  if (!db) {
    return {
      dailyLimit: 1,
      usedToday: 0,
      remaining: 1,
      isLimitReached: false,
      enforceDailyLimit: true,
      maintenanceMode: false,
      maintenanceNotice: '',
      limitWindow: '24h',
      nextResetTime: null,
      resetCountdownMs: 0
    };
  }

  const sysCol = db.collection('system_config');
  const configDoc = await sysCol.findOne({ _id: 'templates_configuration' }) || {};

  const enforceDailyLimit = configDoc.enforceDailyLimit !== false;
  const globalLimit = Number(configDoc.dailyLimit) > 0 ? Number(configDoc.dailyLimit) : 1;
  const limitWindow = configDoc.limitWindow || '24h';
  const maintenanceMode = !!configDoc.maintenanceMode;
  const maintenanceNotice = configDoc.maintenanceNotice || 'AI Template generation is currently undergoing scheduled maintenance. Please check back shortly.';
  const globalResetAt = configDoc.globalResetAt ? new Date(configDoc.globalResetAt) : null;

  if (!user) {
    return {
      authenticated: false,
      dailyLimit: globalLimit,
      usedToday: 0,
      remaining: globalLimit,
      isLimitReached: false,
      enforceDailyLimit,
      maintenanceMode,
      maintenanceNotice,
      limitWindow,
      nextResetTime: null,
      resetCountdownMs: 0
    };
  }

  const userId = String(user.userId || user.id || user._id || '');
  const userEmail = String(user.email || '').toLowerCase();

  // Check user document for custom limits or individual reset timestamp
  const userDoc = await db.collection('users').findOne({
    $or: [
      { id: userId },
      { _id: userId },
      { userId: userId },
      { email: userEmail }
    ]
  });

  const userDailyLimit = (userDoc && userDoc.templateDailyLimit !== undefined)
    ? Number(userDoc.templateDailyLimit)
    : globalLimit;
  const userResetAt = userDoc?.templateLimitResetAt ? new Date(userDoc.templateLimitResetAt) : null;

  // Calculate window start
  let windowStart;
  if (limitWindow === 'calendar') {
    const now = new Date();
    windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  } else {
    // 24-Hour Rolling Window
    windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
  }

  let effectiveStart = windowStart;
  if (globalResetAt && globalResetAt > effectiveStart) {
    effectiveStart = globalResetAt;
  }
  if (userResetAt && userResetAt > effectiveStart) {
    effectiveStart = userResetAt;
  }

  const query = {
    $or: [
      { userId },
      { userEmail }
    ],
    createdAt: { $gte: effectiveStart },
    resetByAdmin: { $ne: true },
    status: { $nin: ['failed', 'FAILED', 'RENDER_FAILED', 'EXECUTION_TIMEOUT'] },
    refunded: { $ne: true }
  };

  const usedToday = await db.collection('template_generations').countDocuments(query);
  const isUnlimited = userDailyLimit <= 0;
  const isLimitReached = !isUnlimited && enforceDailyLimit && usedToday >= userDailyLimit;
  const remaining = isUnlimited ? 999 : Math.max(0, userDailyLimit - usedToday);

  let nextResetTime = null;
  let resetCountdownMs = 0;

  if (isLimitReached) {
    if (limitWindow === 'calendar') {
      const now = new Date();
      nextResetTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    } else {
      const oldest = await db.collection('template_generations').findOne(query, { sort: { createdAt: 1 } });
      nextResetTime = oldest ? new Date(oldest.createdAt.getTime() + 24 * 60 * 60 * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
    resetCountdownMs = Math.max(0, nextResetTime.getTime() - Date.now());
  }

  return {
    authenticated: true,
    userId,
    userEmail,
    dailyLimit: userDailyLimit,
    usedToday,
    remaining,
    isLimitReached,
    enforceDailyLimit,
    maintenanceMode,
    maintenanceNotice,
    limitWindow,
    nextResetTime: nextResetTime ? nextResetTime.toISOString() : null,
    resetCountdownMs
  };
}
