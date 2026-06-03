<?php
/* =============================================================================
   Eseyasa — endpoint de correo para los formularios del sitio (Hostinger / PHP).
   Recibe el mismo JSON que ya envían los formularios (contacto, newsletter y
   booking de artista) y manda un email al buzón de Eseyasa vía SMTP de Gmail.

   Usa SMTP autenticado (no la función mail()) para que Gmail NO lo marque como
   spam ni lo descarte. Requiere la librería PHPMailer (incluida en /phpmailer)
   y una "contraseña de aplicación" de Google guardada en smtp-secret.php.
   ============================================================================= */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/phpmailer/Exception.php';
require __DIR__ . '/phpmailer/PHPMailer.php';
require __DIR__ . '/phpmailer/SMTP.php';

// --- Configuración SMTP (Gmail) ------------------------------------------
// La cuenta que AUTENTICA y ENVÍA. El correo llega a este mismo buzón.
const MAIL_TO   = 'Eseyasaproductions@gmail.com';   // destinatario
const SMTP_HOST = 'smtp.gmail.com';
const SMTP_PORT = 465;                               // 465 = SSL
const SMTP_USER = 'Eseyasaproductions@gmail.com';    // tu cuenta Gmail
const SMTP_FROM = 'Eseyasaproductions@gmail.com';    // remitente (debe ser la misma cuenta)

// La contraseña de aplicación se guarda en un archivo aparte (smtp-secret.php)
// para no subirla nunca a git. Ese archivo debe devolver la cadena de 16
// caracteres que genera Google (Cuenta Google → Seguridad → Contraseñas de aplicación).
$SMTP_PASS = file_exists(__DIR__ . '/smtp-secret.php')
    ? (require __DIR__ . '/smtp-secret.php')
    : '';

// --- Cabeceras de respuesta ----------------------------------------------
header('Content-Type: application/json; charset=utf-8');

// Solo aceptamos POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// --- Lectura de datos -----------------------------------------------------
// Los formularios envían JSON (Content-Type: application/json). Como fallback
// también aceptamos datos de formulario clásico (application/x-www-form-urlencoded).
$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    $data = $_POST;
}

function field($data, $key) {
    return isset($data[$key]) ? trim((string) $data[$key]) : '';
}

$name    = field($data, 'name');
$email   = field($data, 'email');
$subject = field($data, 'subject');

// --- Validación mínima ----------------------------------------------------
// Solo exigimos nombre y email; el resto de campos varían según el formulario.
if ($name === '' || $email === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email']);
    exit;
}
// Defensa contra inyección de cabeceras: ningún campo que acabe en una cabecera
// del correo puede contener saltos de línea (\r o \n).
if (preg_match('/[\r\n]/', $name) || preg_match('/[\r\n]/', $email)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

// --- Construcción del cuerpo del email -----------------------------------
// Recorremos los campos conocidos y añadimos solo los que vengan informados.
$labels = [
    'name'        => 'Name',
    'email'       => 'Email',
    'artist'      => 'Artist',
    'source'      => 'Source',
    'event_name'  => 'Event',
    'event_type'  => 'Event type',
    'event_date'  => 'Date',
    'location'    => 'Location',
    'message'     => 'Message',
    'requirements'=> 'Requirements',
    'page'        => 'Page',
];
$lines = [];
foreach ($labels as $key => $label) {
    $val = field($data, $key);
    if ($val !== '') {
        $lines[] = $label . ': ' . $val;
    }
}
$body = implode("\n", $lines);

$mailSubject = $subject !== '' ? $subject : ('Contact / Booking: ' . $name);

// --- Envío vía SMTP -------------------------------------------------------
if ($SMTP_PASS === '') {
    http_response_code(500);
    echo json_encode(['error' => 'Email not configured (missing SMTP password)']);
    exit;
}

$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = $SMTP_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // SSL en puerto 465
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = 'UTF-8';

    // From debe ser la cuenta autenticada (Gmail lo exige); Reply-To es el visitante,
    // así podés responderle directamente desde Gmail.
    $mail->setFrom(SMTP_FROM, 'Eseyasa Web');
    $mail->addAddress(MAIL_TO);
    $mail->addReplyTo($email, $name);

    $mail->Subject = $mailSubject;
    $mail->Body    = $body;

    $mail->send();
    echo json_encode(['ok' => true]);
} catch (Exception $e) {
    http_response_code(500);
    // No exponemos el detalle SMTP al cliente; queda en $mail->ErrorInfo si se necesita depurar.
    echo json_encode(['error' => 'Could not send the email']);
}
