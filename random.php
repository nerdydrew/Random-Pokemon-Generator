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
if ($region != null) {
	$paramArray[] = $region . " = 1";
	$tier_column = $region . "_tier";
} else {
	$tier_column = "tier";
}
if ($type != null) {$paramArray[] = $type . ' = true';}
if ($ubers && $nfes) {
	// If we want to get ubers and NFEs as well as fully evolved Pokemon,
	// no need to add a parameter for that.
} else if ($ubers == false && $nfes == false) {
	// No Ubers and no NFEs - only fully evolved Pokemon.
	$paramArray[] = $tier_column . ' = "FE"';
} else {
	// We want to query for 2 of the 3 tiers, leaving out either Ubers or NFEs.
	if ($ubers) {
		$paramArray[] = '(' . $tier_column . ' != "NFE")';
	} else if ($nfes) {
		$paramArray[] = '(' . $tier_column . ' != "Uber")';
	}
}
$parameters = (count($paramArray) > 0) ? "WHERE " . implode(" AND ", $paramArray) : "";

// Connect to the database and execute the query.
$connection = new mysqli($sql_host, $sql_username, $sql_password, $sql_database);
if ($parameters == "") {
	// If we're generating from all Pokemon, it's much more efficient to generate
	// IDs and then query them directly, rather than randomizing the whole database.
	$max = $connection->query("SELECT COUNT(*) AS count FROM dex")->fetch_object()->count;
	$ids_array = generate_distinct_random_numbers(1, $max, $n);
	$ids_string = implode(", ", $ids_array);
	$sql = "SELECT id, name FROM dex WHERE id IN (" . $ids_string . ")";
} else {
	$sql = "SELECT id, name FROM dex " . $parameters . " ORDER BY rand() LIMIT $n";
}

$db_output = $connection->query($sql);

// Convert the results to an array.
while($row = $db_output->fetch_assoc()) {
	$output_row['id'] = $row['id'];
	$output_row['name'] = $row['name'];

	// Chance of being shiny. http://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon#Generation_VI
	$output_row['shiny'] = (mt_rand(0,65535) < 16);

	if ($sprites) {
		$output_row['sprite'] = ($row['shiny'] ? $path_to_shiny_sprites : $path_to_sprites) . $row['id'] . $sprite_extention;
	}

	if ($natures) {
		$output_row['nature'] = $nature_list[mt_rand(0, count($nature_list)-1)];
	}

	$output_array[] = $output_row;
}

// Finally, convert the results to JSON.
echo json_encode($output_array);
