<?php

declare(strict_types=1);

// 自动计算当前脚本所在的 URL 目录前缀，无论部署在哪个路径都能正常工作
define('BASE_PATH', rtrim(dirname($_SERVER['SCRIPT_NAME'] ?? ''), '/\\'));

require_once __DIR__ . '/PokemonGenerator.php';

PokemonGenerator::setBasePath(BASE_PATH);

session_start();

function h(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function checked(bool $condition): string
{
    return $condition ? ' checked' : '';
}

function selected(bool $condition): string
{
    return $condition ? ' selected' : '';
}

function listContains(array $selectedValues, string|int $value): bool
{
    return $selectedValues === [] || in_array($value, $selectedValues, true);
}

function getSessionList(string $key): array
{
    $value = $_SESSION[$key] ?? [];
    return is_array($value) ? $value : [];
}

function trimHistory(array $history): array
{
    return array_slice($history, 0, PokemonGenerator::HISTORY_SIZE);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['clear_shinies'])) {
    $_SESSION['shinies'] = [];
    header('Location: ' . BASE_PATH . '/');
    exit;
}

$history = getSessionList('history');
$shinies = getSessionList('shinies');
$displayedIndex = isset($_SESSION['displayedIndex']) ? (int) $_SESSION['displayedIndex'] : -1;
$storedOptions = $_SESSION['last_options'] ?? PokemonGenerator::getDefaultOptions();
if (!is_array($storedOptions)) {
    $storedOptions = PokemonGenerator::getDefaultOptions();
}

$shouldParseInput = PokemonGenerator::hasOptionInputs($_GET) || isset($_GET['generate']);
$options = $shouldParseInput
    ? PokemonGenerator::parseOptions($_GET, $storedOptions)
    : $storedOptions;

$results = [];
$errorMessage = null;

if (isset($_GET['generate'])) {
    try {
        $results = PokemonGenerator::generate($options);
        $_SESSION['last_options'] = $options;

        if ($results !== []) {
            array_unshift($history, $results);
            $history = trimHistory($history);

            $newShinies = PokemonGenerator::filterShinies($results);
            if ($newShinies !== []) {
                array_unshift($shinies, ...$newShinies);
            }

            $_SESSION['history'] = $history;
            $_SESSION['shinies'] = $shinies;
            $_SESSION['displayedIndex'] = 0;
            $displayedIndex = 0;
        }
    } catch (Throwable $exception) {
        $errorMessage = 'An error occurred while generating Pokémon.';
    }
} elseif (isset($_GET['history']) && $history !== []) {
    if ($displayedIndex < 0) {
        $displayedIndex = 0;
    }

    if ($_GET['history'] === 'previous') {
        $displayedIndex = min($displayedIndex + 1, count($history) - 1);
    } elseif ($_GET['history'] === 'next') {
        $displayedIndex = max($displayedIndex - 1, 0);
    }

    $_SESSION['displayedIndex'] = $displayedIndex;
    $results = $history[$displayedIndex] ?? [];
} elseif ($history !== [] && $displayedIndex >= 0) {
    $results = $history[$displayedIndex] ?? [];
}

$regionDefinitions = PokemonGenerator::getRegionDefinitions();
$typeDefinitions = PokemonGenerator::getTypeDefinitions();
$shinyCount = count($shinies);
$showPrevious = $history !== [] && $displayedIndex < count($history) - 1 && $displayedIndex >= 0;
$showNext = $history !== [] && $displayedIndex > 0;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Random Pokémon Generator</title>
    <link rel="stylesheet" type="text/css" href="<?= BASE_PATH ?>/style.css">
    <meta name="theme-color" content="#FFF" media="(prefers-color-scheme: light)">
    <meta name="theme-color" content="#222" media="(prefers-color-scheme: dark)">
    <meta name="description" content="Generate random Pokémon based on region, type, and more. Try your luck and catch a shiny Pokémon!">
    <link rel="icon" href="<?= BASE_PATH ?>/favicon.ico">
    <link rel="icon" href="<?= BASE_PATH ?>/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="<?= BASE_PATH ?>/apple-touch-icon.png">
    <link rel="manifest" href="<?= BASE_PATH ?>/manifest.webmanifest">
    <script src="<?= BASE_PATH ?>/ui.js" defer></script>
