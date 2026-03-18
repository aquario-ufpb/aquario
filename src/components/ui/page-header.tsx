type PageHeaderProps = {
  title: string;
  subtitle: string;
  className?: string;
};

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={className ? `${className} mb-8` : "mb-8"}>
      <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-aquario-header dark:text-aquario-header-dark">
        {title}
      </h1>
      <p className="text-lg md:text-xl text-aquario-header dark:text-aquario-header-dark/80">
        {subtitle}
      </p>
    </div>
  );
}
