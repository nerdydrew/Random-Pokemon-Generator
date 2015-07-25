<?php 
// This page reads in $_GET URL parameters, validates them, generates random Pokémon
// based on the parameters, and outputs the result in JSON.

require_once 'config.php';
require_once 'utils.php';

// HTTP headers to keep this page from being cached
header("Cache-Control: no-cache, no-store, must-revalidate"); // HTTP 1.1
header("Pragma: no-cache"); // HTTP 1.0
header("Expires: 0"); // Proxies

// Validate all the data. First, make sure that n (the number of generated Pokémon)
// is an integer between 1 and 6.
if (!isset($_GET["n"])) {
	// Redirect to the home page if n isn't set.
	redirect('');
} else {
	$n = $_GET["n"];
}
if (!is_numeric($n) || $n > 6) {$n=6;}
elseif ($n < 1) {$n=1;}
$n = round($n); // ensure n is an integer

// Get other options, validating and setting to defaults if not provided.
$ubers = get_or_set("ubers", true);
$nfes = get_or_set("nfes", true);
$sprites = get_or_set("sprites", true);
$natures = get_or_set("natures", false);
$region = get_or_set("region", null, $region_list);
$type = get_or_set("type", null, $type_list);


// Construct the query, making an array of parameters.
$paramArray = array();
if ($region != null) {$paramArray[] = $region . " = 1";}
if ($type != null) {$paramArray[] = '(type1 = "' . $type . '" OR type2 = "' . $type . '")';}
if ($ubers == false) {$paramArray[] = 'tier != "Uber"';}
if ($nfes == false) {$paramArray[] = 'tier != "NFE"';}
$parameters = (count($paramArray) > 0) ? "WHERE " . implode(" AND ", $paramArray) : "";

// Connect to the database and execute the query.
$connection = new mysqli($sql_host, $sql_username, $sql_password, $sql_database);
$dbOutput = $connection->query("SELECT id, name FROM dex " . $parameters . " ORDER BY rand() LIMIT $n ");

// Convert the results to an array.
while($row = $dbOutput->fetch_assoc()) {
	// Chance of being shiny. http://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon#Generation_VI
	$row['shiny'] = (mt_rand(0,65535) < 16);
	if ($sprites) {
		$row['sprite'] = ($row['shiny'] ? $path_to_shiny_sprites : $path_to_sprites) . $row['id'] . $sprite_extention;
	}
	if ($natures) {
		$row['nature'] = $nature_list[mt_rand(0, count($nature_list)-1)];
	}
	
	$outputArray[] = $row;
}

// Finally, convert the results to JSON.
echo json_encode($outputArray);