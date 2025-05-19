import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./views/Home.jsx";
import Rules from "./views/Rules.jsx";
import Game from "./views/Game.jsx"; // Importa el componente Game
import { ThemeProvider } from "./components/ThemeContext";
import React from 'react';



function App() {
    return (
        <ThemeProvider> {/* 🎨 Proveedor del tema global */}
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/rules" element={<Rules />} />
                    <Route path="/game" element={<Game />} /> {/* Nueva ruta para Game */}
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
