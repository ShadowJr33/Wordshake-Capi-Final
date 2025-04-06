import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";

function Game() {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedLetters, setSelectedLetters] = useState([]);
    const [grid, setGrid] = useState(generateRandomGrid());
    const [showLetters, setShowLetters] = useState(false);
    const [scoreHistory, setScoreHistory] = useState([]);
    const [timeLeft, setTimeLeft] = useState(180);
    const [gameOver, setGameOver] = useState(false);
    const [finalScore, setFinalScore] = useState(0);
    const timerRef = useRef(null);
    const [usedWords, setUsedWords] = useState(new Set());
    const [language, setLanguage] = useState(location.state?.language || "es");

    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.1;
        }
    }, []);

    const API_URL = import.meta.env.VITE_API_URL;

    const toggleMusic = () => {
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

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

    function generateRandomGrid() {
        const vowels = "AEIOU";
        const consonants = "BCDFGHJKLMNPQRSTVWXYZ";
        return Array(5).fill().map(() =>
            Array(5).fill().map(() => {
                const letterPool = Math.random() < 0.4 ? vowels : consonants;
                return letterPool[Math.floor(Math.random() * letterPool.length)];
            })
        );
    }

    const calculateFinalScore = () => {
        const total = scoreHistory.reduce((sum, item) => sum + item.puntos, 0);
        setFinalScore(total);
    };

    const handleLetterClick = (row, col) => {
        if (!showLetters || timeLeft === 0 || gameOver) return;
        const letter = grid[row][col];
        const position = `${row}-${col}`;
        setSelectedLetters(prev => {
            if (prev.some(item => item.position === position)) {
                return prev.filter(item => item.position !== position);
            }
            return [...prev, { letter, position }];
        });
    };

    const resetGame = () => {
        clearInterval(timerRef.current);
        setSelectedLetters([]);
        setGrid(generateRandomGrid());
        setShowLetters(true);
        setTimeLeft(180);
        setScoreHistory([]);
        setUsedWords(new Set());
        setGameOver(false);
        setFinalScore(0);
    };

    const handleSubmit = async () => {
        if (gameOver) return;
        
        const userWord = selectedLetters.map(item => item.letter).join('').toLowerCase();
        
        if (userWord.length < 2) {
            alert(language === "es" ? "La palabra debe tener al menos 2 letras" : "Word must be at least 2 letters long");
            return;
        }

        if (usedWords.has(userWord)) {
            alert(language === "es" ? "Ya has ingresado esta palabra antes" : "You've already used this word");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/check`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    word: userWord, 
                    language: language
                }),
            });

            const data = await response.json();

            if (data.score) {
                setUsedWords(prev => new Set(prev).add(userWord));
                setScoreHistory(prev => [
                    { palabra: userWord.toUpperCase(), puntos: data.score },
                    ...prev
                ]);
                setSelectedLetters([]);
            } else {
                alert(data.error || (language === "es" ? "Palabra no válida" : "Invalid word"));
            }
        } catch (err) {
            console.error("Error de conexión:", err);
            alert(language === "es" ? "Error al conectar con el servidor" : "Server connection error");
        }
    };

    const isLetterSelected = (row, col) => {
        return selectedLetters.some(item => item.position === `${row}-${col}`);
    };

    const formatTime = () => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="game-jsx-root">
            <audio ref={audioRef} loop src="/Enemy (from the series Arcane League of Legends).mp3" />

            <div className="game-main-container">
                <button className="game-home-button" onClick={() => navigate("/")}>
                    🏡 {language === "es" ? "Inicio" : "Home"}
                </button>

                {gameOver && (
                    <div className="game-over-modal">
                        <div className="game-over-content">
                            <h2 style={{ color: 'black' }}>
                                {language === "es" ? "¡Se ha acabado el tiempo!" : "Time's up!"}
                            </h2>
                            <p style={{ color: 'black' }}>
                                {language === "es" ? "Tu puntaje total es:" : "Your total score is:"} {finalScore}
                            </p>
                            <button 
                                className="reset-game-button"
                                onClick={resetGame}
                            >
                                {language === "es" ? "Jugar de nuevo" : "Play again"}
                            </button>
                        </div>
                    </div>
                )}

                <div className="game-content-center">
                    <div className="title-and-timer">
                        <h1 className="game-title">WordShake</h1>
                        {showLetters && <div className="timer">{formatTime()}</div>}
                        <button onClick={toggleMusic} className="music-toggle-button">
                            {isPlaying ? <FaVolumeUp /> : <FaVolumeMute />}
                        </button>
                    </div>

                    <div className="game-main-content">
                        <div className="letter-grid-container">
                            {grid.map((row, rowIndex) =>
                                row.map((letter, colIndex) => (
                                    <button
                                        key={`${rowIndex}-${colIndex}`}
                                        className={`letter-button ${isLetterSelected(rowIndex, colIndex) ? 'selected' : ''} ${!showLetters || gameOver ? 'hidden' : ''}`}
                                        onClick={() => handleLetterClick(rowIndex, colIndex)}
                                        disabled={gameOver}
                                    >
                                        {letter}
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="score-table-container">
                            <h3 className="score-table-title">
                                {language === "es" ? "Puntuaciones" : "Scores"}
                            </h3>
                            <div className="score-table-scroll">
                                <table className="score-table">
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
                        <h3 className="word-display-title">
                            {language === "es" ? "Tu palabra:" : "Your word:"}
                        </h3>
                        <div className="word-display">
                            {selectedLetters.length > 0 ? (
                                selectedLetters.map((item, index) => (
                                    <span key={index}>{item.letter}</span>
                                ))
                            ) : (
                                <span className={`word-display-placeholder ${!showLetters ? 'waiting' : ''}`}>
                                    {showLetters ? 
                                        (language === "es" ? "Selecciona letras" : "Select letters") : 
                                        (language === "es" ? "Presiona Comenzar" : "Press Start")}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="buttons-container">
                        <button
                            className={`reset-game-button ${!showLetters ? 'start' : ''}`}
                            onClick={resetGame}
                        >
                            {showLetters ? 
                                (language === "es" ? "Reiniciar Juego" : "Reset Game") : 
                                (language === "es" ? "Comenzar Juego" : "Start Game")}
                        </button>

                        {showLetters && !gameOver && (
                            <button
                                className="submit-button"
                                onClick={handleSubmit}
                                disabled={selectedLetters.length === 0 || timeLeft === 0}
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