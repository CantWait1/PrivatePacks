import Header from "./components/header";
import Body from "./components/body";
import Search from "./components/search_enhanced";

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <Header></Header>
      <Body></Body>
    </div>
  );
}
