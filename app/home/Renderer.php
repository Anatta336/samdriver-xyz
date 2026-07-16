<?php

namespace App\Home;

use App\Articles\ArticleList;
use App\Includes\DiskPalette;
use App\Includes\Head;
use App\Includes\SmallPrint;

class Renderer
{
    /**
     * Generates string for the full page of HTML of the home page.
     */
    public static function render(): string
    {
        $html = '<!DOCTYPE html><html lang="en">';

        // <head>
        $html .= Head::render(
            title: 'Sam Driver',
            description: 'Articles and tutorials on game and web development',
            styleSheetPath: '/css/home.css',
        );

        $html .= '<body class="home">';

        $html .= '<header class="desk-plate">';
        $html .= '<h1>Sam Driver <span class="plate-divider" aria-hidden="true">//</span> Articles <span class="amp">&amp;</span> Tutorials</h1>';
        $html .= '<p>Game and web development. Pick a disk, or slot one into the drive.</p>';
        $html .= '</header>';

        $html .= '<nav aria-label="Articles"><ul class="disk-field">';
        $index = 0;
        foreach ((new ArticleList())->getArticles() as $article) {
            if (empty($article) || !$article->exists()) {
                continue;
            }

            $html .= self::renderDisk($article, $index);
            ++$index;
        }
        $html .= '</ul></nav>';

        $html .= self::renderDrive();

        // Interaction script, cachebusted by modification time.
        $jsModified = @filemtime(__DIR__.'/../../public/js/home.js') ?: 0;
        $html .= '<script src="/js/home.js?v='.$jsModified.'" defer></script>';

        $html .= '</body>';
        $html .= '</html>';

        return $html;
    }

    /**
     * A single article presented as a 3.5" floppy disk.
     * Visual randomness (tilt, colour, wear) is seeded from the slug so it is
     * stable between page loads.
     */
    private static function renderDisk($article, int $index): string
    {
        $slug = $article->getSlug();
        $seed = crc32($slug);

        $tilt = (($seed % 110) / 10.0) - 5.5;                       // -5.5deg .. 5.5deg
        $jitterX = (((($seed >> 3) % 100) / 100.0) - 0.5) * 12.0;   // -6% .. 6%
        $jitterY = (((($seed >> 6) % 100) / 100.0) - 0.5) * 9.0;    // -4.5% .. 4.5%
        $labelTilt = 0;
        $wear = 0.35 + ((($seed >> 12) % 60) / 100.0);              // 0.35 .. 0.95
        $shell = DiskPalette::shellColour($slug);

        // Entrance: the disk is dealt in from a point off the top of the view.
        // --deal-fx is where along the top edge it starts (0 = left, 1 = right)
        // and --deal-drop how far beyond the edge; home.js turns the pair into
        // the pixel offset once it knows where the disk has landed.
        $dealRot = ((($seed >> 9) % 220)) - 110.0;                  // -110deg .. 110deg
        $dealFx = 0.08 + ((($seed >> 15) % 85) / 100.0);            // 0.08 .. 0.92
        $dealDrop = 30 + (($seed >> 21) % 90);                      // 30px .. 119px

        // Long titles get printed smaller so they fit the label.
        $titleLength = mb_strlen($article->getName());
        $titleScale = max(0.68, min(1.0, 1.05 - ($titleLength - 14) * 0.011));

        $style = sprintf(
            '--i: %d; --z: %d; --tilt: %.2fdeg; --jx: %.2f%%; --jy: %.2f%%; --label-tilt: %.2fdeg; --wear: %.2f; --shell: %s; --title-scale: %.2f; --deal-rot: %.1fdeg; --deal-fx: %.2f; --deal-drop: %dpx;',
            $index,
            2 + ($index % 14),
            $tilt,
            $jitterX,
            $jitterY,
            $labelTilt,
            $wear,
            $shell,
            $titleScale,
            $dealRot,
            $dealFx,
            $dealDrop
        );

        $name = htmlentities($article->getName());
        $description = htmlentities($article->getDescription());

        // Older articles carry placeholder ordering dates; stamp those with a
        // serial number instead.
        $sort = $article->getSort();
        $date = ((int) substr($sort, 0, 4)) > 1971
            ? htmlentities($sort)
            : sprintf('NO.&#8202;%02d', ($seed % 89) + 10);
        $href = '/article/'.htmlentities($slug);

        $html = '<li class="disk-cell" style="'.$style.'">';
        $html .= '<a class="disk" href="'.$href.'" data-slug="'.htmlentities($slug).'">';
        $html .= '<span class="disk-lift">';
        $html .= '<span class="disk-shell">';

        // Metal shutter along the insertion edge.
        $html .= '<span class="shutter-indent" aria-hidden="true"></span>';
        $html .= '<span class="shutter" aria-hidden="true"><span class="shutter-window"></span></span>';
        $html .= '<span class="moulded-arrow" aria-hidden="true"></span>';

        // Paper label, printed by a tired dot-matrix printer.
        $html .= '<span class="label">';
        $html .= '<h2>'.$name.'</h2>';
        $html .= '<span class="label-meta" aria-hidden="true"><span class="label-date">'.$date.'</span><span class="label-density">2HD&thinsp;&middot;&thinsp;1.44&nbsp;MB</span></span>';
        $html .= '</span>';

        // Moulded details.
        $html .= '<span class="hole hole-left" aria-hidden="true"></span>';
        $html .= '<span class="hole hole-right" aria-hidden="true"></span>';
        // $html .= '<span class="grip" aria-hidden="true"></span>';

        $html .= '<span class="load-btn">Load &#9656;</span>';

        $html .= '</span>'; // .disk-shell
        $html .= '</span>'; // .disk-lift
        $html .= '</a>';
        $html .= '</li>';

        return $html;
    }

    /**
     * The floppy drive, mounted flush into the surface.
     */
    private static function renderDrive(): string
    {
        $smallPrint = SmallPrint::render();

        return <<<EOD
        <aside class="drive" aria-label="Disk drive: drop a disk here to open its article">
            <div class="drive-plate">
                <div class="drive-slot" aria-hidden="true"><span class="slot-opening"></span></div>
                <div class="drive-row" aria-hidden="true">
                    <span class="drive-led"></span>
                    <span class="drive-legend">Insert disk<span class="drive-legend-more"> to load article</span></span>
                    <button class="drive-eject" type="button" aria-hidden="true" tabindex="-1" title="Eject">&#9167;</button>
                </div>
                <div class="drive-chin">
                    {$smallPrint}
                    <span class="chin-vents" aria-hidden="true"></span>
                </div>
                <span class="drive-screw screw-tl" aria-hidden="true"></span>
                <span class="drive-screw screw-tr" aria-hidden="true"></span>
                <span class="drive-screw screw-bl" aria-hidden="true"></span>
                <span class="drive-screw screw-br" aria-hidden="true"></span>
            </div>
        </aside>
        EOD;
    }
}
