export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <div className="space-y-6 text-sm leading-relaxed [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </main>
  );
}
