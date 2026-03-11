const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveRuntimeUrl(rawUrl: string): string {
  const fallback = trimTrailingSlash(rawUrl);

  if (typeof window === 'undefined') {
    return fallback;
  }

  // If relative URL (starts with /), use current origin
  if (fallback.startsWith('/')) {
    return trimTrailingSlash(new URL(fallback, window.location.origin).toString());
  }

  try {
    const parsedUrl = new URL(fallback, window.location.origin);
    const browserHost = window.location.hostname;
    const apiHostIsLocal = LOCAL_HOSTS.has(parsedUrl.hostname);
    const browserIsLocal = LOCAL_HOSTS.has(browserHost);

    // When UI is opened from another machine/device, "localhost" points to that device.
    if (apiHostIsLocal && !browserIsLocal) {
      parsedUrl.hostname = browserHost;
    }

    // Always use port 80 (no explicit port) for production domains
    if (!browserIsLocal && !apiHostIsLocal) {
      parsedUrl.port = '';
    }

    return trimTrailingSlash(parsedUrl.toString());
  } catch {
    return fallback;
  }
}

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  // Use relative URL by default for production (supports multiple domains)
  const base = envUrl || '/v1';
  return resolveRuntimeUrl(base);
}

export function getSocketUrl(): string {
  const apiBase = getApiBaseUrl();

  if (apiBase.endsWith('/v1')) {
    return apiBase.slice(0, -3);
  }

  return apiBase;
}

export function getPublicApiUrl(): string {
  return getSocketUrl();
}
