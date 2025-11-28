<?php

use Inertia\Inertia;
use Illuminate\Support\Facades\Route;

// Welcome page - entry point
Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('welcome');
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

//Register to verify email page
Route::get('/verify-email', function () {
    return Inertia::render('Auth/VerifyEmail');
})->name('verify-email');

