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

Route::get('/forgot-password', function () {
    return Inertia::render('Auth/ForgotPassword');
})->name('password.request');

Route::post('/forgot-password', function () {
    // Placeholder: The actual backend controller is missing. 
    // This allows the route to exist for Ziggy.
    return redirect()->back()->with('status', 'Password reset functionality requires Firebase implementation or Laravel controllers.');
})->name('password.email');

// ------------------------------
// After login → Admin Dashboard
// ------------------------------
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->name('dashboard');

//Register to verify email page
Route::get('/verify-email', function () {
    return Inertia::render('Auth/VerifyEmail');
})->name('verify-email');

