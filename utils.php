<?php

require_once 'config.php';

//////// CLASSES ////////

class Parameters {
	public static $n_low = 1;
	public static $n_high = 6;
	public static $region_list = array('kanto','johto','hoenn','sinnoh','sinnoh_pt','unova','unova_b2w2','kalos');
	public static $type_list = array('bug','dark','dragon','electric','fairy','fighting','fire','flying','ghost','grass','ground','ice','normal','poison','psychic','rock','steel','water');

	protected $n = 6;
	protected $ubers = true;
	protected $nfes = true;
	protected $sprites = true;
	protected $natures = false;
	protected $region = null;
	protected $type = null;

	public function get_n() {
		return $this->n;
	}

	public function set_n($n) {
		if (is_numeric($n)) {
			$n = (int) $n;
			if ($n > $this::$n_high) {
				$n = $this::$n_high;
			} else if ($n < $this::$n_low) {
				$n = $this::$n_low;
			}
			$this->n = $n;
		}
	}

	public function get_ubers() {
		return $this->ubers;
	}

	public function set_ubers($ubers) {
		$ubers = filter_var($ubers, FILTER_VALIDATE_BOOLEAN);
		if (!is_null($ubers)) {
			$this->ubers = $ubers;
		}
	}

	public function get_nfes() {
		return $this->nfes;
	}

	public function set_nfes($nfes) {
		$nfes = filter_var($nfes, FILTER_VALIDATE_BOOLEAN);
		if (!is_null($nfes)) {
			$this->nfes = $nfes;
		}
	}

	public function get_sprites() {
		return $this->sprites;
	}

	public function set_sprites($sprites) {
		$sprites = filter_var($sprites, FILTER_VALIDATE_BOOLEAN);
		if (!is_null($sprites)) {
			$this->sprites = $sprites;
		}
	}

	public function get_natures() {
		return $this->natures;
	}

	public function set_natures($natures) {
		$natures = filter_var($natures, FILTER_VALIDATE_BOOLEAN);
		if (!is_null($natures)) {
			$this->natures = $natures;
		}
	}

	public function get_region() {
		return $this->region;
	}

	public function set_region($region) {
		if (in_array($region, $this::$region_list)) {
			$this->region = $region;
		}
	}

	public function get_type() {
		return $this->type;
	}

	public function set_type($type) {
		if (in_array($type, $this::$type_list)) {
			$this->type = $type;
		}
	}



}

//////// FUNCTIONS ////////

function validate_parameters($in_params) {
	$params = new Parameters();
	$params->set_n($in_params["n"]);
	if (isset($in_params["ubers"])) {
		$params->set_ubers($in_params["ubers"]);
	}
	if (isset($in_params["nfes"])) {
		$params->set_nfes($in_params["nfes"]);
	}
	if (isset($in_params["sprites"])) {
		$params->set_sprites($in_params["sprites"]);
	}
	if (isset($in_params["natures"])) {
		$params->set_natures($in_params["natures"]);
	}
	if (isset($in_params["region"])) {
		$params->set_region($in_params["region"]);
	}
	if (isset($in_params["type"])) {
		$params->set_type($in_params["type"]);
	}

	return $params;
}

// Most efficient for large ranges ($max-$min) and small $n values.
function generate_distinct_random_numbers($min, $max, $n) {
	$numbers = array();
	while (count($numbers) < $n) {
		$number = mt_rand($min, $max);
		if (array_search($number, $numbers) === false) {
			$numbers[] = $number;
		}
	}
	return $numbers;
}

function get_random_eligible_form($id, $params, $can_be_mega) {
	$type = $params->get_type();
	$region = $params->get_region();
	$ubers = $params->get_ubers();
	$nfes = $params->get_nfes();

	$connection = new mysqli(SQL_HOST, SQL_USERNAME, SQL_PASSWORD, SQL_DATABASE);
	// Construct the query, making an array of parameters.
	$param_array = array("id = " . $id);
	if ($region != null) {
		$param_array[] = $region . " = 1";
		$tier_column = $region . "_tier";
	} else {
		$tier_column = "tier";
	}
	if ($type != null) {
		$param_array[] = '(type1 = "' . $type . '" OR type2 = "' . $type . '")';
	}
	if ($ubers && $nfes) {
		// If we want to get ubers and NFEs as well as fully evolved Pokemon,
		// no need to add a parameter for that.
	} else if ($ubers == false && $nfes == false) {
		// No Ubers and no NFEs - only fully evolved Pokemon.
		$param_array[] = $tier_column . ' = "FE"';
	} else {
		// We want to query for 2 of the 3 tiers, leaving out either Ubers or NFEs.
		if ($ubers) {
			$param_array[] = '(' . $tier_column . ' != "NFE")';
		} else if ($nfes) {
			$param_array[] = '(' . $tier_column . ' != "Uber")';
		}
	}
	if (!$can_be_mega) {
		$param_array[] = 'is_mega = false';
	}
	$parameters = implode(" AND ", $param_array);

	$sql = "SELECT name, sprite_suffix, is_mega FROM forms WHERE " . $parameters . " ORDER BY rand() LIMIT 1";

	$db_output = $connection->query($sql);
	$connection->close();
	return $db_output->fetch_assoc();
}


//////// LISTS for generation of natures ////////

$nature_list = array('Adamant','Bashful','Bold','Brave','Calm','Careful','Docile','Gentle','Hardy','Hasty','Impish','Jolly','Lax','Lonely','Mild','Modest','Na&iuml;ve','Naughty','Quiet','Quirky','Rash','Relaxed','Sassy','Serious','Timid');
