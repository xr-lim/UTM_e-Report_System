<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

// Redirect root to login page
Route::get('/', function () {
    return redirect()->route('login');
});
// ------------------------------
// Authentication Pages (React)
// ------------------------------

Route::get('/login', function () {
    return Inertia::render('Auth/Login');
})->name('login');

Route::get('/register', function () {
    return Inertia::render('Auth/Register');
})->name('register');

//Register to verify email page
Route::get('/verify-email', function () {
    return Inertia::render('Auth/VerifyEmail');
})->name('verify-email');

// ------------------------------
// After login → Admin Dashboard
// ------------------------------
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->name('dashboard');

Route::get('/reports', function () {
    return Inertia::render('Reports');
})->name('reports.index');

Route::get('/reports/{reportId}', function ($reportId) {
    // Pass the report ID as a prop to the React component
    return Inertia::render('ReportDetail', ['reportId' => $reportId]);
})->name('report.view');