</head>
<body>

<header>
    <h1>Random Pokémon Generator</h1>
</header>

<form action="<?= BASE_PATH ?>/" method="get" id="controls" class="menu">
    <input type="hidden" name="generate" value="1">

    <fieldset>
        <label>Generate
            <select name="n" id="n" required>
                <?php for ($i = 1; $i <= 6; $i++): ?>
                    <option value="<?= $i ?>"<?= selected($options['n'] === $i) ?>><?= $i ?></option>
                <?php endfor; ?>
            </select>
            Pokémon.
        </label>

        <div class="dropdown" id="regions">
            <button type="button" data-plural-name="Regions">All Regions</button>
            <div class="popup">
                <ul>
                    <li><label><input type="checkbox" value="all" data-select-all="true"<?= checked($options['regions'] === []) ?>>Select All</label></li>
                    <?php foreach ($regionDefinitions as $region): ?>
                        <li>
                            <label title="<?= h($region['title']) ?>">
                                <input type="checkbox" name="regions[]" value="<?= h($region['value']) ?>"<?= checked(listContains($options['regions'], $region['value'])) ?>><?= h($region['label']) ?>
                            </label>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        </div>

        <div class="dropdown" id="types">
            <button type="button" data-plural-name="Types" data-allow-showing-two="true">All Types</button>
            <div class="popup">
                <ul>
                    <li><label><input type="checkbox" value="all" data-select-all="true"<?= checked($options['types'] === []) ?>>Select All</label></li>
                    <?php foreach ($typeDefinitions as $type): ?>
                        <li>
                            <label>
                                <input type="checkbox" name="types[]" value="<?= h($type['value']) ?>"<?= checked(listContains($options['types'], $type['value'])) ?>><?= h($type['label']) ?>
                            </label>
                        </li>
                    <?php endforeach; ?>
                </ul>
            </div>
        </div>
    </fieldset>

    <fieldset>
        <div class="dropdown">
            <button type="button" data-plural-name="Legendaries" data-name-for-count="Legendary Types" data-allow-none="true">All Legendaries</button>
            <div class="popup">
                <ul>
                    <li><label><input type="checkbox" data-select-all="true"<?= checked($options['sublegendaries'] && $options['legendaries'] && $options['mythicals'] && $options['paradoxes'] && $options['ultraBeasts']) ?>>Select All</label></li>
                    <li><label><input type="checkbox" id="sublegendaries" name="sublegendaries" value="true" data-short-name="Sub-Legendary"<?= checked($options['sublegendaries']) ?>>Sub-Legendary Pokémon</label></li>
                    <li><label><input type="checkbox" id="legendaries" name="legendaries" value="true" data-short-name="Legendary"<?= checked($options['legendaries']) ?>>Legendary Pokémon</label></li>
                    <li><label><input type="checkbox" id="mythicals" name="mythicals" value="true" data-short-name="Mythical"<?= checked($options['mythicals']) ?>>Mythical Pokémon</label></li>
                    <li><label><input type="checkbox" id="paradox" name="paradoxes" value="true" data-short-name="Paradox"<?= checked($options['paradoxes']) ?>>Paradox Pokémon</label></li>
                    <li><label><input type="checkbox" id="ultraBeast" name="ultraBeasts" value="true"<?= checked($options['ultraBeasts']) ?>>Ultra Beasts</label></li>
                </ul>
            </div>
        </div>

        <div class="dropdown">
            <button type="button" data-plural-name="Stages">Stages</button>
            <div class="popup">
                <ul>
                    <li><label><input type="checkbox" id="unevolved" name="evolutionCounts[]" value="0"<?= checked(listContains($options['evolutionCounts'], 0)) ?>>Unevolved</label></li>
                    <li><label><input type="checkbox" id="evolvedOnce" name="evolutionCounts[]" value="1"<?= checked(listContains($options['evolutionCounts'], 1)) ?>>Evolved Once</label></li>
                    <li><label><input type="checkbox" id="evolvedTwice" name="evolutionCounts[]" value="2"<?= checked(listContains($options['evolutionCounts'], 2)) ?>>Evolved Twice</label></li>
                </ul>
            </div>
        </div>

        <div class="dropdown">
            <button type="button" data-all-name="Fully Evolved or Not">Fully Evolved or Not</button>
            <div class="popup">
                <ul>
                    <li><label><input type="checkbox" id="nfes" name="nfes" value="true"<?= checked($options['nfes']) ?>>Not Fully Evolved</label></li>
                    <li><label><input type="checkbox" id="fullyEvolved" name="fullyEvolved" value="true"<?= checked($options['fullyEvolved']) ?>>Fully Evolved</label></li>
                </ul>
            </div>
        </div>
    </fieldset>

    <fieldset>
        <select name="display" id="display" required>
            <option value="names"<?= selected($options['display'] === 'names') ?>>Names Only</option>
            <option value="sprites"<?= selected($options['display'] === 'sprites') ?>>Images Only</option>
            <option value="both"<?= selected($options['display'] === 'both') ?>>Names and Images</option>
        </select>

        <label><input type="checkbox" id="natures" name="natures" value="true"<?= checked($options['natures']) ?>>Natures</label>
        <label><input type="checkbox" id="genders" name="genders" value="true"<?= checked($options['genders']) ?>>Genders</label>

        <div class="dropdown" id="formsDropdown">
            <button type="button" data-plural-name="Forms" data-allow-showing-two="true" data-allow-none="true">Forms</button>
            <div class="popup">
                <ul>
                    <li><label><input type="checkbox" id="forms" name="forms" value="true" data-short-name="Forms"<?= checked($options['forms']) ?>>Alternate Forms</label></li>
                    <li><label><input type="checkbox" id="megas" name="megas" value="true" data-short-name="Megas"<?= checked($options['megas']) ?>>Mega Evolutions</label></li>
                    <li><label><input type="checkbox" id="gigantamaxes" name="gigantamaxes" value="true" data-short-name="Gigantamax"<?= checked($options['gigantamaxes']) ?>>Gigantamax Forms</label></li>
                </ul>
            </div>
        </div>

        <input value="Generate" type="submit">
    </fieldset>
