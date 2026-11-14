import React, { useMemo, useState } from 'react';
import { CalendarClock, MapPin } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { getActivityImage } from './activityImages';

export type LandingActivity = {
  title: string;
  date: string;
  location: string;
  status: 'Completed' | 'Ongoing' | 'Upcoming';
  description: string;
  tag: string;
};

type ActivitiesShowcaseProps = {
  activities: LandingActivity[];
};

function formatStatusClass(status: LandingActivity['status']) {
  if (status === 'Upcoming') return 'is-upcoming';
  if (status === 'Ongoing') return 'is-ongoing';
  return 'is-completed';
}

function ActivityMedia({
  activity,
  featured = false
}: {
  activity: LandingActivity;
  featured?: boolean;
}) {
  const image = getActivityImage(activity.title);

  return (
    <div className={`activities-media${featured ? ' is-featured' : ''}`}>
      {image.src ? (
        <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
      ) : (
        <div className="activities-media-fallback" aria-hidden="true" />
      )}
      {image.isSample ? <span className="activities-sample-badge">Sample photo</span> : null}
    </div>
  );
}

/**
 * Balanced accreditation activities photo gallery.
 * Uses verified activity records with temporary sample photographs
 * that can be replaced via `activityImages.ts`.
 */
export function ActivitiesShowcase({ activities }: ActivitiesShowcaseProps) {
  const reduceMotion = useReducedMotion();
  const ordered = useMemo(
    () =>
      [...activities].sort(
        (first, second) => Date.parse(second.date) - Date.parse(first.date)
      ),
    [activities]
  );

  const featured = ordered[0];
  const recent = ordered.slice(1, 4);
  const [expandedTitle, setExpandedTitle] = useState<string | null>(null);

  if (!featured) return null;

  const fadeUp = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] as const }
        };

  return (
    <div className="activities-showcase">
      <motion.article className="activities-featured" {...fadeUp(0.04)}>
        <ActivityMedia activity={featured} featured />
        <div className="activities-featured-body">
          <div className="activities-meta">
            <span className="activities-category">{featured.tag}</span>
            <span className={`activities-status ${formatStatusClass(featured.status)}`}>
              {featured.status}
            </span>
          </div>
          <h3>{featured.title}</h3>
          <div className="activities-facts">
            <span>
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              {featured.date}
            </span>
            <span>
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {featured.location}
            </span>
          </div>
          <p>{featured.description}</p>
        </div>
      </motion.article>

      {recent.map((activity, index) => {
        const isExpanded = expandedTitle === activity.title;
        // With a 2x2 featured tile in a 3-column grid, the third side card
        // spans the full bottom row so no empty cells remain.
        const isWide = index === 2;
        return (
          <motion.article
            key={activity.title}
            className={`activities-card${isWide ? ' is-wide' : ''}${isExpanded ? ' is-expanded' : ''}`}
            {...fadeUp(0.08 + index * 0.06)}
          >
            <ActivityMedia activity={activity} />
            <div className="activities-card-body">
              <div className="activities-meta">
                <span className="activities-category">{activity.tag}</span>
                <span className={`activities-status ${formatStatusClass(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
              <h3>{activity.title}</h3>
              <div className="activities-facts">
                <span>
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  {activity.date}
                </span>
              </div>
              <button
                type="button"
                className="activities-details-toggle"
                aria-expanded={isExpanded}
                onClick={() =>
                  setExpandedTitle((current) => (current === activity.title ? null : activity.title))
                }
              >
                {isExpanded ? 'Hide details' : 'View details'}
              </button>
              {isExpanded ? (
                <div className="activities-card-detail">
                  <p>{activity.description}</p>
                  <span>
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {activity.location}
                  </span>
                </div>
              ) : null}
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}
