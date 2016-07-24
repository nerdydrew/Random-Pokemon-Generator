<?php

//////// FUNCTIONS ////////

// Safely $_GETs and returns the value of $get_key, falling back on the $default.
// Can optionally validate the value from a list of $possible_values.
function get_or_set($get_key, $default, $possible_values = null) {
	$using_boolean = ($default === true || $default === false);
	$validate_from_list = ($possible_values != null);

	if (isset($_GET[$get_key]) && (!$validate_from_list || in_array($_GET[$get_key], $possible_values))) {
		if ($using_boolean) {
			return filter_var($_GET[$get_key], FILTER_VALIDATE_BOOLEAN);
		} else {
			return $_GET[$get_key];
		}
	} else {
		return $default;
	}
}

// Sets an HTTP header to redirect to the specified path (relative or absolute).
// Note: must come before any HTML.
function redirect($path) {
	// Convert to absolute path if needed
	if (substr($path, 0, 4) !== 'http') {
		// If it's absolute, make sure it has a leading "/".
		if (substr($path, 0, 1) !== "/" && strlen($path) > 0) {
			$path = "/" . $path;
		}
		$protocol = (isset($_SERVER['HTTPS'])) ? 'https' : 'http';
		$path = $protocol . '://' . $_SERVER['HTTP_HOST'] . $path;
	}

	header('Location: ' . $path);
	die();
}

// Most efficient for large ranges ($max-$min) and small $n values.
function generate_distinct_random_numbers($min, $max, $n) {
	$numbers = array();
	while (count($numbers) < $n) {
		$number = mt_rand($min, $max);
		if (strrpos($numbers, $number) === false) {
			$numbers[] = $number;
		}
	}
	return $numbers;
}


//////// LISTS for data validation, default values, and generation of natures ////////

$nature_list = array('Adamant','Bashful','Bold','Brave','Calm','Careful','Docile','Gentle','Hardy','Hasty','Impish','Jolly','Lax','Lonely','Mild','Modest','Na&iuml;ve','Naughty','Quiet','Quirky','Rash','Relaxed','Sassy','Serious','Timid');

$region_list = array('kanto','johto','hoenn','sinnoh','sinnoh_pt','unova','unova_b2w2','kalos');

$type_list = array('bug','dark','dragon','electric','fairy','fighting','fire','flying','ghost','grass','ground','ice','normal','poison','psychic','rock','steel','water');

$default = array(
	'n_low' => '1',
	'n_high' => '6',
	'n' => '6',
	'region' => null,
	'type' => null,
	'ubers' => true,
	'nfes' => true,
	'sprites' => true,
	'natures' => false
);
