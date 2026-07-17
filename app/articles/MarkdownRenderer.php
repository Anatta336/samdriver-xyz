<?php

namespace App\Articles;

use App\Includes\Site;
use DOMElement;
use DOMNode;
use DOMText;

/**
 * Renders an article as Markdown, served at /article/{slug}.md and linked from
 * the llms.txt index.
 *
 * Articles are hand-written and share no build step, so this walks whatever
 * markup an article happens to use rather than expecting a schema. The demos
 * are the point of most articles and there's nothing to say about a <canvas>
 * in plain text — but each demo has a <noscript> fallback holding a static
 * image and a written alt text, so that gets unwrapped and stands in for it.
 */
class MarkdownRenderer
{
    /**
     * Elements holding no readable text, or text that's browser furniture.
     */
    private const SKIPPED_ELEMENTS = [
        'button', 'canvas', 'iframe', 'input', 'label', 'script', 'select',
        'source', 'style', 'textarea', 'video',
    ];

    /**
     * Classes marking content that only means anything in a browser: the
     * "javascript is disabled" notices, and the controls driving the demos.
     */
    private const SKIPPED_CLASSES = ['warning', 'requires-script'];

    /**
     * Elements carrying no meaning of their own, whose children are emitted in
     * their place.
     */
    private const TRANSPARENT_ELEMENTS = [
        'article', 'aside', 'div', 'main', 'noscript', 'section',
    ];

    private const BLOCK_ELEMENTS = [
        'blockquote', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img',
        'ol', 'p', 'pre', 'table', 'ul',
    ];

    public static function render(Article $article): string
    {
        $markdown = '# '.$article->getName()."\n\n";
        $markdown .= '> '.$article->getDescription()."\n";

        $blocks = [];
        $content = $article->getContentElement();

        if ($content) {
            $blocks = self::renderChildBlocks($content);
        }

        if ($blocks) {
            $markdown .= "\n".implode("\n\n", $blocks)."\n";
        }

        return $markdown;
    }

    /**
     * @param array<string> $exceptTags Child elements to leave to the caller.
     * @return array<string> Markdown blocks, to be joined by a blank line.
     */
    private static function renderChildBlocks(DOMNode $node, array $exceptTags = []): array
    {
        $blocks = [];
        $inline = '';

        foreach ($node->childNodes as $child) {
            if (self::isSkipped($child) || self::hasTag($child, $exceptTags)) {
                continue;
            }

            if (!self::isBlock($child)) {
                $inline .= self::renderInline($child);
                continue;
            }

            // Flush any loose text sitting between the block elements.
            $blocks = array_merge($blocks, self::asBlock($inline), self::renderBlock($child));
            $inline = '';
        }

        return array_merge($blocks, self::asBlock($inline));
    }

    /**
     * @return array<string>
     */
    private static function renderBlock(DOMElement $element): array
    {
        $tag = strtolower($element->nodeName);

        if (in_array($tag, self::TRANSPARENT_ELEMENTS, true)) {
            return self::renderChildBlocks($element);
        }

        switch ($tag) {
            case 'h1':
            case 'h2':
            case 'h3':
            case 'h4':
            case 'h5':
            case 'h6':
                // Articles open at <h2>, below the title this renders as <h1>,
                // so the levels carry over as they are.
                return self::asBlock(
                    str_repeat('#', (int) $tag[1]).' '.self::renderChildrenInline($element)
                );

            case 'p':
                return self::asBlock(self::renderChildrenInline($element));

            case 'img':
                return self::asBlock(self::renderImage($element));

            case 'pre':
                return self::renderCodeBlock($element);

            case 'ul':
            case 'ol':
                return self::renderList($element);

            case 'figure':
                return self::renderFigure($element);

            case 'table':
                return self::renderTable($element);

            case 'blockquote':
                $quoted = implode("\n\n", self::renderChildBlocks($element));
                return self::asBlock(preg_replace('/^/m', '> ', $quoted));
        }

        return self::renderChildBlocks($element);
    }

