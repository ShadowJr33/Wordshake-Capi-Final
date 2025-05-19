import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import React from 'react';
import './styles/styles.css';

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
