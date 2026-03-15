# 💰 Secure Finance Ledger System (Backend)

A professional-grade financial ledger backend built with the **MERN stack**. This system is designed to handle secure user authentication and high-integrity financial transactions with data consistency.

## 🌟 Key Technical Highlights
* **Robust Authentication:** Implements **JWT (JSON Web Tokens)** with a **Blacklist** system for secure, state-less sessions.
* **Financial Integrity:** Prevents "Double Spend" errors using **Idempotency Keys** for all transaction requests.
* **Complex Data Analysis:** Uses **MongoDB Aggregation Pipelines** to generate real-time monthly statements and balance summaries.
* **Security First:** Implements **Bcrypt.js** for one-way password hashing and protected API routes via custom middleware.

## 🛠️ Tech Stack
* **Language:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (using Mongoose ODM)
* **Security:** JWT, Bcrypt, Dotenv, Cookie-parser

## 📂 Project Structure
* `src/models`: Schemas for Users, Accounts, and Ledgers.
* `src/controllers`: Business logic for transfers and authentication.
* `src/middleware`: Authentication guards and input validation.
* `src/routes`: API endpoint definitions.

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/KrapanshuMundra/backend-ledger-system.git