import { LucideIcon } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';

interface OpenPlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  eyebrow?: string;
}

/** Temporary empty page for Faculty & Staff Resource Center routes until later chunks. */
export function OpenPlaceholder({ title, description, icon, eyebrow = 'Faculty & Staff Resource Center' }: OpenPlaceholderProps) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <section className="panel p-6 sm:p-8" aria-label={`${title} placeholder`}>
        <EmptyState
          icon={icon}
          title="Coming soon"
          description="This section of the Faculty & Staff Resource Center will be implemented in a later development chunk. Navigation and layout are ready."
        />
      </section>
    </>
  );
}
