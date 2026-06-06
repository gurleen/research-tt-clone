import { BrowserRouter, Route, Routes } from "react-router";
import { FeedPage } from "./pages/FeedPage";
import "./index.css";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FeedPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
