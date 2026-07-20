import { createRoot } from "react-dom/client";
import { App } from "./app/App.tsx"; // في حال قمت بإضافة default لملف App
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(<App />);