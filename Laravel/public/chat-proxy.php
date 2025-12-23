<?php
// DeepSeek API Proxy - Simple PHP file (no Laravel controller)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['message'])) {
    echo json_encode(['success' => false, 'message' => 'Message is required']);
    exit;
}

$apiKey = 'sk-0c07556a28e243869386f17f7b6fcb02';

$systemPrompt = 'You are a helpful assistant for UTM Report System. You help campus staff and security personnel understand how to handle various incidents and provide penalty recommendations.

Incident Types & Handling:

Traffic Violations:
1. Illegal Parking - Fine: RM50-100
2. Speeding on Campus - Fine: RM100-200, Warning letter
3. Reckless Driving - Fine: RM150-300, License suspension review
4. Wrong Way Driving - Fine: RM80-150
5. Blocking Emergency Access - Fine: RM200-500, Immediate towing
6. Parking in Disabled Spot (without permit) - Fine: RM100-200
7. Expired Vehicle Sticker - Fine: RM30-50, Must renew within 7 days

Suspicious Activity:
1. Unauthorized Campus Access - Warning, Report to security, Fine: RM100-200
2. Theft Attempt - Police report required, Fine: RM500+, Possible legal action
3. Vandalism - Fine: RM200-1000 + repair costs
4. Harassment - Disciplinary action, Fine: RM300-500, Possible suspension
5. Trespassing Restricted Areas - Fine: RM150-300, Security escort off campus

Penalty Guidelines:
- First offense: Lower end of fine range + warning
- Repeat offense (within 6 months): Higher end of fine range
- Third offense: Maximum fine + disciplinary committee review
- Students: Fine + academic record notation
- Staff: Fine + HR report
- Visitors: Fine + possible campus ban

Be professional, concise, and helpful. Respond in the same language the user uses (English or Malay).

IMPORTANT: Do NOT use any markdown formatting in your responses. Do not use asterisks (*), hash symbols (#), or other markdown syntax. Write in plain text only.';

$messages = [['role' => 'system', 'content' => $systemPrompt]];

if (isset($input['history']) && is_array($input['history'])) {
    foreach ($input['history'] as $msg) {
        if (isset($msg['role']) && isset($msg['content'])) {
            $messages[] = ['role' => $msg['role'], 'content' => $msg['content']];
        }
    }
}

$messages[] = ['role' => 'user', 'content' => $input['message']];

$ch = curl_init('https://api.deepseek.com/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'model' => 'deepseek-chat',
    'messages' => $messages,
    'max_tokens' => 1024,
    'temperature' => 0.7
]));
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    $reply = $data['choices'][0]['message']['content'] ?? 'Sorry, I could not generate a response.';
    echo json_encode(['success' => true, 'reply' => $reply]);
} else {
    echo json_encode(['success' => false, 'message' => 'API error: ' . $httpCode]);
}
