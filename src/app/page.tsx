import Header from "@/components/Header/Header";
import Hero from "@/components/Hero/Hero";
import Search from "@/components/Search/Search";
import Wizard from "@/components/Wizard/Wizard";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";
import Marketing from "@/components/Marketing/Marketing";

export default function Home() {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Hero />
        <Search />
        <Wizard />
        <Marketing />
      </main>
      <Footer />
      <SideDrawer />
    </>
  );
}
