import type { ReactNode } from "react";

export default function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="panel p-6 sm:p-8">
      <h2 className="text-lg">{title}</h2>
      <p className="mb-6 mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {children}
    </section>
  );
}
