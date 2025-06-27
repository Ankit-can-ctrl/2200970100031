import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import URLShortener from "./components/URLShortener";
import Statistics from "./components/Statistics";
import RedirectHandler from "./components/RedirectHandler";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<URLShortener />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/:shortcode" element={<RedirectHandler />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
