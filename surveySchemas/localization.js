const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const buildLocalizedFromLegacy = (enValue, arValue) => {
  if (enValue == null && arValue == null) return null;
  const en = enValue != null ? String(enValue) : arValue != null ? String(arValue) : '';
  const ar = arValue != null ? String(arValue) : en;
  return { en, ar };
};

const buildLocalizedArrayFromLegacy = (enArray = [], arArray = []) => {
  const length = Math.max(enArray.length, arArray.length);
  if (length === 0) return [];
  const result = [];
  for (let i = 0; i < length; i += 1) {
    const localized = buildLocalizedFromLegacy(enArray[i], arArray[i]);
    if (localized) {
      result.push(localized);
    }
  }
  return result;
};

const RESERVED_KEYS = new Set([
  'en', 'ar', 'EN', 'AR', 'en-US', 'ar-IQ', 'en_gb', 'ar_sa', 'text', 'value', 'label', 'default'
]);

const normalizeLocalizedInput = (value, fieldPath, { required = true } = {}) => {
  if (value === undefined || value === null) {
    if (required) {
      throw new Error(`${fieldPath} is required and must include both en and ar translations`);
    }
    return null;
  }

  if (typeof value === 'string') {
    const text = value.trim();
    if (!text && required) {
      throw new Error(`${fieldPath} must not be empty`);
    }
    return { en: text, ar: text };
  }

  if (isPlainObject(value)) {
    let en = value.en ?? value.EN ?? value['en-US'] ?? value.en_gb ?? null;
    let ar = value.ar ?? value.AR ?? value['ar-IQ'] ?? value.ar_sa ?? null;

    if (en == null && ar == null && value.text !== undefined) {
      const normalized = normalizeLocalizedInput(value.text, `${fieldPath}.text`, { required });
      en = normalized.en;
      ar = normalized.ar;
    }

    if (en == null && ar == null && value.value !== undefined) {
      const normalized = normalizeLocalizedInput(value.value, `${fieldPath}.value`, { required });
      en = normalized.en;
      ar = normalized.ar;
    }

    if (en == null && ar == null) {
      if (!required) return null;
      throw new Error(`${fieldPath} must include both en and ar translations`);
    }

    if (en == null) en = ar != null ? String(ar) : '';
    if (ar == null) ar = en != null ? String(en) : '';

    const normalized = {};
    normalized.en = String(en);
    normalized.ar = String(ar);

    for (const [key, raw] of Object.entries(value)) {
      if (RESERVED_KEYS.has(key)) continue;
      if (raw === undefined || raw === null) continue;
      if (typeof raw === 'string') {
        const text = raw.trim();
        if (text) {
          normalized[key] = text;
        }
      }
    }

    return normalized;
  }

  if (!required) return null;
  throw new Error(`${fieldPath} must be a string or an object containing en/ar translations`);
};

const normalizeLocalizedOptionalInput = (value, fieldPath) =>
  normalizeLocalizedInput(value, fieldPath, { required: false });

const normalizeLocalizedArrayInput = (values, fieldPath) => {
  if (values == null) return [];
  const arr = Array.isArray(values) ? values : [values];
  return arr.map((item, index) =>
    normalizeLocalizedInput(item, `${fieldPath}[${index}]`, { required: true })
  );
};

const normalizeLocalizedOutput = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') {
    const text = value.trim();
    return { en: text, ar: text };
  }
  if (isPlainObject(value)) {
    const normalized = {};
    const en = value.en ?? value.EN ?? value['en-US'] ?? value.default ?? null;
    const ar = value.ar ?? value.AR ?? value['ar-IQ'] ?? value.default ?? null;

    if (en != null) normalized.en = String(en);
    if (ar != null) normalized.ar = String(ar);

    if (en == null && ar == null) {
      // Attempt to derive from nested text/value keys
      if (value.text !== undefined) {
        return normalizeLocalizedOutput(value.text);
      }
      if (value.value !== undefined) {
        return normalizeLocalizedOutput(value.value);
      }
      const serialized = JSON.stringify(value);
      normalized.en = serialized;
      normalized.ar = serialized;
    }

    for (const [key, raw] of Object.entries(value)) {
      if (key === 'en' || key === 'ar' || key === 'text' || key === 'value' || key === 'default') continue;
      if (raw === undefined || raw === null) continue;
      if (typeof raw === 'string') {
        const text = raw.trim();
        if (text) {
          normalized[key] = text;
        }
      } else if (typeof raw === 'object') {
        const nested = normalizeLocalizedOutput(raw);
        if (nested && typeof nested === 'object') {
          if (nested[key]) {
            normalized[key] = nested[key];
          } else if (nested.en) {
            normalized[key] = nested.en;
          }
        }
      }
    }

    if (!normalized.en && normalized.ar) normalized.en = normalized.ar;
    if (!normalized.ar && normalized.en) normalized.ar = normalized.en;

    return normalized;
  }
  const text = String(value);
  return { en: text, ar: text };
};

