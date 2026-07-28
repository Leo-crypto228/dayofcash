import { useState } from 'react'
import Modal from '../components/Modal.jsx'

// "Voyage Luxe" cashback showcase. A card opens a detail sheet; the sheet's
// bottom button links out to the real platform. Images hosted in public/luxe.
const HERO = {
  name: 'Maldives Private Island', sub: 'Exclusive Retreat', cb: '15% Cashback',
  url: 'https://www.booking.com/searchresults.html?ss=Maldives', img: '/luxe/hero.jpg', cta: 'Réserver sur Booking',
  desc: "Une île privée aux eaux turquoise, villas sur pilotis et service d'exception.",
  perks: ['15% de cashback sur ta réservation', 'Villa sur l’eau privée', 'Spa & expériences exclusives', 'Transferts en hydravion inclus'],
}

const PARTNERS = [
  { name: 'Booking.com', sub: 'Premium Stays & Villas', cb: 'Up to 8%', url: 'https://www.booking.com', fit: 'cover', logo: '/luxe/booking.jpg', cta: 'Continuer vers Booking.com',
    desc: 'Des millions d’hébergements premium, villas et hôtels de luxe.',
    perks: ['Jusqu’à 8% de cashback', 'Annulation gratuite sur la plupart des séjours', 'Programme Genius : réductions en plus', 'Cashback crédité après le séjour'] },
  { name: 'Expedia', sub: 'Flights & Luxury Packages', cb: 'Up to 10%', url: 'https://www.expedia.fr', fit: 'cover', logo: '/luxe/expedia.jpg', cta: 'Continuer vers Expedia',
    desc: 'Vols, hôtels et packages luxe au meilleur prix.',
    perks: ['Jusqu’à 10% de cashback', 'Économise en combinant vol + hôtel', 'Membres One Key : avantages exclusifs', 'Support voyage 24/7'] },
  { name: 'Four Seasons', sub: 'Legendary Service', cb: '12% Back', url: 'https://www.fourseasons.com', fit: 'contain', logo: '/luxe/fourseasons.jpg', cta: 'Continuer vers Four Seasons',
    desc: 'L’excellence de l’hôtellerie de luxe légendaire.',
    perks: ['12% de cashback', 'Surclassements & attentions VIP', 'Petit-déjeuner offert selon l’offre', 'Service d’exception'] },
  { name: 'Rosewood', sub: 'A Sense of Place', cb: '10% Back', url: 'https://www.rosewoodhotels.com', fit: 'cover', logo: '/luxe/rosewood.jpg', cta: 'Continuer vers Rosewood',
    desc: 'Des adresses uniques, un sens du lieu inégalé.',
    perks: ['10% de cashback', 'Expériences sur-mesure', 'Suites & villas privées', 'Rosewood Elite : privilèges membres'] },
]

const AIRLINES = [
  { name: 'Air France', sub: 'La Première', cb: '12% Cashback', url: 'https://www.airfrance.fr', photo: '/luxe/afcabin.jpg', logo: '/luxe/aflogo.jpg', cta: 'Continuer vers Air France',
    desc: 'L’art de voyager à la française, en cabine La Première.',
    perks: ['12% de cashback', 'Salons privés & coupe-file', 'Sièges-lits & gastronomie signée', 'Miles Flying Blue cumulables'] },
  { name: 'Emirates', sub: 'First Class Suite', cb: '10% Cashback', url: 'https://www.emirates.com', photo: '/luxe/emiratessuite.jpg', logo: '/luxe/emirateslogo.jpg', cta: 'Continuer vers Emirates',
    desc: 'Des suites privées First Class, avec douche à bord.',
    perks: ['10% de cashback', 'Suites fermées First Class', 'Chauffeur privé inclus', 'Skywards miles cumulables'] },
]

// Load More : jets privés, îles privées, palaces — real, reliable sites.
// Same big-card layout as the airlines (photo + logo).
const MORE = [
  { name: 'NetJets', sub: 'Jets privés à la demande', cb: '10% Cashback', url: 'https://www.netjets.com', cta: 'Continuer vers NetJets',
    photo: '/luxe/ultra/netjets.jpg', logo: '/luxe/ultra/netjets-logo.png',
    desc: 'Le leader mondial du jet privé, disponible en quelques heures.',
    perks: ['10% de cashback', 'Flotte de +750 jets', 'Départ en 4h partout dans le monde', 'Équipage dédié'] },
  { name: 'Soneva', sub: 'Îles privées · Maldives', cb: '14% Cashback', url: 'https://soneva.com', cta: 'Continuer vers Soneva',
    photo: '/luxe/ultra/soneva.jpg', logo: '/luxe/ultra/soneva-logo.png',
    desc: 'Villas pieds dans l’eau sur des îles privées des Maldives.',
    perks: ['14% de cashback', 'Villas avec toboggan privé', 'Observatoire & cinéma en plein air', 'Barefoot luxury'] },
  { name: 'Aman', sub: 'Resorts d’exception', cb: '12% Cashback', url: 'https://www.aman.com', cta: 'Continuer vers Aman',
    photo: '/luxe/ultra/aman.jpg', logo: '/luxe/ultra/aman-logo.png',
    desc: 'Des sanctuaires discrets dans les plus beaux lieux du monde.',
    perks: ['12% de cashback', 'Spas légendaires', 'Villas ultra-privées', 'Expériences sur-mesure'] },
  { name: 'The Brando', sub: 'Île privée · Polynésie', cb: '12% Cashback', url: 'https://thebrando.com', cta: 'Continuer vers The Brando',
    photo: '/luxe/ultra/brando.jpg', logo: '/luxe/ultra/brando-logo.png',
    desc: 'L’atoll privé mythique de Tetiaroa, refuge des stars.',
    perks: ['12% de cashback', 'Atoll 100% privé', 'Éco-resort d’exception', 'Plages désertes garanties'] },
  { name: 'Necker Island', sub: 'Île privée · Caraïbes', cb: '15% Cashback', url: 'https://www.virginlimitededition.com', cta: 'Continuer vers Necker Island',
    photo: '/luxe/ultra/necker.jpg', logo: '/luxe/ultra/necker-logo.png',
    desc: 'L’île privée de Richard Branson, privatisable en entier.',
    perks: ['15% de cashback', 'Île entière privatisable', 'Sports nautiques illimités', 'Jusqu’à 48 invités'] },
  { name: 'Burj Al Arab', sub: 'Jumeirah · Dubaï', cb: '11% Cashback', url: 'https://www.jumeirah.com', cta: 'Continuer vers Jumeirah',
    photo: '/luxe/ultra/jumeirah.jpg', logo: '/luxe/ultra/jumeirah-logo.png',
    desc: 'La voile la plus célèbre du monde, suites en duplex et service majordome.',
    perks: ['11% de cashback', 'Suites duplex avec majordome', 'Flotte de Rolls-Royce', 'Plage & rooftop privés'] },
]

