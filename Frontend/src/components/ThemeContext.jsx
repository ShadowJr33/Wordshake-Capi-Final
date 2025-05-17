import { createContext, useContext, useEffect, useState } from "react";

// 1️⃣ Creamos el contexto
const ThemeContext = createContext();

// 2️⃣ Proveedor del tema
export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(localStorage.getItem("theme") || "tema-claro");

    // Cambia el tema y lo guarda en localStorage
    const toggleTheme = () => {
        const newTheme = theme === "tema-claro" ? "tema-oscuro" : "tema-claro";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
    };

    // Aplica la clase al body cada vez que cambia el tema
    useEffect(() => {
        document.body.classList.remove("tema-claro", "tema-oscuro");
        document.body.classList.add(theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

// 3️⃣ Hook personalizado para usar el tema en cualquier parte
export function useTheme() {
    return useContext(ThemeContext);
}
