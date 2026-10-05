const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'public', 'products');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const items = [
  { id: 'matta-rice', title: 'NIRAPARA', sub: 'Palakkadan Matta Rice', tag: '5 KG VADI', bg1: '#881337', bg2: '#4c0519', icon: '🌾' },
  { id: 'sambar-powder', title: 'EASTERN', sub: 'Kerala Sambar Masala', tag: '250g PACK', bg1: '#ea580c', bg2: '#9a3412', icon: '🌶️' },
  { id: 'puttu-podi', title: 'DOUBLE HORSE', sub: 'Chemba Puttu Podi', tag: '1 KG ROASTED', bg1: '#b45309', bg2: '#78350f', icon: '🍚' },
  { id: 'banana-chips', title: 'BRAVO', sub: 'Nendran Banana Chips', tag: 'COCONUT OIL', bg1: '#ca8a04', bg2: '#854d0e', icon: '🍌' },
  { id: 'mango-pickle', title: 'GRANDMAS', sub: 'Tender Mango Achar', tag: 'TRADITIONAL 400g', bg1: '#dc2626', bg2: '#7f1d1d', icon: '🥭' },
  { id: 'coconut-oil', title: 'KLF NIRMAL', sub: '100% Pure Coconut Oil', tag: '1 LITRE', bg1: '#0284c7', bg2: '#0369a1', icon: '🥥' },
  { id: 'appam-podi', title: 'BRAHMINS', sub: 'Easy Palappam Podi', tag: '1 KG INSTANT', bg1: '#059669', bg2: '#064e3b', icon: '🥞' },
  { id: 'malabar-parotta', title: 'KITCHEN TREASURES', sub: 'Malabar Parotta (5 pcs)', tag: 'FROZEN FLAKY', bg1: '#d97706', bg2: '#92400e', icon: '🫓' },
  { id: 'uruli', title: 'TRADITIONAL', sub: 'Bronze Kerala Uruli', tag: '10 INCH BRONZE', bg1: '#78350f', bg2: '#451a03', icon: '🍲' },
  { id: 'cardamom', title: 'PERIYAR', sub: 'Wayanad Green Cardamom', tag: 'GRADE 8mm 100g', bg1: '#15803d', bg2: '#14532d', icon: '🌿' },
  { id: 'fish-masala', title: 'EASTERN', sub: 'Kerala Fish Curry Masala', tag: 'KUDAMPULI SPECIAL', bg1: '#b91c1c', bg2: '#7f1d1d', icon: '🐟' },
  { id: 'pavizham-rice', title: 'PAVIZHAM', sub: 'Superior Sortex Matta Rice', tag: '5 KG SORTEX', bg1: '#9f1239', bg2: '#4c0519', icon: '🌾' },
  { id: 'kerala-mixture', title: 'BRAVO', sub: 'Spicy Kerala Mixture', tag: 'CRUNCHY 350g', bg1: '#d97706', bg2: '#78350f', icon: '🥜' },
  { id: 'puli-inji', title: 'GRANDMAS', sub: 'Traditional Puli Inji', tag: 'SADYA SPECIAL', bg1: '#7f1d1d', bg2: '#450a0a', icon: '🫚' },
  { id: 'frozen-kappa', title: 'KITCHEN TREASURES', sub: 'Frozen Cut Tapioca', tag: '1 KG KAPPA', bg1: '#065f46', bg2: '#022c22', icon: '🥔' },
  { id: 'tea-munnar', title: 'KANNAN DEVAN', sub: 'Classic Munnar CTC Tea', tag: 'STRONG 500g', bg1: '#15803d', bg2: '#052e16', icon: '☕' }
];

items.forEach(item => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="100%" height="100%">
    <defs>
      <linearGradient id="bg_${item.id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${item.bg1}" />
        <stop offset="100%" stop-color="${item.bg2}" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#000" flood-opacity="0.25" />
      </filter>
    </defs>
    <rect width="600" height="600" fill="#f8fafc" rx="28" />
    <circle cx="300" cy="280" r="220" fill="#f1f5f9" />
    
    <g filter="url(#shadow)">
      <rect x="130" y="80" width="340" height="420" rx="28" fill="url(#bg_${item.id})" stroke="#ffffff" stroke-width="4" />
      <rect x="150" y="100" width="300" height="70" rx="16" fill="#ffffff" fill-opacity="0.15" />
      <text x="300" y="142" font-family="'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="2">${item.title}</text>
      
      <circle cx="300" cy="260" r="75" fill="#ffffff" fill-opacity="0.95" />
      <text x="300" y="292" font-size="75" text-anchor="middle">${item.icon}</text>
      
      <text x="300" y="385" font-family="'Segoe UI', Roboto, sans-serif" font-size="19" font-weight="bold" fill="#ffffff" text-anchor="middle">${item.sub}</text>
      
      <rect x="200" y="415" width="200" height="38" rx="19" fill="#fef08a" />
      <text x="300" y="440" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="800" fill="#854d0e" text-anchor="middle" letter-spacing="1">${item.tag}</text>
      
      <circle cx="430" cy="115" r="24" fill="#fbbf24" stroke="#ffffff" stroke-width="2" />
      <text x="430" y="120" font-family="'Segoe UI', Roboto, sans-serif" font-size="9" font-weight="900" fill="#78350f" text-anchor="middle">AUTHENTIC</text>
    </g>
    
    <text x="300" y="555" font-family="'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#64748b" text-anchor="middle">Kerala Superstore Manchester • UK Quality Guaranteed</text>
  </svg>`;

  fs.writeFileSync(path.join(dir, `${item.id}.svg`), svg);
  fs.writeFileSync(path.join(dir, `${item.id}.png`), svg);
});

console.log('All 16 product assets generated successfully in public/products/');
