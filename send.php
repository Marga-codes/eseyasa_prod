<?php
/* =============================================================================
   Eseyasa — endpoint de correo para los formularios del sitio (Hostinger / PHP).
   Recibe el mismo JSON que ya envían los formularios (contacto, newsletter y
   booking de artista) y manda un email al buzón de Eseyasa.
   No necesita base de datos ni Node: funciona en hosting compartido con PHP.
   ============================================================================= */

// --- Configuración --------------------------------------------------------
// Buzón que RECIBE los mensajes. Cámbialo si quieres otro destino.
const MAIL_TO = 'Eseyasaproductions@gmail.com';

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

$name         = field($data, 'name');
$email        = field($data, 'email');
$message      = field($data, 'message');
$requirements = field($data, 'requirements');
$subject      = field($data, 'subject');

// --- Validación mínima ----------------------------------------------------
// Solo exigimos nombre y email; el resto de campos varían según el formulario.
if ($name === '' || $email === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan campos obligatorios']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email no válido']);
    exit;
}

// --- Construcción del cuerpo del email -----------------------------------
// Recorremos los campos conocidos y añadimos solo los que vengan informados.
$labels = [
    'name'        => 'Nombre',
    'email'       => 'Email',
    'artist'      => 'Artista',
    'source'      => 'Origen',
    'event_name'  => 'Evento',
    'event_type'  => 'Tipo de evento',
    'event_date'  => 'Fecha',
    'location'    => 'Ubicación',
    'message'     => 'Mensaje',
    'requirements'=> 'Requisitos',
    'page'        => 'Página',
];
$lines = [];
foreach ($labels as $key => $label) {
    $val = field($data, $key);
    if ($val !== '') {
        $lines[] = $label . ': ' . $val;
    }
}
$body = implode("\n", $lines);

// --- Cabeceras del correo (deliverability) --------------------------------
// El "From" debe ir en el dominio del propio hosting para que no lo rechacen.
// El "Reply-To" es el visitante, así puedes responderle directamente.
$host = preg_replace('/^www\./', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
$from = 'no-reply@' . $host;

$mailSubject = $subject !== '' ? $subject : ('Contacto / Booking: ' . $name);

$headers  = 'From: Eseyasa Web <' . $from . ">\r\n";
$headers .= 'Reply-To: ' . $name . ' <' . $email . ">\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// --- Envío ----------------------------------------------------------------
$ok = @mail(MAIL_TO, '=?UTF-8?B?' . base64_encode($mailSubject) . '?=', $body, $headers);

if ($ok) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo enviar el correo']);
}