</form>

<nav id="history">
    <a class="<?= $showPrevious ? 'text' : 'hidden text' ?>" id="previous" href="<?= BASE_PATH ?>/?history=previous">&#x23EA; Previous</a>
    <a class="<?= $showNext ? 'text' : 'hidden text' ?>" id="next" href="<?= BASE_PATH ?>/?history=next">Next &#x23E9;</a>
</nav>

<section id="results">
    <?php if ($errorMessage !== null): ?>
        <?= h($errorMessage) ?>
    <?php elseif ($results !== [] || isset($_GET['generate'])): ?>
        <?= PokemonGenerator::renderPokemonList($results) ?>
    <?php endif; ?>
</section>

<button id="shiny-toggler" class="text <?= $shinyCount === 0 ? 'invisible ' : '' ?>is-hiding" type="button">
    <span class="star">&starf;</span>
    <span id="shiny-count"><?= $shinyCount ?></span> shiny Pokémon
    <span class="is-showing">&and;</span><span class="is-hiding">&or;</span>
</button>
<section id="shiny-container" class="menu invisible">
    <div id="shinies"><?= PokemonGenerator::renderShinyList($shinies) ?></div>
    <form method="post" action="<?= BASE_PATH ?>/">
        <button class="text" type="submit" name="clear_shinies" value="1">&#x274C; Clear your shiny Pokémon</button>
    </form>
</section>

<footer>
    <p>
        <a href="https://github.com/hqylwrx/Random-Pokemon-Generator">GitHub</a> |
        Pokémon is &copy; <span data-since="1995"></span> Nintendo. Website is &copy; <span data-since="2008"></span> Drew Mitchell.
    </p>
</footer>

</body>
</html>
