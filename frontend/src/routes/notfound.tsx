import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

export default function Notfound() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />

      <main className="flex-1">
        Not Found Page
      </main>

      <Footer />
    </div>
  );
}