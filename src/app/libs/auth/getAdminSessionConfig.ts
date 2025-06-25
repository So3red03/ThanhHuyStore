import prisma from '../prismadb';

// Cache để tránh query DB quá nhiều
let cachedConfig: { sessionTimeout: number; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function getAdminSessionConfig(): Promise<{ sessionMaxAge: number }> {
  const now = Date.now();

  // Return cached config if still valid
  if (cachedConfig && now - cachedConfig.timestamp < CACHE_DURATION) {
    return { sessionMaxAge: cachedConfig.sessionTimeout * 60 }; // Convert minutes to seconds
  }

  try {
    const settings = await prisma.adminSettings.findFirst({
      select: { sessionTimeout: true }
    });
    const sessionTimeout = settings?.sessionTimeout || 30; // Default 30 minutes

    // console.log('getAdminSessionConfig - DB value:', settings?.sessionTimeout, 'final:', sessionTimeout);

    // Update cache
    cachedConfig = {
      sessionTimeout,
      timestamp: now
    };

    return { sessionMaxAge: sessionTimeout * 60 }; // Convert minutes to seconds
  } catch (error) {
    console.error('Failed to get admin session config:', error);

    // Return cached value if available, otherwise default
    if (cachedConfig) {
      return { sessionMaxAge: cachedConfig.sessionTimeout * 60 };
    }

    return { sessionMaxAge: 30 * 60 }; // Default 30 minutes in seconds
  }
}

// Function to clear cache when settings are updated
export function clearSessionConfigCache() {
  cachedConfig = null;
}
