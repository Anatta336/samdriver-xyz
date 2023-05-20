<?php
spl_autoload_register(function ($class) {
    $prefixes = [
        "App\\" => __DIR__ . "",
    ];
    // Loop through the prefixes array
    foreach ($prefixes as $prefix => $baseDir) {
        if (strpos($class, $prefix) !== 0) {
            // Class name does not start with the prefix, so move to the next prefix
            continue;
        }

        // Remove the prefix from the class name.
        $relativePath = substr($class, strlen($prefix));

        // Replace backslashes with directory separators.
        $relativePath = DIRECTORY_SEPARATOR.str_replace("\\", DIRECTORY_SEPARATOR, $relativePath);

        // Convert all but the final directory name to start lowercase.
        $relativePath = preg_replace_callback(
            "/\/([A-Z])(?=[^\/]*\/)/",
            function ($matches) {
                // Convert to lowercase.
                return strtolower($matches[1]);
            },
            $relativePath
        );

        // Prepend the base directory.
        $relativePath = $baseDir.DIRECTORY_SEPARATOR.$relativePath;

        // Append .php
        $file = $relativePath . '.php';

        // Check if the file exists and is readable.
        if (is_readable($file)) {
            // Actually import it.
            require $file;
        }
    }
});
