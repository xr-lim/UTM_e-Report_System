# 💻 UTM E-Report System Website

This is the administrative platform for the UTM E-Report System, built with **Laravel, React, Inertia.js, and Firebase**. The website allows administrators and authorities to view, manage, and analyze reports submitted via the accompanying Flutter mobile application.

---

## ✨ Features

* **Firebase Authentication:** Secure login for Admin and Authority users using Firebase Auth (email/password and Google SSO).
* **Real-time Reporting:** Fetches vehicle violation and suspicious activity reports in real-time directly from **Cloud Firestore**.
* **Role-Based Authorization:** Content access and editing rights are controlled by roles (`admin`, `authority`) retrieved from the Firestore `/users` collection.
* **Dynamic Data View:** Displays a dashboard with key performance indicators (KPIs), incident distribution, and a live feed of recent reports.
* **Advanced Analytics:** Placeholder for future implementation of statistical tools like interactive heatmaps based on report locations.

---

## 📂 Project Structure (Frontend Focus)

The primary logic for authentication and data fetching resides on the frontend within the React/Inertia structure.

```
UTM_E-REPORT_SYSTEM/
├── app/
│   ├── Http/
│   └── Providers/
├── config/
├── database/
├── public/
├── resources/
│   ├── css/
│   ├── js/
│   │   ├── Components/
│   │   ├── Layouts/
│   │   ├── Pages/         # React pages (Dashboard.jsx, Auth/*.jsx)
│   │   ├── firebaseConfig.js # Firebase initialization
│   │   └── app.jsx        # Inertia/React entry point
├── routes/
│   ├── api.php
│   └── web.php            # Inertia routes (e.g., /dashboard, /login)
├── .env
├── composer.json
└── package.json
```

---

## 🚀 Setup

The project requires PHP, Composer (for Laravel dependencies), and Node.js/npm (for JavaScript dependencies).

### 1. Prerequisites

Ensure you have the following installed:

* **PHP:** Version 8.1 or higher
* **Composer**
* **Node.js & npm**
* **Firebase Project:** Access to the Firestore database and API keys.

### 2. Initial Setup

Navigate to the project root and install both backend and frontend dependencies.

```bash
# Install PHP dependencies
composer install

# Install Node dependencies
npm install
```

### 3. Environment Configuration

Create your local environment file and configure Firebase API keys.

```bash
cp .env.example .env
php artisan key:generate
php artisan migrate
```

In your `.env` file, ensure you have the following keys populated with your Firebase project configuration:

```env
# General Laravel Config
APP_NAME="UTM E-Report System"
APP_ENV=local
APP_KEY=...
APP_URL=http://localhost

# FIREBASE CONFIGURATION (FOR FRONTEND)
# These values must match the credentials in your Firebase web app settings
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
```

### 4. Link Firebase Configuration

Verify that the keys set in `.env` are correctly imported into your frontend configuration file:

* **`resources/js/firebaseConfig.js`** should read these environment variables prefixed with `VITE_`.

---

## ⚡ Running the Website

You need to run both the Laravel server and the Vite development server concurrently.

### 1. Start Laravel Server

```bash
php artisan serve
```

### 2. Start Vite Development Server

Run the frontend development server to compile and serve the React/Inertia assets:

```bash
npm run dev
```

The application will typically be accessible at `http://127.0.0.1:8000` (or the port specified by `php artisan serve`).

---

## 🔐 Authorization Notes

This application uses Firebase as the sole source of truth for authentication and user roles.

* **Login:** The `Login.jsx` and `Register.jsx` pages bypass the traditional Laravel database and communicate directly with Firebase Authentication.
* **Role Check:** User authorization (checking for `admin` or `authority` role) is performed client-side by fetching the `role` field from the Firestore `/users/{uid}` document immediately after Firebase login.

For production API endpoints (e.g., if you implement server-side statistics), you must implement a custom **Laravel Middleware** to verify the Firebase ID Token sent from the frontend.
