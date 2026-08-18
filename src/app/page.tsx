import Header from "@/components/Header/Header";
import Wizard from "@/components/Wizard/Wizard";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";

export default function Home() {
  return (
    <>
      <Header />
      <main style={{ flex: 1, padding: "2rem 0" }}>
        <Wizard />
      </main>
      <Footer />
      <SideDrawer />
    </>
  );
}
