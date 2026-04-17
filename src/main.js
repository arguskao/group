import { SurveyForm } from './SurveyForm.js';
import { StatisticsPanel } from './StatisticsPanel.js';
import { CSVManager } from './CSVManager.js';
import { AuthManager } from './AuthManager.js';
import { D1ApiClient } from './D1ApiClient.js';

/**
 * Main application class
 */
class SurveyApp {
  constructor() {
    this.csvManager = new CSVManager();
    this.authManager = new AuthManager();

    // Initialize D1 API Client
    // Use relative path for Pages Functions, or fallback to env variable
    const apiUrl = import.meta.env.VITE_API_URL || '';
    this.apiClient = new D1ApiClient(apiUrl);

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    // Initialize form
    const surveySection = document.getElementById('survey-section');
    this.surveyForm = new SurveyForm(surveySection, (data) => this.handleFormSubmit(data));

    // Initialize statistics panel
    const statsSection = document.getElementById('statistics-section');
    this.statsPanel = new StatisticsPanel(statsSection);

    // Load existing data and update statistics
    await this.loadStatistics();

    // Initialize download button
    this.initDownloadButton();
  }

  /**
   * Load statistics from API
   */
  async loadStatistics() {
    this.showLoading('正在載入統計資料...');

    try {
      const result = await this.apiClient.getAllResponses();

      if (result.success) {
        this.statsPanel.update(result.data);
        this.hideLoading();
      } else {
        // Fallback to localStorage if API fails
        console.warn('API 載入失敗，使用 localStorage 資料:', result.error);
        const localResponses = this.csvManager.readAll();
        this.statsPanel.update(localResponses);
        this.hideLoading();
        this.showError('無法從伺服器載入資料，顯示本地資料');
      }
    } catch (error) {
      console.error('載入統計資料錯誤:', error);
      // Fallback to localStorage
      const localResponses = this.csvManager.readAll();
      this.statsPanel.update(localResponses);
      this.hideLoading();
      this.showError('網路錯誤，顯示本地資料');
    }
  }

  /**
   * Handle form submission
   * @param {{name: string, phone: string, region: string, occupation: string, timestamp: string}} data
   */
  async handleFormSubmit(data) {
    this.showLoading('正在提交...');

    try {
      // Submit to API
      const result = await this.apiClient.createResponse(data);

      if (result.success) {
        // Also save to localStorage as backup
        this.csvManager.append(data);

        // Reload statistics
        await this.loadStatistics();

        this.hideLoading();
        this.showSuccess('提交成功！');
      } else {
        // Save to localStorage only if API fails
        this.csvManager.append(data);
        const responses = this.csvManager.readAll();
        this.statsPanel.update(responses);

        this.hideLoading();
        this.showError(`提交失敗: ${result.error}。資料已保存到本地。`);
      }
    } catch (error) {
      console.error('提交錯誤:', error);
      // Save to localStorage as fallback
      this.csvManager.append(data);
      const responses = this.csvManager.readAll();
      this.statsPanel.update(responses);

      this.hideLoading();
      this.showError('網路錯誤，資料已保存到本地');
    }
  }

  /**
   * Initialize download button and password dialog
   */
  initDownloadButton() {
    const downloadSection = document.getElementById('download-section');
    downloadSection.innerHTML = `
      <h3>下載問卷資料</h3>
      <button id="download-btn">下載 CSV 檔案</button>
    `;

    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.addEventListener('click', () => this.showPasswordDialog());

    // Setup password dialog
    const passwordDialog = document.getElementById('password-dialog');
    const passwordSubmit = document.getElementById('password-submit');
    const passwordCancel = document.getElementById('password-cancel');
    const passwordInput = document.getElementById('admin-password');

    passwordSubmit.addEventListener('click', () => this.handlePasswordSubmit());
    passwordCancel.addEventListener('click', () => this.hidePasswordDialog());

    // Allow Enter key to submit
    passwordInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handlePasswordSubmit();
      }
    });
  }

  /**
   * Show password dialog
   */
  showPasswordDialog() {
    const dialog = document.getElementById('password-dialog');
    const passwordInput = document.getElementById('admin-password');
    const errorElement = document.getElementById('password-error');

    dialog.classList.remove('hidden');
    passwordInput.value = '';
    errorElement.textContent = '';
    passwordInput.focus();
  }

  /**
   * Hide password dialog
   */
  hidePasswordDialog() {
    const dialog = document.getElementById('password-dialog');
    dialog.classList.add('hidden');
  }

  /**
   * Handle password submission
   */
  async handlePasswordSubmit() {
    const passwordInput = document.getElementById('admin-password');
    const errorElement = document.getElementById('password-error');
    const password = passwordInput.value;

    if (!password) {
      errorElement.textContent = '請輸入管理員密碼';
      return;
    }

    // Verify password locally first
    if (!this.authManager.authenticate(password)) {
      errorElement.textContent = '密碼錯誤，請重試';
      return;
    }

    // Download from API
    this.showLoading('正在下載...');

    try {
      const result = await this.apiClient.downloadCSV(password);

      if (result.success) {
        this.hidePasswordDialog();
        this.hideLoading();
        this.showSuccess('下載成功！');
      } else {
        // Fallback to localStorage download
        console.warn('API 下載失敗，使用 localStorage:', result.error);
        this.csvManager.download();
        this.hidePasswordDialog();
        this.hideLoading();
        this.showError('無法從伺服器下載，已下載本地資料');
      }
    } catch (error) {
      console.error('下載錯誤:', error);
      // Fallback to localStorage
      this.csvManager.download();
      this.hidePasswordDialog();
      this.hideLoading();
      this.showError('網路錯誤，已下載本地資料');
    }
  }

  /**
   * Show loading indicator
   * @param {string} message - Loading message
   */
  showLoading(message = '載入中...') {
    let loadingEl = document.getElementById('loading-indicator');

    if (!loadingEl) {
      loadingEl = document.createElement('div');
      loadingEl.id = 'loading-indicator';
      loadingEl.className = 'loading-indicator';
      document.body.appendChild(loadingEl);
    }

    loadingEl.textContent = message;
    loadingEl.style.display = 'block';
  }

  /**
   * Hide loading indicator
   */
  hideLoading() {
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) {
      loadingEl.style.display = 'none';
    }
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    this.showMessage(message, 'error');
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    this.showMessage(message, 'success');
  }

  /**
   * Show message to user
   * @param {string} message - Message text
   * @param {string} type - Message type ('error' or 'success')
   */
  showMessage(message, type = 'info') {
    let messageEl = document.getElementById('app-message');

    if (!messageEl) {
      messageEl = document.createElement('div');
      messageEl.id = 'app-message';
      messageEl.className = 'app-message';
      document.body.appendChild(messageEl);
    }

    messageEl.textContent = message;
    messageEl.className = `app-message ${type}`;
    messageEl.style.display = 'block';

    // Auto hide after 5 seconds
    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SurveyApp();
});