    private static function renderInline(DOMNode $node): string
    {
        if ($node instanceof DOMText) {
            return self::collapseWhitespace($node->textContent);
        }

        if (!$node instanceof DOMElement) {
            return '';
        }

        switch (strtolower($node->nodeName)) {
            case 'br':
                return "\n";

            case 'b':
            case 'strong':
                return self::wrapInline(self::renderChildrenInline($node), '**');

            case 'i':
            case 'em':
                return self::wrapInline(self::renderChildrenInline($node), '*');

            case 'code':
                return self::wrapInline(self::collapseWhitespace($node->textContent), '`');

            // MathML holds one token per element, so the whitespace between
            // them is only source formatting: closing it up recovers something
            // like "η1sin(θ1)=η2sin(θ2)", which reads well enough set as code.
            case 'math':
                return self::wrapInline(preg_replace('/\s+/', '', $node->textContent), '`');

            case 'sup':
                return '^'.self::renderChildrenInline($node);

            case 'sub':
                return '_'.self::renderChildrenInline($node);

            case 'img':
                return self::renderImage($node);

            case 'a':
                $text = self::renderChildrenInline($node);
                $href = self::absoluteUrl($node->getAttribute('href'));

                return $href === '' ? $text : '['.trim($text).']('.$href.')';
        }

        return self::renderChildrenInline($node);
    }

    private static function renderChildrenInline(DOMNode $node): string
    {
        $text = '';

        foreach ($node->childNodes as $child) {
            if (self::isSkipped($child)) {
                continue;
            }

            $text .= self::renderInline($child);
        }

        // Each child collapsed its own whitespace but the joins between them
        // can still double up, as in "<p>a <b> bold </b> word</p>". A browser
        // collapses those too. Line breaks are left alone: only a <br> can put
        // one here, and it meant it.
        return preg_replace('/ +/', ' ', $text);
    }

    /**
     * @return array<string>
     */
    private static function renderCodeBlock(DOMElement $element): array
    {
        $code = trim($element->textContent, "\n");

        if (trim($code) === '') {
            return [];
        }

        // The fence has to outrun the longest run of backticks in the code.
        $fence = '```';
        if (preg_match_all('/`+/', $code, $matches)) {
            $fence = str_repeat('`', max(3, max(array_map('strlen', $matches[0])) + 1));
        }

        return [$fence."\n".$code."\n".$fence];
    }

    private static function renderImage(DOMElement $element): string
    {
        $source = self::absoluteUrl($element->getAttribute('src'));

        if ($source === '') {
            return '';
        }

        return '!['.trim(self::collapseWhitespace($element->getAttribute('alt'))).']('.$source.')';
    }

    /**
     * @return array<string>
     */
    private static function renderList(DOMElement $element): array
    {
        $isOrdered = strtolower($element->nodeName) === 'ol';
        $items = [];

        foreach (self::childElements($element, ['li']) as $item) {
            $blocks = self::renderChildBlocks($item);

            if (!$blocks) {
                continue;
            }

            $marker = $isOrdered ? (count($items) + 1).'. ' : '- ';
            $text = implode("\n\n", $blocks);

            // Indent the wrapped lines so they stay within the item.
            $items[] = $marker.str_replace("\n", "\n".str_repeat(' ', strlen($marker)), $text);
        }

        return $items ? [implode("\n", $items)] : [];
    }

    /**
     * @return array<string>
     */
    private static function renderFigure(DOMElement $element): array
    {
        $blocks = self::renderChildBlocks($element, ['figcaption']);
        $caption = self::childElements($element, ['figcaption'])[0] ?? null;

        if ($caption) {
            $blocks = array_merge($blocks, self::asBlock(
                self::wrapInline(self::renderChildrenInline($caption), '*')
            ));
        }

        return $blocks;
    }

