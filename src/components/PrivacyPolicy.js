import React from 'react';

const PrivacyPolicy = ({ t }) => {
  const policy = t.privacyPolicy;

  // Helper to render content with line breaks
  const renderContent = (content) => {
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
            {policy.title}
          </h1>
          <p className="mt-2 text-sm text-text/60">{policy.lastUpdated}</p>
        </div>
        <div className="mt-10 space-y-8 text-text/90 leading-relaxed">
          {policy.sections.map((section, index) => (
            <div key={index}>
              <h2 className="text-2xl font-semibold mb-4 font-serif">{section.title}</h2>
              {section.content && (
                <p className="text-base">{renderContent(section.content)}</p>
              )}
              {section.subsections && section.subsections.map((subsection, subIndex) => (
                <div key={subIndex} className="mt-6 pl-4">
                  <h3 className="text-xl font-semibold mb-2">{subsection.title}</h3>
                  <p className="text-base">{renderContent(subsection.content)}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 