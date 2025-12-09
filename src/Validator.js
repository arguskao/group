import { TAIWAN_REGIONS, OCCUPATION_TYPES } from './constants.js';

/**
 * Validator class for form input validation
 */
export class Validator {
  /**
   * Validate name field
   * @param {string} name - The name to validate
   * @returns {{isValid: boolean, errors: Array<{field: string, message: string}>}}
   */
  static validateName(name) {
    const errors = [];
    
    if (!name || name.trim() === '') {
      errors.push({ field: 'name', message: '此欄位為必填' });
    } else if (!/^[\u4e00-\u9fa5a-zA-Z\s]+$/.test(name)) {
      errors.push({ field: 'name', message: '姓名只能包含中文、英文字母和空格' });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate phone field
   * @param {string} phone - The phone number to validate
   * @returns {{isValid: boolean, errors: Array<{field: string, message: string}>}}
   */
  static validatePhone(phone) {
    const errors = [];
    
    if (!phone || phone.trim() === '') {
      errors.push({ field: 'phone', message: '此欄位為必填' });
    } else {
      // Remove spaces and hyphens to count digits
      const digitsOnly = phone.replace(/[\s-]/g, '');
      
      if (!/^[\d\s-]+$/.test(phone)) {
        errors.push({ field: 'phone', message: '電話號碼只能包含數字、空格和連字號' });
      } else if (digitsOnly.length < 8 || digitsOnly.length > 15) {
        errors.push({ field: 'phone', message: '請輸入有效的電話號碼（8-15 位數字）' });
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate region field
   * @param {string} region - The region to validate
   * @returns {{isValid: boolean, errors: Array<{field: string, message: string}>}}
   */
  static validateRegion(region) {
    const errors = [];
    
    if (!region || region === '') {
      errors.push({ field: 'region', message: '請選擇一個選項' });
    } else if (!TAIWAN_REGIONS.includes(region)) {
      errors.push({ field: 'region', message: '請選擇有效的地區' });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate occupation field
   * @param {string} occupation - The occupation to validate
   * @returns {{isValid: boolean, errors: Array<{field: string, message: string}>}}
   */
  static validateOccupation(occupation) {
    const errors = [];
    
    if (!occupation || occupation === '') {
      errors.push({ field: 'occupation', message: '請選擇一個選項' });
    } else if (!OCCUPATION_TYPES.includes(occupation)) {
      errors.push({ field: 'occupation', message: '請選擇有效的職業類型' });
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate complete form
   * @param {{name: string, phone: string, region: string, occupation: string}} data - The form data to validate
   * @returns {{isValid: boolean, errors: Array<{field: string, message: string}>}}
   */
  static validateForm(data) {
    const allErrors = [];
    
    const nameResult = this.validateName(data.name);
    const phoneResult = this.validatePhone(data.phone);
    const regionResult = this.validateRegion(data.region);
    const occupationResult = this.validateOccupation(data.occupation);
    
    allErrors.push(...nameResult.errors);
    allErrors.push(...phoneResult.errors);
    allErrors.push(...regionResult.errors);
    allErrors.push(...occupationResult.errors);
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }
}
