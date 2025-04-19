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

    // Mapeo de niveles por idioma
    const difficultyMap = {
        en: {
            easy: "easy",
            medium: "normal",
            hard: "hard",
            hardcore: "hardcore"
        },
        es: {
            easy: "facil",
            medium: "normal_2",
            hard: "dificil",
            hardcore: "diablo"
        }
    };

    const toggleLanguage = () => {
        setLanguage((prevLang) => {
            const newLang = prevLang === "en" ? "es" : "en";
            // Resetear la dificultad al cambiar idioma para evitar conflictos
            setDifficulty("easy");
            return newLang;
        });
    };

    const fetchScores = async () => {
        try {
            const query = `
                query {
                    topScores(language: "${language}", level: "${difficultyMap[language][difficulty]}") {
                        userName
                        score
                    }
                }
            `;

            const response = await fetch(`${API_URL}/graphql`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query
                }),
            });

            const { data, errors } = await response.json();

            if (errors) {
                throw new Error(errors[0].message);
            }

            if (data && data.topScores) {
                setScores(data.topScores.map(item => ({
                    name: item.userName || "Unknown",
                    score: item.score || 0,
                    difficulty: difficulty
                })));
            } else {
                setScores([]);
            }
        } catch (err) {
            console.error("GraphQL Error:", err);
            toast.error(err.message || (language === "en" ? "Error loading scores" : "Error al cargar puntajes"));
            setScores([]);
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
                toast.success(language === "en" ? "Login successful" : "Inicio de sesión exitoso");
                navigate("/game", { state: { language } });
            } else {
                toast.error(language === "en" ? "Incorrect username or password" : "Usuario o contraseña incorrectos");
            }
        } catch (err) {
            setError(language === "en" ? "Server connection error" : "Error en la conexión con el servidor");
        }
    };

    const validationSchema = Yup.object().shape({
        registroUsuario: Yup.string().required(language === "en" ? "Username is required" : "El usuario es obligatorio"),
        registroEmail: Yup.string()
            .email(language === "en" ? "Invalid email" : "Email no válido")
            .required(language === "en" ? "Email is required" : "El email es obligatorio"),
        registroPassword: Yup.string()
            .required(language === "en" ? "Password is required" : "La contraseña es obligatoria")
            .min(5, language === "en" ? "Password must be at least 5 characters" : "La contraseña debe tener mínimo 5 caracteres")
            .matches(/[A-Z]/, language === "en" ? "Must contain at least one uppercase letter" : "Debe contener al menos una mayúscula")
            .matches(/\d/, language === "en" ? "Must contain at least one number" : "Debe contener al menos un número"),
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
                toast.error(result.error || (language === "en" ? "Registration error" : "Error en el registro"));
            }
        } catch (err) {
            toast.error(language === "en" ? "Error connecting to server" : "Error al conectar con el servidor");
        }
    };

    // Textos traducidos
    const translations = {
        en: {
            welcome: "Welcome to WordShake Capi",
            topScores: "Top Scores",
            noScores: "No scores yet",
            difficulty: {
                easy: "Easy",
                medium: "Medium",
                hard: "Hard",
                hardcore: "Hardcore"
            },
            createAccount: "Create Account",
            registerText: "or use your username for registration",
            signIn: "Sign In",
            useAccount: "or use your account",
            start: "Start",
            welcomeBack: "Welcome Back!",
            loginText: "To keep connected with us please login with your personal info",
            helloFriend: "Hello, Friend!",
            registerText2: "Enter your personal details and start journey with us",
            signUp: "Sign Up"
        },
        es: {
            welcome: "Bienvenido a WordShake Capi",
            topScores: "Mejores Puntajes",
            noScores: "No hay puntajes aún",
            difficulty: {
                easy: "Fácil",
                medium: "Medio",
                hard: "Difícil",
                hardcore: "Hardcore"
            },
            createAccount: "Crear Cuenta",
            registerText: "o usa tu usuario para registrarte",
            signIn: "Iniciar Sesión",
            useAccount: "o usa tu cuenta",
            start: "Empezar",
            welcomeBack: "¡Bienvenido de nuevo!",
            loginText: "Para mantenerte conectado con nosotros, por favor inicia sesión con tu información personal",
            helloFriend: "¡Hola, Amigo!",
            registerText2: "Ingresa tus datos personales y comienza el viaje con nosotros",
            signUp: "Registrarse"
        }
    };

    const t = translations[language];

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
                    <h3>{t.topScores}</h3>
                    <div className="difficulty-buttons">
                        <button 
                            className={difficulty === "easy" ? "active" : ""} 
                            onClick={() => setDifficulty("easy")}
                        >
                            {t.difficulty.easy}
                        </button>
                        <button 
                            className={difficulty === "medium" ? "active" : ""} 
                            onClick={() => setDifficulty("medium")}
                        >
                            {t.difficulty.medium}
                        </button>
                        <button 
                            className={difficulty === "hard" ? "active" : ""} 
                            onClick={() => setDifficulty("hard")}
                        >
                            {t.difficulty.hard}
                        </button>
                        <button 
                            className={difficulty === "hardcore" ? "active" : ""} 
                            onClick={() => setDifficulty("hardcore")}
                        >
                            {t.difficulty.hardcore}
                        </button>
                    </div>
                    <ul>
                        {scores.length > 0 ? (
                            scores.map((s, index) => (
                                <li key={index}>
                                    {s.name}: {s.score} ({t.difficulty[s.difficulty]})
                                </li>
                            ))
                        ) : (
                            <li>{t.noScores}</li>
                        )}
                    </ul>
                </div>
            )}

            <h2>{t.welcome}</h2>

            <div className={`container ${isRightPanelActive ? "right-panel-active" : ""}`}>
                <div className="form-container sign-up-container">
                    <form onSubmit={handleSubmit(handleRegister)}>
                        <h1>{t.createAccount}</h1>
                        <span>{t.registerText}</span>

                        <input type="text" placeholder={language === "en" ? "Username" : "Usuario"} {...register("registroUsuario")} />
                        <p className="error">{errors.registroUsuario?.message}</p>

                        <input type="email" placeholder={language === "en" ? "Email" : "Correo Electrónico"} {...register("registroEmail")} />
                        <p className="error">{errors.registroEmail?.message}</p>

                        <input type="password" placeholder={language === "en" ? "Password" : "Contraseña"} {...register("registroPassword")} />
                        <p className="error">{errors.registroPassword?.message}</p>

                        <button type="submit">{t.createAccount}</button>
                    </form>
                </div>

                <div className="form-container sign-in-container">
                    <form onSubmit={handleLogin}>
                        <h1>{t.signIn}</h1>
                        <span>{t.useAccount}</span>
                        <input type="text" placeholder={language === "en" ? "Username" : "Usuario"} value={usuario} onChange={(e) => setUsuario(e.target.value)} />
                        <input type="password" placeholder={language === "en" ? "Password" : "Contraseña"} value={password} onChange={(e) => setPassword(e.target.value)} />
                        <button type="submit">{t.start}</button>
                        {error && <p style={{ color: "red" }}>{error}</p>}
                    </form>
                </div>

                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1>{t.welcomeBack}</h1>
                            <p>{t.loginText}</p>
                            <button className="ghost" onClick={() => setIsRightPanelActive(false)}>
                                {t.signIn}
                            </button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1>{t.helloFriend}</h1>
                            <p>{t.registerText2}</p>
                            <button className="ghost" onClick={() => setIsRightPanelActive(true)}>
                                {t.signUp}
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