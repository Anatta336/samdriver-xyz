<?php

namespace App\Includes;

class Footer
{
    public static function render(): string
    {
        return <<<'EOD'
        <footer>
            <p>This site uses no cookies or other tracking technology.</p>
            <address>
                <!-- <p><a href="/feed/">RSS Feed<img src="/icons/rss.svg" class="smallIcon" alt="RSS icon" height="12px" width="12px"></a></p> -->
                <p><a id="footer-email" href="mailto:#"></a></p>

                <!-- conceal email from simple bots -->
                <script type="text/javascript">
                    const encoded = [ 115, 108, 130, 129, 150, 141, 162, 120, 167, 181, 200, 134, 195, 215, 158, 237, 235];
                    const email = encoded.map((enc, index) => enc - index * 8).map(code => String.fromCharCode(code)).join('');
                    const element = document.getElementById('footer-email');
                    element.href = `mailto:${email}`;
                    element.innerHTML = email;
                </script>
            </address>
        </footer>
        EOD;
    }
}