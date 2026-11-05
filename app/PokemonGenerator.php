<?php

declare(strict_types=1);

class PokemonGenerator
{
    public const HISTORY_SIZE = 64;

    /**
     * URL prefix for all asset/sprite paths.
     * Override by calling PokemonGenerator::setBasePath('/pokemon') before rendering.
     */
    private static string $basePath = '';

    public static function setBasePath(string $path): void
    {
        self::$basePath = rtrim($path, '/');
    }

    private static function spritesNormalPath(): string
    {
        return self::$basePath . '/sprites/normal/';
    }

    private static function spritesShinyPath(): string
    {
        return self::$basePath . '/sprites/shiny/';
    }

    private const SPRITE_EXTENSION = '.webp';

    /** 1/4096 shiny odds (Gen VI method: < 16 out of 65536) */
    private const SHINY_THRESHOLD = 16;
    private const SHINY_ROLLS     = 65536;

    private const NATURES = [
        'Adamant', 'Bashful', 'Bold', 'Brave', 'Calm', 'Careful', 'Docile', 'Gentle',
        'Hardy', 'Hasty', 'Impish', 'Jolly', 'Lax', 'Lonely', 'Mild', 'Modest', 'Na&iuml;ve',
        'Naughty', 'Quiet', 'Quirky', 'Rash', 'Relaxed', 'Sassy', 'Serious', 'Timid',
    ];

    // -------------------------------------------------------------------------
    // Options
    // -------------------------------------------------------------------------

    /** Returns the default generation options. */
    public static function getDefaultOptions(): array
    {
        return [
            'n'              => 1,
            'regions'        => [],
            'types'          => [],
            'sublegendaries' => true,
            'legendaries'    => true,
            'mythicals'      => true,
            'paradoxes'      => true,
            'ultraBeasts'    => true,
            'evolutionCounts'=> [],
            'nfes'           => true,
            'fullyEvolved'   => true,
            'display'        => 'both',
            'natures'        => false,
            'genders'        => false,
            'forms'          => false,
            'megas'          => false,
            'gigantamaxes'   => false,
        ];
    }

