# Pipeline: Analytics Modeling Reviewer

An interactive study reviewer for **Fundamentals of Analytics Modeling**, covering all nine modules:

1. Exploratory Data Analysis
2. Data Preparation
3. Introduction to Regression Analysis
4. Time Series and Forecasting
5. Association Rule Mining
6. K-Means Clustering
7. Regression Algorithms (KNN, Decision Tree, SVR)
8. Classification Algorithms (KNN, Decision Tree, LDA)
9. Text Analytics and BERT

Each module has a 30-second summary, lessons with three explanation depths, an interactive lab, common traps (including slide errors), a quiz with explanations, and a cheat sheet. There are also flashcards with spaced repetition, a mixed exam mode, and study tools (compare tables, formula bank with calculators, method wizard, glossary).

## Running it

It is a plain static site: no build step and no dependencies.

- **Locally:** open `index.html` through any static server, e.g. `python -m http.server 8000`, then visit http://localhost:8000.
- **Hosting:** deploy the repository root as a static site (Render, GitHub Pages, Netlify, etc.). `render.yaml` is included for Render.

## Structure

```
index.html          page shell and styles
app.js              routing, progress, quizzes, flashcards, tools
labs.js             the nine interactive labs
content/m1.js … m9.js   module content (lessons, traps, quiz, cards, cheat sheet)
content/extras.js   glossary, compare tables, formulas, method wizard
```

Progress (XP, streak, quiz history, flashcard schedule) is stored in the browser's `localStorage`, so it stays on the device and browser you study on.
