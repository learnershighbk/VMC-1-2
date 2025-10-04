"use client";

import { Checkbox } from '@/components/ui/checkbox';
import { TERMS_LABELS, TERMS_TYPES } from '@/constants/terms';

type TermsConsentValue = {
  service: boolean;
  privacy: boolean;
};

type TermsConsentProps = {
  value: TermsConsentValue;
  onChange: (value: TermsConsentValue) => void;
  disabled?: boolean;
};

export const TermsConsent = ({ value, onChange, disabled }: TermsConsentProps) => {
  const handleChange = (key: keyof TermsConsentValue, checked: boolean) => {
    onChange({ ...value, [key]: checked });
  };

  const handleAllChange = (checked: boolean) => {
    onChange({ service: checked, privacy: checked });
  };

  const allChecked = value.service && value.privacy;

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-2">
        <Checkbox
          id="terms-all"
          checked={allChecked}
          onCheckedChange={handleAllChange}
          disabled={disabled}
        />
        <label
          htmlFor="terms-all"
          className="text-sm font-semibold text-slate-900 cursor-pointer"
        >
          전체 동의
        </label>
      </div>
      
      <div className="ml-6 flex flex-col gap-2 border-t border-slate-100 pt-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="terms-service"
            checked={value.service}
            onCheckedChange={(checked) => handleChange('service', checked as boolean)}
            disabled={disabled}
          />
          <label
            htmlFor="terms-service"
            className="text-sm text-slate-700 cursor-pointer"
          >
            {TERMS_LABELS[TERMS_TYPES.SERVICE]} (필수)
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          <Checkbox
            id="terms-privacy"
            checked={value.privacy}
            onCheckedChange={(checked) => handleChange('privacy', checked as boolean)}
            disabled={disabled}
          />
          <label
            htmlFor="terms-privacy"
            className="text-sm text-slate-700 cursor-pointer"
          >
            {TERMS_LABELS[TERMS_TYPES.PRIVACY]} (필수)
          </label>
        </div>
      </div>
    </div>
  );
};

