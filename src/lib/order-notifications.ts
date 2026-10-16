const trackingKey = "streeto:orders-awaiting-confirmation";
export const customerOrderTrackedEvent = "streeto:customer-order-tracked";

export type TrackedCustomerOrder = {
  id: string;
  trackedAt: number;
  lastStatus?: string;
};

let audioContext: AudioContext | null = null;
let newOrderSoundBuffer: AudioBuffer | null = null;
let newOrderSoundLoading: Promise<AudioBuffer | null> | null = null;
let readyOrderSoundBuffer: AudioBuffer | null = null;
let readyOrderSoundLoading: Promise<AudioBuffer | null> | null = null;

async function loadNewOrderSound() {
  if (newOrderSoundBuffer) return newOrderSoundBuffer;
  if (!audioContext) return null;
  newOrderSoundLoading ??= fetch("/sounds/order-alert.mp3")
    .then((response) => {
      if (!response.ok) throw new Error("Could not load the order alert sound.");
      return response.arrayBuffer();
    })
    .then((bytes) => audioContext!.decodeAudioData(bytes))
    .then((buffer) => {
      newOrderSoundBuffer = buffer;
      return buffer;
    })
    .catch(() => null)
    .finally(() => { newOrderSoundLoading = null; });
  return newOrderSoundLoading;
}

async function loadReadyOrderSound() {
  if (readyOrderSoundBuffer) return readyOrderSoundBuffer;
  if (!audioContext) return null;
  readyOrderSoundLoading ??= fetch("/sounds/order-ready.mp3")
    .then((response) => {
      if (!response.ok) throw new Error("Could not load the ready order sound.");
      return response.arrayBuffer();
    })
    .then((bytes) => audioContext!.decodeAudioData(bytes))
    .then((buffer) => {
      readyOrderSoundBuffer = buffer;
      return buffer;
    })
    .catch(() => null)
    .finally(() => { readyOrderSoundLoading = null; });
  return readyOrderSoundLoading;
}

export async function enableOrderSounds() {
  if (typeof window === "undefined") {
    return false;
  }

  const AudioContextConstructor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextConstructor) {
    return false;
  }

  try {
    audioContext ??= new AudioContextConstructor();

    if (audioContext.state !== "running") {
      await audioContext.resume();
    }

    await loadNewOrderSound();
    await loadReadyOrderSound();
    return audioContext.state === "running";
  } catch {
    return false;
  }
}

function playNotes(notes: number[], spacing: number, duration: number, volume = 0.16) {
  if (!audioContext || audioContext.state !== "running") {
    return;
  }

  const startAt = audioContext.currentTime;

  notes.forEach((frequency, index) => {
    const oscillator = audioContext!.createOscillator();
    const gain = audioContext!.createGain();
    const noteStart = startAt + index * spacing;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, noteStart);
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(volume, noteStart + 0.02);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      noteStart + duration
    );

    oscillator.connect(gain);
    gain.connect(audioContext!.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + duration);
  });
}

export function playNewOrderSound() {
  if (!audioContext || audioContext.state !== "running" || !newOrderSoundBuffer) return;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = newOrderSoundBuffer;
  gain.gain.value = 0.85;
  source.connect(gain);
  gain.connect(audioContext.destination);
  source.start();
}

export function playOrderStatusSound() {
  if (!audioContext || audioContext.state !== "running") {
    return false;
  }

  playNotes([784, 1047], 0.12, 0.2);
  return true;
}

export function playReadyOrderSound() {
  if (!audioContext || audioContext.state !== "running" || !readyOrderSoundBuffer) return;
  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  source.buffer = readyOrderSoundBuffer;
  gain.gain.value = 0.85;
  source.connect(gain);
  gain.connect(audioContext.destination);
  source.start();
}

export function readTrackedCustomerOrders(): TrackedCustomerOrder[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(trackingKey);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    const maxAge = 7 * 24 * 60 * 60 * 1000;

    if (!Array.isArray(parsed)) {
      return [];
    }

    const tracked = parsed.filter(
      (item): item is TrackedCustomerOrder =>
        typeof item?.id === "string" &&
        typeof item?.trackedAt === "number" &&
        (item?.lastStatus === undefined ||
          typeof item.lastStatus === "string") &&
        Date.now() - item.trackedAt < maxAge
    );

    if (tracked.length !== parsed.length) {
      saveTrackedCustomerOrders(tracked);
    }

    return tracked;
  } catch {
    return [];
  }
}

export function saveTrackedCustomerOrders(
  orders: TrackedCustomerOrder[]
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(trackingKey, JSON.stringify(orders));
  } catch {
    // Sound tracking is best-effort if browser storage is unavailable.
  }

  window.dispatchEvent(new Event(customerOrderTrackedEvent));
}

export function trackCustomerOrderForConfirmation(
  orderId: string,
  initialStatus = "PLACED"
) {
  if (!orderId || typeof window === "undefined") {
    return;
  }

  const tracked = readTrackedCustomerOrders();

  if (tracked.some((order) => order.id === orderId)) {
    return;
  }

  saveTrackedCustomerOrders([
    ...tracked,
    {
      id: orderId,
      trackedAt: Date.now(),
      lastStatus: initialStatus,
    },
  ]);
}
