import Pusher from 'pusher-js';

let pusherInstance: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (pusherInstance) {
    return pusherInstance;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

  if (!key || key === 'your_pusher_key' || key === 'sample_pusher_key') {
    return null;
  }

  try {
    pusherInstance = new Pusher(key, {
      cluster,
      forceTLS: true,
    });
    return pusherInstance;
  } catch (err) {
    console.warn('Failed to initialize Pusher client:', err);
    return null;
  }
}
