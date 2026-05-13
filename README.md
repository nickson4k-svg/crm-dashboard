<div align="center">

# 📊 B2B CRM Dashboard with AI Analytics

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)

A modern, responsive Customer Relationship Management dashboard built to manage leads, track sales pipelines, and generate AI-powered insights. 

**[🔗 View Live Demo](https://nickson4k-svg.github.io/crm-dashboard/)**

<br />



</div>

---

## 🚀 About The Project

> **💡 Core Concept:** Demonstrating a full-stack approach to building a Single Page Application (SPA) using strictly Vanilla JavaScript, emphasizing clean architecture, state management, and seamless serverless integration.

The frontend focuses on complex DOM manipulation without relying on heavy frameworks, while the backend utilizes Node.js serverless functions to securely communicate with external AI APIs.

### ✨ Key Features
* **🤖 AI Sales Forecasting:** Integrated OpenRouter API via a secure Node.js microservice to analyze the current sales pipeline and generate smart revenue forecasts.
* **📈 Interactive Data Visualization:** Dynamic, responsive charts built with `Chart.js` for pipeline analysis.
* **👥 Lead Management (CRUD):** Add, edit, delete, and change the status of clients in real-time.
* **💾 State Management:** Custom state management utilizing `localStorage` for persistent data across sessions.
* **🎨 Modern UI/UX:** Responsive layout utilizing CSS Grid and Flexbox, featuring a sleek dark mode interface, modal windows, and smooth transitions.
* **🔒 Secure Architecture:** Backend deployed on Vercel as a Serverless Function to hide API keys and handle CORS configurations safely.

## 🛠️ Tech Stack

| Category | Technologies Used |
| :--- | :--- |
| **Frontend Layout** | HTML5 & Semantic markup, CSS3 (Custom properties, Grid, Flexbox, Animations) |
| **Logic & State** | Vanilla JavaScript (ES6+, Async/Await, Fetch API) |
| **Data Visualization** | Chart.js |
| **Backend Services** | Node.js & Express.js, Vercel Serverless Functions |
| **External APIs** | OpenRouter API (AI LLM integration) |

<details>
  <summary><b>📂 Click to expand: Core Architecture Overview</b></summary>
  <br>

  * `script.js`: Core business logic, state management, API requests, and data rendering.
  * `ui-navi.js`: SPA routing and navigation logic, DOM class toggling (Separation of Concerns).
  * `style.css`: Modular and responsive styling.
  * `/api/forecast.js`: Node.js serverless function acting as a secure proxy for AI requests.
</details>
