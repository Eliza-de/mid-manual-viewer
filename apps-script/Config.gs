/**
 * Config.gs — Read configuration from the Config sheet
 *
 * Cache config values to reduce sheet reads.
 */

const CONFIG_SHEET = 'Config';
const CONFIG_CACHE_SECONDS = 300; // 5 min

/**
 * Get a config value by key.
 * @param {string} key
 * @returns {string|null}
 */
function getConfig(key) {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('cfg:' + key);
  if (cached !== null) return cached;

  const sheet = getSheet(CONFIG_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      const value = String(data[i][1]);
      cache.put('cfg:' + key, value, CONFIG_CACHE_SECONDS);
      return value;
    }
  }
  return null;
}

/**
 * Set a config value (admin use).
 */
function setConfig(key, value) {
  const sheet = getSheet(CONFIG_SHEET);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      CacheService.getScriptCache().remove('cfg:' + key);
      return;
    }
  }
  // Key not found, append
  sheet.appendRow([key, value, '']);
  CacheService.getScriptCache().remove('cfg:' + key);
}

/**
 * Read all config as a flat object.
 */
function getAllConfig() {
  const sheet = getSheet(CONFIG_SHEET);
  const data = sheet.getDataRange().getValues();
  const cfg = {};
  for (let i = 1; i < data.length; i++) {
    cfg[data[i][0]] = data[i][1];
  }
  return cfg;
}
