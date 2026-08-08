import Header from "@/components/Header/Header";
import Hero from "@/components/Hero/Hero";
import Footer from "@/components/Footer/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Hero />
      </main>
      <Footer />
    </>
  );
}
