import React from 'react';

const Impressum = ({ t }) => {
  const imprint = t.imprint;

  // Helper to render content with line breaks and potential links
  const renderContent = (content) => {
    // Basic link detection - adjust regex if needed for more complex cases
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        // Ensure link opens in new tab
        return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{part}</a>;
      }
      // Render text parts with line breaks
      return part.split('\n').map((line, lineIndex) => (
        <React.Fragment key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < part.split('\n').length - 1 && <br />}
        </React.Fragment>
      ));
    });
  };

   // Helper for simple text with line breaks only
   const renderSimpleContent = (content) => {
     return content.split('\n').map((line, index) => (
       <React.Fragment key={index}>
         {line}
         <br />
       </React.Fragment>
     ));
   };

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mx-auto lg:mx-0">
          <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl font-serif">
            {imprint.title}
          </h1>
        </div>

        <div className="mt-10 space-y-8 text-text/90 leading-relaxed text-base">
          {/* Provider Info */}
          <section>
            <p className="font-semibold">{imprint.provider.name}</p>
            <p>{imprint.provider.person}</p>
            <p>{renderSimpleContent(imprint.provider.address)}</p>
          </section>

          {/* Represented By */}
          <section>
            <h2 className="text-xl font-semibold mb-2">{imprint.representedBy.title}</h2>
            <p>{imprint.representedBy.value}</p>
          </section>

          {/* Register Entry */}
          <section>
            <h2 className="text-xl font-semibold mb-2">{imprint.registerEntry.title}</h2>
            <p>{imprint.registerEntry.court}</p>
            <p>{imprint.registerEntry.number}</p>
          </section>

          {/* VAT ID */}
          <section>
            <h2 className="text-xl font-semibold mb-2">{imprint.vatId.title}</h2>
            <p>{imprint.vatId.value}</p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold mb-2">{imprint.contact.title}</h2>
            <p>{imprint.contact.phone}</p>
            <p>{imprint.contact.email}</p>
          </section>

          {/* Professional Info */}
          <section>
            <h2 className="text-xl font-semibold mb-2">{imprint.professionalInfo.title}</h2>
            <p>{imprint.professionalInfo.jobTitle}</p>
            <p>{imprint.professionalInfo.chamber}</p>
            <p>{renderContent(imprint.professionalInfo.chamberAddressInfo)}</p>
             <h3 className="text-lg font-medium mt-4 mb-1">{imprint.professionalInfo.regulationsTitle}</h3>
             <ul className="list-disc list-inside space-y-1">
               {imprint.professionalInfo.regulations.map((reg, index) => (
                 <li key={index}>{reg}</li>
               ))}
             </ul>
             <p className="mt-2">{renderContent(imprint.professionalInfo.regulationsLinkInfo)}</p>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 font-serif">{imprint.disclaimer.title}</h2>
            <div className="space-y-4">
              <p>{imprint.disclaimer.general}</p>
              <p>{imprint.disclaimer.noResponsibility}</p>
              <p>{imprint.disclaimer.externalLinks}</p>
              <p>{imprint.disclaimer.copyright}</p>
              <p>{imprint.disclaimer.internetRisk}</p>
              <p>{imprint.disclaimer.lawAndJurisdiction}</p>
            </div>
          </section>

          {/* Insurance */}
          <section>
            <h2 className="text-xl font-semibold mb-2">{imprint.insurance.title}</h2>
            <p>{imprint.insurance.name}</p>
            <p>{renderSimpleContent(imprint.insurance.address)}</p>
          </section>

          {/* Content Responsible */}
          <section>
             <h2 className="text-xl font-semibold mb-2">{imprint.contentResponsible.title}</h2>
             <p>{imprint.contentResponsible.name}</p>
             <p>{imprint.contentResponsible.person}</p>
             <p>{renderSimpleContent(imprint.contentResponsible.address)}</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Impressum; 