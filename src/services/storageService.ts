/**
 * Client Storage Cache Service for offline/session state and preferences.
 */
export class StorageService {
  private static readonly RECENT_DRAWINGS_KEY = 'area_annotator_recent';
  private static readonly SETTINGS_KEY = 'area_annotator_settings';

  static saveRecentDrawingId(id: string) {
    try {
      const recent = this.getRecentDrawingIds();
      const filtered = recent.filter(item => item !== id);
      filtered.unshift(id);
      localStorage.setItem(this.RECENT_DRAWINGS_KEY, JSON.stringify(filtered.slice(0, 10)));
    } catch (err) {
      console.warn('Storage save failed:', err);
    }
  }

  static getRecentDrawingIds(): string[] {
    try {
      const data = localStorage.getItem(this.RECENT_DRAWINGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static getSettings(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : { defaultUnit: 'm²', autoDetectScale: true };
    } catch {
      return { defaultUnit: 'm²', autoDetectScale: true };
    }
  }

  static saveSettings(settings: Record<string, any>) {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn('Settings save failed:', err);
    }
  }
}