const normalizeLocalizedArrayOutput = (values) => {
  if (!Array.isArray(values)) return [];
  return values.map((item) => normalizeLocalizedOutput(item)).filter(Boolean);
};

const parseArrayCandidate = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      // Fallback to treating as single string value
    }
    return [value];
  }
  return value;
};

const extractLocalizedCandidate = (source, baseKey) => {
  if (!isPlainObject(source)) return undefined;
  if (source[baseKey] !== undefined) return source[baseKey];
  const legacy = buildLocalizedFromLegacy(source[`${baseKey}_en`], source[`${baseKey}_ar`]);
  if (legacy) return legacy;
  return undefined;
};

const normalizeOptionsInput = (options, fieldPath) => {
  const parsed = parseArrayCandidate(options);
  if (parsed === null || parsed === undefined) return null;
  if (!Array.isArray(parsed)) {
    throw new Error(`${fieldPath} must be an array of option definitions`);
  }

  return parsed.map((option, index) => {
    const optionPath = `${fieldPath}[${index}]`;
    if (option === null || option === undefined) {
      throw new Error(`${optionPath} is required`);
    }

    if (typeof option === 'string') {
      const text = normalizeLocalizedInput(option, `${optionPath}.text`);
      return { value: option, text };
    }

    if (isPlainObject(option)) {
      const textCandidate = extractLocalizedCandidate(option, 'text') ?? option.label ?? option.value;
      const text = normalizeLocalizedInput(textCandidate, `${optionPath}.text`);
      const value = option.value != null ? String(option.value) : pickLocalizedText(text) || String(index + 1);

      const normalized = { value, text };

      if (option.group !== undefined && option.group !== null && option.group !== '') {
        normalized.group = String(option.group);
      }
      if (option.metadata !== undefined) {
        normalized.metadata = option.metadata;
      }
      return normalized;
    }

    throw new Error(`${optionPath} must be a string or object`);
  });
};

const normalizeOptionsOutput = (options) => {
  if (!Array.isArray(options)) return options;
  return options.map((option, index) => {
    if (option === null || option === undefined) return option;
    if (typeof option === 'string') {
      const text = normalizeLocalizedOutput(option);
      return { value: option, text };
    }

    if (isPlainObject(option)) {
      const textCandidate = extractLocalizedCandidate(option, 'text') ?? option.label ?? option.value;
      const text = normalizeLocalizedOutput(textCandidate);
      const value = option.value != null ? String(option.value) : pickLocalizedText(text) || String(index + 1);

      const normalized = { ...option, value, text };
      if (normalized.group !== undefined && normalized.group !== null) {
        normalized.group = String(normalized.group);
      } else {
        delete normalized.group;
      }
      if (normalized.metadata === undefined) delete normalized.metadata;
      delete normalized.text_en;
      delete normalized.text_ar;
      delete normalized.label;
      return normalized;
    }

    return option;
  });
};

const pickLocalizedText = (localized, preferred = 'en') => {
  if (localized == null) return null;
  if (typeof localized === 'string') {
    const text = localized.trim();
    return text || null;
  }
  if (isPlainObject(localized)) {
    const preferredValue = localized[preferred];
    if (typeof preferredValue === 'string' && preferredValue.trim()) {
      return preferredValue.trim();
    }
    for (const value of Object.values(localized)) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }
  return String(localized);
};

module.exports = {
  buildLocalizedArrayFromLegacy,
  buildLocalizedFromLegacy,
  extractLocalizedCandidate,
  normalizeLocalizedInput,
  normalizeLocalizedOptionalInput,
  normalizeLocalizedArrayInput,
  normalizeLocalizedOutput,
  normalizeLocalizedArrayOutput,
  normalizeOptionsInput,
  normalizeOptionsOutput,
  pickLocalizedText,
};
