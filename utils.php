<?php

require_once 'config.php';

//////// CLASSES ////////

class Parameters {
	public static $n_low = 1;
	public static $n_high = 6;
	public static $region_list = array('kanto','johto','hoenn','sinnoh','sinnoh_pt','unova','unova_b2w2','kalos', 'alola');
	public static $type_list = array('bug','dark','dragon','electric','fairy','fighting','fire','flying','ghost','grass','ground','ice','normal','poison','psychic','rock','steel','water');

	protected $n = 6;
	protected $ubers = true;
	protected $nfes = true;
	protected $sprites = true;
	protected $natures = false;
	protected $forms = true;
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

	public function get_forms() {
		return $this->forms;
	}

	public function set_forms($forms) {
		$forms = filter_var($forms, FILTER_VALIDATE_BOOLEAN);
		if (!is_null($forms)) {
			$this->forms = $forms;
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

	private function get_tier_sql($tier_attribute) {
		if ($this->get_ubers() && $this->get_nfes()) {
			// If we want to get ubers and NFEs as well as fully evolved Pokemon,
			// no need to add a parameter for that.
			return null;
		} else if (!$this->get_ubers() && !$this->get_nfes()) {
			// No Ubers and no NFEs - only fully evolved Pokemon.
			return $tier_attribute . ' = "FE"';
		} else {
			// We want to query for 2 of the 3 tiers, leaving out either Ubers or NFEs.
			if ($this->get_ubers()) {
				return '(' . $tier_attribute . ' != "NFE")';
			} else if ($this->get_nfes()) {
				return '(' . $tier_attribute . ' != "Uber")';
			}
		}
	}

	private function get_dex_sql($connection) {
		$param_array = array();
		if ($this->get_region() != null) {
			$table = $this->get_region() . '_dex';
		} else {
			$table = 'national_dex';
		}
		if ($this->get_type() != null) {
			if ($this->get_forms()) {
				$param_array[] = $this->get_type() . ' = true';
			} else {
				$param_array[] = '(type1 = "' . $this->get_type() . '" OR type2 = "' . $this->get_type() . '")';
			}
		}
		$tier_parameter = $this->get_tier_sql('tier');
		if ($tier_parameter != null) {
			$param_array[] = $tier_parameter;
		}

		$parameters = (count($param_array) > 0) ? 'WHERE ' . implode(' AND ', $param_array) : '';

		return 'SELECT id, name, multiform FROM ' . $table . ' ' . $parameters;
	}

	private function get_forms_sql($id) {
		$param_array = array('id = ' . $id);
		if ($this->get_region() != null) {
			$tier_column = $this->get_region() . '_tier';
		} else {
			$tier_column = 'tier';
		}
		if ($this->get_type() != null) {
			$param_array[] = '(type1 = "' . $this->get_type() . '" OR type2 = "' . $this->get_type() . '")';
		}
		$tier_parameter = $this->get_tier_sql($tier_column);
		if ($tier_parameter != null) {
			$param_array[] = $tier_parameter;
		}

		$parameters = implode(' AND ', $param_array);

		return 'SELECT id, name, sprite_suffix, is_mega FROM forms WHERE ' . $parameters;
	}

	private function get_eligible_forms($connection, $id) {
		$sql = $this->get_forms_sql($id);
		$db_output = $connection->query($sql);
		return $db_output->fetch_all(MYSQLI_ASSOC);
	}

	// Generates a list of all Pokemon eligible to be generated based on the parameters.
	public function get_list() {
		$connection = new mysqli(SQL_HOST, SQL_USERNAME, SQL_PASSWORD, SQL_DATABASE);
		$sql = $this->get_dex_sql($connection);
		$db_output = $connection->query($sql);

		while($row = $db_output->fetch_assoc()) {
			$this_pokemon = array('id' => $row['id'], 'name' => $row['name']);

			if ($this->get_forms() && $row['multiform']) {
				$forms = $this->get_eligible_forms($connection, $row['id']);
				$this_pokemon['forms'] = $forms;
			}

			$pokemon_array[] = $this_pokemon;
		}

		$connection->close();
		return $pokemon_array;
	}
}

//////// FUNCTIONS ////////

function validate_parameters($in_params) {
	$params = new Parameters();
	if (isset($in_params['n'])) {
		$params->set_n($in_params['n']);
	}
	if (isset($in_params['ubers'])) {
		$params->set_ubers($in_params['ubers']);
	}
	if (isset($in_params['nfes'])) {
		$params->set_nfes($in_params['nfes']);
	}
	if (isset($in_params['sprites'])) {
		$params->set_sprites($in_params['sprites']);
	}
	if (isset($in_params['natures'])) {
		$params->set_natures($in_params['natures']);
	}
	if (isset($in_params['forms'])) {
		$params->set_forms($in_params['forms']);
	}
	if (isset($in_params['region'])) {
		$params->set_region($in_params['region']);
	}
	if (isset($in_params['type'])) {
		$params->set_type($in_params['type']);
	}

	return $params;
}
