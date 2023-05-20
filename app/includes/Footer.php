<?php

namespace App\Includes;

class Footer
{
    public static function render(): string
    {
        return <<<'EOD'
        <footer>
            <address>
                <!-- <p><a href="/feed/">RSS Feed<img src="/icons/rss.svg" class="smallIcon" alt="RSS icon" height="12px" width="12px"></a></p> -->
                <p>
                    <!-- conceal email from simple bots -->
                    <script type="text/javascript">
                        email = 'gmx.co.uk'
                        email = ('sdriver' + '@' + email)
                        document.write(`<a href="mailto: ${email}">${email} <img src="/footer/email.svg" class="smallIcon" alt="Email" height="10px" width="14.10px"></a>`)
                    </script>
                </p>
            </address>
        <p>This site uses no cookies or other tracking technology.</p>
        </footer>
        EOD;
    }
}