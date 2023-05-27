<?php
declare(strict_types = 1);

namespace Public;

use App\Routes\Handler;

require '../vendor/autoload.php';
// error_reporting(E_ALL);

$uri = $_SERVER['REQUEST_URI'] ?? '/';

$handler = new Handler($uri);
echo $handler->render();

?>
