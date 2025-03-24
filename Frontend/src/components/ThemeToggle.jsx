import { useTheme } from "../components/ThemeContext";

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button onClick={toggleTheme} className="ghost" style={{ position: "absolute", top: "70px", right: "10px" }}>
            {theme === "tema-claro" ? "🌙" : "☀️"}
        </button>
    );
};

export default ThemeToggle;
