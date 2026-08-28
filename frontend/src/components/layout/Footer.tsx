export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-muted-foreground md:flex-row">
        <p>© {year} LOADOUT. All rights reserved.</p>

        <div className="flex gap-6">
          <div className="hover:text-foreground">
            Privacy Policy
          </div>
          <div className="hover:text-foreground">
            Terms of Service
          </div>
          <div className="hover:text-foreground">
            Cookie Policy
          </div>
          <div className="hover:text-foreground">
            Contact
          </div>
        </div>
      </div>
    </footer>
  );
}