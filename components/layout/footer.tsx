export function Footer() {
  return (
    <footer className="border-t py-6 md:px-8 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} Transport App. Todos los derechos reservados.
        </p>
        <p className="text-center text-sm text-muted-foreground md:text-right">
          Versión 1.0.0
        </p>
      </div>
    </footer>
  );
}