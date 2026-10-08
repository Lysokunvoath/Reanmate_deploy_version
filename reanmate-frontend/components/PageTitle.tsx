export default function PageTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border-l-[3px] border-gold pl-4 ${className}`}>
      <h1 className="text-xl font-bold text-primary sm:text-2xl">
        {children}
      </h1>
    </div>
  );
}
