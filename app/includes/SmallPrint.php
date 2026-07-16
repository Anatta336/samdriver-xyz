<?php

namespace App\Includes;

/**
 * The site's small print — the no-tracking note and contact address —
 * screen-printed onto the hardware it sits on: the monitor chin on article
 * pages, the disk drive plate on the home page.
 */
class SmallPrint
{
    public static function render(): string
    {
        return <<<'EOD'
        <div class="small-print">
            <p>No cookies&thinsp;/&thinsp;tracking</p>
            <address>
                <a id="footer-email" href="mailto:#"></a>
            </address>

            <!-- conceal email from simple bots -->
            <script type="text/javascript">
                const encoded = [ 115, 108, 130, 129, 150, 141, 162, 120, 167, 181, 200, 134, 195, 215, 158, 237, 235];
                const email = encoded.map((enc, index) => enc - index * 8).map(code => String.fromCharCode(code)).join('');
                const element = document.getElementById('footer-email');
                element.href = `mailto:${email}`;
                element.innerHTML = email;
            </script>
        </div>
        EOD;
    }
}
