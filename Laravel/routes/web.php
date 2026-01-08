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

// Reports List
Route::get('/reports', function () {
    return Inertia::render('Reports');
})->name('reports.index');

// Report Detail
Route::get('/reports/{reportType}/{reportId}', function ($reportType, $reportId) {
    // Pass the report ID and type as props to the React component
    return Inertia::render('ReportDetail', ['reportId' => $reportId, 'reportType' => $reportType]);
})->name('report.view');

// Feedbacks List
Route::get('/feedback', function () {
    return Inertia::render('Feedbacks');
})->name('feedbacks.index');

// Feedback Detail
Route::get('/feedback/{id}', function ($id) {
    return Inertia::render('FeedbackDetail', ['feedbackId' => $id]);
})->name('feedback.view');