    /**
     * A table is only a Markdown table when it's genuinely tabular. Some
     * articles nest tables to lay out a diagram, which Markdown has no way to
     * express, so those collapse to their cells' contents in reading order.
     *
     * @return array<string>
     */
    private static function renderTable(DOMElement $element): array
    {
        $rows = self::tableRows($element);

        if (!$rows) {
            return [];
        }

        if (!self::isTabular($element)) {
            $blocks = [];
            foreach ($rows as $row) {
                foreach (self::childElements($row, ['td', 'th']) as $cell) {
                    $blocks = array_merge($blocks, self::renderChildBlocks($cell));
                }
            }

            return $blocks;
        }

        $grid = [];
        foreach ($rows as $row) {
            $cells = [];
            foreach (self::childElements($row, ['td', 'th']) as $cell) {
                $cells[] = str_replace(
                    ['|', "\n"],
                    ['\\|', ' '],
                    trim(self::renderChildrenInline($cell))
                );
            }

            $grid[] = $cells;
        }

        $width = max(array_map('count', $grid));

        if ($width === 0) {
            return [];
        }

        $lines = [];
        foreach ($grid as $index => $cells) {
            $lines[] = '| '.implode(' | ', array_pad($cells, $width, '')).' |';

            // Markdown wants a header row, so the first row becomes one.
            if ($index === 0) {
                $lines[] = '|'.str_repeat(' --- |', $width);
            }
        }

        return [implode("\n", $lines)];
    }

    /**
     * Whether a table holds data rather than being used to lay out a diagram.
     */
    private static function isTabular(DOMElement $table): bool
    {
        foreach (['table', 'pre', 'ul', 'ol', 'figure'] as $tag) {
            if ($table->getElementsByTagName($tag)->length > 0) {
                return false;
            }
        }

        return true;
    }

    /**
     * The table's own rows, looking through any <thead>/<tbody>/<tfoot> but not
     * into the rows of a nested table.
     *
     * @return array<DOMElement>
     */
    private static function tableRows(DOMElement $table): array
    {
        $rows = [];

        foreach (self::childElements($table, ['tr', 'thead', 'tbody', 'tfoot']) as $child) {
            if (strtolower($child->nodeName) === 'tr') {
                $rows[] = $child;
                continue;
            }

            $rows = array_merge($rows, self::tableRows($child));
        }

        return $rows;
    }

    /**
     * @param array<string> $tags
     * @return array<DOMElement>
     */
    private static function childElements(DOMNode $node, array $tags): array
    {
        $elements = [];

        foreach ($node->childNodes as $child) {
            if (self::hasTag($child, $tags) && !self::isSkipped($child)) {
                $elements[] = $child;
            }
        }

        return $elements;
    }

    private static function isSkipped(DOMNode $node): bool
    {
        if ($node instanceof DOMText) {
            return false;
        }

        if (!$node instanceof DOMElement) {
            // A comment, or something else with nothing to say.
            return true;
        }

        if (in_array(strtolower($node->nodeName), self::SKIPPED_ELEMENTS, true)) {
            return true;
        }

        $classes = preg_split('/\s+/', $node->getAttribute('class'), -1, PREG_SPLIT_NO_EMPTY);

        return (bool) array_intersect($classes, self::SKIPPED_CLASSES);
    }

    private static function isBlock(DOMNode $node): bool
    {
        return self::hasTag($node, self::BLOCK_ELEMENTS)
            || self::hasTag($node, self::TRANSPARENT_ELEMENTS);
    }

    /**
     * @param array<string> $tags
     */
    private static function hasTag(DOMNode $node, array $tags): bool
    {
        return $node instanceof DOMElement
            && in_array(strtolower($node->nodeName), $tags, true);
    }

    /**
     * Markdown for a block, or nothing at all if it turned out to be empty.
     *
     * @return array<string>
     */
    private static function asBlock(string $markdown): array
    {
        $markdown = trim($markdown);

        return $markdown === '' ? [] : [$markdown];
    }

    /**
     * Wraps text in a marker, leaving any surrounding space outside it so the
     * marker stays attached to the word.
     */
    private static function wrapInline(string $text, string $marker): string
    {
        if (trim($text) === '') {
            return $text;
        }

        preg_match('/^(\s*)(.*?)(\s*)$/s', $text, $parts);

        return $parts[1].$marker.$parts[2].$marker.$parts[3];
    }

    private static function collapseWhitespace(string $text): string
    {
        return preg_replace('/\s+/', ' ', $text);
    }

    private static function absoluteUrl(string $url): string
    {
        $url = trim($url);

        return str_starts_with($url, '/') ? Site::URL.$url : $url;
    }
}
