const lockQueues = {};

const withLock = async (key, fn) => {
  if (!lockQueues[key]) lockQueues[key] = Promise.resolve();
  const result = lockQueues[key].then(() => fn());
  lockQueues[key] = result.catch(() => {});
  return result;
};

// Cleanup stale lock keys every 5 minutes
setInterval(() => {
  for (const key of Object.keys(lockQueues)) {
    delete lockQueues[key];
  }
}, 5 * 60 * 1000);

module.exports = { withLock };
