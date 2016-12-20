<?php
// This page reads in $_GET URL parameters, validates them, determines which
// Pokemon fulfill the parameters, and outputs the result in JSON.

require_once 'config.php';
require_once 'utils.php';

$params = validate_parameters($_GET);
echo json_encode($params->get_list());
