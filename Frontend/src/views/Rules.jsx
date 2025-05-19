import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../components/ThemeContext";
import React from 'react';

function Rules() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const [language, setLanguage] = useState("en");

    const translations = {
        en: {
            mainTitleRules: "Rules",
            howToPlayTitle: "How to Play Wordshake",
            rule1: "You have 3 minutes to find as many words as possible.",
            rule2: "Words must be at least 3 letters long.",
            rule3: "Each letter can only be used once per word.",
            rule4: "Submit your words before the time runs out.",
            rule5: "Points are awarded based on the length of the word.",
            scoringTitle: "Scoring",
            scoringDescription: "The points are awarded based on the length of the word as follows:",
            score3Letters: "3-letter words: 1 point",
            score4Letters: "4-letter words: 2 points",
            score5Letters: "5-letter words: 3 points",
            score6Letters: "6-letter words: 4 points",
            score7Letters: "7-letter words: 5 points",
            score8Letters: "8 or more letters: 11 points",
            maximizeScore: "Try to find the longest words to maximize your score!",
            difficultyTitle: "Difficulty Levels",
            easy: "Easy: 4 minutes to find words and no time is deducted for wrong words.",
            medium: "Medium: 3 minutes to find words and no time is deducted for wrong words.",
            hard: "Hard: 2 minutes to find words and time is deducted for wrong words.",
            diablo: "Hardcore: 1 minute and if you don't score 10 points, your account will be deleted.",
        },
        es: {
            mainTitleRules: "Reglas",
            howToPlayTitle: "Cómo Jugar Wordshake",
            rule1: "Tienes 3 minutos para encontrar tantas palabras como sea posible.",
            rule2: "Las palabras deben tener al menos 3 letras.",
            rule3: "Cada letra solo se puede usar una vez por palabra.",
            rule4: "Envía tus palabras antes de que se acabe el tiempo.",
            rule5: "Los puntos se otorgan según la longitud de la palabra.",
            scoringTitle: "Puntuación",
            scoringDescription: "Los puntos se otorgan según la longitud de la palabra de la siguiente manera:",
            score3Letters: "Palabras de 3 letras: 1 punto",
            score4Letters: "Palabras de 4 letras: 2 puntos",
            score5Letters: "Palabras de 5 letras: 3 puntos",
            score6Letters: "Palabras de 6 letras: 4 puntos",
            score7Letters: "Palabras de 7 letras: 5 puntos",
            score8Letters: "8 o más letras: 11 puntos",
            maximizeScore: "¡Intenta encontrar las palabras más largas para maximizar tu puntuación!",
            difficultyTitle: "Niveles de Dificultad",
            easy: "Fácil: 4 minutos para buscar palabras y no se resta tiempo por palabras incorrectas.",
            medium: "Medio: 3 minutos para buscar palabras y no se resta tiempo por palabras incorrectas.",
            hard: "Difícil: 2 minutos para buscar palabras y se resta tiempo por palabras incorrectas.",
            diablo: "Diablo: 1 minuto y si no llegas a 10 puntos se elimina la cuenta.",
        },
    };

    const t = translations[language];

    useEffect(() => {
        const link = document.getElementById("theme-stylesheet");
        if (link) {
            const newHref = theme === "claro" ? "/styles/styleclaro.css" : "/styles/styleoscuro.css";
            link.setAttribute("href", newHref + "?v=" + new Date().getTime());
        }
    }, [theme]);

    const toggleLanguage = () => {
        setLanguage((prevLang) => (prevLang === "en" ? "es" : "en"));
    };

    return (
        <div className="rules">
            <button className="ghost" onClick={toggleLanguage}
                style={{ position: "absolute", top: "10px", right: "10px" }}>
                {language === "en" ? "EN" : "ES"}
            </button>

            <ThemeToggle />

            <button className="ghost" onClick={() => navigate("/")}
                style={{ position: "absolute", top: "10px", left: "10px" }}>
                X
            </button>

            <h2>{t.mainTitleRules}</h2>
            <div className="container">
                <h2>{t.howToPlayTitle}</h2>
                <ol>
                    <li>{t.rule1}</li>
                    <li>{t.rule2}</li>
                    <li>{t.rule3}</li>
                    <li>{t.rule4}</li>
                    <li>{t.rule5}</li>
                </ol>

                <h3>{t.scoringTitle}</h3>
                <p>{t.scoringDescription}</p>
                <ul>
                    <li>{t.score3Letters}</li>
                    <li>{t.score4Letters}</li>
                    <li>{t.score5Letters}</li>
                    <li>{t.score6Letters}</li>
                    <li>{t.score7Letters}</li>
                    <li>{t.score8Letters}</li>
                </ul>
                <p>{t.maximizeScore}</p>

                <h3>{t.difficultyTitle}</h3>
                <ul>
                    <li>{t.easy}</li>
                    <li>{t.medium}</li>
                    <li>{t.hard}</li>
                    <li>{t.diablo}</li>
                </ul>
            </div>
        </div>
    );
}

export default Rules;
