export function Footer() {
  return (
    <footer className="border-t py-4 mt-auto">
      <div className="px-4 md:px-8 lg:px-12 xl:px-16 flex flex-col items-center justify-between gap-4 md:h-14 md:flex-row">
        <p className="text-center text-sm text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} Sistema de Transporte - Grupo Alliot. Todos los derechos reservados.
        </p>
        <p className="text-center text-sm text-muted-foreground md:text-right">
          Versión 2.0.0
        </p>
      </div>
    </footer>
  );
}