/**
 * OFFLINE QUEUE UTILITY FOR FIELD OPERATOR TABLETS
 * Automatically caches unsent maintenance records in localStorage when factory Wi-Fi drops,
 * and synchronizes them with the backend when connection is restored.
 */

const STORAGE_KEY = 'taiho_offline_maintenance_queue';

export function getQueuedRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Gagal membaca antrean offline:', e);
    return [];
  }
}

export function queueRecord(record) {
  try {
    const queue = getQueuedRecords();
    const item = {
      ...record,
      queued_at: new Date().toISOString(),
      client_uuid: record.client_uuid || `uuid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sync_status: 'PENDING'
    };
    queue.push(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return item;
  } catch (e) {
    console.error('Gagal menyimpan ke antrean offline:', e);
    return null;
  }
}

export function removeQueuedRecord(client_uuid) {
  try {
    const queue = getQueuedRecords().filter(r => r.client_uuid !== client_uuid);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.error('Gagal menghapus antrean offline:', e);
  }
}

export async function syncQueuedRecords(onProgress) {
  const queue = getQueuedRecords();
  if (queue.length === 0) return { total: 0, synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      const res = await fetch('/api/maintenance/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          is_offline_submission: 1
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        removeQueuedRecord(item.client_uuid);
        synced++;
        if (onProgress) onProgress({ item, status: 'SUCCESS' });
      } else {
        failed++;
        if (onProgress) onProgress({ item, status: 'ERROR', message: data.message });
      }
    } catch (err) {
      failed++;
      if (onProgress) onProgress({ item, status: 'NETWORK_ERROR', message: err.message });
    }
  }

  return { total: queue.length, synced, failed };
}
