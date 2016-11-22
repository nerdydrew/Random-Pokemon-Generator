<?php

require_once 'config.php';

//////// CLASSES ////////

class Parameters {
	public static $n_low = 1;
	public static $n_high = 6;
	public static $region_list = array('kanto','johto','hoenn','sinnoh','sinnoh_pt','unova','unova_b2w2','kalos', 'alola');
	public static $type_list = array('bug','dark','dragon','electric','fairy','fighting','fire','flying','ghost','grass','ground','ice','normal','poison','psychic','rock','steel','water');

	public static $nature_list = array('Adamant','Bashful','Bold','Brave','Calm','Careful','Docile','Gentle','Hardy','Hasty','Impish','Jolly','Lax','Lonely','Mild','Modest','Na&iuml;ve','Naughty','Quiet','Quirky','Rash','Relaxed','Sassy','Serious','Timid');

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

		// Connect to the database and execute the query.
		if ($parameters == '' && $this->get_region() == null) {
			// If we're generating from all Pokemon, it's much more efficient to generate
			// IDs and then query them directly, rather than randomizing the whole database.
			$max = $connection->query('SELECT COUNT(*) AS count FROM ' . $table)->fetch_object()->count;
			$ids_array = generate_distinct_random_numbers(1, $max, $this->get_n());
			$ids_string = implode(', ', $ids_array);
			$sql = 'SELECT id, name, multiform FROM national_dex WHERE id IN (' . $ids_string . ') ORDER BY rand()';
		} else {
			$sql = 'SELECT id, name, multiform FROM ' . $table . ' ' . $parameters . ' ORDER BY rand() LIMIT ' . $this->get_n();
		}
		return $sql;
	}

	private function get_forms_sql($id, $can_be_mega) {
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

		if (!$can_be_mega) {
			$param_array[] = 'is_mega = false';
		}
		$parameters = implode(' AND ', $param_array);

		return 'SELECT name, sprite_suffix, is_mega FROM forms WHERE ' . $parameters . ' ORDER BY rand() LIMIT 1';
	}

	private function get_random_eligible_form($connection, $id, $can_be_mega) {
		$sql = $this->get_forms_sql($id, $can_be_mega);
		$db_output = $connection->query($sql);
		return $db_output->fetch_assoc();
	}

	public function generate() {
		$connection = new mysqli(SQL_HOST, SQL_USERNAME, SQL_PASSWORD, SQL_DATABASE);
		$sql = $this->get_dex_sql($connection);
		$db_output = $connection->query($sql);

		$can_be_mega = true;

		while($row = $db_output->fetch_assoc()) {
			$sprite_name = $row['id'];

			if ($this->get_forms() && $row['multiform']) {
				$form = $this->get_random_eligible_form($connection, $row['id'], $can_be_mega);
				$row['name'] = $form['name'];
				if ($form['sprite_suffix']) {
					$sprite_name .= '-' . $form['sprite_suffix'];
				}

				// Yeah, this makes earlier Pokemon more likely to be megas than Pokemon
				// later on in the list, but it's close enough for now.
				if ($form['is_mega']) {
					$can_be_mega = false;
				}


			}
			unset($row['multiform']);

			// Chance of being shiny. http://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon#Generation_VI
			$row['shiny'] = (mt_rand(0,65535) < 16);

			if ($this->get_sprites()) {
				$row['sprite'] = get_sprite_path($row, $sprite_name);
			}

			if ($this->get_natures()) {
				$row['nature'] = $this::$nature_list[mt_rand(0, count($this::$nature_list)-1)];
			}

			$pokemon_array[] = $row;
		}

		$connection->close();
		return $pokemon_array;
	}
}

//////// FUNCTIONS ////////

function get_sprite_path($row, $sprite_name) {
	if ($row['shiny']) {
		$animated_path = PATH_TO_SHINY_ANIMATED_SPRITES . $sprite_name . ANIMATED_SPRITE_EXTENTION;
	} else {
		$animated_path = PATH_TO_ANIMATED_SPRITES . $sprite_name . ANIMATED_SPRITE_EXTENTION;
	}

	if (file_exists(dirname(__FILE__) . $animated_path)) {
		return $animated_path;
	} else {
		if ($row['shiny']) {
			$regular_path = PATH_TO_SHINY_REGULAR_SPRITES . $sprite_name . REGULAR_SPRITE_EXTENTION;
		} else {
			$regular_path = PATH_TO_REGULAR_SPRITES . $sprite_name . REGULAR_SPRITE_EXTENTION;
		}

		if (file_exists(dirname(__FILE__) . $regular_path)) {
			return $regular_path;
		} else {
			return DEFAULT_SPRITE;
		}
	}

}

function validate_parameters($in_params) {
	$params = new Parameters();
	$params->set_n($in_params['n']);
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
