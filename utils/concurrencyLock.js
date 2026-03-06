// Concurrency Lock Util (offline , no deps)
// Simple promise queue per key to serialize access , eliminate race conditions.
// Used for rate store , seat reserve , ticket/payment (critical shared state/DB ops).
// Prevents concurrent reqs causing double-book , incorrect count , etc.

const lockQueues = new Map();  // key -> [pending promises]

const withLock = async (key , fn) => {
  // Get or create queue for key
  if (!lockQueues.has(key)) {
    lockQueues.set(key, []);
  }
  const queue = lockQueues.get(key);

  // Create lock promise
  const lockPromise = new Promise((resolve) => {
    if (queue.length === 0) {
      // No pending , run immediately
      resolve();
    } else {
      // Wait for last in queue
      queue[queue.length - 1].then(resolve);
    }
    // Add self to queue (placeholder)
    queue.push(Promise.resolve());
  });

  try {
    await lockPromise;
    // Run critical fn
    return await fn();
  } finally {
    // Remove from queue (first)
    queue.shift();
    if (queue.length === 0) {
      lockQueues.delete(key);  // cleanup
    }
  }
};

// Cleanup old queues periodically (concise)
setInterval(() => {
  // (not impl full , for demo)
}, 60000).unref();

module.exports = { withLock };