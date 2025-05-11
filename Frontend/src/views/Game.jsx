import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaVolumeUp, FaVolumeMute, FaMusic } from "react-icons/fa";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../components/ThemeContext";

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
    
    // Estados para el sistema de música
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
    }, []);

    useEffect(() => {
        const settings = difficultySettings[difficulty];
        setTimeLeft(settings.timeLimit);
        setGrid(generateRandomGrid(settings.gridSize, settings.vowelProbability));
        
        // Show hardcore warning if applicable
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
                console.error("ID de usuario inválido:", userId);
                return;
            }
    
            if (!VALID_LEVELS[language].includes(difficulty)) {
                console.error(`Nivel ${difficulty} no válido para idioma ${language}`);
                return;
            }
    
            // Check if hardcore mode and less than 10 words
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
                console.error("Error en la respuesta:", errorData);
                return;
            }
    
            const data = await response.json();
            if (data.message?.includes('top')) {
                const positionMatch = data.message.match(/top (\d+)/);
                if (positionMatch) setTopPosition(parseInt(positionMatch[1]));
            }
        } catch (err) {
            console.error("Error al guardar puntaje:", err);
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
    };

    const handleSubmit = async () => {
        if (gameOver) return;
        const userWord = selectedLetters.map(item => item.letter).join('').toLowerCase();
        
        if (userWord.length < 2) {
            alert(language === "es" ? "La palabra debe tener al menos 2 letras" : "Word must be at least 2 letters");
            return;
        }

        if (usedWords.has(userWord)) {
            alert(language === "es" ? "Palabra ya usada" : "Word already used");
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
                alert(data.error || (language === "es" ? "Palabra no válida" : "Invalid word"));
            }
        } catch (err) {
            console.error("Error de conexión:", err);
            alert(language === "es" ? "Error de conexión" : "Connection error");
        }
    };

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
                <button className="reset-game-button" onClick={resetGame}>
                    {language === "es" ? "Jugar de nuevo" : "Play Again"}
                </button>
            </div>
        </div>
    );

    return (
        <div className="game-jsx-root">
            <audio ref={audioRef} loop />
            
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
                <button className="game-home-button" onClick={() => navigate("/")}>
                    🏡 {language === "es" ? "Inicio" : "Home"}
                </button>
                <ThemeToggle />
                
                {showHardcoreWarning && <HardcoreWarningModal />}
                {accountDeleted && <AccountDeletedModal />}
                {gameOver && !accountDeleted && <GameOverModal />}

                <div className="game-content-center">
                    <div className="title-and-timer">
                        <h1 className="game-title">WordShake</h1>
                        {showLetters && <div className="timer">{formatTime()}</div>}
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