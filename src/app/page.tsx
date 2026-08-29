import Header from "@/components/Header/Header";
import Dashboard from "@/components/Dashboard/Dashboard";
import Footer from "@/components/Footer/Footer";
import SideDrawer from "@/components/SideDrawer/SideDrawer";

export default function Home() {
  return (
    <>
      <Header />
      <main style={{ flex: 1 }}>
        <Dashboard />
      </main>
      <Footer />
      <SideDrawer />
    </>
  );
}

