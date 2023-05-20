<?php

namespace App\Includes;

class Nav
{
    public static function render(): string
    {
        return <<<'EOD'
        <nav>
            <a href="/">Articles</a>
        </nav>
        EOD;
    }
}