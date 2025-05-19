import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaVolumeUp, FaVolumeMute, FaMusic, FaTrophy } from "react-icons/fa";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../components/ThemeContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import defaultAvatar from "../assets/default-avatar.png";
import React from 'react';

function Game() {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedLetters, setSelectedLetters] = useState([]);
    const [grid, setGrid] = useState([]);
    const [showLetters, setShowLetters] = useState(false);
    const [scoreHistory, setScoreHistory] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const [topPosition, setTopPosition] = useState(null);
    const timerRef = useRef(null);
    const [usedWords, setUsedWords] = useState(new Set());
    const [language, setLanguage] = useState(location.state?.language || "es");
    const [difficulty, setDifficulty] = useState(location.state?.difficulty || "facil");
    const [bestWord, setBestWord] = useState(null);
    const [showHardcoreWarning, setShowHardcoreWarning] = useState(false);
    const [accountDeleted, setAccountDeleted] = useState(false);
    const [timePenalty, setTimePenalty] = useState(false);
    const [showAchievements, setShowAchievements] = useState(false);
    const [achievements, setAchievements] = useState([]);
    const [usernameInput, setUsernameInput] = useState("");
    
    // States for music system
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [songs] = useState([
        { title: "Wii Shop", file: "/Wii Shop Channel Main Theme (HQ).mp3" },
        { title: "Symbolism", file: "/Electro-Light - Symbolism  Trap  NCS - Copyright Free Music (1).mp3" },
        { title: "Energy", file: "/Elektronomia - Energy  Progressive House  NCS - Copyright Free Music.mp3" },
        { title: "Hope", file: "/Tobu - Hope [Privated NCS Release].mp3" },
        { title: "Better Days", file: "/LAKEY INSPIRED - Better Days.mp3" }
    ]);
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [showMusicMenu, setShowMusicMenu] = useState(false);

    // States for avatar system
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [userName, setUserName] = useState("");
    const [uploading, setUploading] = useState(false);

    const VALID_LEVELS = {
        en: ['easy', 'normal', 'hard', 'hardcore'],
        es: ['facil', 'normal_2', 'dificil', 'diablo']
    };

    const API_URL = import.meta.env.VITE_API_URL;

    const difficultySettings = {
        easy: { gridSize: 6, timeLimit: 180, vowelProbability: 0.4 },
        normal: { gridSize: 5, timeLimit: 180, vowelProbability: 0.35 },
        hard: { gridSize: 4, timeLimit: 120, vowelProbability: 0.3 },
        hardcore: { gridSize: 4, timeLimit: 60, vowelProbability: 0.25 },
        facil: { gridSize: 6, timeLimit: 180, vowelProbability: 0.4 },
        normal_2: { gridSize: 5, timeLimit: 180, vowelProbability: 0.35 },
        dificil: { gridSize: 4, timeLimit: 120, vowelProbability: 0.3 },
        diablo: { gridSize: 4, timeLimit: 60, vowelProbability: 0.25 }
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.9;
        }

        // Load user data
        const userId = localStorage.getItem("userId");
        const name = localStorage.getItem("userName") || (language === "es" ? "Usuario" : "User");
        setUserName(name);
        setUsernameInput(name);

        if (userId) {
            fetch(`${API_URL}/api/user_image/${userId}`)
                .then(res => {
                    if (!res.ok) throw new Error();
                    return res.blob();
                })
                .then(blob => setAvatarUrl(URL.createObjectURL(blob)))
                .catch(() => setAvatarUrl(null));
        }
    }, [accountDeleted, language]);

    useEffect(() => {
        const settings = difficultySettings[difficulty];
        setTimeLeft(settings.timeLimit);
        setGrid(generateRandomGrid(settings.gridSize, settings.vowelProbability));
        
        if ((difficulty === 'hardcore' || difficulty === 'diablo') && !showHardcoreWarning) {
            setShowHardcoreWarning(true);
        }
    }, [difficulty]);

    useEffect(() => {
        return () => clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        if (showLetters && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setGameOver(true);
                        calculateFinalScore();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [showLetters, timeLeft]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.src = songs[currentSongIndex].file;
            audioRef.current.load();
            if (isPlaying) audioRef.current.play();
        }
    }, [currentSongIndex]);

    const toggleMusic = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const MusicMenu = () => (
        <div className="music-menu">
            <h4>{language === "es" ? "Seleccionar música" : "Select Music"}</h4>
            <div className="songs-list">
                {songs.map((song, index) => (
                    <button
                        key={song.file}
                        className={`song-item ${index === currentSongIndex ? 'selected' : ''}`}
                        onClick={() => { setCurrentSongIndex(index); setShowMusicMenu(false); }}
                    >
                        {song.title}
                    </button>
                ))}
            </div>
        </div>
    );

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const userId = localStorage.getItem("userId");
        const formData = new FormData();
        formData.append("user_id", userId);
        formData.append("image", file);

        try {
            const res = await fetch(`${API_URL}/api/upload_image`, {
                method: "POST",
                body: formData
            });
            if (res.ok) {
                fetch(`${API_URL}/api/user_image/${userId}`)
                    .then(res => res.blob())
                    .then(blob => setAvatarUrl(URL.createObjectURL(blob)));
            } else {
                toast.error(language === "es" ? "Error al subir la imagen" : "Error uploading image");
            }
        } catch {
            toast.error(language === "es" ? "Error de conexión" : "Connection error");
        }
        setUploading(false);
    };

    function generateRandomGrid(size, vowelProbability) {
        const vowels = language === "es" ? "AEIOU" : "AEIOU";
        const consonants = language === "es" ? "BCDFGHJKLMNÑPQRSTVWXYZ" : "BCDFGHJKLMNPQRSTVWXYZ";
        return Array(size).fill().map(() =>
            Array(size).fill().map(() => {
                const letterPool = Math.random() < vowelProbability ? vowels : consonants;
                return letterPool[Math.floor(Math.random() * letterPool.length)];
            })
        );
    }

    const calculateFinalScore = async () => {
        const total = scoreHistory.reduce((sum, item) => sum + item.puntos, 0);
        setFinalScore(total);
        
        if (scoreHistory.length > 0) {
            const best = scoreHistory.reduce((max, item) => 
                item.puntos > max.puntos ? item : max, scoreHistory[0]);
            setBestWord(best);
        }
        
        try {
            const userId = localStorage.getItem('userId');
            if (!userId || isNaN(parseInt(userId))) {
                console.error("Invalid user ID:", userId);
                return;
            }
    
            if (!VALID_LEVELS[language].includes(difficulty)) {
                console.error(`Invalid level ${difficulty} for language ${language}`);
                return;
            }
    
            if ((difficulty === 'hardcore' || difficulty === 'diablo') && scoreHistory.length < 10) {
                await deleteUserAccount(userId);
                setAccountDeleted(true);
                return;
            }
    
            const response = await fetch(`${API_URL}/api/update_score`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: parseInt(userId),
                    language: language,
                    level: difficulty,
                    score: total
                })
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Response error:", errorData);
                return;
            }
    
            const data = await response.json();
            if (data.message?.includes('top')) {
                const positionMatch = data.message.match(/top (\d+)/);
                if (positionMatch) setTopPosition(parseInt(positionMatch[1]));
            }
        } catch (err) {
            console.error("Error saving score:", err);
        }
    };

    const deleteUserAccount = async (userId) => {
        try {
            const response = await fetch(`${API_URL}/api/users/${userId}?confirmacion=no_acabo`, {
                method: "DELETE"
            });
            
            if (!response.ok) {
                throw new Error("Failed to delete account");
            }
            
            localStorage.removeItem('userId');
            return true;
        } catch (err) {
            console.error("Error deleting account:", err);
            return false;
        }
    };

    const handleLetterClick = (row, col) => {
        if (!showLetters || timeLeft === 0 || gameOver) return;
        const position = `${row}-${col}`;
        setSelectedLetters(prev => 
            prev.some(item => item.position === position) 
                ? prev.filter(item => item.position !== position) 
                : [...prev, { letter: grid[row][col], position }]
        );
    };

    const resetGame = () => {
        clearInterval(timerRef.current);
        const settings = difficultySettings[difficulty];
        setSelectedLetters([]);
        setGrid(generateRandomGrid(settings.gridSize, settings.vowelProbability));
        setShowLetters(true);
        setTimeLeft(settings.timeLimit);
        setScoreHistory([]);
        setUsedWords(new Set());
        setGameOver(false);
        setFinalScore(0);
        setTopPosition(null);
        setBestWord(null);
        setAccountDeleted(false);
        setTimePenalty(false);
    };

    const applyTimePenalty = () => {
        if (difficulty === 'hard' || difficulty === 'hardcore' || difficulty === 'dificil' || difficulty === 'diablo') {
            setTimePenalty(true);
            setTimeLeft(prev => {
                const newTime = prev - 5;
                if (newTime <= 0) {
                    setGameOver(true);
                    calculateFinalScore();
                    return 0;
                }
                return newTime;
            });
            
            setTimeout(() => setTimePenalty(false), 1000);
        }
    };

    const handleSubmit = async () => {
        if (gameOver) return;
        const userWord = selectedLetters.map(item => item.letter).join('').toLowerCase();
        
        if (userWord.length < 2) {
            toast.error(language === "es" ? "La palabra debe tener al menos 2 letras" : "Word must be at least 2 letters");
            return;
        }

        if (usedWords.has(userWord)) {
            toast.error(language === "es" ? "Palabra ya usada" : "Word already used");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/check`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    word: userWord, 
                    language: language,
                    difficulty: difficulty
                })
            });

            const data = await response.json();
            if (data.score) {
                setUsedWords(prev => new Set([...prev, userWord]));
                setScoreHistory(prev => [{ palabra: userWord.toUpperCase(), puntos: data.score }, ...prev]);
                setSelectedLetters([]);
            } else {
                toast.error(data.error || (language === "es" ? "Palabra no válida" : "Invalid word"));
                applyTimePenalty();
            }
        } catch (err) {
            console.error("Connection error:", err);
            toast.error(language === "es" ? "Error de conexión" : "Connection error");
        }
    };

    const fetchAchievements = async () => {
        try {
            const userId = localStorage.getItem("userId");
            
            if (!userId) {
                toast.error(language === "es" ? "Usuario no identificado" : "User not identified");
                return;
            }

            const response = await fetch(`${API_URL}/api/challenge_status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userId })
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Datos de logros recibidos:", data); // Para depuración
                
                const status = data.challenge_status;
                
                // Mapeo CORREGIDO (usando las mismas claves que la API)
                setAchievements([
                    {
                        id: "easy",
                        title: language === "es" ? "Principiante" : "Beginner",
                        description: language === "es" ? "Alcanza 40 puntos en modo Fácil" : "Score 40 points in Easy mode",
                        completed: status.easy.completed, // ← Clave "easy" (no "facil")
                        pointsNeeded: status.easy.points_needed
                    },
                    {
                        id: "normal",
                        title: language === "es" ? "Intermedio" : "Intermediate",
                        description: language === "es" ? "Alcanza 30 puntos en modo Normal" : "Score 30 points in Normal mode",
                        completed: status.normal.completed, // ← Clave "normal" (no "normal_2")
                        pointsNeeded: status.normal.points_needed
                    },
                    {
                        id: "hard",
                        title: language === "es" ? "Avanzado" : "Advanced",
                        description: language === "es" ? "Alcanza 20 puntos en modo Difícil" : "Score 20 points in Hard mode",
                        completed: status.hard.completed, // ← Clave "hard" (no "dificil")
                        pointsNeeded: status.hard.points_needed
                    },
                    {
                        id: "hardcore",
                        title: language === "es" ? "Experto" : "Expert",
                        description: language === "es" ? "Alcanza 10 puntos en modo Hardcore" : "Score 10 points in Hardcore mode",
                        completed: status.hardcore.completed, // ← Clave "hardcore" (no "diablo")
                        pointsNeeded: status.hardcore.points_needed
                    },
                    {
                        id: "all",
                        title: language === "es" ? "Maestro de Palabras" : "Word Master",
                        description: language === "es" ? "Completa todos los desafíos" : "Complete all challenges",
                        completed: status.easy.completed && 
                                status.normal.completed && 
                                status.hard.completed && 
                                status.hardcore.completed,
                        pointsNeeded: 0
                    }
                ]);
            } else {
                toast.error(language === "es" ? "Error al cargar logros" : "Error loading achievements");
            }
        } catch (err) {
            console.error("Error fetching achievements:", err);
            toast.error(language === "es" ? "Error de conexión" : "Connection error");
        }
    };

    const handleAchievementsClick = () => {
        if (!localStorage.getItem("userId")) {
            toast.info(language === "es" ? "Inicia sesión para ver tus logros" : "Log in to view your achievements");
            return;
        }
        fetchAchievements();
        setShowAchievements(true);
    };

    const AchievementsModal = () => (
        <div className="achievements-modal">
            <div className="achievements-content">
                <button 
                    className="close-achievements" 
                    onClick={() => setShowAchievements(false)}
                >
                    ×
                </button>
                <h2><FaTrophy /> {language === "es" ? "Tus Logros" : "Your Achievements"}</h2>
                <div className="achievements-list">
                    {achievements.map((achievement) => (
                        <div 
                            key={achievement.id} 
                            className={`achievement-item ${achievement.completed ? 'completed' : 'locked'}`}
                        >
                            <div className="achievement-icon">
                                {achievement.completed ? '✅' : '🔒'}
                            </div>
                            <div className="achievement-details">
                                <h3>{achievement.title}</h3>
                                <p>{achievement.description}</p>
                                {!achievement.completed && achievement.pointsNeeded > 0 && (
                                    <div className="progress-text">
                                        {language === "es" 
                                            ? `Te faltan ${achievement.pointsNeeded} puntos` 
                                            : `${achievement.pointsNeeded} points needed`}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const isLetterSelected = (row, col) => 
        selectedLetters.some(item => item.position === `${row}-${col}`);

    const formatTime = () => 
        `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`;

    const getGridStyle = () => ({
        gridTemplateColumns: `repeat(${difficultySettings[difficulty].gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${difficultySettings[difficulty].gridSize}, 1fr)`,
        ...(difficulty === "easy" || difficulty === "facil" ? { gap: '8px', padding: '10px' } : {})
    });

    const acceptHardcoreChallenge = () => {
        setShowHardcoreWarning(false);
        setShowLetters(true);
    };

    const HardcoreWarningModal = () => (
        <div className="hardcore-warning-modal">
            <div className="hardcore-warning-content">
                <h2 className="blood-text">
                    {language === "es" ? "¡ADVERTENCIA!" : "WARNING!"}
                </h2>
                <div className="warning-message">
                    {language === "es" ? 
                        "Estás a punto de jugar en modo HARDCORE. Si no adivinas al menos 10 palabras, tu cuenta será ELIMINADA permanentemente." : 
                        "You're about to play HARDCORE mode. If you don't guess at least 10 words, your account will be PERMANENTLY DELETED."}
                </div>
                <button className="accept-button" onClick={acceptHardcoreChallenge}>
                    {language === "es" ? "Acepto el desafío" : "I accept the challenge"}
                </button>
            </div>
        </div>
    );

    const AccountDeletedModal = () => (
        <div className="account-deleted-modal">
            <div className="deleted-content">
                <div className="skull-text">💀</div>
                <h2>{language === "es" ? "CUENTA ELIMINADA" : "ACCOUNT DELETED"}</h2>
                <div className="deleted-message">
                    {language === "es" ? 
                        "No lograste adivinar 10 palabras en el modo hardcore. Tu cuenta ha sido eliminada." : 
                        "You failed to guess 10 words in hardcore mode. Your account has been deleted."}
                </div>
                <button 
                    className="back-to-home-button" 
                    onClick={() => navigate("/")}
                >
                    {language === "es" ? "Volver al inicio" : "Back to home"}
                </button>
            </div>
        </div>
    );

    const GameOverModal = () => (
        <div className="game-over-modal">
            <div className="game-over-content">
                <h2>{language === "es" ? "¡Tiempo terminado!" : "Time's up!"}</h2>
                <div className="game-summary-container">
                    <div className="summary-card general-summary">
                        <h3>{language === "es" ? "Resumen" : "Summary"}</h3>
                        <div className="summary-item">
                            <span>{language === "es" ? "Puntaje Total:" : "Total Score:"}</span>
                            <span className="highlight">{finalScore}</span>
                        </div>
                        <div className="summary-item">
                            <span>{language === "es" ? "Palabras:" : "Words:"}</span>
                            <span className="highlight">{scoreHistory.length}</span>
                        </div>
                        {topPosition && (
                            <div className="summary-item top-position">
                                <span>🏆 {language === "es" ? "Top:" : "Rank:"}</span>
                                <span className="highlight">{topPosition}</span>
                            </div>
                        )}
                    </div>
                    {bestWord && (
                        <div className="summary-card best-word">
                            <h3>{language === "es" ? "Mejor Palabra" : "Best Word"}</h3>
                            <div className="best-word-display">
                                <span className="word">{bestWord.palabra}</span>
                                <span className="points">+{bestWord.puntos} pts</span>
                            </div>
                        </div>
                    )}
                </div>
                <div className="game-over-buttons">
                    <button className="reset-game-button" onClick={resetGame}>
                        {language === "es" ? "Jugar de nuevo" : "Play Again"}
                    </button>
                    <button 
                        className="achievements-button" 
                        onClick={handleAchievementsClick}
                    >
                        <FaTrophy /> {language === "es" ? "Ver Logros" : "View Achievements"}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="game-jsx-root">
            <audio ref={audioRef} loop />
            <ToastContainer position="top-center" autoClose={3000} />
            
            <div className="music-controls">
                <button onClick={toggleMusic} className="music-toggle-button">
                    {isPlaying ? <FaVolumeUp /> : <FaVolumeMute />}
                </button>
                <button onClick={() => setShowMusicMenu(!showMusicMenu)} className="music-menu-button">
                    <FaMusic />
                </button>
                {showMusicMenu && <MusicMenu />}
            </div>

            <div className="game-main-container">
                {(difficulty !== 'hardcore' && difficulty !== 'diablo') && (
                    <button className="game-home-button" onClick={() => navigate("/")}>
                        🏡 {language === "es" ? "Inicio" : "Home"}
                    </button>
                )}
                <ThemeToggle />
                
                {/* Avatar Section */}
                <div className="user-avatar-section">
                    <div className="avatar-img-wrapper" style={{ position: "relative", display: "inline-block" }}>
                        <label
                            className="avatar-upload-label"
                            style={{ cursor: uploading ? "not-allowed" : "pointer" }}
                        >
                            <img
                                src={avatarUrl || defaultAvatar}
                                alt="Avatar"
                                className="user-avatar-img"
                                style={{ opacity: uploading ? 0.5 : 1, transition: "filter 0.2s" }}
                            />
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleAvatarChange}
                                disabled={uploading}
                            />
                            <span className="avatar-hover-text">
                                {language === "es" ? "Cambiar imagen" : "Change image"}
                            </span>
                        </label>
                    </div>
                    <div className="user-name">{userName}</div>
                </div>

                {showHardcoreWarning && <HardcoreWarningModal />}
                {accountDeleted && <AccountDeletedModal />}
                {gameOver && !accountDeleted && <GameOverModal />}
                {showAchievements && <AchievementsModal />}

                <div className="game-content-center">
                    <div className="title-and-timer">
                        <h1 className="game-title">WordShake</h1>
                        {showLetters && (
                            <div className={`timer ${timePenalty ? 'time-penalty' : ''}`}>
                                {formatTime()}
                                {timePenalty && <span className="penalty-text">-5s</span>}
                            </div>
                        )}
                    </div>

                    <div className="game-main-content">
                        <div className="letter-grid-container" style={getGridStyle()}>
                            {grid.map((row, rowIndex) =>
                                row.map((letter, colIndex) => (
                                    <button
                                        key={`${rowIndex}-${colIndex}`}
                                        className={`letter-button 
                                            ${isLetterSelected(rowIndex, colIndex) ? 'selected' : ''} 
                                            ${!showLetters || gameOver ? 'hidden' : ''}`}
                                        onClick={() => handleLetterClick(rowIndex, colIndex)}
                                        disabled={gameOver || accountDeleted}
                                        style={difficulty === "easy" || difficulty === "facil" ? { 
                                            width: '40px', 
                                            height: '45px', 
                                            fontSize: '1.2rem' 
                                        } : {}}
                                    >
                                        {letter}
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="score-table-container">
                            <h3>{language === "es" ? "Puntuaciones" : "Scores"}</h3>
                            <div className="score-table-scroll">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>{language === "es" ? "Palabra" : "Word"}</th>
                                            <th>{language === "es" ? "Puntos" : "Points"}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scoreHistory.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.palabra}</td>
                                                <td>{item.puntos}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="word-display-container">
                        <h3>{language === "es" ? "Tu palabra:" : "Your word:"}</h3>
                        <div className="word-display">
                            {selectedLetters.length > 0 ? (
                                selectedLetters.map((item, index) => <span key={index}>{item.letter}</span>)
                            ) : (
                                <span className={!showLetters ? 'waiting' : ''}>
                                    {showLetters 
                                        ? (language === "es" ? "Selecciona letras" : "Select letters") 
                                        : (language === "es" ? "Presiona Comenzar" : "Press Start")}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="buttons-container">
                        <button 
                            className={`reset-game-button ${!showLetters ? 'start' : ''}`} 
                            onClick={resetGame}
                            disabled={accountDeleted}
                        >
                            {showLetters 
                                ? (language === "es" ? "Reiniciar" : "Reset") 
                                : (language === "es" ? "Comenzar" : "Start")}
                        </button>
                        {showLetters && !gameOver && !accountDeleted && (
                            <button 
                                className="submit-button" 
                                onClick={handleSubmit}
                                disabled={selectedLetters.length === 0}
                            >
                                {language === "es" ? "Ingresar" : "Submit"}
                            </button>
                        )}
                        {!gameOver && (
                            <button 
                                className="achievements-button" 
                                onClick={handleAchievementsClick}
                            >
                                <FaTrophy /> {language === "es" ? "Logros" : "Achievements"}
                            </button>
                        )}
                    </div>
                </div>

                <footer className="game-footer">
                    <p>Creado con ❤️ por Capi's INC</p>
                </footer>
            </div>
        </div>
    );
}

export default Game;