import { TAIWAN_REGIONS, OCCUPATION_TYPES } from './constants.js';
import { Validator } from './Validator.js';

/**
 * SurveyForm component for handling user input
 */
export class SurveyForm {
  constructor(container, onSubmit) {
    this.container = container;
    this.onSubmit = onSubmit;
    this.render();
    this.attachEventListeners();
  }

  /**
   * Render the form HTML
   */
  render() {
    this.container.innerHTML = `
      <h2>問卷調查</h2>
      <p class="intro-text">歡迎參與本次問卷調查，請填寫以下資訊。</p>
      
      <form id="survey-form">
        <div class="form-group">
          <label for="name">姓名 <span aria-label="必填">*</span></label>
          <input type="text" id="name" name="name" aria-required="true">
          <div id="name-error" class="error-message" role="alert"></div>
        </div>
        
        <div class="form-group">
          <label for="phone">電話 <span aria-label="必填">*</span></label>
          <input type="tel" id="phone" name="phone" aria-required="true">
          <div id="phone-error" class="error-message" role="alert"></div>
        </div>
        
        <div class="form-group">
          <label for="region">地區 <span aria-label="必填">*</span></label>
          <select id="region" name="region" aria-required="true">
            <option value="">請選擇地區</option>
            ${TAIWAN_REGIONS.map(region => `<option value="${region}">${region}</option>`).join('')}
          </select>
          <div id="region-error" class="error-message" role="alert"></div>
        </div>
        
        <div class="form-group">
          <label for="occupation">工作性質 <span aria-label="必填">*</span></label>
          <select id="occupation" name="occupation" aria-required="true">
            <option value="">請選擇工作性質</option>
            ${OCCUPATION_TYPES.map(type => `<option value="${type}">${type}</option>`).join('')}
          </select>
          <div id="occupation-error" class="error-message" role="alert"></div>
        </div>
        
        <button type="submit">提交</button>
        <div id="success-message" class="success-message" style="display: none;"></div>
      </form>
    `;
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const form = this.container.querySelector('#survey-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
  }

  /**
   * Get form data
   * @returns {{name: string, phone: string, region: string, occupation: string, timestamp: string}}
   */
  getData() {
    const form = this.container.querySelector('#survey-form');
    return {
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value.trim(),
      region: form.elements.region.value,
      occupation: form.elements.occupation.value,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Validate form
   * @returns {{isValid: boolean, errors: Array<{field: string, message: string}>}}
   */
  validate() {
    const data = this.getData();
    return Validator.validateForm(data);
  }

  /**
   * Show validation errors
   * @param {Array<{field: string, message: string}>} errors
   */
  showErrors(errors) {
    // Clear all previous errors
    this.clearErrors();

    errors.forEach(error => {
      const errorElement = this.container.querySelector(`#${error.field}-error`);
      const inputElement = this.container.querySelector(`#${error.field}`);

      if (errorElement) {
        errorElement.textContent = error.message;
        errorElement.style.display = 'block';
      }

      if (inputElement) {
        inputElement.classList.add('field-error');
        inputElement.setAttribute('aria-describedby', `${error.field}-error`);
      }
    });
  }

  /**
   * Clear all error messages
   */
  clearErrors() {
    const errorElements = this.container.querySelectorAll('.error-message');
    errorElements.forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });

    const inputElements = this.container.querySelectorAll('input, select');
    inputElements.forEach(el => {
      el.classList.remove('field-error');
      el.removeAttribute('aria-describedby');
    });
  }

  /**
   * Clear form fields
   */
  clear() {
    const form = this.container.querySelector('#survey-form');
    form.reset();
    this.clearErrors();
  }

  /**
   * Show success message
   * @param {string} message
   */
  showSuccess(message) {
    const successElement = this.container.querySelector('#success-message');
    if (successElement) {
      successElement.textContent = message;
      successElement.style.display = 'block';

      setTimeout(() => {
        successElement.style.display = 'none';
      }, 3000);
    }
  }

  /**
   * Handle form submission
   */
  handleSubmit() {
    const validationResult = this.validate();

    if (!validationResult.isValid) {
      this.showErrors(validationResult.errors);
      return;
    }

    const data = this.getData();

    if (this.onSubmit) {
      this.onSubmit(data);
    }

    this.clear();
    this.showSuccess('問卷提交成功！');
  }
}
