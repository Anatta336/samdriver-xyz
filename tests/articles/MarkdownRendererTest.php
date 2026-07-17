<?php

namespace Tests\Articles;

require_once __DIR__.'/../../vendor/autoload.php';

use App\Articles\Article;
use App\Articles\MarkdownRenderer;
use org\bovigo\vfs\vfsStream;
use org\bovigo\vfs\vfsStreamDirectory;
use PHPUnit\Framework\TestCase;

class MarkdownRendererTest extends TestCase
{
    protected vfsStreamDirectory $root;

    protected function setUp(): void
    {
        $this->root = vfsStream::setup('article-data');
    }

    /**
     * Builds an article whose <article> element holds the given markup, and
     * returns its Markdown.
     */
    private function render(string $content): string
    {
        vfsStream::create(
            [
                'example' => [
                    'index.html' => '<html><head><title>Example</title>'
                        .'<meta name="description" content="An example.">'
                        .'</head><body><article>'.$content.'</article></body></html>',
                ],
            ], $this->root
        );

        return MarkdownRenderer::render(new Article($this->root->url(), 'example'));
    }

    public function testRendersTitleAndDescription(): void
    {
        $markdown = $this->render('<p>Body.</p>');

        $this->assertStringStartsWith("# Example\n\n> An example.\n", $markdown);
        $this->assertStringContainsString("\nBody.\n", $markdown);
    }

    public function testRendersInlineMarkup(): void
    {
        $markdown = $this->render(
            '<p>An <b>interface</b> has an <i>index</i> of <code>1.52</code>.</p>'
        );

        $this->assertStringContainsString(
            'An **interface** has an *index* of `1.52`.',
            $markdown
        );
    }

    /**
     * Emphasis markers have to sit against the word, not the space around it.
     */
    public function testEmphasisKeepsSurroundingSpaceOutsideTheMarkers(): void
    {
        $markdown = $this->render('<p>a <b> bold </b> word</p>');

        $this->assertStringContainsString('a **bold** word', $markdown);
    }

    public function testMakesLinksAndImagesAbsolute(): void
    {
        $markdown = $this->render(
            '<p><a href="/article/other">Other</a></p>'
            .'<img src="/article-data/example/pic.webp" alt="A picture">'
        );

        $this->assertStringContainsString('[Other](https://samdriver.xyz/article/other)', $markdown);
        $this->assertStringContainsString(
            '![A picture](https://samdriver.xyz/article-data/example/pic.webp)',
            $markdown
        );
    }

    public function testLeavesExternalLinksAlone(): void
    {
        $markdown = $this->render('<p><a href="https://example.com/x">External</a></p>');

        $this->assertStringContainsString('[External](https://example.com/x)', $markdown);
    }

    public function testRendersHeadingsAtTheirOwnLevel(): void
    {
        $markdown = $this->render('<h2>Air to glass</h2><h3>Detail</h3>');

        $this->assertStringContainsString("\n## Air to glass\n", $markdown);
        $this->assertStringContainsString("\n### Detail\n", $markdown);
    }

    public function testRendersCodeBlocksAsFences(): void
    {
        $markdown = $this->render("<pre><code>int x = 1;\nint y = 2;</code></pre>");

        $this->assertStringContainsString("```\nint x = 1;\nint y = 2;\n```", $markdown);
    }

    /**
     * A fence has to be longer than any run of backticks inside the code.
     */
    public function testCodeBlockFenceOutrunsBackticksInTheCode(): void
    {
        $markdown = $this->render('<pre><code>a ``` b</code></pre>');

        $this->assertStringContainsString("````\na ``` b\n````", $markdown);
    }

    public function testRendersLists(): void
    {
        $markdown = $this->render(
            '<ul><li>First</li><li>Second</li></ul><ol><li>One</li><li>Two</li></ol>'
        );

        $this->assertStringContainsString("- First\n- Second", $markdown);
        $this->assertStringContainsString("1. One\n2. Two", $markdown);
    }

