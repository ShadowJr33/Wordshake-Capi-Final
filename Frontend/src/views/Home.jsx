import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../components/ThemeContext";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Home() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [showScores, setShowScores] = useState(false);
    const [isRightPanelActive, setIsRightPanelActive] = useState(false);
    const [language, setLanguage] = useState("en");
    const [difficulty, setDifficulty] = useState("easy");
    const [scores, setScores] = useState([]);

    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL;

    const toggleLanguage = () => {
        setLanguage((prevLang) => (prevLang === "en" ? "es" : "en"));
    };

    const fetchScores = async () => {
        try {
            const response = await fetch(`${API_URL}/api/top_scores`);
            const data = await response.json();
            
            if (data) {
                // Transformamos los datos del backend al formato que espera el frontend
                const transformedScores = [];
                
                // Procesamos scores fáciles
                Object.entries(data.easy).forEach(([name, score]) => {
                    transformedScores.push({ name, score, difficulty: "easy" });
                });
                
                // Procesamos scores normales
                Object.entries(data.normal).forEach(([name, score]) => {
                    transformedScores.push({ name, score, difficulty: "medium" });
                });
                
                // Procesamos scores difíciles
                Object.entries(data.hard).forEach(([name, score]) => {
                    transformedScores.push({ name, score, difficulty: "hard" });
                });

                // Procesamos scores hardcore
                Object.entries(data.hardcore).forEach(([name, score]) => {
                    transformedScores.push({ name, score, difficulty: "hardcore" });
                });
                
                // Filtramos según la dificultad seleccionada
                const filteredScores = transformedScores.filter(
                    item => item.difficulty === difficulty || 
                           (difficulty === "medium" && item.difficulty === "normal")
                ).slice(0, 3);
                
                setScores(filteredScores);
            }
        } catch (err) {
            toast.error(language === "en" ? "Error loading scores" : "Error al cargar puntajes");
        }
    };

    useEffect(() => {
        if (showScores) {
            fetchScores();
        }
    }, [showScores, difficulty, language]);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name: usuario, password }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Inicio de sesión exitoso");
                navigate("/game", { state: { language } });
            } else {
                toast.error("Usuario o contraseña incorrectos");
            }
        } catch (err) {
            setError("Error en la conexión con el servidor");
        }
    };

    const validationSchema = Yup.object().shape({
        registroUsuario: Yup.string().required("El usuario es obligatorio"),
        registroEmail: Yup.string().email("Email no válido").required("El email es obligatorio"),
        registroPassword: Yup.string()
            .required("La contraseña es obligatoria")
            .min(5, "La contraseña debe tener mínimo 5 caracteres")
            .matches(/[A-Z]/, "Debe contener al menos una mayúscula")
            .matches(/\d/, "Debe contener al menos un número"),
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm({
        resolver: yupResolver(validationSchema)
    });

    const handleRegister = async (data) => {
        try {
            const response = await fetch(`${API_URL}/api/insert`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: data.registroUsuario,
                    email: data.registroEmail,
                    password: data.registroPassword,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(language === "en" ? "Account created successfully!" : "¡Cuenta creada exitosamente!");
                reset();
                setIsRightPanelActive(false);
            } else {
                toast.error(result.error || "Error en el registro");
            }
        } catch (err) {
            toast.error("Error al conectar con el servidor");
        }
    };

    return (
        <div className="home">
            <button className="ghost" onClick={toggleLanguage} style={{ position: "absolute", top: "10px", right: "10px" }}>
                {language === "en" ? "EN" : "ES"}
            </button>

            <button className="ghost" onClick={() => navigate("/rules")} style={{ position: "absolute", top: "10px", left: "10px" }}>
                ?
            </button>

            <button className="ghost" onClick={() => setShowScores(!showScores)} style={{ position: "absolute", top: "70px", left: "10px" }}>
                🏆
            </button>

            <ThemeToggle />

            {showScores && (
                <div className="container scores-panel">
                    <h3>{language === "en" ? "Top Scores" : "Mejores Puntajes"}</h3>
                    <div className="difficulty-buttons">
                        <button 
                            className={difficulty === "easy" ? "active" : ""} 
                            onClick={() => setDifficulty("easy")}
                        >
                            {language === "en" ? "Easy" : "Fácil"}
                        </button>
                        <button 
                            className={difficulty === "medium" ? "active" : ""} 
                            onClick={() => setDifficulty("medium")}
                        >
                            {language === "en" ? "Medium" : "Medio"}
                        </button>
                        <button 
                            className={difficulty === "hard" ? "active" : ""} 
                            onClick={() => setDifficulty("hard")}
                        >
                            {language === "en" ? "Hard" : "Difícil"}
                        </button>
                        <button 
                            className={difficulty === "hardcore" ? "active" : ""} 
                            onClick={() => setDifficulty("hardcore")}
                        >
                            Hardcore
                        </button>
                    </div>
                    <ul>
                        {scores.length > 0 ? (
                            scores.map((s, index) => (
                                <li key={index}>
                                    {s.name}: {s.score} ({language === "en" ? 
                                        s.difficulty === "easy" ? "Easy" : 
                                        s.difficulty === "medium" ? "Medium" : 
                                        s.difficulty === "hardcore" ? "Hardcore" : "Hard" 
                                        : 
                                        s.difficulty === "easy" ? "Fácil" : 
                                        s.difficulty === "medium" ? "Medio" : 
                                        s.difficulty === "hardcore" ? "Hardcore" : "Difícil"})
                                </li>
                            ))
                        ) : (
                            <li>{language === "en" ? "No scores yet" : "No hay puntajes aún"}</li>
                        )}
                    </ul>
                </div>
            )}

            <h2>{language === "en" ? "Welcome to WordShake Capi" : "Bienvenido a WordShake Capi"}</h2>

            <div className={`container ${isRightPanelActive ? "right-panel-active" : ""}`}>
                <div className="form-container sign-up-container">
                    <form onSubmit={handleSubmit(handleRegister)}>
                        <h1>{language === "en" ? "Create Account" : "Crear Cuenta"}</h1>
                        <span>{language === "en" ? "or use your username for registration" : "o usa tu usuario para registrarte"}</span>

                        <input type="text" placeholder="Usuario" {...register("registroUsuario")} />
                        <p className="error">{errors.registroUsuario?.message}</p>

                        <input type="email" placeholder="Correo Electrónico" {...register("registroEmail")} />
                        <p className="error">{errors.registroEmail?.message}</p>

                        <input type="password" placeholder="Contraseña" {...register("registroPassword")} />
                        <p className="error">{errors.registroPassword?.message}</p>

                        <button type="submit">{language === "en" ? "Create" : "Crear"}</button>
                    </form>
                </div>

                <div className="form-container sign-in-container">
                    <form onSubmit={handleLogin}>
                        <h1>{language === "en" ? "Sign In" : "Iniciar Sesión"}</h1>
                        <span>{language === "en" ? "or use your account" : "o usa tu cuenta"}</span>
                        <input type="text" placeholder={language === "en" ? "Username" : "Usuario"} value={usuario} onChange={(e) => setUsuario(e.target.value)} />
                        <input type="password" placeholder={language === "en" ? "Password" : "Contraseña"} value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="submit">{language === "en" ? "Start" : "Empezar"}</button>
                        {error && <p style={{ color: "red" }}>{error}</p>}
                    </form>
                </div>

                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>{language === "en" ? "Welcome Back!" : "¡Bienvenido de nuevo!"}</h1>
                            <p>{language === "en" ? "To keep connected with us please login with your personal info" : "Para mantenerte conectado con nosotros, por favor inicia sesión con tu información personal"}</p>
                            <button className="ghost" onClick={() => setIsRightPanelActive(false)}>
                                {language === "en" ? "Sign In" : "Iniciar Sesión"}
                            </button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>{language === "en" ? "Hello, Friend!" : "¡Hola, Amigo!"}</h1>
                            <p>{language === "en" ? "Enter your personal details and start journey with us" : "Ingresa tus datos personales y comienza el viaje con nosotros"}</p>
                            <button className="ghost" onClick={() => setIsRightPanelActive(true)}>
                                {language === "en" ? "Sign Up" : "Registrarse"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
}

export default Home;