<?php
// This page reads in $_GET URL parameters, validates them, generates random Pokémon
// based on the parameters, and outputs the result in JSON.

require_once 'config.php';
require_once 'utils.php';

// HTTP headers to keep this page from being cached
header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1
header('Pragma: no-cache'); // HTTP 1.0
header('Expires: 0'); // Proxies

$params = validate_parameters($_GET);
echo json_encode($params->generate());
