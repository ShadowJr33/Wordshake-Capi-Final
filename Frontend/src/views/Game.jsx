import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaVolumeUp, FaVolumeMute } from "react-icons/fa";

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

    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Agrega esto al inicio del archivo, después de los imports
    const VALID_LEVELS = {
        en: ['easy', 'normal', 'hard', 'hardcore'],
        es: ['facil', 'normal_2', 'dificil', 'diablo']
    };

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.1;
        }
    }, []);

    const API_URL = import.meta.env.VITE_API_URL;

    // Configuración según dificultad
    const difficultySettings = {
        easy: {
            gridSize: 6,
            timeLimit: 180,
            vowelProbability: 0.4
        },
        normal: {
            gridSize: 5,
            timeLimit: 180,
            vowelProbability: 0.35
        },
        hard: {
            gridSize: 4,
            timeLimit: 120,
            vowelProbability: 0.3
        },
        hardcore: {
            gridSize: 4,
            timeLimit: 60,
            vowelProbability: 0.25
        },
        facil: {
            gridSize: 6,
            timeLimit: 180,
            vowelProbability: 0.4
        },
        normal_2: {
            gridSize: 5,
            timeLimit: 180,
            vowelProbability: 0.35
        },
        dificil: {
            gridSize: 4,
            timeLimit: 120,
            vowelProbability: 0.3
        },
        diablo: {
            gridSize: 4,
            timeLimit: 60,
            vowelProbability: 0.25
        }
    };

    useEffect(() => {
        // Inicializar el juego con la configuración de dificultad
        const settings = difficultySettings[difficulty];
        setTimeLeft(settings.timeLimit);
        setGrid(generateRandomGrid(settings.gridSize, settings.vowelProbability));
    }, [difficulty]);

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

    // En el componente Game.jsx, modifica la función calculateFinalScore así:

    const calculateFinalScore = async () => {
        const total = scoreHistory.reduce((sum, item) => sum + item.puntos, 0);
        setFinalScore(total);
        
        try {
            const userId = localStorage.getItem('userId');
            
            if (!userId || isNaN(parseInt(userId))) {
                console.error("ID de usuario inválido en localStorage:", userId);
                // Eliminamos el alert aquí
                return;
            }
    
            if (!VALID_LEVELS[language].includes(difficulty)) {
                console.error(`Nivel ${difficulty} no válido para idioma ${language}`);
                // Eliminamos el alert aquí
                return;
            }
    
            const requestBody = {
                user_id: parseInt(userId),
                language: language,
                level: difficulty,
                score: total
            };
    
            const response = await fetch(`${API_URL}/api/update_score`, {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(requestBody)
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Error en la respuesta:", errorData);
                // Eliminamos el alert aquí
                return;
            }
    
            const data = await response.json();
            
            if (data.message && data.message.includes('top')) {
                const positionMatch = data.message.match(/top (\d+)/);
                if (positionMatch) {
                    setTopPosition(parseInt(positionMatch[1]));
                    // Eliminamos el alert aquí ya que se mostrará en el modal
                }
            }
        } catch (err) {
            console.error("Error al guardar puntaje:", err);
            // Eliminamos el alert aquí
        }
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
                    language: language,
                    difficulty: difficulty
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

    const getGridStyle = () => {
        const settings = difficultySettings[difficulty];
        return {
            gridTemplateColumns: `repeat(${settings.gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${settings.gridSize}, 1fr)`,
            ...(difficulty === "easy" || difficulty === "facil" ? {
                gap: '8px',
                padding: '10px'
            } : {})
        };
    };

    const GameOverModal = () => (
        <div className="game-over-modal">
            <div className="game-over-content">
                <h2 style={{ color: 'black' }}>
                    {language === "es" ? "¡Se ha acabado el tiempo!" : "Time's up!"}
                </h2>
                <p style={{ color: 'black' }}>
                    {language === "es" ? "Tu puntaje total es:" : "Your total score is:"} {finalScore}
                </p>
                <p style={{ color: 'black' }}>
                    {language === "es" ? "Dificultad:" : "Difficulty:"} {difficulty}
                </p>
                {topPosition && (
                    <p style={{ color: 'black', fontWeight: 'bold' }}>
                        {language === "es" 
                            ? `¡Estás en el puesto ${topPosition} del top 10!` 
                            : `You're in position ${topPosition} of the top 10!`}
                    </p>
                )}
                <button 
                    className="reset-game-button"
                    onClick={resetGame}
                >
                    {language === "es" ? "Jugar de nuevo" : "Play again"}
                </button>
            </div>
        </div>
    );

    return (
        <div className="game-jsx-root">
            <audio ref={audioRef} loop src="/Enemy (from the series Arcane League of Legends).mp3" />

            <div className="game-main-container">
                <button className="game-home-button" onClick={() => navigate("/")}>
                    🏡 {language === "es" ? "Inicio" : "Home"}
                </button>

                {gameOver && <GameOverModal />}

                <div className="game-content-center">
                    <div className="title-and-timer">
                        <h1 className="game-title">WordShake</h1>
                        {showLetters && (
                            <div className="timer-container">
                                <div className="timer">{formatTime()}</div>
                            </div>
                        )}
                        <button onClick={toggleMusic} className="music-toggle-button">
                            {isPlaying ? <FaVolumeUp /> : <FaVolumeMute />}
                        </button>
                    </div>

                    <div className="game-main-content">
                        <div className="letter-grid-container" style={getGridStyle()}>
                            {grid.map((row, rowIndex) =>
                                row.map((letter, colIndex) => (
                                    <button
                                        key={`${rowIndex}-${colIndex}`}
                                        className={`letter-button ${isLetterSelected(rowIndex, colIndex) ? 'selected' : ''} ${!showLetters || gameOver ? 'hidden' : ''}`}
                                        onClick={() => handleLetterClick(rowIndex, colIndex)}
                                        disabled={gameOver}
                                        style={
                                            (difficulty === "easy" || difficulty === "facil") ? {
                                                width: '40px',  
                                                height: '45px', 
                                                fontSize: '1.2rem' 
                                            } : {}
                                        }
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