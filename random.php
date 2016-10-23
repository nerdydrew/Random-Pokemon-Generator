<?php
// This page reads in $_GET URL parameters, validates them, generates random Pokémon
// based on the parameters, and outputs the result in JSON.

require_once 'config.php';
require_once 'utils.php';

// HTTP headers to keep this page from being cached
header("Cache-Control: no-cache, no-store, must-revalidate"); // HTTP 1.1
header("Pragma: no-cache"); // HTTP 1.0
header("Expires: 0"); // Proxies

$params = validate_parameters($_GET);

// Construct the query, making an array of parameters.
$paramArray = array();
if ($params->get_region() != null) {
	$table = $params->get_region() . "_dex";
} else {
	$table = 'national_dex';
}
if ($params->get_type() != null) {$paramArray[] = $params->get_type() . ' = true';}
if ($params->get_ubers() && $params->get_nfes()) {
	// If we want to get ubers and NFEs as well as fully evolved Pokemon,
	// no need to add a parameter for that.
} else if ($params->get_ubers() == false && $params->get_nfes() == false) {
	// No Ubers and no NFEs - only fully evolved Pokemon.
	$paramArray[] = 'tier = "FE"';
} else {
	// We want to query for 2 of the 3 tiers, leaving out either Ubers or NFEs.
	if ($params->get_ubers()) {
		$paramArray[] = '(tier != "NFE")';
	} else if ($params->get_nfes()) {
		$paramArray[] = '(tier != "Uber")';
	}
}
$parameters = (count($paramArray) > 0) ? "WHERE " . implode(" AND ", $paramArray) : "";

// Connect to the database and execute the query.
$connection = new mysqli(SQL_HOST, SQL_USERNAME, SQL_PASSWORD, SQL_DATABASE);
if ($parameters == "" && $params->get_region() == null) {
	// If we're generating from all Pokemon, it's much more efficient to generate
	// IDs and then query them directly, rather than randomizing the whole database.
	$max = $connection->query("SELECT COUNT(*) AS count FROM " . $table)->fetch_object()->count;
	$ids_array = generate_distinct_random_numbers(1, $max, $params->get_n());
	$ids_string = implode(", ", $ids_array);
	$sql = "SELECT id, name, multiform FROM national_dex WHERE id IN (" . $ids_string . ")";
} else {
	$sql = "SELECT id, name, multiform FROM " . $table . " " . $parameters . " ORDER BY rand() LIMIT " . $params->get_n();
}

$db_output = $connection->query($sql);
$connection->close();

$can_be_mega = true;
// Convert the results to an array.
while($row = $db_output->fetch_assoc()) {
	$output_row['id'] = $row['id'];
	$output_row['name'] = $row['name'];
	$sprite_name = $row['id'];

	if ($row['multiform']) {
		$form = get_random_eligible_form($row['id'], $params, $can_be_mega);
		$output_row['name'] = $form['name'];
		if ($form['sprite_suffix']) {
			$sprite_name .= '-' . $form['sprite_suffix'];
		}

		// Yeah, this makes earlier Pokemon more likely to be megas than Pokemon
		// later on in the list, but it's close enough for now.
		if ($form['is_mega']) {
			$can_be_mega = false;
		}
	}

	// Chance of being shiny. http://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon#Generation_VI
	$output_row['shiny'] = (mt_rand(0,65535) < 16);

	if ($params->get_sprites()) {
		$output_row['sprite'] = ($output_row['shiny'] ? $path_to_shiny_sprites : $path_to_sprites) . $sprite_name . $sprite_extention;
	}

	if ($params->get_natures()) {
		$output_row['nature'] = $nature_list[mt_rand(0, count($nature_list)-1)];
	}

	$output_array[] = $output_row;
}

// Finally, convert the results to JSON.
echo json_encode($output_array);
