<a id="readme-top"></a>

<div align="center">

# <img src="https://api.iconify.design/lucide/layout-dashboard.svg?color=%237C4DFF" width="32" align="text-bottom"> B2B CRM Dashboard with AI Analytics

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?logo=vercel&logoColor=white)
![GitHub last commit](https://img.shields.io/github/last-commit/nickson4k-svg/crm-dashboard?color=%237C4DFF)
![GitHub repo size](https://img.shields.io/github/repo-size/nickson4k-svg/crm-dashboard?color=%237C4DFF)

A modern, responsive Customer Relationship Management dashboard built to manage leads, track sales pipelines, and generate AI-powered insights. 

**[<img src="https://api.iconify.design/lucide/external-link.svg?color=%237C4DFF" width="16" align="text-bottom"> View Live Demo](https://nickson4k-svg.github.io/crm-dashboard/)**

<br />

</div>

---

## <img src="https://api.iconify.design/lucide/rocket.svg?color=%237C4DFF" width="26" align="text-bottom"> About The Project

> **<img src="https://api.iconify.design/lucide/lightbulb.svg?color=%237C4DFF" width="18" align="text-bottom"> Core Concept:** Demonstrating a full-stack approach to building a Single Page Application (SPA) using strictly Vanilla JavaScript, emphasizing clean architecture, state management, and seamless serverless integration.

The frontend focuses on complex DOM manipulation without relying on heavy frameworks, while the backend utilizes Node.js serverless functions to securely communicate with external AI APIs.

### <img src="https://api.iconify.design/lucide/sparkles.svg?color=%237C4DFF" width="22" align="text-bottom"> Key Features

* <img src="https://api.iconify.design/lucide/bot.svg?color=%237C4DFF" width="20" align="text-bottom"> **AI Sales Forecasting:** Integrated OpenRouter API via a secure Node.js microservice to analyze the current sales pipeline and generate smart revenue forecasts.
* <img src="https://api.iconify.design/lucide/bar-chart-3.svg?color=%237C4DFF" width="20" align="text-bottom"> **Interactive Data Visualization:** Dynamic, responsive charts built with `Chart.js` for pipeline analysis.
* <img src="https://api.iconify.design/lucide/users.svg?color=%237C4DFF" width="20" align="text-bottom"> **Lead Management (CRUD):** Add, edit, delete, and change the status of clients in real-time.
* <img src="https://api.iconify.design/lucide/database.svg?color=%237C4DFF" width="20" align="text-bottom"> **State Management:** Custom state management utilizing `localStorage` for persistent data across sessions.
* <img src="https://api.iconify.design/lucide/layout-template.svg?color=%237C4DFF" width="20" align="text-bottom"> **Modern UI/UX:** Responsive layout utilizing CSS Grid and Flexbox, featuring a sleek dark mode interface, modal windows, and smooth transitions.
* <img src="https://api.iconify.design/lucide/shield-check.svg?color=%237C4DFF" width="20" align="text-bottom"> **Secure Architecture:** Backend deployed on Vercel as a Serverless Function to hide API keys and handle CORS configurations safely.

## <img src="https://api.iconify.design/lucide/layers.svg?color=%237C4DFF" width="26" align="text-bottom"> Tech Stack

| Category | Technologies Used |
| :--- | :--- |
| **Frontend Layout** | HTML5 & Semantic markup, CSS3 (Custom properties, Grid, Flexbox, Animations) |
| **Logic & State** | Vanilla JavaScript (ES6+, Async/Await, Fetch API) |
| **Data Visualization** | Chart.js |
| **Backend Services** | Node.js & Express.js, Vercel Serverless Functions |
| **External APIs** | OpenRouter API (AI LLM integration) |

## <img src="https://api.iconify.design/lucide/folder-tree.svg?color=%237C4DFF" width="26" align="text-bottom"> Architecture Overview

```text
📦 crm-dashboard
 ┣ 📂 api
 ┃ ┗ 📜 forecast.js      # Serverless function proxy (Vercel)
 ┣ 📜 index.html         # Semantic HTML entry point
 ┣ 📜 script.js          # Core business logic, API calls & State Management
 ┣ 📜 ui-navi.js         # SPA routing & UI manipulation
 ┗ 📜 style.css          # CSS Variables, Grid/Flexbox layouts
