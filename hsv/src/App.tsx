import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Picker from "@/pages/Picker";
import Adjust from "@/pages/Adjust";
import Playground from "@/pages/Playground";
import ColorWheel from "@/pages/ColorWheel";
import Converter from "@/pages/Converter";
import Palette from "@/pages/Palette";

export default function App() {
  return (
    <Router basename="/hsv">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/picker" element={<Picker />} />
          <Route path="/adjust" element={<Adjust />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/color-wheel" element={<ColorWheel />} />
          <Route path="/converter" element={<Converter />} />
          <Route path="/palette" element={<Palette />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </Router>
  );
}
