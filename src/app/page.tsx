import Header from "@/components/Header/Header";
import Dashboard from "@/components/Dashboard/Dashboard";
import Footer from "@/components/Footer/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Dashboard />
      </main>
      <Footer />
    </>
  );
}

