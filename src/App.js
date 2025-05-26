"use client"

import { useState, useEffect, useRef } from "react"
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Menu, X, Leaf, Users, Globe, Linkedin, ChevronRight, Check, ChevronDown, BookOpen, ArrowUpRight } from "lucide-react"
import bigFourImage from './images/big4.png'
import leilaHeroImage from './images/leila1.jpeg'
import leilaLogo from './images/leilalogo.png'
import leilaLogoWhite from './images/leilalogo_filled_white.png'
import leilaAbout1 from './images/leila2.jpeg'
import leilaAbout2 from './images/leila3.jpeg'
import { translations } from './translations'
import PrivacyPolicy from "./components/PrivacyPolicy"
import Impressum from "./components/Impressum"
import ScrollToTop from "./components/ScrollToTop"
import Logo from "./components/Logo"

console.log('Image path:', bigFourImage);

const colors = {
  background: "#f9e9ea",
  text: "#393639",
  primary: "#dcafa5",
  secondary: "#ebcfc8",
  accent: "#8f9a7a"
};

// Component for the main page content
const HomePageContent = ({ t, lang, services, currentTestimonials, insightImages }) => {
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center bg-gradient-to-br from-background via-white to-primary/10">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-32">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div className="space-y-10">
              <div className="space-y-8">
                <span className="inline-flex px-4 py-1.5 text-sm font-medium bg-accent/90 text-white rounded-full shadow-sm">
                  {t.hero.tag}
                </span>
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
                  <span className="block text-text font-serif leading-tight">
                    {t.hero.title.line1}
                  </span>
                  <span className="block text-text font-serif leading-tight">
                    {t.hero.title.line2}
                  </span>
                  <span className="block mt-6 text-text/90 text-2xl sm:text-3xl font-sans font-light leading-relaxed">
                    {t.hero.title.line3}
                  </span>
                </h1>
                <p className="text-xl text-text/90 max-w-2xl font-light leading-relaxed">
                  {t.hero.description}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://calendly.com/contact-taxandpurpose/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-medium bg-accent text-white hover:bg-accent/90 hover:-translate-y-0.5 transition-all duration-300 shadow-md hover:shadow-xl"
                >
                  {t.hero.cta.schedule}
                </a>
                <a
                  href="#about"
                  className="inline-flex items-center justify-center rounded-full px-8 py-3 text-base font-medium text-text border-2 border-accent/20 hover:bg-accent/5 transition-all duration-300"
                >
                  {t.hero.cta.learn}
                </a>
              </div>
            </div>

            {/* Right side - temporary placeholder using the coffee workspace image */}
            <div className="relative aspect-w-16 aspect-h-9 rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={leilaHeroImage}
                alt="Dr. Leila Momen smiling at her desk in a modern office with plants and books"
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-accent/20 to-transparent mix-blend-multiply"></div>
              {/* Decorative elements suggesting sustainability */}
              <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-[radial-gradient(#e8bde6_1px,transparent_1px)] [background-size:12px_12px] opacity-[0.15] rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 relative bg-white overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-flex px-4 py-1.5 text-sm font-medium bg-accent text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
              {t.services.tag}
            </span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-text font-serif relative">
              {t.services.title}
              <div className="absolute -inset-1 bg-primary/5 blur-3xl rounded-full opacity-50"></div>
            </h2>
            <p className="mt-4 text-lg text-text/90 max-w-2xl mx-auto font-light">
              {t.services.description}
            </p>
          </div>

          {/* Services grid */}
          <div className="grid gap-8 lg:grid-cols-3">
            {services.map((service, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-3xl p-8 hover:bg-white hover:shadow-xl transition-all duration-500 border border-[#e4bfbf]/30 overflow-hidden"
              >
                {/* Add a decorative element that appears on hover */}
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-accent/5 rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-700"></div>
                
                {/* Card content */}
                <div className="relative">
                  <div className="inline-flex p-4 rounded-2xl bg-accent/10 text-accent group-hover:scale-110 transition-all duration-500">
                    {service.icon}
                  </div>
                </div>
                
                <h3 className="mt-6 text-2xl font-semibold text-text group-hover:text-accent transition-colors duration-300 font-serif">
                  {service.title}
                </h3>
                
                <p className="mt-4 text-text/70">
                  {service.description}
                </p>
                
                <ul className="mt-6 space-y-3">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-accent/10 text-accent mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="ml-3 text-sm text-text/80">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="pt-32 pb-12 relative bg-background overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-text text-sm font-medium mb-3">
              {t.about.tag}
            </span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-text">
              {t.about.title}
            </h2>
            <p className="text-lg text-text/90 max-w-2xl mx-auto">
              {t.about.description}
            </p>
          </div>

          {/* Value Proposition & Mindset Section */}
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Value Proposition Card */}
            <div className="bg-white/40 backdrop-blur-sm p-6 rounded-xl border border-primary/10 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-accent mb-4">{t.about.valueProposition.title}</h3>
              {t.about.valueProposition.intro && (
                <p className="text-sm text-text/80 mb-4 italic">{t.about.valueProposition.intro}</p>
              )}
              <ul className="space-y-3">
                {t.about.valueProposition.points.map((point, i) => (
                  <li key={i} className="flex items-start">
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-accent/10 text-accent mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="ml-3 text-sm text-text/80">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mindset Change Card */}
            <div className="bg-white/40 backdrop-blur-sm p-6 rounded-xl border border-primary/10 shadow-sm hover:shadow-md transition-shadow duration-300">
              <h3 className="text-xl font-semibold text-accent mb-4">{t.about.mindsetChange.title}</h3>
               <p className="text-sm text-text/70 italic mb-3">{t.about.mindsetChange.intro}</p>
              <ul className="space-y-3">
                {t.about.mindsetChange.points.map((point, i) => (
                  <li key={i} className="flex items-start">
                     <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-accent/10 text-accent mt-0.5">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="ml-3 text-sm text-text/80">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Grid for the two images of Dr. Momen */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img
                src={leilaAbout1}
                alt="Dr. Leila Momen in a professional setting, sitting at a desk with documents and a laptop"
                className="w-full h-full object-cover aspect-[4/3]"
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
              <img
                src={leilaAbout2}
                alt="Dr. Leila Momen outdoors, standing in front of greenery and smiling"
                className="w-full h-full object-cover aspect-[4/3]"
              />
            </div>
          </div>

          {/* Core Principles Section */}
          <div className="max-w-4xl mx-auto text-left mb-16 bg-white/40 backdrop-blur-sm p-6 rounded-xl border border-primary/10 shadow-sm">
            <h3 className="text-xl font-semibold text-accent mb-6">{t.about.corePrinciples.sectionTitle}</h3>
            <div className="space-y-6">
              {t.about.corePrinciples.items.map((principle, index) => (
                <div key={index}>
                  <h4 className="text-lg font-medium text-text mb-1">{principle.title}:</h4>
                  <p className="text-text/80">{principle.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats section */}
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 mt-16">
            {[
              t.about.stats.experience,
              t.about.stats.countries,
              t.about.stats.clients,
              t.about.stats.savings,
            ].map((stat, index) => (
              <div key={index} className="group relative overflow-hidden">
                <div className="relative bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-primary/10 hover:border-accent/20 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 h-full flex flex-col">
                  <div className="text-5xl font-bold text-accent font-serif relative">
                    <span className="relative z-10">{stat.number}</span>
                    <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full"></div>
                    </div>
                  <div className="mt-2 text-text/70 flex-grow">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {t.about.stats.statsDescription && (
            <p className="mt-8 text-center text-text/80 max-w-2xl mx-auto">
              {t.about.stats.statsDescription}
            </p>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="pt-12 pb-24 relative bg-background">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-text font-serif">
              {t.testimonials.title}
            </h2>
            <p className="text-lg text-text/90 max-w-3xl mx-auto">
              {t.testimonials.description}
            </p>
          </div>

          <div className="grid gap-12 md:grid-cols-2 lg:gap-16">
            {currentTestimonials.map((testimonial, index) => (
              <div key={index} className="group relative flex flex-col sm:flex-row items-start gap-6">
                {testimonial.logo && (
                   <div className="flex-shrink-0 w-24 h-24 sm:w-16 sm:h-16 rounded-full bg-white border border-primary/10 flex items-center justify-center overflow-hidden shadow-md p-2">
                    <img src={testimonial.logo} alt={`Logo of ${testimonial.author}'s organization`} className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                 {!testimonial.logo && (
                   <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-all duration-300">
                     <span className="text-text font-serif text-xl">
                       {testimonial.author.split(' ').map(n => n[0]).join('')}
                     </span>
                   </div>
                 )}

                <div className="flex-1 relative bg-white rounded-xl p-6 border border-primary/10 hover:border-accent/20 hover:shadow-lg transition-all duration-300">
                   <div className="absolute -top-3 left-6 transform group-hover:scale-110 transition-transform duration-300">
                     <div className="w-8 h-8 bg-accent shadow-lg rounded-full flex items-center justify-center">
                       <span className="text-white text-2xl font-serif -mt-1">"</span>
                     </div>
                   </div>
                  <blockquote className="relative pt-4">
                    <p className="text-base text-text/80 italic leading-relaxed mb-4">
                      {testimonial.quote}
                    </p>
                    <footer className="mt-4 text-right">
                      <cite className="not-italic font-medium text-text block">{testimonial.author}</cite>
                      <span className="text-sm text-text/60">{testimonial.position}</span>
                    </footer>
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-24 relative bg-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(232,189,230,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(232,189,230,0.15)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50"></div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-text text-sm font-medium mb-3">
              {t.faq.tag}
            </span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-text font-serif">
              {t.faq.title}
            </h2>
            <p className="text-lg text-text/90 max-w-2xl mx-auto">
              {t.faq.description}
            </p>
          </div>

          <div className="space-y-6">
            {t.faq.items.map((item, index) => (
              <details key={index} className="group bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-primary/20 shadow-sm transition-all duration-300 hover:border-accent/30 open:ring-1 open:ring-accent/20 open:shadow-md">
                <summary className="flex justify-between items-center cursor-pointer list-none font-medium text-text hover:text-accent">
                  {item.question}
                  <ChevronDown className="w-5 h-5 text-accent/70 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <div
                   className="mt-4 text-text/80 space-y-4 faq-answer"
                   dangerouslySetInnerHTML={{ __html: item.answer }}
                 />
              </details>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => setIsTermsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-base font-medium text-accent border-2 border-accent/30 hover:bg-accent/5 transition-all duration-300 group"
            >
              <BookOpen className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              {t.faq.showTermsButton}
              <ArrowUpRight className="w-4 h-4 opacity-70 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </button>
          </div>
        </div>
      </section>

      {/* Terms Explanation Modal */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
             <div className="flex justify-between items-center p-6 border-b border-primary/20">
               <h3 className="text-xl font-semibold text-text font-serif">{t.faq.showTermsButton}</h3>
               <button
                 onClick={() => setIsTermsModalOpen(false)}
                 className="p-2 rounded-full hover:bg-primary/10 text-text"
                 aria-label="Close modal"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
             <div className="p-6 space-y-6 overflow-y-auto">
               {t.faq.purposeEconomyTerms.map((item, index) => (
                 <details key={index} className="group bg-background/50 p-4 rounded-lg border border-primary/10">
                   <summary className="flex justify-between items-center cursor-pointer list-none font-medium text-text hover:text-accent">
                     {item.question}
                     <ChevronDown className="w-5 h-5 text-accent/70 transition-transform duration-300 group-open:rotate-180" />
                   </summary>
                   <div
                      className="mt-3 text-text/80 faq-answer prose prose-sm max-w-none prose-a:text-accent hover:prose-a:underline prose-ul:list-disc prose-ul:pl-5 prose-li:my-1"
                      dangerouslySetInnerHTML={{ __html: item.answer }}
                    />
                 </details>
               ))}
             </div>
             <div className="p-4 border-t border-primary/10 text-right">
               <button
                 onClick={() => setIsTermsModalOpen(false)}
                 className="px-4 py-2 rounded-md bg-accent text-white hover:bg-accent/90 transition-colors"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}

      {/* Contact Section */}
      <section id="contact" className="py-24 relative bg-white">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-on-scroll">
            <span className="inline-block px-4 py-1 rounded-full bg-primary/20 text-text text-sm font-medium mb-3">
              {t.nav.contact}
            </span>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-text font-serif">
              {t.contact.title}
            </h2>
            <p className="text-lg text-text/90 max-w-2xl mx-auto">
              {t.contact.description}
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-8 md:grid-cols-5">
              <div className="md:col-span-2 bg-white/50 backdrop-blur-sm rounded-xl p-8 border border-primary/10 shadow-lg">
                <h3 className="text-xl font-medium mb-6 text-text">{t.contact.info.title}</h3>
                <ul className="space-y-6">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-accent/10 text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-text">{t.contact.info.email}</p>
                      <a href="mailto:contact@taxandpurpose.com" className="text-text/70 hover:text-accent transition-colors">
                        contact@taxandpurpose.com
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-accent/10 text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-text">{t.contact.info.phone}</p>
                      <a href="tel:+4915144508604" className="text-text/70 hover:text-accent transition-colors">
                        +49 1514 4508604 
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-accent/10 text-accent">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-text">{t.contact.info.address}</p>
                      <p className="text-text/70">
                        Jülicher Straße 72a<br />
                        52070 Aachen<br />
                        Germany
                      </p>
                    </div>
                  </li>
                </ul>
                
                <div className="mt-8 pt-8 border-t border-primary/10">
                  <h4 className="text-lg font-medium mb-4 text-text">{t.contact.schedule.title}</h4>
                  <a
                    href="https://calendly.com/contact-taxandpurpose/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md bg-accent w-full px-6 py-3 text-base font-medium text-white hover:bg-accent/90 transition-all duration-300 shadow-md hover:shadow-xl"
                  >
                    {t.nav.schedule}
                  </a>
                </div>
              </div>
              
              <div className="md:col-span-3 rounded-xl overflow-hidden h-[400px] shadow-lg">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2522.3846910328835!2d6.0772!3d50.7753!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c0995d4a4a1b1d%3A0x9b1fd1e6d3f3b5b0!2sJ%C3%BClicher%20Str.%2072a%2C%2052070%20Aachen%2C%20Germany!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy"
                  title="Office Location"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative bg-[#e4bfbf]/30">
        <div className="absolute inset-0 bg-[radial-gradient(#657c62_1px,transparent_1px)] [background-size:20px_20px] opacity-10"></div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text sm:text-4xl mb-4">{t.cta.title}</h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-text/90 mb-8">
            {t.cta.description}
          </p>
          <a
            href="https://calendly.com/contact-taxandpurpose/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-md bg-accent px-8 py-4 text-base font-medium text-white hover:bg-accent/90 transition-all duration-300 shadow-md hover:shadow-xl transform hover:-translate-y-1"
          >
            {t.cta.button}
          </a>
        </div>
      </section>
    </>
  );
};

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [lang, setLang] = useState('de')
  const t = translations[lang]

  const useIntersectionObserver = (options = {}) => {
    const [elements, setElements] = useState([]);
    const [entries, setEntries] = useState([]);

    const observer = useRef(null);

    useEffect(() => {
      if (elements.length) {
        observer.current = new IntersectionObserver((observedEntries) => {
          setEntries(observedEntries);
        }, options);

        elements.forEach((element) => observer.current.observe(element));
      }

      return () => {
        if (observer.current) {
          observer.current.disconnect();
        }
      };
    }, [elements, options]);

    return [setElements, entries];
  };

  const [setElements, entries] = useIntersectionObserver({ threshold: 0.1 });

  useEffect(() => {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    setElements(Array.from(animatedElements));
  }, [setElements, lang]);

  useEffect(() => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in');
      }
    });
  }, [entries]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navigation = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/#services" },
    { name: "About", href: "/#about" },
    { name: "References", href: "/#testimonials" },
    { name: "Contact", href: "/#contact" },
  ]

  const services = [
    {
      icon: <Users className="h-6 w-6" />,
      title: t.services.cards.social.title,
      description: t.services.cards.social.description,
      features: t.services.cards.social.features,
    },
    {
      icon: <Leaf className="h-6 w-6" />,
      title: t.services.cards.sustainability.title,
      description: t.services.cards.sustainability.description,
      features: t.services.cards.sustainability.features,
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: t.services.cards.international.title,
      description: t.services.cards.international.description,
      features: t.services.cards.international.features,
    },
  ]

  const insightImages = {
    sustainable: "https://images.unsplash.com/photo-1618044733300-9472054094ee",
    crossBorder: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e",
    social: "https://images.unsplash.com/photo-1434626881859-194d67b2b86f"
  }

  const newTestimonials = [
    {
      quote_de: "Dank des engagierten Einsatzes von Leila Momen im digitalHUB konnten zahlreiche spannende und nachhaltige Projekte umgesetzt werden. Startups profitierten dabei von wertvollem Support in steuerlichen Spezialfragen und bekamen hilfreiche Orientierung bei wichtigen steuerlichen Themen.",
      quote_en: "Thanks to Leila Momen's dedicated commitment at digitalHUB, numerous exciting and sustainable projects were implemented. Startups benefited from valuable support on special tax issues and received helpful guidance on important tax matters.",
      author: "Iris Wilhelmi",
      position_de: "Geschäftsführerin vom digitalHUB Aachen e.V.",
      position_en: "Managing Director of digitalHUB Aachen e.V.",
      logo: null
    },
    {
      quote_de: "tax&purpose wird uns bei steuerlichen Fördermöglichkeiten für Solartechnologie beraten. Wir freuen uns auf die kompetente Unterstützung von tax&purpose.",
      quote_en: "tax&purpose will advise us on tax incentives for solar technology. We look forward to the competent support from tax&purpose.",
      author: "Tanju Doganay",
      position_de: "Geschäftsführer von QUALITEC Solutions GmbH & Co. KG",
      position_en: "Managing Director of QUALITEC Solutions GmbH & Co. KG",
      logo: null
    },
    {
      quote_de: "Leila hat Zakat Deutschland e.V. als Mitgründerin aufgebaut und steuerlich auf stabile Beine gestellt. Ihre Leidenschaft, Projekte durch ihre umfassende steuerliche Expertise zum Fliegen zu bringen ist, ist beispielhaft. Tax&purpose wird unsere gemeinnützige Organisation mit großem Engagement weiterhin steuerlich begleiten.",
      quote_en: "As a co-founder, Leila built Zakat Deutschland e.V. and put it on a stable tax footing. Her passion for getting projects off the ground with her comprehensive tax expertise is exemplary. Tax&purpose will continue to provide tax support to our non-profit organization with great commitment.",
      author: "Khurrem Akhtar",
      position_de: "Vorstandsvorsitzender von Zakat Deutschland e.V.",
      position_en: "Chairman of the Board of Zakat Deutschland e.V.",
      logo: null
    },
    {
      quote_de: "Leila hat mit großer Leidenschaft und Engagement für und mit INAIA ein Produkt für die islamkonforme Investition und Finanzierung von Immobilien entwickelt und steuerlich optimiert. Wir freuen uns mit tax&purpose islamkonforme und damit ethische und nachhaltige Finanzprodukte steuerlich beraten zu lassen.",
      quote_en: "With great passion and commitment, Leila developed and tax-optimized a product for Islamic-compliant investment and financing of real estate for and with INAIA. We look forward to having tax&purpose advise us on tax matters for Islamic-compliant and thus ethical and sustainable financial products.",
      author: "Emre Akye",
      position_de: "Geschäftsführer der INAIA GmbH",
      position_en: "Managing Director of INAIA GmbH",
      logo: null
    }
  ];

  const currentTestimonials = newTestimonials.map(testimonial => ({
    ...testimonial,
    quote: lang === 'de' ? testimonial.quote_de : testimonial.quote_en,
    position: lang === 'de' ? testimonial.position_de : testimonial.position_en,
  }));

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen font-sans text-text bg-background">
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background shadow-md backdrop-blur-sm" : "bg-transparent"
          }`}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-24 items-center justify-between">
              <Link to="/" className="flex items-center">
                <Logo />
              </Link>

              <div className="hidden lg:flex lg:items-center lg:gap-8">
                <nav className="flex gap-16">
                  {navigation.map((item) => (
                    item.href.startsWith('/') ? (
                       <Link
                        key={item.href}
                        to={item.href}
                        className="text-sm font-medium text-text hover:text-accent transition-colors duration-300 relative group"
                       >
                        {t.nav[item.name.toLowerCase()]}
                        <span className="absolute -bottom-1 left-0 w-full h-px bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                      </Link>
                    ) : (
                       <a
                        key={item.href}
                        href={item.href}
                        className="text-sm font-medium text-text hover:text-accent transition-colors duration-300 relative group"
                       >
                        {t.nav[item.name.toLowerCase()]}
                        <span className="absolute -bottom-1 left-0 w-full h-px bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
                       </a>
                     )
                  ))}
                </nav>

                <a
                  href="https://calendly.com/contact-taxandpurpose/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium bg-accent/90 text-white hover:bg-accent transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  {t.nav.schedule}
                </a>

                <button
                  onClick={() => setLang(lang === 'en' ? 'de' : 'en')}
                  className="text-sm font-medium text-text hover:text-accent transition-colors duration-300 flex items-center gap-2"
                >
                  {lang === 'de' ? (
                    <>
                      <span className="w-5 h-5 rounded-full overflow-hidden">
                        <img src="https://flagcdn.com/de.svg" alt="German flag" className="w-full h-full object-cover" />
                      </span>
                      DE
                    </>
                  ) : (
                    <>
                      <span className="w-5 h-5 rounded-full overflow-hidden">
                        <img src="https://flagcdn.com/gb.svg" alt="United Kingdom flag" className="w-full h-full object-cover" />
                      </span>
                      EN
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden rounded-full p-2 text-text hover:bg-accent/10"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              {isMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300">
                  <div className="absolute top-24 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#e4bfbf]/10 shadow-lg max-h-[80vh] overflow-y-auto transform transition-transform duration-300">
                    <div className="p-6 space-y-4">
                      {navigation.map((item) => (
                         item.href.startsWith('/') ? (
                            <Link
                              key={item.href}
                              to={item.href}
                              className="block px-4 py-3 text-base font-medium text-text hover:text-accent rounded-lg hover:bg-accent/5 transition-colors duration-300"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {t.nav[item.name.toLowerCase()]}
                            </Link>
                         ) : (
                            <a
                              key={item.href}
                              href={item.href}
                              className="block px-4 py-3 text-base font-medium text-text hover:text-accent rounded-lg hover:bg-accent/5 transition-colors duration-300"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              {t.nav[item.name.toLowerCase()]}
                            </a>
                          )
                      ))}
                      <div className="pt-4 border-t border-[#e4bfbf]/10">
                        <a
                          href="https://calendly.com/contact-taxandpurpose/30min"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full px-4 py-3 text-center rounded-lg bg-accent text-white hover:bg-accent/90 transition-all duration-300"
                        >
                          {t.nav.schedule}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="pt-24">
          <Routes>
            <Route
              path="/"
              element={
                <HomePageContent
                  t={t}
                  lang={lang}
                  services={services}
                  currentTestimonials={currentTestimonials}
                  insightImages={insightImages}
                />
              }
            />
            <Route path="/privacy-policy" element={<PrivacyPolicy t={t} />} />
            <Route path="/imprint" element={<Impressum t={t} />} />
          </Routes>
        </main>

      <footer className="relative bg-[#393639] text-white">
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4">
              <Link to="/" className="inline-block">
                <img src={leilaLogoWhite} alt="tax & purpose logo in white, stylized olive branch and text" className="h-12 w-auto" />
              </Link>
              <div className="flex space-x-4 pt-4">
                <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-primary/20 transition-colors duration-300">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div className="lg:col-span-2 grid gap-8 sm:grid-cols-2">
              <div className="space-y-4">
                <h4 className="text-base font-medium">{t.footer.quickLinks}</h4>
                <ul className="space-y-2 text-sm text-secondary">
                    {navigation.map((item) => (
                      <li>
                        <Link to={item.href} className="hover:text-primary transition-colors">
                          {t.nav[item.name.toLowerCase()]}
                        </Link>
                  </li>
                    ))}
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="text-base font-medium">{t.footer.contact}</h4>
                <ul className="space-y-2 text-sm text-secondary">
                  <li>Dr. Leila Momen</li>
                  <li>Jülicher Straße 72a</li>
                  <li>52070 Aachen</li>
                  <li>
                    <a href="tel:+4915144508604" className="hover:text-primary transition-colors">
                      +49 1514 4508604 
                    </a>
                  </li>
                  <li>
                    <a href="mailto:contact@taxandpurpose.com" className="hover:text-primary transition-colors">
                      contact@taxandpurpose.com
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-[#e4bfbf]/10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-[#f3e7e7]/60">
            <div className="flex-1 text-center md:text-left mb-4 md:mb-0">
              © {new Date().getFullYear()} tax & purpose. {t.footer.rights}
              {lang === 'de' && t.footer.duExplanation && (
                <p className="text-xs mt-2 text-secondary/60 italic max-w-lg mx-auto md:mx-0">{t.footer.duExplanation}</p>
              )}
            </div>
            <div className="mt-4 md:mt-0 text-center md:text-right">
              <Link to="/privacy-policy" className="hover:text-primary transition-colors">
                {t.footer.privacyLink || "Privacy Policy"}
              </Link>
              <Link to="/imprint" className="hover:text-primary transition-colors ml-4">
                {t.footer.imprintLink || "Imprint"}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </Router>
  )
}

export default App

