<?php

function jwtBase64UrlEncode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function jwtBase64UrlDecode(string $data): string
{
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $data .= str_repeat('=', 4 - $remainder);
    }

    $decoded = base64_decode(strtr($data, '-_', '+/'), true);
    if ($decoded === false) {
        throw new Exception('Invalid base64url payload');
    }

    return $decoded;
}

function jwtConfig(): array
{
    $ttl = (int)(getenv('JWT_TTL_SECONDS') ?: 28800); // 8 hours

    return [
        'secret' => getenv('JWT_SECRET') ?: 'replace-with-a-strong-secret',
        'issuer' => getenv('JWT_ISSUER') ?: 'student-management-backend',
        'ttl' => $ttl > 0 ? $ttl : 28800,
    ];
}

function createJwt(array $claims): string
{
    $cfg = jwtConfig();
    $now = time();

    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $payload = array_merge([
        'iss' => $cfg['issuer'],
        'iat' => $now,
        'nbf' => $now,
        'exp' => $now + $cfg['ttl'],
    ], $claims);

    $headerPart = jwtBase64UrlEncode(json_encode($header));
    $payloadPart = jwtBase64UrlEncode(json_encode($payload));
    $signingInput = $headerPart . '.' . $payloadPart;
    $signature = hash_hmac('sha256', $signingInput, $cfg['secret'], true);
    $signaturePart = jwtBase64UrlEncode($signature);

    return $signingInput . '.' . $signaturePart;
}

function decodeJwt(string $token): array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        throw new Exception('Malformed token');
    }

    [$headerPart, $payloadPart, $signaturePart] = $parts;
    $header = json_decode(jwtBase64UrlDecode($headerPart), true);
    $payload = json_decode(jwtBase64UrlDecode($payloadPart), true);
    $signature = jwtBase64UrlDecode($signaturePart);

    if (!is_array($header) || !is_array($payload)) {
        throw new Exception('Invalid token payload');
    }

    if (($header['alg'] ?? null) !== 'HS256') {
        throw new Exception('Unsupported algorithm');
    }

    $cfg = jwtConfig();
    $expected = hash_hmac('sha256', $headerPart . '.' . $payloadPart, $cfg['secret'], true);
    if (!hash_equals($expected, $signature)) {
        throw new Exception('Invalid signature');
    }

    $now = time();
    if (isset($payload['nbf']) && (int)$payload['nbf'] > $now) {
        throw new Exception('Token not active yet');
    }
    if (!isset($payload['exp']) || (int)$payload['exp'] <= $now) {
        throw new Exception('Token expired');
    }
    if (($payload['iss'] ?? null) !== $cfg['issuer']) {
        throw new Exception('Invalid issuer');
    }

    return $payload;
}

