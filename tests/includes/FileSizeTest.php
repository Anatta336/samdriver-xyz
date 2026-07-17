<?php

namespace Tests\Includes;

require_once __DIR__.'/../../vendor/autoload.php';

use App\Includes\FileSize;
use PHPUnit\Framework\TestCase;

class FileSizeTest extends TestCase
{
    public static function sizeProvider(): array
    {
        return [
            'zero' => [0, '0 B'],
            'bytes' => [512, '512 B'],
            'last byte value' => [999, '999 B'],
            'first kilobyte' => [1000, '1 kB'],
            'kilobytes round to whole' => [28564, '29 kB'],
            'last kilobyte value' => [999999, '1000 kB'],
            'first megabyte' => [1000000, '1.0 MB'],
            'megabytes keep one decimal' => [2412034, '2.4 MB'],
            'large megabytes' => [13500000, '13.5 MB'],
        ];
    }

    /**
     * @dataProvider sizeProvider
     */
    public function testFormat(int $bytes, string $expected): void
    {
        $this->assertSame($expected, FileSize::format($bytes));
    }
}
