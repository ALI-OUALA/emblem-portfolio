import { Hero } from './sections/Hero';
import { Services } from './sections/Services';
import { Work } from './sections/Work';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';

export default function App() {
  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Hero onCta={scrollToContact} />
      <Services />
      <Work />
      <Contact />
      <Footer />
    </div>
  );
}