    public function testRendersFigureCaptionAfterItsContent(): void
    {
        $markdown = $this->render(
            '<figure><img src="/a.webp" alt="Alt"><figcaption>Bresenham\'s</figcaption></figure>'
        );

        $this->assertStringContainsString(
            "![Alt](https://samdriver.xyz/a.webp)\n\n*Bresenham's*",
            $markdown
        );
    }

    public function testRendersTabularTableAsMarkdownTable(): void
    {
        $markdown = $this->render(
            '<table><tr><th>Name</th><th>Index</th></tr>'
            .'<tr><td>Glass</td><td>1.52</td></tr></table>'
        );

        $this->assertStringContainsString(
            "| Name | Index |\n| --- | --- |\n| Glass | 1.52 |",
            $markdown
        );
    }

    /**
     * Nested tables lay out a diagram and have no Markdown equivalent, so the
     * outer table gives way to the contents of its cells.
     */
    public function testFlattensTableUsedForLayout(): void
    {
        $markdown = $this->render(
            '<table><tr><th>Grid</th></tr><tr><td>'
            .'<table class="gridded"><tr><td>(0,0)</td><td>(1,0)</td></tr></table>'
            .'</td></tr></table>'
        );

        $this->assertStringContainsString('Grid', $markdown);
        $this->assertStringContainsString('| (0,0) | (1,0) |', $markdown);
        // The outer table contributed no table of its own.
        $this->assertStringNotContainsString('| Grid |', $markdown);
    }

    /**
     * The demos are the point of most articles, and their <noscript> fallback
     * is the only part of them that means anything as text.
     */
    public function testUsesNoscriptFallbackInPlaceOfADemo(): void
    {
        $markdown = $this->render(
            '<canvas id="demo" width="512" height="512"></canvas>'
            .'<noscript><style>#demo { display: none; }</style>'
            .'<p class="warning">Javascript is disabled so the demo cannot be shown.</p>'
            .'<img src="/fallback.webp" alt="A diagram of a light ray"></noscript>'
        );

        $this->assertStringContainsString(
            '![A diagram of a light ray](https://samdriver.xyz/fallback.webp)',
            $markdown
        );
        $this->assertStringNotContainsString('display: none', $markdown);
        $this->assertStringNotContainsString('Javascript is disabled', $markdown);
    }

    public function testSkipsScriptsAndDemoControls(): void
    {
        $markdown = $this->render(
            '<p>Kept.</p>'
            .'<script>const secret = 1;</script>'
            .'<div class="requires-script"><label for="v">Viscosity: </label>'
            .'<input type="range" id="v"></div>'
        );

        $this->assertStringContainsString('Kept.', $markdown);
        $this->assertStringNotContainsString('secret', $markdown);
        $this->assertStringNotContainsString('Viscosity', $markdown);
    }

    /**
     * MathML holds one token per element; the whitespace between them is only
     * source formatting.
     */
    public function testRendersMathAsCodeWithoutSourceWhitespace(): void
    {
        $markdown = $this->render(
            '<p><math><mrow><mi>a</mi>'."\n".'<mo>=</mo>'."\n".'<mn>2</mn></mrow></math></p>'
        );

        $this->assertStringContainsString('`a=2`', $markdown);
    }

    public function testCollapsesSourceWhitespaceInProse(): void
    {
        $markdown = $this->render("<p>One\n    two\n    three</p>");

        $this->assertStringContainsString('One two three', $markdown);
    }

    public function testHandlesArticleWithNoContentElement(): void
    {
        vfsStream::create(
            [
                'empty' => ['index.html' => '<html><head><title>Empty</title></head><body></body></html>'],
            ], $this->root
        );

        $markdown = MarkdownRenderer::render(new Article($this->root->url(), 'empty'));

        $this->assertStringContainsString('# Empty', $markdown);
    }
}
