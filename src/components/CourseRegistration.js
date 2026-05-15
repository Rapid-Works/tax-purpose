import { useState } from 'react';
import { X, Check, Loader2, AlertCircle } from 'lucide-react';
import { registerForFreeCourse, createPaidCourseRegistration, formatPrice } from '../directus/courses';

const CourseRegistration = ({ course, lang, onClose }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const isFree = course.is_free || course.price === 0;

  const texts = {
    de: {
      title: 'Kursanmeldung',
      subtitle: isFree ? 'Kostenlose Anmeldung' : 'Anmeldung mit Bezahlung',
      firstName: 'Vorname',
      lastName: 'Nachname',
      email: 'E-Mail',
      phone: 'Telefon (optional)',
      company: 'Unternehmen (optional)',
      notes: 'Anmerkungen (optional)',
      submit: isFree ? 'Kostenlos anmelden' : 'Weiter zur Bezahlung',
      submitting: 'Wird verarbeitet...',
      required: 'Pflichtfeld',
      successTitle: 'Anmeldung erfolgreich!',
      successMessage: isFree
        ? 'Sie erhalten in Kürze eine Bestätigungs-E-Mail.'
        : 'Sie werden zur Bezahlung weitergeleitet...',
      errorTitle: 'Fehler bei der Anmeldung',
      close: 'Schließen',
      price: 'Preis',
      free: 'Kostenlos'
    },
    en: {
      title: 'Course Registration',
      subtitle: isFree ? 'Free Registration' : 'Registration with Payment',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone (optional)',
      company: 'Company (optional)',
      notes: 'Notes (optional)',
      submit: isFree ? 'Register for Free' : 'Continue to Payment',
      submitting: 'Processing...',
      required: 'Required',
      successTitle: 'Registration Successful!',
      successMessage: isFree
        ? 'You will receive a confirmation email shortly.'
        : 'You will be redirected to payment...',
      errorTitle: 'Registration Error',
      close: 'Close',
      price: 'Price',
      free: 'Free'
    }
  };

  const txt = texts[lang] || texts.de;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isFree) {
        // Free course - register directly
        const result = await registerForFreeCourse(course.id, formData);
        if (result.success) {
          setSuccess(true);
        } else {
          setError(result.error || 'Registration failed');
        }
      } else {
        // Paid course - create pending registration
        // Directus Flow will handle Mollie payment creation
        const result = await createPaidCourseRegistration(course.id, formData);
        if (result.success) {
          setSuccess(true);
          // In production, Directus Flow would redirect to Mollie
          // For now, show success message
          // TODO: Handle Mollie redirect from Directus Flow response
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-primary/20">
          <div>
            <h3 className="text-xl font-semibold text-text font-serif">{txt.title}</h3>
            <p className="text-sm text-text/60 mt-1">{course.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-primary/10 text-text transition-colors"
            aria-label={txt.close}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success State */}
        {success && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-xl font-semibold text-text mb-2">{txt.successTitle}</h4>
            <p className="text-text/70 mb-6">{txt.successMessage}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full bg-accent text-white hover:bg-accent/90 transition-colors"
            >
              {txt.close}
            </button>
          </div>
        )}

        {/* Error State */}
        {error && !success && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-800">{txt.errorTitle}</h4>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {/* Price Info */}
            <div className="p-4 bg-background rounded-xl mb-4">
              <div className="flex justify-between items-center">
                <span className="text-text/70">{txt.price}</span>
                <span className={`font-semibold ${isFree ? 'text-accent' : 'text-text'}`}>
                  {isFree ? txt.free : formatPrice(course.price, course.currency)}
                </span>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  {txt.firstName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-secondary rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">
                  {txt.lastName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-secondary rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                {txt.email} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-secondary rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                {txt.phone}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-secondary rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                {txt.company}
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-secondary rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">
                {txt.notes}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-3 border border-secondary rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 px-6 py-4 rounded-full bg-accent text-white font-medium hover:bg-accent/90 disabled:bg-secondary disabled:text-text/50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {txt.submitting}
                </>
              ) : (
                txt.submit
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CourseRegistration;
