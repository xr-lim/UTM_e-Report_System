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

// ------------------------------
// After login → Admin Dashboard
// ------------------------------
Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->name('dashboard');

