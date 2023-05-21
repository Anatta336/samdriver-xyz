<?php

namespace App\Includes;

class Nav
{
    public static function render(): string
    {
        return <<<'EOD'
        <nav>
            <a class="home" href="/" aria-label="View articles list">
                <div class="square"></div>
                <div class="square"></div>
                <div class="square"></div>
                <div class="square"></div>
                <div class="square"></div>
            </a>
        </nav>
        EOD;
    }
}