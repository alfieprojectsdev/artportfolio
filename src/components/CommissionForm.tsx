import { useState, useCallback } from 'react';
import { actions } from 'astro:actions';
import { PRICING, type ArtType, type Style } from '../lib/schemas';

interface CommissionFormProps {
  cloudName: string;
  uploadPreset: string;
  isOpen: boolean; // Commission status from site settings
}

export default function CommissionForm({ cloudName, uploadPreset, isOpen }: CommissionFormProps) {
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    discord: '',
    artType: 'bust' as ArtType,
    style: 'flat' as Style,
    description: '',
    refImages: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate estimated price
  const estimatedPrice = PRICING[formData.artType][formData.style];
  const estimatedUsd = Math.round(estimatedPrice / 56);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = useCallback(() => {
    if (formData.refImages.length >= 5) {
      alert('Maximum 5 reference images allowed');
      return;
    }

    // @ts-ignore - Cloudinary widget types
    if (window.cloudinary) {
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName,
          uploadPreset,
          folder: 'commissions/refs',
          sources: ['local', 'url'],
          multiple: false,
          maxFileSize: 5000000, // 5MB
          clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
        },
        (error: Error | null, result: { event: string; info: { secure_url: string } }) => {
          if (error) {
            console.error('Upload error:', error);
            return;
          }
          if (result.event === 'success') {
            setFormData(prev => ({
              ...prev,
              refImages: [...prev.refImages, result.info.secure_url],
            }));
          }
        }
      );
      widget.open();
    }
  }, [cloudName, uploadPreset, formData.refImages.length]);

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      refImages: prev.refImages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setSubmitResult(null);

    try {
      // Convert to FormData since action has accept: 'form'
      const submitData = new FormData();
      submitData.append('clientName', formData.clientName);
      submitData.append('email', formData.email);
      if (formData.discord) {
        submitData.append('discord', formData.discord);
      }
      submitData.append('artType', formData.artType);
      submitData.append('style', formData.style);
      submitData.append('description', formData.description);
      // Send each ref image URL separately for FormData array handling
      formData.refImages.forEach((url) => {
        submitData.append('refImages', url);
      });

      const result = await actions.submitCommission(submitData);

      if (result.error) {
        // Handle validation errors
        if (result.error.fields) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(result.error.fields)) {
            fieldErrors[key] = Array.isArray(messages) ? messages[0] : String(messages);
          }
          setErrors(fieldErrors);
        } else {
          setSubmitResult({ success: false, message: result.error.message || 'Submission failed' });
        }
      } else if (result.data) {
        setSubmitResult({ success: true, message: result.data.message });
        // Reset form on success
        setFormData({
          clientName: '',
          email: '',
          discord: '',
          artType: 'bust',
          style: 'flat',
          description: '',
          refImages: [],
        });
      }
    } catch (error) {
      setSubmitResult({ success: false, message: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="commission-closed">
        <h3>Commissions are currently closed</h3>
        <p>Please check back later or follow me on social media for updates!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="commission-form">
      <h3>Request a Commission</h3>

      {submitResult && (
        <div className={`form-message ${submitResult.success ? 'success' : 'error'}`}>
          {submitResult.message}
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="clientName">Your Name *</label>
          <input
            type="text"
            id="clientName"
            name="clientName"
            value={formData.clientName}
            onChange={handleInputChange}
            required
            placeholder="How should I call you?"
          />
          {errors.clientName && <span className="field-error">{errors.clientName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="your@email.com"
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="discord">Discord (optional)</label>
        <input
          type="text"
          id="discord"
          name="discord"
          value={formData.discord}
          onChange={handleInputChange}
          placeholder="username#0000"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="artType">Commission Type *</label>
          <select
            id="artType"
            name="artType"
            value={formData.artType}
            onChange={handleInputChange}
            required
          >
            <option value="headshot">Headshot</option>
            <option value="bust">Bust</option>
            <option value="half">Half Body</option>
            <option value="full">Full Body</option>
            <option value="chibi">Chibi</option>
            <option value="custom">Custom (Quote Required)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="style">Style *</label>
          <select
            id="style"
            name="style"
            value={formData.style}
            onChange={handleInputChange}
            required
          >
            <option value="sketch">Sketch</option>
            <option value="flat">Flat Color</option>
            <option value="rendered">Fully Rendered</option>
          </select>
        </div>
      </div>

      <div className="price-estimate">
        <span>Estimated Price:</span>
        <strong>
          {formData.artType === 'custom'
            ? 'Quote Required'
            : `₱${estimatedPrice} (~$${estimatedUsd} USD)`}
        </strong>
      </div>

      <div className="form-group">
        <label htmlFor="description">Description *</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          required
          rows={5}
          placeholder="Describe your commission in detail. Include character details, pose, expression, background preferences, etc."
        />
        {errors.description && <span className="field-error">{errors.description}</span>}
        <span className="char-count">{formData.description.length}/2000</span>
      </div>

      <div className="form-group">
        <label>Reference Images (up to 5)</label>
        <div className="ref-images">
          {formData.refImages.map((url, index) => (
            <div key={index} className="ref-image">
              <img src={url.replace('/upload/', '/upload/w_100,h_100,c_fill/')} alt={`Reference ${index + 1}`} />
              <button type="button" onClick={() => removeImage(index)} className="remove-ref">×</button>
            </div>
          ))}
          {formData.refImages.length < 5 && (
            <button type="button" onClick={handleImageUpload} className="add-ref-btn">
              + Add Reference
            </button>
          )}
        </div>
        <p className="field-hint">Upload character references, color palettes, or inspiration images</p>
      </div>

      <button type="submit" disabled={isSubmitting} className="submit-btn">
        {isSubmitting ? 'Submitting...' : 'Submit Request'}
      </button>

      <p className="form-note">
        By submitting, you agree to the Terms of Service above. I'll respond within 1-3 days!
      </p>
    </form>
  );
}
