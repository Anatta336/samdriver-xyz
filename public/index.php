<?php
declare(strict_types = 1);

namespace Public;

use App\Routes\Handler;

// Autoloader that doesn't have any dependencies, so works on live.
require_once '../app/autoloader.php';

$uri = $_SERVER['REQUEST_URI'] ?? '/';

$handler = new Handler($uri);
echo $handler->render();

?>