const hideOnErr = (e) => { e.currentTarget.style.visibility = 'hidden' }

export default function Explore() {
  const [sel, setSel] = useState(null)
  const [showMore, setShowMore] = useState(false)
  const banner = sel?.img || sel?.photo

  return (
    <div className="page lux">
      <div className="lux-head">
        <h1 className="lux-title">The Private Collection</h1>
        <p className="lux-sub">Curated luxury experiences with elite rewards.</p>
      </div>

      {/* Hero */}
      <button className="lux-hero" onClick={() => setSel(HERO)}>
        <img className="lux-hero-img" src={HERO.img} alt={HERO.name} onError={hideOnErr} />
        <div className="lux-hero-shade" />
        <div className="lux-hero-content">
          <div>
            <h2 className="lux-hero-title">{HERO.name}</h2>
            <p className="lux-hero-sub">{HERO.sub}</p>
          </div>
          <span className="lux-badge lg">★ {HERO.cb}</span>
        </div>
      </button>

      {/* Boutique Curation */}
      <div className="lux-sec-head">
        <h3>Boutique Curation</h3>
      </div>
      <div className="lux-partners">
        {PARTNERS.map((p) => (
          <button key={p.name} className="lux-partner" onClick={() => setSel(p)}>
            <div className="lux-partner-left">
              <div className="lux-logo">
                <img src={p.logo} alt={p.name} style={{ objectFit: p.fit }} onError={hideOnErr} />
              </div>
              <div>
                <div className="lux-partner-name">{p.name}</div>
                <div className="lux-partner-sub">{p.sub}</div>
              </div>
            </div>
            <span className="lux-pill">{p.cb}</span>
          </button>
        ))}
      </div>

      {/* Elite Airline Rewards */}
      <h3 className="lux-sec-head solo">Elite Airline Rewards</h3>
      <div className="lux-airlines">
        {AIRLINES.map((a) => (
          <button key={a.name} className="lux-airline" onClick={() => setSel(a)}>
            <div className="lux-airline-media">
              <img src={a.photo} alt={a.name} onError={hideOnErr} />
              <span className="lux-badge tr">{a.cb}</span>
            </div>
            <div className="lux-airline-foot">
              <div className="lux-airline-logo">
                <img src={a.logo} alt={a.name} onError={hideOnErr} />
              </div>
              <div>
                <div className="lux-partner-name">{a.name}</div>
                <div className="lux-partner-sub">{a.sub}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Ultra Luxe (Load More) */}
      {showMore && (
        <>
          <div className="lux-sec-head">
            <h3>Ultra Luxe</h3>
          </div>
          <div className="lux-airlines">
            {MORE.map((p) => (
              <button key={p.name} className="lux-airline" onClick={() => setSel(p)}>
                <div className="lux-airline-media">
                  <img src={p.photo} alt={p.name} onError={hideOnErr} />
                  <span className="lux-badge tr">{p.cb}</span>
                </div>
                <div className="lux-airline-foot">
                  <div className="lux-airline-logo">
                    <img src={p.logo} alt={p.name} onError={hideOnErr} />
                  </div>
                  <div>
                    <div className="lux-partner-name">{p.name}</div>
                    <div className="lux-partner-sub">{p.sub}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {!showMore && (
        <div className="lux-loadmore">
          <button type="button" onClick={() => setShowMore(true)}>Load More <span className="lux-chev">⌄</span></button>
        </div>
      )}

      {/* Detail sheet */}
      <Modal open={!!sel} title={sel?.name} onClose={() => setSel(null)}>
        {sel && (
          <div className="lux-detail">
            <div className="lux-detail-media">
              {banner
                ? <img src={banner} alt={sel.name} onError={hideOnErr} />
                : sel.logo
                  ? <img className="lux-detail-logo" src={sel.logo} alt={sel.name} onError={hideOnErr} />
                  : <div className="lux-mono big">{sel.name[0]}</div>}
              <span className="lux-badge lg">★ {sel.cb}</span>
            </div>
            <p className="lux-detail-desc">{sel.desc}</p>
            <ul className="lux-perks">
              {sel.perks.map((p) => (
                <li key={p}><Check /> {p}</li>
              ))}
            </ul>
            <a className="lux-cta" href={sel.url} target="_blank" rel="noopener noreferrer" onClick={() => setSel(null)}>
              {sel.cta} <span className="lux-cta-arrow">↗</span>
            </a>
          </div>
        )}
      </Modal>
    </div>
  )
}

function Check() {
  return (
    <span className="lux-check">
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 6" /></svg>
    </span>
  )
}
