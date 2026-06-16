import { useCookieConsent } from './CookieBanner';

const MAP_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2522.3846910328835!2d6.0772!3d50.7753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c0995d4a4a1b1d%3A0x9b1fd1e6d3f3b5b0!2sJ%C3%BClicher%20Str.%2072a%2C%2052070%20Aachen%2C%20Germany!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus';

const GoogleMapEmbed = ({ t }) => {
  const { hasConsent, openSettings } = useCookieConsent();

  if (!hasConsent('external')) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl bg-background p-8 text-center">
        <p className="mb-6 max-w-md text-sm leading-relaxed text-text/70">
          {t.cookies.mapBlocked}
        </p>
        <button
          type="button"
          onClick={openSettings}
          className="inline-flex items-center justify-center rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
        >
          {t.cookies.loadMap}
        </button>
      </div>
    );
  }

  return (
    <iframe
      src={MAP_SRC}
      width="100%"
      height="100%"
      style={{ border: 0 }}
      allowFullScreen=""
      loading="lazy"
      title="Office Location"
    />
  );
};

export default GoogleMapEmbed;