    /** Returns true if the query array contains any option-related keys. */
    public static function hasOptionInputs(array $query): bool
    {
        $optionKeys = [
            'n', 'regions', 'types', 'sublegendaries', 'legendaries', 'mythicals',
            'paradoxes', 'ultraBeasts', 'evolutionCounts', 'nfes', 'fullyEvolved',
            'display', 'natures', 'genders', 'forms', 'megas', 'gigantamaxes',
        ];
        foreach ($optionKeys as $key) {
            if (array_key_exists($key, $query)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Parses GET parameters into a validated options array.
     * Falls back to $defaults for values not present in $input.
     */
    public static function parseOptions(array $input, array $defaults): array
    {
        $d = $defaults;

        // n: 1–6
        $n = isset($input['n']) ? (int) $input['n'] : $d['n'];
        $n = max(1, min(6, $n));

        // regions[]: array of strings, empty = all
        if (isset($input['regions']) && is_array($input['regions'])) {
            $regions = array_values(array_filter(array_map('strval', $input['regions'])));
        } else {
            $regions = $d['regions'];
        }

        // types[]: array of strings, empty = all
        if (isset($input['types']) && is_array($input['types'])) {
            $types = array_values(array_filter(array_map('strval', $input['types'])));
        } else {
            $types = $d['types'];
        }

        // boolean checkboxes (present and equal "true" → true, otherwise false from form; or fall back to default)
        $parseBool = static function (array $input, string $key, bool $default): bool {
            if (!array_key_exists($key, $input)) {
                return $default;
            }
            return filter_var($input[$key], FILTER_VALIDATE_BOOLEAN);
        };

        // evolutionCounts[]: array of ints 0-2, empty = all
        if (isset($input['evolutionCounts']) && is_array($input['evolutionCounts'])) {
            $evolutionCounts = array_values(array_unique(array_map('intval', $input['evolutionCounts'])));
            $evolutionCounts = array_values(array_filter($evolutionCounts, fn($v) => in_array($v, [0, 1, 2], true)));
        } else {
            $evolutionCounts = $d['evolutionCounts'];
        }

        // display: names | sprites | both
        $display = $input['display'] ?? $d['display'];
        if (!in_array($display, ['names', 'sprites', 'both'], true)) {
            $display = 'both';
        }

        return [
            'n'               => $n,
            'regions'         => $regions,
            'types'           => $types,
            'sublegendaries'  => $parseBool($input, 'sublegendaries', $d['sublegendaries']),
            'legendaries'     => $parseBool($input, 'legendaries', $d['legendaries']),
            'mythicals'       => $parseBool($input, 'mythicals', $d['mythicals']),
            'paradoxes'       => $parseBool($input, 'paradoxes', $d['paradoxes']),
            'ultraBeasts'     => $parseBool($input, 'ultraBeasts', $d['ultraBeasts']),
            'evolutionCounts' => $evolutionCounts,
            'nfes'            => $parseBool($input, 'nfes', $d['nfes']),
            'fullyEvolved'    => $parseBool($input, 'fullyEvolved', $d['fullyEvolved']),
            'display'         => $display,
            'natures'         => $parseBool($input, 'natures', $d['natures']),
            'genders'         => $parseBool($input, 'genders', $d['genders']),
            'forms'           => $parseBool($input, 'forms', $d['forms']),
            'megas'           => $parseBool($input, 'megas', $d['megas']),
            'gigantamaxes'    => $parseBool($input, 'gigantamaxes', $d['gigantamaxes']),
        ];
    }

    // -------------------------------------------------------------------------
    // Generation
    // -------------------------------------------------------------------------

    /**
     * Main entry point. Returns an array of generated Pokémon arrays,
     * each containing: id, baseName, name, spriteSuffix, nature, shiny, date, gender,
     * showName, showSprite.
     */
    public static function generate(array $options): array
    {
        $allPokemon   = self::loadDex();
        $regionGroups = self::getRegionDexMap();

        // --- Build pool filtered by region ---
        if ($options['regions'] === []) {
            // All regions: merge duplicates (same id) preserving all forms
            $pool = self::mergeAllRegions($regionGroups, $allPokemon);
        } else {
            $pool = self::buildPoolForRegions($options['regions'], $regionGroups, $allPokemon);
        }

        // --- Filter by legendary status ---
        $pool = array_values(array_filter($pool, static function (array $p) use ($options): bool {
            return self::passesLegendaryFilter($p, $options);
        }));

        // --- Filter by evolution counts / NFE status ---
        $pool = array_values(array_filter($pool, static function (array $p) use ($options): bool {
            return self::passesEvolutionFilter($p, $options);
        }));

        // --- Filter by types (and strip form types) ---
        $types = array_flip($options['types']); // quick lookup
        $pool = self::filterByTypes($pool, $types, $options);

        if ($pool === []) {
            return [];
        }

        return self::chooseRandom($pool, $options);
    }

    /** Filters generated results and returns only the shiny ones. */
    public static function filterShinies(array $results): array
    {
        return array_values(array_filter($results, static fn(array $p) => $p['shiny']));
    }

    // -------------------------------------------------------------------------
    // Region / Type definitions (used by the view)
    // -------------------------------------------------------------------------

    public static function getRegionDefinitions(): array
    {
        return [
            ['value' => 'kanto',   'label' => 'Kanto',    'title' => 'Generation I'],
            ['value' => 'johto',   'label' => 'Johto',    'title' => 'Generation II'],
            ['value' => 'hoenn',   'label' => 'Hoenn',    'title' => 'Generation III'],
            ['value' => 'sinnoh',  'label' => 'Sinnoh',   'title' => 'Generation IV'],
            ['value' => 'unova',   'label' => 'Unova',    'title' => 'Generation V'],
            ['value' => 'kalos',   'label' => 'Kalos',    'title' => 'Generation VI'],
            ['value' => 'alola',   'label' => 'Alola',    'title' => 'Generation VII'],
            ['value' => 'galar',   'label' => 'Galar',    'title' => 'Generation VIII'],
            ['value' => 'hisui',   'label' => 'Hisui',    'title' => 'Generation VIII (Legends: Arceus)'],
            ['value' => 'paldea',  'label' => 'Paldea',   'title' => 'Generation IX'],
        ];
    }

    public static function getTypeDefinitions(): array
    {
        return [
            ['value' => 'normal',   'label' => 'Normal'],
            ['value' => 'fire',     'label' => 'Fire'],
            ['value' => 'water',    'label' => 'Water'],
            ['value' => 'electric', 'label' => 'Electric'],
            ['value' => 'grass',    'label' => 'Grass'],
            ['value' => 'ice',      'label' => 'Ice'],
            ['value' => 'fighting', 'label' => 'Fighting'],
            ['value' => 'poison',   'label' => 'Poison'],
            ['value' => 'ground',   'label' => 'Ground'],
            ['value' => 'flying',   'label' => 'Flying'],
            ['value' => 'psychic',  'label' => 'Psychic'],
            ['value' => 'bug',      'label' => 'Bug'],
            ['value' => 'rock',     'label' => 'Rock'],
            ['value' => 'ghost',    'label' => 'Ghost'],
            ['value' => 'dragon',   'label' => 'Dragon'],
            ['value' => 'dark',     'label' => 'Dark'],
            ['value' => 'steel',    'label' => 'Steel'],
            ['value' => 'fairy',    'label' => 'Fairy'],
        ];
    }

    // -------------------------------------------------------------------------
    // Rendering
    // -------------------------------------------------------------------------

    /** Renders an <ol> of generated Pokémon. */
    public static function renderPokemonList(array $results): string
    {
        if ($results === []) {
            return '<ol></ol>';
        }
        $items = '';
        foreach ($results as $p) {
            $items .= self::renderPokemonItem($p);
        }
        return "<ol>{$items}</ol>";
    }

    /** Renders the shiny history <ol>. */
    public static function renderShinyList(array $shinies): string
    {
        if ($shinies === []) {
            return '';
        }
        $items = '';
        foreach ($shinies as $p) {
            $items .= self::renderShinyItem($p);
        }
        return "<ol>{$items}</ol>";
    }

    // -------------------------------------------------------------------------
    // Private helpers – rendering
    // -------------------------------------------------------------------------

    private static function renderPokemonItem(array $p): string
    {
        $showName   = $p['showName']   ?? true;
        $showSprite = $p['showSprite'] ?? true;

        $classes = '';
        if ($p['shiny']) {
            $classes .= 'shiny ';
        }
        if (!$showSprite) {
            $classes .= 'imageless ';
        }
        $classes = trim($classes);

        $img  = $showSprite ? self::renderImage($p, false) : '';
        $text = self::renderText($p, $showName);

        return "<li" . ($classes !== '' ? " class=\"{$classes}\"" : '') . ">{$img}{$text}</li>";
    }

    private static function renderShinyItem(array $p): string
    {
        $dateHtml = '';
        if (!empty($p['date'])) {
            $dateStr     = htmlspecialchars($p['date'], ENT_QUOTES, 'UTF-8');
            $dateDisplay = date('n/j/Y', strtotime($p['date']));
            $dateHtml    = "<div class=\"date\" title=\"{$dateStr}\">Encountered on {$dateDisplay}</div>";
        }
        $img  = self::renderImage($p, true);
        $text = self::renderText($p, true);
        return "<li>{$img}{$text}{$dateHtml}</li>";
    }

    private static function renderImage(array $p, bool $forceShiny): string
    {
        $shiny    = $forceShiny || $p['shiny'];
        $basePath = $shiny ? self::spritesShinyPath() : self::spritesNormalPath();
        $filename = self::normalizeName($p['baseName']);
        if (!empty($p['spriteSuffix'])) {
            $filename .= '-' . $p['spriteSuffix'];
        }
        $src     = $basePath . $filename . self::SPRITE_EXTENSION;
        $altText = ($shiny ? 'Shiny ' : '') . htmlspecialchars($p['name'], ENT_QUOTES, 'UTF-8');
        return "<img src=\"{$src}\" alt=\"{$altText}\" title=\"{$altText}\">";
    }

    private static function renderText(array $p, bool $includeName): string
    {
        $parts = [];

        if (!empty($p['nature'])) {
            $parts[] = '<span class="nature">' . htmlspecialchars($p['nature'], ENT_QUOTES, 'UTF-8') . '</span>';
        }
        if ($includeName) {
            $parts[] = htmlspecialchars($p['name'], ENT_QUOTES, 'UTF-8');
        }

        $gender = $p['gender'] ?? null;
        $name   = $p['name']   ?? '';
        // Nidoran already has the gender symbol in its name
        if ($name !== 'Nidoran ♀' && $name !== 'Nidoran ♂') {
            if ($gender === 'male') {
                $parts[] = '<span class="male" title="Male">♂</span>';
            } elseif ($gender === 'female') {
                $parts[] = '<span class="female" title="Female">♀</span>';
            }
        }

        if ($p['shiny']) {
            $parts[] = '<span class="star">&starf;</span>';
        }

        $text = trim(implode(' ', $parts));
        return $text !== '' ? $text : '&nbsp;';
    }

    // -------------------------------------------------------------------------
    // Private helpers – data loading
    // -------------------------------------------------------------------------

    /** Loads and caches the full Pokédex JSON. */
    private static ?array $dexCache = null;

    private static function loadDex(): array
    {
        if (self::$dexCache !== null) {
            return self::$dexCache;
        }
        $path = __DIR__ . '/dex/all.json';
        $json = file_get_contents($path);
        if ($json === false) {
            throw new \RuntimeException("Cannot read dex file: {$path}");
        }
        $data = json_decode($json, true, 512, JSON_THROW_ON_ERROR);
        self::$dexCache = $data;
        return $data;
    }

    /**
     * Returns a map of region name → array of Pokémon IDs.
     * Each regional dex file is public/dex/{region}.json, which may contain either:
     *   - an array of Pokémon objects (each with an "id" key), or
     *   - a plain array of integer IDs.
     */
    private static ?array $regionMapCache = null;

    private static function getRegionDexMap(): array
    {
        if (self::$regionMapCache !== null) {
            return self::$regionMapCache;
        }
        $map     = [];
        $dexDir  = __DIR__ . '/dex/';
        $regions = array_column(self::getRegionDefinitions(), 'value');

        foreach ($regions as $region) {
            $file = $dexDir . $region . '.json';
            if (!file_exists($file)) {
                continue;
            }
            $raw = file_get_contents($file);
            if ($raw === false) {
                continue;
            }
            $items = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($items) || $items === []) {
                continue;
            }
            // Support both formats: array of objects with "id", or plain int array
            $ids = [];
            foreach ($items as $item) {
                if (is_array($item) && isset($item['id'])) {
                    $ids[] = (int) $item['id'];
                } elseif (is_int($item)) {
                    $ids[] = $item;
                }
            }
            if ($ids !== []) {
                $map[$region] = $ids;
            }
        }
        self::$regionMapCache = $map;
        return $map;
    }

    // -------------------------------------------------------------------------
    // Private helpers – pool building
    // -------------------------------------------------------------------------

    /**
     * Merge all regions: for each Pokémon ID, if it appears in multiple regions
     * with different forms, merge the form lists (primary region wins conflicts).
     */
    private static function mergeAllRegions(array $regionGroups, array $allPokemon): array
    {
        // Index all.json by id
        $byId = [];
        foreach ($allPokemon as $p) {
            $byId[$p['id']] = $p;
        }

        // If no region files exist, just return the full dex
        if ($regionGroups === []) {
            return array_values($byId);
        }

        // Collect every unique Pokémon across all regions
        $merged = [];
        foreach ($regionGroups as $regionIds) {
            foreach ($regionIds as $id) {
                if (!isset($byId[$id])) {
                    continue;
                }
                if (!isset($merged[$id])) {
                    $merged[$id] = $byId[$id];
                } else {
                    $merged[$id] = self::mergePokemon($merged[$id], $byId[$id]);
                }
            }
        }
        return array_values($merged);
    }

    private static function buildPoolForRegions(array $regions, array $regionGroups, array $allPokemon): array
    {
        $byId = [];
        foreach ($allPokemon as $p) {
            $byId[$p['id']] = $p;
        }

        $merged = [];
        foreach ($regions as $region) {
            if (!isset($regionGroups[$region])) {
                continue;
            }
            foreach ($regionGroups[$region] as $id) {
                if (!isset($byId[$id])) {
                    continue;
                }
                if (!isset($merged[$id])) {
                    $merged[$id] = $byId[$id];
                } else {
                    $merged[$id] = self::mergePokemon($merged[$id], $byId[$id]);
                }
            }
        }

        // If none of the requested regions exist as files, fall back to full dex
        if ($merged === []) {
            return array_values($byId);
        }
        return array_values($merged);
    }

    /** Merges forms from two versions of the same Pokémon (primary wins). */
    private static function mergePokemon(array $primary, array $secondary): array
    {
        if (!isset($primary['forms']) && !isset($secondary['forms'])) {
            return $primary;
        }
        $primForms = $primary['forms']  ?? [[]];
        $secForms  = $secondary['forms'] ?? [[]];

        $byKey = [];
        // Secondary first so primary overwrites
        foreach (array_merge($secForms, $primForms) as $form) {
            $key         = $form['spriteSuffix'] ?? '__base__';
            $byKey[$key] = $form;
        }
        $merged          = $primary;
        $merged['forms'] = array_values($byKey);
        return $merged;
    }

    // -------------------------------------------------------------------------
    // Private helpers – filtering
    // -------------------------------------------------------------------------

    private static function passesLegendaryFilter(array $p, array $options): bool
    {
        if (!empty($p['isSubLegendary']) && !$options['sublegendaries']) {
            return false;
        }
        if (!empty($p['isLegendary']) && !$options['legendaries']) {
            return false;
        }
        if (!empty($p['isMythical']) && !$options['mythicals']) {
            return false;
        }
        if (!empty($p['isParadox']) && !$options['paradoxes']) {
            return false;
        }
        if (!empty($p['isUltraBeast']) && !$options['ultraBeasts']) {
            return false;
        }
        return true;
    }

    private static function passesEvolutionFilter(array $p, array $options): bool
    {
        // evolutionCounts filter (empty = all)
        if ($options['evolutionCounts'] !== []) {
            $evoCount = $p['evolutionCount'] ?? 0;
            if (!in_array($evoCount, $options['evolutionCounts'], true)) {
                return false;
            }
        }

        // NFE / fully evolved filter
        $nfeAllowed = $options['nfes'];
        $feAllowed  = $options['fullyEvolved'];

        // If both are checked (or both unchecked), all pass
        if ($nfeAllowed === $feAllowed) {
            return true;
        }
        $isNfe = !empty($p['isNfe']);
        if ($isNfe && !$nfeAllowed) {
            return false;
        }
        if (!$isNfe && !$feAllowed) {
            return false;
        }
        return true;
    }

    /**
     * Filters the pool by type. Also strips forms that don't match the type filter
     * and removes megas/gigantamaxes based on options.
     */
    private static function filterByTypes(array $pool, array $types, array $options): array
    {
        $result = [];
        foreach ($pool as $p) {
            $filtered = self::filterPokemonForms($p, $types, $options);
            if ($filtered !== null) {
                $result[] = $filtered;
            }
        }
        return $result;
    }

    /**
     * Returns the Pokémon with forms stripped according to options and type filter,
     * or null if the base Pokémon itself doesn't pass.
     */
    private static function filterPokemonForms(array $p, array $types, array $options): ?array
    {
        if (!isset($p['forms'])) {
            // No alternate forms – just check base type
            if (!self::typeMatches($p['types'], $types)) {
                return null;
            }
            return $p;
        }

        // Has forms: filter each form
        $allowMegas       = $options['forms'] && $options['megas'];
        $allowGigantamax  = $options['forms'] && $options['gigantamaxes'];
        $allowOtherForms  = $options['forms'];

        $keptForms = [];
        foreach ($p['forms'] as $form) {
            // Empty form array element {} represents the base form
            $isBase       = ($form === [] || (!isset($form['isMega']) && !isset($form['isGigantamax'])));
            $isMega       = !empty($form['isMega']);
            $isGigantamax = !empty($form['isGigantamax']);

            if ($isMega && !$allowMegas) {
                continue;
            }
            if ($isGigantamax && !$allowGigantamax) {
                continue;
            }
            if (!$isBase && !$isMega && !$isGigantamax && !$allowOtherForms) {
                continue;
            }

            // Type check
            $formTypes = $form['types'] ?? $p['types'];
            if (!self::typeMatches($formTypes, $types)) {
                continue;
            }

            $keptForms[] = $form;
        }

        if ($keptForms === []) {
            return null;
        }

        $copy          = $p;
        $copy['forms'] = $keptForms;
        return $copy;
    }

    /** Returns true if any of the Pokémon's types are in the filter set (empty = all pass). */
    private static function typeMatches(array $pokemonTypes, array $typesFlipped): bool
    {
        if ($typesFlipped === []) {
            return true;
        }
        foreach ($pokemonTypes as $t) {
            if (isset($typesFlipped[$t])) {
                return true;
            }
        }
        return false;
    }

    // -------------------------------------------------------------------------
    // Private helpers – random selection
    // -------------------------------------------------------------------------

    private static function chooseRandom(array $pool, array $options): array
    {
        $generated  = [];
        $n          = $options['n'];
        $showName   = $options['display'] !== 'sprites';
        $showSprite = $options['display'] !== 'names';

        // Deep copy so we can mutate
        $eligible = $pool;

        while (count($eligible) > 0 && count($generated) < $n) {
            $idx     = random_int(0, count($eligible) - 1);
            $pokemon = $eligible[$idx];
            array_splice($eligible, $idx, 1);

            $form = null;
            if ($options['forms'] && isset($pokemon['forms'])) {
                $formIdx = random_int(0, count($pokemon['forms']) - 1);
                $form    = $pokemon['forms'][$formIdx];

                // If we picked a mega, remove all remaining megas from pool
                if (!empty($form['isMega'])) {
                    $eligible = self::removeMegas($eligible);
                }
                // If we picked a gigantamax, remove all remaining gigantamaxes from pool
                if (!empty($form['isGigantamax'])) {
                    $eligible = self::removeGigantamaxes($eligible);
                }
            }

            $generated[] = self::buildGeneratedPokemon($pokemon, $form, $options, $showName, $showSprite);
        }

        // Shuffle to avoid megas always appearing first
        shuffle($generated);
        return $generated;
    }

    private static function removeMegas(array $pool): array
    {
        $result = [];
        foreach ($pool as $p) {
            if (!isset($p['forms'])) {
                $result[] = $p;
                continue;
            }
            $forms = array_values(array_filter($p['forms'], static fn($f) => empty($f['isMega'])));
            if ($forms !== []) {
                $p['forms'] = $forms;
                $result[]   = $p;
            }
        }
        return $result;
    }

    private static function removeGigantamaxes(array $pool): array
    {
        $result = [];
        foreach ($pool as $p) {
            if (!isset($p['forms'])) {
                $result[] = $p;
                continue;
            }
            $forms = array_values(array_filter($p['forms'], static fn($f) => empty($f['isGigantamax'])));
            if ($forms !== []) {
                $p['forms'] = $forms;
                $result[]   = $p;
            }
        }
        return $result;
    }

    private static function buildGeneratedPokemon(
        array  $pokemon,
        ?array $form,
        array  $options,
        bool   $showName,
        bool   $showSprite
    ): array {
        $baseName     = $pokemon['name'];
        $name         = self::getName($pokemon, $form);
        $spriteSuffix = $form['spriteSuffix'] ?? null;

        // Shiny: Gen VI odds — < 16 out of 65536
        $shiny = $showSprite && (random_int(0, self::SHINY_ROLLS - 1) < self::SHINY_THRESHOLD);

        $nature = null;
        if ($options['natures']) {
            $nature = self::NATURES[random_int(0, count(self::NATURES) - 1)];
        }

        $gender = null;
        if ($options['genders']) {
            $ratio = $form['genderRatio'] ?? $pokemon['genderRatio'] ?? ['male' => 1, 'female' => 1];
            if ($ratio !== 'unknown' && is_array($ratio)) {
                $total  = $ratio['male'] + $ratio['female'];
                $roll   = lcg_value(); // 0.0–1.0
                $gender = ($roll < ($ratio['male'] / $total)) ? 'male' : 'female';
            }
        }

        return [
            'id'          => $pokemon['id'],
            'baseName'    => $baseName,
            'name'        => $name,
            'spriteSuffix'=> $spriteSuffix,
            'nature'      => $nature,
            'shiny'       => $shiny,
            'date'        => date('Y-m-d H:i:s'),
            'gender'      => $gender,
            'showName'    => $showName,
            'showSprite'  => $showSprite,
        ];
    }

    private static function getName(array $pokemon, ?array $form): string
    {
        if ($form === null || $form === []) {
            return $pokemon['name'];
        }
        if (isset($form['name'])) {
            return $form['name'];
        }
        if (!empty($form['isMega'])) {
            return $pokemon['name'] . ' Mega';
        }
        if (!empty($form['isGigantamax'])) {
            return $pokemon['name'] . ' Gigantamax';
        }
        return $pokemon['name'];
    }

    /**
     * Normalises a Pokémon name to match the sprite filename convention.
     * Must match normalize_name() in scripts/format_sprites.py.
     *
     * Works without mbstring: all Pokémon names are ASCII except é, ♀, ♂.
     */
    private static function normalizeName(string $name): string
    {
        // Replace multi-byte special chars before lowercasing
        $name = str_replace(['É', 'é'], 'e', $name);
        $name = str_replace('♀', 'f', $name);
        $name = str_replace('♂', 'm', $name);
        // Now safe to use strtolower (remaining chars are ASCII)
        $name = strtolower($name);
        $name = preg_replace("/['.:%\- ]/", '', $name);
        return $name;
    }
}
