import React, { useEffect, useId, useState } from 'react';
import { CalendarClock, ChevronLeft, ChevronRight, ExternalLink, MapPin, Users, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  IA_ACCREDITATION_AREAS,
  IA_ORIENTATION_EVENT,
  type EventPhoto
} from './iaOrientationEvent';
import { QA_OFFICE_SAMPLE_CARDS, type SampleQaCard } from './qaOfficeSamples';

type ActivitiesShowcaseProps = {
  /** Kept for call-site compatibility; the showcase features the verified IA orientation event. */
  activities?: unknown;
};

type DetailsTarget = { kind: 'event' } | { kind: 'sample'; card: SampleQaCard };

/**
 * NEMSU QA Office activities gallery featuring the Institutional Accreditation
 * Orientation and Workshop (22–23 October 2026), plus sample QA content cards.
 */
export function ActivitiesShowcase(_props: ActivitiesShowcaseProps) {
  const reduceMotion = useReducedMotion();
  const event = IA_ORIENTATION_EVENT;
  const [details, setDetails] = useState<DetailsTarget | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const titleId = useId();
  const lightboxTitleId = useId();
  const photos = event.photos as readonly EventPhoto[];
  const featuredPhoto = photos[0];

  useEffect(() => {
    if (!details && lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxIndex !== null) {
          setLightboxIndex(null);
          return;
        }
        setDetails(null);
      }
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setLightboxIndex((current) =>
          current === null ? current : (current - 1 + photos.length) % photos.length
        );
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setLightboxIndex((current) => (current === null ? current : (current + 1) % photos.length));
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [details, lightboxIndex, photos.length]);

  const fadeUp = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] as const }
        };

  const openLightbox = (index: number) => setLightboxIndex(index);
  const activeLightboxPhoto = lightboxIndex === null ? null : photos[lightboxIndex];
  const sideCards = QA_OFFICE_SAMPLE_CARDS.slice(0, 2);
  const workshopsCard = QA_OFFICE_SAMPLE_CARDS[2];

  return (
    <>
      <div className="activities-showcase">
        <div className="activities-showcase-upper">
          <div className="activities-showcase-main">
            <motion.article className="activities-featured" {...fadeUp(0.04)}>
              <div className="activities-media is-featured">
                <img src={featuredPhoto.src} alt={featuredPhoto.alt} loading="lazy" decoding="async" />
              </div>

              <div className="activities-featured-body">
                <div className="activities-meta">
                  <span className="activities-category">{event.category}</span>
                  <span className="activities-status is-completed">{event.status}</span>
                </div>
                <h3>{event.title}</h3>
                <div className="activities-facts">
                  <span>
                    <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                    {event.dateLabel}
                  </span>
                  <span>
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {event.location}
                  </span>
                  <span>
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    NEMSU Office of Quality Assurance, headed by {event.officeHead}
                  </span>
                </div>
                <p>{event.shortDescription}</p>
                <button
                  type="button"
                  className="activities-details-toggle"
                  onClick={() => setDetails({ kind: 'event' })}
                >
                  View Details
                </button>
              </div>
            </motion.article>
          </div>

          <div className="activities-showcase-side">
            {sideCards.map((card, index) => (
              <motion.article key={card.id} className="activities-card is-compact" {...fadeUp(0.08 + index * 0.06)}>
                <div className="activities-media">
                  <img src={card.image.src} alt={card.image.alt} loading="lazy" decoding="async" />
                </div>
                <div className="activities-card-body">
                  <div className="activities-meta">
                    <span className="activities-category">{card.category}</span>
                  </div>
                  <h3>{card.title}</h3>
                  <p className="activities-card-copy">{card.description}</p>
                  <button
                    type="button"
                    className="activities-details-toggle"
                    onClick={() => setDetails({ kind: 'sample', card })}
                  >
                    View Details
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>

        {workshopsCard ? (
          <motion.article className="activities-card is-wide" {...fadeUp(0.2)}>
            <div className="activities-media">
              <img
                src={workshopsCard.image.src}
                alt={workshopsCard.image.alt}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="activities-card-body">
              <div className="activities-meta">
                <span className="activities-category">{workshopsCard.category}</span>
              </div>
              <h3>{workshopsCard.title}</h3>
              <p className="activities-card-copy">{workshopsCard.description}</p>
              <button
                type="button"
                className="activities-details-toggle"
                onClick={() => setDetails({ kind: 'sample', card: workshopsCard })}
              >
                View Details
              </button>
            </div>
          </motion.article>
        ) : null}
      </div>

      <AnimatePresence>
        {details ? (
          <motion.div
            className="activities-modal-backdrop"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={() => setDetails(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="activities-modal"
              initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {details.kind === 'event' ? (
                <>
                  <div className="activities-modal-head">
                    <div>
                      <p className="activities-category">{event.category}</p>
                      <h3 id={titleId}>{event.title}</h3>
                      <p className="activities-modal-type">{event.type}</p>
                    </div>
                    <button
                      type="button"
                      className="activities-modal-close"
                      aria-label="Close event details"
                      onClick={() => setDetails(null)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="activities-modal-body">
                    <div className="activities-modal-facts">
                      <span>
                        <CalendarClock className="h-4 w-4" aria-hidden="true" />
                        {event.dateLabel}
                      </span>
                      <span>
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        {event.location}
                      </span>
                      <span>
                        <Users className="h-4 w-4" aria-hidden="true" />
                        {event.organizer}, headed by {event.officeHead}
                      </span>
                    </div>

                    <div className="activities-modal-gallery">
                      {photos.map((photo, index) => (
                        <figure key={photo.src}>
                          <button
                            type="button"
                            className="activities-modal-gallery-btn"
                            onClick={() => openLightbox(index)}
                            aria-label={`Enlarge photo: ${photo.caption}`}
                          >
                            <img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" />
                          </button>
                          <figcaption>{photo.caption}</figcaption>
                        </figure>
                      ))}
                    </div>

                    <section className="activities-modal-section">
                      <h4>About this activity</h4>
                      {event.fullDescription.map((paragraph) => (
                        <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                      ))}
                    </section>

                    <section className="activities-modal-section activities-modal-grid">
                      <div>
                        <h4>Organizing office</h4>
                        <p>{event.organizer}</p>
                        <p>
                          <strong>Office Head:</strong> {event.officeHead}
                        </p>
                        <p>
                          <strong>University Representative:</strong> {event.universityRepresentative}
                        </p>
                      </div>
                      <div>
                        <h4>Resource speakers</h4>
                        <ul>
                          {event.speakers.map((speaker) => (
                            <li key={speaker}>{speaker}</li>
                          ))}
                        </ul>
                      </div>
                    </section>

                    <section className="activities-modal-section">
                      <h4>Workshop highlights</h4>
                      <ul className="activities-modal-bullets">
                        {event.highlights.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>

                    <section className="activities-modal-section">
                      <h4>Nine institutional accreditation areas</h4>
                      <ol className="activities-modal-areas">
                        {IA_ACCREDITATION_AREAS.map((area) => (
                          <li key={area}>{area}</li>
                        ))}
                      </ol>
                    </section>

                    <p className="activities-modal-source">
                      Source:{' '}
                      <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer">
                        {event.sourceLabel}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="activities-modal-head">
                    <div>
                      <p className="activities-category">{details.card.category}</p>
                      <h3 id={titleId}>{details.card.title}</h3>
                    </div>
                    <button
                      type="button"
                      className="activities-modal-close"
                      aria-label="Close sample details"
                      onClick={() => setDetails(null)}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="activities-modal-body">
                    <div className="activities-media activities-modal-sample-media">
                      <img
                        src={details.card.image.src}
                        alt={details.card.image.alt}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    {details.card.detailCopy.map((paragraph) => (
                      <p key={paragraph.slice(0, 48)} className="activities-modal-sample-copy">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeLightboxPhoto && lightboxIndex !== null ? (
          <motion.div
            className="activities-lightbox-backdrop"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            onClick={() => setLightboxIndex(null)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={lightboxTitleId}
              className="activities-lightbox"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="activities-lightbox-toolbar">
                <p id={lightboxTitleId}>{activeLightboxPhoto.caption}</p>
                <button
                  type="button"
                  className="activities-modal-close"
                  aria-label="Close photo gallery"
                  onClick={() => setLightboxIndex(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="activities-lightbox-stage">
                <button
                  type="button"
                  className="activities-lightbox-nav is-prev"
                  aria-label="Previous photo"
                  onClick={() =>
                    setLightboxIndex((current) =>
                      current === null ? current : (current - 1 + photos.length) % photos.length
                    )
                  }
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <img
                  src={activeLightboxPhoto.src}
                  alt={activeLightboxPhoto.alt}
                  decoding="async"
                />

                <button
                  type="button"
                  className="activities-lightbox-nav is-next"
                  aria-label="Next photo"
                  onClick={() =>
                    setLightboxIndex((current) =>
                      current === null ? current : (current + 1) % photos.length
                    )
                  }
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <p className="activities-lightbox-count">
                {lightboxIndex + 1} / {photos.length}
              </p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

/** @deprecated Prefer IA_ORIENTATION_EVENT; retained for older imports. */
export type LandingActivity = {
  title: string;
  date: string;
  location: string;
  status: 'Completed' | 'Ongoing' | 'Upcoming';
  description: string;
  tag: string;
};
