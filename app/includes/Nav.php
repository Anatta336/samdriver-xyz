<?php

namespace App\Includes;

class Nav
{
    public static function render(): string
    {
        return <<<'EOD'
        <nav>
            <a class="home" href="/">
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