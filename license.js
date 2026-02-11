/**
 * License management for SnapType Pro
 * Integrates with Lemon Squeezy for payment processing
 *
 * Setup:
 * 1. Create a Lemon Squeezy account (free)
 * 2. Create a product ($4.99/mo subscription)
 * 3. Create a license key activation endpoint (or use LS overlay checkout)
 * 4. Replace STORE_ID and PRODUCT_ID below
 */

const LICENSE_CONFIG = {
  STORE_SLUG: 'snaptype',           // Replace with your Lemon Squeezy store slug
  PRODUCT_ID: '',                     // Replace with your product ID
  CHECKOUT_URL: '',                   // Replace with your checkout overlay URL
  VALIDATION_INTERVAL: 24 * 60 * 60 * 1000  // Validate license every 24 hours
};

class LicenseManager {
  constructor() {
    this.licenseKey = null;
    this.isValid = false;
  }

  async init() {
    const result = await chrome.storage.local.get(['license']);
    if (result.license) {
      this.licenseKey = result.license.key;
      this.isValid = result.license.valid;

      // Re-validate if stale
      const lastCheck = result.license.lastValidated || 0;
      if (Date.now() - lastCheck > LICENSE_CONFIG.VALIDATION_INTERVAL) {
        await this.validate();
      }
    }
    return this.isValid;
  }

  async activate(licenseKey) {
    try {
      const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: licenseKey,
          instance_name: 'SnapType Chrome Extension'
        })
      });

      const data = await response.json();

      if (data.activated || data.valid) {
        this.licenseKey = licenseKey;
        this.isValid = true;
        await this.saveLicense(true);
        await this.updateSettings(true);
        return { success: true };
      }

      return { success: false, error: data.error || 'Invalid license key' };
    } catch (err) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }

  async validate() {
    if (!this.licenseKey) return false;

    try {
      const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: this.licenseKey,
          instance_name: 'SnapType Chrome Extension'
        })
      });

      const data = await response.json();
      this.isValid = data.valid === true;
      await this.saveLicense(this.isValid);
      await this.updateSettings(this.isValid);
      return this.isValid;
    } catch (err) {
      // On network error, keep existing status for grace period
      return this.isValid;
    }
  }

  async deactivate() {
    if (!this.licenseKey) return;

    try {
      await fetch('https://api.lemonsqueezy.com/v1/licenses/deactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          license_key: this.licenseKey,
          instance_name: 'SnapType Chrome Extension'
        })
      });
    } catch (err) {
      // Silent fail on deactivation
    }

    this.licenseKey = null;
    this.isValid = false;
    await this.saveLicense(false);
    await this.updateSettings(false);
  }

  async saveLicense(valid) {
    await chrome.storage.local.set({
      license: {
        key: this.licenseKey,
        valid,
        lastValidated: Date.now()
      }
    });
  }

  async updateSettings(isPro) {
    const result = await chrome.storage.local.get(['settings']);
    const settings = result.settings || {};
    settings.isPro = isPro;
    await chrome.storage.local.set({ settings });
  }

  getCheckoutUrl() {
    if (LICENSE_CONFIG.CHECKOUT_URL) {
      return LICENSE_CONFIG.CHECKOUT_URL;
    }
    return `https://${LICENSE_CONFIG.STORE_SLUG}.lemonsqueezy.com/checkout`;
  }
}

// Export for use in popup and background
if (typeof globalThis !== 'undefined') {
  globalThis.LicenseManager = LicenseManager;
  globalThis.LICENSE_CONFIG = LICENSE_CONFIG;
}
