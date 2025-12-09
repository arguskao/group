import { SurveyForm } from './SurveyForm.js';
import { StatisticsPanel } from './StatisticsPanel.js';
import { CSVManager } from './CSVManager.js';
import { AuthManager } from './AuthManager.js';

/**
 * Main application class
 */
class SurveyApp {
  constructor() {
    this.csvManager = new CSVManager();
    this.authManager = new AuthManager();
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    // Initialize form
    const surveySection = document.getElementById('survey-section');
    this.surveyForm = new SurveyForm(surveySection, (data) => this.handleFormSubmit(data));

    // Initialize statistics panel
    const statsSection = document.getElementById('statistics-section');
    this.statsPanel = new StatisticsPanel(statsSection);

    // Load existing data and update statistics
    const responses = this.csvManager.readAll();
    this.statsPanel.update(responses);

    // Initialize download button
    this.initDownloadButton();
  }

  /**
   * Handle form submission
   * @param {{name: string, phone: string, region: string, occupation: string, timestamp: string}} data
   */
  handleFormSubmit(data) {
    // Save to CSV
    this.csvManager.append(data);

    // Update statistics
    const responses = this.csvManager.readAll();
    this.statsPanel.update(responses);
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
  handlePasswordSubmit() {
    const passwordInput = document.getElementById('admin-password');
    const errorElement = document.getElementById('password-error');
    const password = passwordInput.value;

    if (!password) {
      errorElement.textContent = '請輸入管理員密碼';
      return;
    }

    if (this.authManager.authenticate(password)) {
      // Password correct - download file
      this.csvManager.download();
      this.hidePasswordDialog();
    } else {
      // Password incorrect
      errorElement.textContent = '密碼錯誤，請重試';
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new SurveyApp();
});
