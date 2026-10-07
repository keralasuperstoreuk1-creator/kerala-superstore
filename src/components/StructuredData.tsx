import React from 'react';

export const StructuredData: React.FC = () => {
  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'GroceryStore',
    '@id': 'https://keralasuperstore.com/#store',
    name: 'Kerala Superstore Manchester',
    alternateName: ['Kerala Supermarket UK', 'Kerala Grocery Manchester'],
    url: 'https://keralasuperstore.com',
    logo: 'https://keralasuperstore.com/branding/kerala-superstore-round-logo.png',
    image: [
      'https://keralasuperstore.com/branding/kerala-superstore-round-logo.png',
      'https://keralasuperstore.com/categories/rice.jpg'
    ],
    description:
      'Leading authentic Kerala supermarket in Manchester, UK. Delivering Palakkadan Matta rice, traditional curry powders, coconut oil, banana chips, and frozen foods nationwide with Cash on Delivery.',
    telephone: '+44 7749 132122',
    email: 'info@keralasuperstores.com',
    priceRange: '£',
    currenciesAccepted: 'GBP',
    paymentAccepted: 'Cash, Credit Card, Debit Card, Apple Pay, Google Pay',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Unit 2, 73 Old Market Street',
      addressLocality: 'Manchester',
      postalCode: 'M9 8DX',
      addressRegion: 'Greater Manchester',
      addressCountry: 'GB',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 53.518,
      longitude: -2.202,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '09:00',
        closes: '21:00',
      },
    ],
    areaServed: [
      {
        '@type': 'City',
        name: 'Manchester',
      },
      {
        '@type': 'Country',
        name: 'United Kingdom',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Kerala Groceries & Spices Catalog',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Rice & Grains',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Curry Powders & Spices',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Kerala Banana Chips & Snacks',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Daily Kitchen Specials & Biriyani',
        },
      ],
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://keralasuperstore.com/#website',
    url: 'https://keralasuperstore.com',
    name: 'Kerala Superstore Manchester',
    alternateName: 'Kerala Supermarket UK',
    description: 'Authentic Kerala Groceries & Spices Delivered Across the UK',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://keralasuperstore.com/?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Where is Kerala Superstore located in Manchester?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Kerala Superstore is located at Unit 2, 73 Old Market Street, Manchester, M9 8DX, United Kingdom. Customer parking is available at the rear.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does Kerala Superstore deliver groceries across the UK?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Kerala Superstore provides fast courier delivery nationwide across England, Scotland, Wales, and Northern Ireland. Free UK Delivery is available on orders over £50.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Cash on Delivery (COD) available for grocery orders?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes, Cash on Delivery is supported. You can inspect your parcel upon arrival and pay in cash directly to your delivery driver.',
        },
      },
      {
        '@type': 'Question',
        name: 'What authentic Kerala brands can I buy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Kerala Superstore stocks 100% genuine products directly imported from top Kerala brands including Nirapara, Eastern, Double Horse, Brahmins, Grandmas, Bravo, and KPL Shudhi.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
};
